import { clerkClient } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';

import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';
import { validateRoleOrWarn } from '@/lib/validation/roleValidation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

/**
 * Clerk Webhook Handler
 *
 * Syncs subscription data from Clerk Billing to Convex for cached display.
 * Clerk is the source of truth for subscriptions, this just caches data for admin UIs.
 *
 * Events handled:
 * - user.created: Create user record in Convex
 * - user.updated: Sync subscription status from Clerk publicMetadata to Convex
 * - user.deleted: Mark user as deleted in Convex
 */

const convexServiceToken = process.env.CONVEX_INTERNAL_SERVICE_TOKEN;

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'webhook',
    httpMethod: 'POST',
    httpPath: '/api/clerk/webhook',
  });

  const startTime = Date.now();
  log.info('Clerk webhook received', { event: 'request.start' });

  try {
    if (!convexServiceToken) {
      log.error('Missing CONVEX_INTERNAL_SERVICE_TOKEN', 'CONFIG_ERROR', {
        event: 'config.error',
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        {
          status: 500,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const rawBody = await request.text();
    const svixHeaders = {
      'svix-id': request.headers.get('svix-id') || '',
      'svix-timestamp': request.headers.get('svix-timestamp') || '',
      'svix-signature': request.headers.get('svix-signature') || '',
    };

    if (!webhookSecret) {
      log.warn('No webhook secret configured - skipping verification', {
        event: 'config.warning',
      });
      return NextResponse.json(
        { received: true, warning: 'no_secret' },
        {
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    let event: any;

    try {
      event = wh.verify(rawBody, svixHeaders);
    } catch (err) {
      log.error('Webhook verification failed', 'SIGNATURE_ERROR', {
        event: 'webhook.verification.failed',
      });
      return NextResponse.json(
        { error: 'Invalid signature' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }
    const eventType = event.type;
    const userData = event.data;

    log.info('Webhook event received', {
      event: 'webhook.event.received',
      extra: { eventType, clerkUserId: userData.id },
    });

    switch (eventType) {
      case 'user.created': {
        // Extract subscription data from Clerk's publicMetadata
        const metadata = userData.public_metadata || {};
        const subscriptionPlan = determineSubscriptionPlan(metadata);
        const subscriptionStatus = determineSubscriptionStatus(metadata);
        const roleInMetadata = metadata.role || null;

        // Validate role value before passing to Convex
        const validatedRole = validateRoleOrWarn(roleInMetadata, 'Clerk Webhook');

        const userEmail = userData.email_addresses?.[0]?.email_address || '';

        log.info('Creating user from Clerk', {
          event: 'user.create.start',
          clerkId: userData.id,
          extra: { subscriptionPlan, subscriptionStatus, role: validatedRole },
        });

        // Create/activate user in Convex
        const userId = await convexServer.mutation(api.users.createUserFromClerk, {
          clerkId: userData.id,
          email: userEmail,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User',
          profile_image: userData.image_url,
          subscription_plan: subscriptionPlan,
          subscription_status: subscriptionStatus,
          // Pass validated role from Clerk metadata if present
          role: validatedRole || undefined,
          serviceToken: convexServiceToken,
        });

        log.info('User created/activated in Convex', {
          event: 'user.create.success',
          clerkId: userData.id,
          userId: userId as string,
        });

        // Check if this user was a pending university student
        // If so, sync university_id to Clerk metadata
        const convexUser = await convexServer.query(api.users.getUserByClerkId, {
          clerkId: userData.id,
          serviceToken: convexServiceToken,
        });

        if (convexUser && convexUser.university_id && !metadata.university_id) {
          try {
            const client = await clerkClient();

            // Build publicMetadata update
            const updatedMetadata: Record<string, any> = {
              ...metadata,
              university_id: convexUser.university_id,
            };

            // Only set role if we have a valid one (prefer Convex role, fallback to validated role from webhook)
            const roleToSync = convexUser.role || validatedRole;
            if (roleToSync) {
              updatedMetadata.role = roleToSync;
            }

            await client.users.updateUser(userData.id, {
              publicMetadata: updatedMetadata,
            });
            log.info('Synced university_id and role to Clerk', {
              event: 'user.sync.success',
              clerkId: userData.id,
              extra: { universityId: convexUser.university_id, role: roleToSync },
            });
          } catch (syncError) {
            log.error('Failed to sync to Clerk', toErrorCode(syncError), {
              event: 'user.sync.error',
              clerkId: userData.id,
            });
          }
        }

        break;
      }

      case 'user.updated': {
        // Sync subscription data from Clerk to Convex (cached display data)
        const metadata = userData.public_metadata || {};
        const subscriptionPlan = determineSubscriptionPlan(metadata);
        const subscriptionStatus = determineSubscriptionStatus(metadata);

        // Check if role changed - important for role management logging
        const roleInMetadata = metadata.role || null;
        const universityIdInMetadata = metadata.university_id;
        // Basic sanity check: must be a non-empty string
        // Convex will validate the actual ID format via v.id("universities") validator
        const universityIdString =
          typeof universityIdInMetadata === 'string' && universityIdInMetadata.trim().length > 0
            ? universityIdInMetadata.trim()
            : undefined;
        const userEmail = userData.email_addresses?.[0]?.email_address;

        // Validate role value before syncing to Convex
        const validatedRole = validateRoleOrWarn(roleInMetadata, `Clerk Webhook - ${userEmail}`);
        const isUniversityRole =
          validatedRole === 'student' ||
          validatedRole === 'advisor' ||
          validatedRole === 'university_admin';
        const membershipRole = isUniversityRole ? validatedRole : null;

        // Build updates object
        const updates: any = {
          email: userEmail,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        };

        if (validatedRole) {
          updates.role = validatedRole;
        }

        // Enforce role constraints per learnings
        if (validatedRole === 'individual') {
          // Individual users must NOT have university_id
          updates.university_id = null; // Explicitly clear
        } else if (membershipRole) {
          // University roles MUST have university_id
          if (!universityIdString) {
            log.error('Invalid state: university role without university_id', 'VALIDATION_ERROR', {
              event: 'user.update.validation_failed',
              clerkId: userData.id,
              extra: { role: membershipRole },
            });
            return NextResponse.json(
              { error: `${membershipRole} role requires university_id` },
              {
                status: 400,
                headers: { 'x-correlation-id': correlationId },
              },
            );
          }
          // Pass as string - Convex validates format with v.id() validator
          updates.university_id = universityIdString;
        }

        // If user is banned in Clerk, ensure account_status is suspended
        if (userData.banned) {
          updates.account_status = 'suspended';
        } else if (metadata.account_status) {
          // Sync account_status from metadata if present
          updates.account_status = metadata.account_status;
        } else {
          // Reset to active when unbanned and no metadata override
          updates.account_status = 'active';
        }

        // Use atomic mutation to update user and membership in single transaction
        // This prevents partial updates where user role changes but membership creation fails
        // Wrap in try-catch to handle invalid university_id format errors gracefully
        try {
          await convexServer.mutation(api.users_profile.updateUserWithMembership, {
            clerkId: userData.id,
            updates,
            // Include membership data for university roles
            // Type assertion rationale: universityIdString is validated as non-empty string above (lines 138-141).
            // The Convex mutation uses v.id("universities") validator which will reject malformed IDs at runtime.
            // The catch block below (lines 204-216) handles these validation errors gracefully.
            // This assertion is safe because: 1) we pre-check for non-empty string, 2) server validates format,
            // 3) we catch and handle format errors with a 400 response.
            membership:
              membershipRole && universityIdString
                ? { role: membershipRole, universityId: universityIdString as Id<'universities'> }
                : undefined,
            serviceToken: convexServiceToken,
          });
        } catch (mutationError: any) {
          // Handle Convex validation errors (e.g., malformed university_id)
          // Convex v.id() validator throws ArgumentValidationError with message prefix
          const errorMessage = mutationError?.message || String(mutationError);
          if (errorMessage.includes('ArgumentValidationError:')) {
            log.error('Invalid university_id format', 'VALIDATION_ERROR', {
              event: 'user.update.validation_failed',
              clerkId: userData.id,
              extra: { universityId: universityIdString },
            });
            return NextResponse.json(
              { error: 'Invalid university_id format in metadata' },
              {
                status: 400,
                headers: { 'x-correlation-id': correlationId },
              },
            );
          }
          // Re-throw other errors
          throw mutationError;
        }

        log.info('User updated from Clerk', {
          event: 'user.update.success',
          clerkId: userData.id,
          extra: { subscriptionPlan, subscriptionStatus, role: validatedRole },
        });
        break;
      }

      case 'user.deleted': {
        // User was deleted from Clerk
        // This should only happen for hard-deleted test users
        log.info('User deleted from Clerk', {
          event: 'user.delete.received',
          clerkId: userData.id,
        });

        // Check if user exists in Convex and is a test user
        try {
          const convexUser = await convexServer.query(api.users.getUserByClerkId, {
            clerkId: userData.id,
            serviceToken: convexServiceToken,
          });

          if (convexUser) {
            if (convexUser.is_test_user) {
              // Test user - this is expected, the hard delete was initiated from our side
              log.info('Test user deletion confirmed', {
                event: 'user.delete.test_user',
                clerkId: userData.id,
              });
            } else {
              // Real user - this shouldn't happen, log warning
              log.warn('Real user was deleted from Clerk', {
                event: 'user.delete.unexpected',
                clerkId: userData.id,
              });
              // Note: Deletions should only happen through softDeleteUser/hardDeleteUser actions
              // which handle both Clerk and Convex updates atomically
            }
          }
        } catch (error) {
          log.error('Error handling user deletion', toErrorCode(error), {
            event: 'user.delete.error',
            clerkId: userData.id,
          });
        }

        break;
      }

      default:
        log.info('Unhandled webhook event type', {
          event: 'webhook.event.unhandled',
          extra: { eventType },
        });
    }

    const durationMs = Date.now() - startTime;
    log.info('Clerk webhook processed', {
      event: 'request.success',
      httpStatus: 200,
      durationMs,
      extra: { eventType },
    });

    return NextResponse.json(
      { received: true },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (err) {
    const durationMs = Date.now() - startTime;
    // Internal errors should return 500, not 400
    log.error('Clerk webhook error', toErrorCode(err), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      { error: 'Webhook error' },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}

/**
 * Determine subscription plan from Clerk's publicMetadata
 *
 * Clerk Billing stores subscription info in user.publicMetadata after successful payment.
 * Common patterns:
 * - metadata.subscriptions: array of active subscriptions
 * - metadata.billing.plan: current plan slug
 * - metadata.plan: plan slug
 */
function determineSubscriptionPlan(metadata: any): 'free' | 'premium' | 'university' {
  // Check for university affiliation first
  if (metadata.role === 'student' || metadata.university_id) {
    return 'university';
  }

  // Check Clerk Billing subscription data
  const subscriptions = metadata.subscriptions || [];
  const currentPlan = metadata.billing?.plan || metadata.plan;

  // Check for premium plan (includes both monthly and annual billing)
  if (currentPlan === 'premium_monthly') {
    return 'premium';
  }

  // Check subscriptions array
  for (const sub of subscriptions) {
    if (sub.plan === 'premium_monthly') {
      if (sub.status === 'active' || sub.status === 'trialing') {
        return 'premium';
      }
    }
  }

  return 'free';
}

/**
 * Determine subscription status from Clerk's publicMetadata
 */
function determineSubscriptionStatus(
  metadata: any,
): 'active' | 'inactive' | 'cancelled' | 'past_due' {
  const subscriptions = metadata.subscriptions || [];
  const currentPlan = metadata.billing?.plan || metadata.plan;

  // University users are always active
  if (metadata.role === 'student' || metadata.university_id) {
    return 'active';
  }

  // Check for active premium subscription
  if (currentPlan === 'premium_monthly') {
    const status = metadata.billing?.status || 'active';
    return mapClerkStatusToConvex(status);
  }

  // Check subscriptions array
  for (const sub of subscriptions) {
    if (sub.plan === 'premium_monthly') {
      return mapClerkStatusToConvex(sub.status);
    }
  }

  return 'inactive';
}

/**
 * Map Clerk subscription status to Convex status
 */
function mapClerkStatusToConvex(
  clerkStatus: string,
): 'active' | 'inactive' | 'cancelled' | 'past_due' {
  switch (clerkStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'cancelled':
    case 'unpaid':
      return 'cancelled';
    default:
      return 'inactive';
  }
}
