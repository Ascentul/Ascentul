import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';
import { isValidUserRole } from '@/lib/validation/roleValidation';
import { ClerkPublicMetadata } from '@/types/clerk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Update user role (Clerk-first, Convex sync via webhook)
 *
 * This endpoint:
 * 1. Verifies caller is super_admin
 * 2. Validates the role transition and university requirements
 * 3. Updates Clerk publicMetadata first (source of truth)
 * 4. Relies on Clerk → Convex webhook to sync Convex/memberships
 *
 * POST /api/admin/users/update-role
 * Body: { userId: string, newRole: string, universityId?: string }
 */
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'admin',
    httpMethod: 'POST',
    httpPath: '/api/admin/users/update-role',
  });

  const startTime = Date.now();
  log.info('Role update request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    // Get caller's role from Clerk
    const client = await clerkClient();
    const caller = await client.users.getUser(userId);
    const callerRole = (caller.publicMetadata as ClerkPublicMetadata)?.role;

    // Only super_admin can update roles
    if (callerRole !== 'super_admin') {
      log.warn('Forbidden - not super_admin', {
        event: 'auth.forbidden',
        errorCode: 'FORBIDDEN',
        extra: { callerRole },
      });
      return NextResponse.json(
        { error: 'Forbidden - Only super admins can update user roles' },
        {
          status: 403,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const body = await request.json();
    const { userId: targetUserId, newRole, universityId } = body;

    if (!targetUserId || !newRole) {
      log.warn('Missing required fields', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Missing required fields: userId, newRole' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Validate role is allowed
    if (!isValidUserRole(newRole)) {
      log.warn('Invalid role specified', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
        extra: { newRole },
      });
      return NextResponse.json(
        { error: `Invalid role: ${newRole}` },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Prevent self-modification to avoid accidental lockout
    if (targetUserId === userId) {
      log.warn('Self-modification attempted', {
        event: 'validation.failed',
        errorCode: 'FORBIDDEN',
      });
      return NextResponse.json(
        { error: 'Cannot modify your own role. Use another super_admin account.' },
        {
          status: 403,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Get target user from Clerk (do not log target user email)
    let targetUser;
    try {
      targetUser = await client.users.getUser(targetUserId);
    } catch (error: unknown) {
      const errorObj = error as { status?: number; errors?: Array<{ code?: string }> };
      if (errorObj?.status === 404 || errorObj?.errors?.[0]?.code === 'resource_not_found') {
        log.warn('Target user not found', { event: 'data.not_found', errorCode: 'NOT_FOUND' });
        return NextResponse.json(
          { error: 'User not found' },
          {
            status: 404,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }
      throw error;
    }

    // Extract current role from Clerk (source of truth)
    const currentRole = (targetUser.publicMetadata as ClerkPublicMetadata)?.role;

    // Critical validation: prevent changing the super_admin role
    if (currentRole === 'super_admin' && newRole !== 'super_admin') {
      log.warn('Attempted to modify super_admin role', {
        event: 'auth.forbidden',
        errorCode: 'FORBIDDEN',
      });
      return NextResponse.json(
        {
          error:
            'Cannot change super_admin role. This role is reserved for the platform founder and cannot be modified through the admin interface. Use Clerk Dashboard for emergency role changes.',
        },
        {
          status: 403,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Validate university requirements
    if (
      (newRole === 'student' || newRole === 'university_admin' || newRole === 'advisor') &&
      !universityId
    ) {
      log.warn('University role missing university_id', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
        extra: { newRole },
      });
      return NextResponse.json(
        { error: `${newRole} role requires a university affiliation` },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Prevent university_id for non-university roles
    if (newRole === 'individual' && universityId) {
      log.warn('Individual role with university_id', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
      });
      return NextResponse.json(
        { error: 'Individual role cannot have university affiliation' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Validate university exists if provided
    if (universityId) {
      if (typeof universityId !== 'string' || universityId.trim().length === 0) {
        log.warn('Invalid university ID format', {
          event: 'validation.failed',
          errorCode: 'BAD_REQUEST',
        });
        return NextResponse.json(
          { error: 'Invalid university ID format - must be a non-empty string' },
          {
            status: 400,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }

      if (!/^[a-z0-9_]+$/i.test(universityId)) {
        log.warn('Invalid university ID characters', {
          event: 'validation.failed',
          errorCode: 'BAD_REQUEST',
        });
        return NextResponse.json(
          { error: 'Invalid university ID format - contains invalid characters' },
          {
            status: 400,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }

      try {
        const university = (await convexServer.query(
          api.universities.getUniversity,
          {
            universityId: universityId as Id<'universities'>,
          },
          token,
        )) as { status?: string } | null;

        if (!university) {
          log.warn('University not found', { event: 'data.not_found', errorCode: 'NOT_FOUND' });
          return NextResponse.json(
            { error: 'Invalid university ID - university does not exist' },
            {
              status: 400,
              headers: { 'x-correlation-id': correlationId },
            },
          );
        }

        if (university.status !== 'active' && university.status !== 'trial') {
          log.warn('Assigning user to inactive university', {
            event: 'admin.university.inactive',
            extra: { universityStatus: university.status },
          });
        }
      } catch (error) {
        log.warn('University validation error', {
          event: 'validation.failed',
          errorCode: toErrorCode(error),
        });
        return NextResponse.json(
          { error: 'Invalid university ID format or university does not exist' },
          {
            status: 400,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }
    }

    // Determine if we should remove university_id
    const requiresUniversity = ['student', 'university_admin', 'advisor'].includes(newRole);

    // Validate transition against backend rules
    try {
      const validation = (await convexServer.query(
        api.roleValidation.validateRoleTransition,
        {
          userId: targetUserId,
          currentRole: currentRole || 'user',
          newRole,
          universityId:
            requiresUniversity && universityId ? (universityId as Id<'universities'>) : undefined,
        },
        token,
      )) as { valid: boolean; error?: string } | null;

      if (!validation?.valid) {
        log.warn('Role transition validation failed', {
          event: 'validation.failed',
          errorCode: 'BAD_REQUEST',
          extra: { validationError: validation?.error },
        });
        return NextResponse.json(
          { error: validation?.error || 'Invalid role transition' },
          {
            status: 400,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }
    } catch (validationError) {
      log.warn('Role transition validation threw error', {
        event: 'validation.failed',
        errorCode: toErrorCode(validationError),
      });
      return NextResponse.json(
        {
          error:
            validationError instanceof Error ? validationError.message : 'Role validation failed',
        },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Update Clerk metadata first; Convex will sync via webhook
    const newMetadata: Record<string, unknown> = {
      ...targetUser.publicMetadata,
      role: newRole,
    };

    if (requiresUniversity && universityId) {
      newMetadata.university_id = universityId;
    } else if (!requiresUniversity) {
      delete newMetadata.university_id;
    }

    await client.users.updateUser(targetUserId, {
      publicMetadata: newMetadata,
    });

    // Also update Convex directly since webhooks may not work in local development
    // This ensures the role change is reflected immediately
    try {
      const membershipRole =
        newRole === 'student' || newRole === 'advisor' || newRole === 'university_admin'
          ? newRole
          : null;

      // Build updates object - only include university_id if it's a valid ID
      const updates: {
        role: string;
        university_id?: Id<'universities'>;
      } = {
        role: newRole,
      };

      if (requiresUniversity && universityId) {
        updates.university_id = universityId as Id<'universities'>;
      }

      // Pass the caller's JWT token to authenticate the Convex mutation
      await convexServer.mutation(
        api.users_profile.updateUserWithMembership,
        {
          clerkId: targetUserId,
          updates,
          membership:
            membershipRole && universityId
              ? { role: membershipRole, universityId: universityId as Id<'universities'> }
              : undefined,
        },
        token, // Pass JWT token for authentication
      );
      log.info('Convex sync completed directly', { event: 'convex.sync.success' });
    } catch (convexError: any) {
      // Log the actual error for debugging
      log.error('Direct Convex sync failed', toErrorCode(convexError), {
        event: 'convex.sync.failed',
        extra: { message: convexError?.message, stack: convexError?.stack },
      });
    }

    const durationMs = Date.now() - startTime;
    log.info('Role updated successfully', {
      event: 'admin.role.updated',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: {
        targetUserId,
        previousRole: currentRole || 'unknown',
        newRole,
        hasUniversity: !!universityId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Role updated successfully.',
        user: {
          id: targetUser.id,
          email: targetUser.emailAddresses[0]?.emailAddress || 'no-email',
          newRole,
        },
      },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Failed to update role';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Role update request failed', toErrorCode(error), {
      event: 'request.error',
      httpStatus: status,
      durationMs,
    });
    return NextResponse.json(
      { error: message },
      {
        status,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
