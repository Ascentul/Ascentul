import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { clerkClient } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

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

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const svixHeaders = {
      'svix-id': request.headers.get('svix-id') || '',
      'svix-timestamp': request.headers.get('svix-timestamp') || '',
      'svix-signature': request.headers.get('svix-signature') || '',
    }

    if (!webhookSecret) {
      console.warn('[Clerk Webhook] No webhook secret configured - skipping verification')
      return NextResponse.json({ received: true, warning: 'no_secret' })
    }

    if (!convexUrl) {
      console.error('[Clerk Webhook] Missing NEXT_PUBLIC_CONVEX_URL')
      return NextResponse.json({ error: 'Missing Convex URL' }, { status: 500 })
    }

    // Verify webhook signature
    const wh = new Webhook(webhookSecret)
    let event: any

    try {
      event = wh.verify(rawBody, svixHeaders)
    } catch (err) {
      console.error('[Clerk Webhook] Verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const convex = new ConvexHttpClient(convexUrl)
    const eventType = event.type
    const userData = event.data

    console.log(`[Clerk Webhook] Received event: ${eventType}`)

    switch (eventType) {
      case 'user.created': {
        // Extract subscription data from Clerk's publicMetadata
        const metadata = userData.public_metadata || {}
        const subscriptionPlan = determineSubscriptionPlan(metadata)
        const subscriptionStatus = determineSubscriptionStatus(metadata)

        const userEmail = userData.email_addresses?.[0]?.email_address || ''

        // Create/activate user in Convex
        const userId = await convex.mutation(api.users.createUserFromClerk, {
          clerkId: userData.id,
          email: userEmail,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User',
          profile_image: userData.image_url,
          subscription_plan: subscriptionPlan,
          subscription_status: subscriptionStatus,
        })

        console.log(`[Clerk Webhook] Created/activated user: ${userData.id}`)

        // Check if this user was a pending university student
        // If so, sync university_id to Clerk metadata
        const convexUser = await convex.query(api.users.getUserByClerkId, {
          clerkId: userData.id,
        })

        if (convexUser && convexUser.university_id && !metadata.university_id) {
          try {
            const client = await clerkClient()
            await client.users.updateUser(userData.id, {
              publicMetadata: {
                ...metadata,
                university_id: convexUser.university_id,
                role: convexUser.role || 'user',
              },
            })
            console.log(`[Clerk Webhook] Synced university_id to Clerk for ${userEmail}`)
          } catch (syncError) {
            console.error('[Clerk Webhook] Failed to sync university_id to Clerk:', syncError)
          }
        }

        break
      }

      case 'user.updated': {
        // Sync subscription data from Clerk to Convex (cached display data)
        const metadata = userData.public_metadata || {}
        const subscriptionPlan = determineSubscriptionPlan(metadata)
        const subscriptionStatus = determineSubscriptionStatus(metadata)

        // Check if user was banned in Clerk - sync to account_status
        const updates: any = {
          email: userData.email_addresses?.[0]?.email_address,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          profile_image: userData.image_url,
          subscription_plan: subscriptionPlan,
          subscription_status: subscriptionStatus,
        }

        // If user is banned in Clerk, ensure account_status is suspended
        if (userData.banned) {
          updates.account_status = 'suspended'
        } else if (metadata.account_status) {
          // Sync account_status from metadata if present
          updates.account_status = metadata.account_status
        } else {
          // Reset to active when unbanned and no metadata override
          updates.account_status = 'active'
        }

        await convex.mutation(api.users.updateUser, {
          clerkId: userData.id,
          updates,
        })

        console.log(`[Clerk Webhook] Updated user: ${userData.id}, plan: ${subscriptionPlan}, status: ${subscriptionStatus}`)
        break
      }

      case 'user.deleted': {
        // User was deleted from Clerk
        // This should only happen for hard-deleted test users
        console.log(`[Clerk Webhook] User deleted from Clerk: ${userData.id}`)

        // Check if user exists in Convex and is a test user
        try {
          const convexUser = await convex.query(api.users.getUserByClerkId, {
            clerkId: userData.id,
          })

          if (convexUser) {
            if (convexUser.is_test_user) {
              // Test user - this is expected, the hard delete was initiated from our side
              console.log(`[Clerk Webhook] Test user deletion confirmed: ${userData.id}`)
            } else {
              // Real user - this shouldn't happen, log warning
              console.warn(`[Clerk Webhook] WARNING: Real user was deleted from Clerk: ${userData.id}`)
              // Note: Deletions should only happen through softDeleteUser/hardDeleteUser actions
              // which handle both Clerk and Convex updates atomically
            }
          }
        } catch (error) {
          console.error(`[Clerk Webhook] Error handling user deletion: ${error}`)
        }

        break
      }

      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Clerk Webhook] Error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
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
    return 'university'
  }

  // Check Clerk Billing subscription data
  const subscriptions = metadata.subscriptions || []
  const currentPlan = metadata.billing?.plan || metadata.plan

  // Check for premium plan (includes both monthly and annual billing)
  if (currentPlan === 'premium_monthly') {
    return 'premium'
  }

  // Check subscriptions array
  for (const sub of subscriptions) {
    if (sub.plan === 'premium_monthly') {
      if (sub.status === 'active' || sub.status === 'trialing') {
        return 'premium'
      }
    }
  }

  return 'free'
}

/**
 * Determine subscription status from Clerk's publicMetadata
 */
function determineSubscriptionStatus(metadata: any): 'active' | 'inactive' | 'cancelled' | 'past_due' {
  const subscriptions = metadata.subscriptions || []
  const currentPlan = metadata.billing?.plan || metadata.plan

  // University users are always active
  if (metadata.role === 'student' || metadata.university_id) {
    return 'active'
  }

  // Check for active premium subscription
  if (currentPlan === 'premium_monthly') {
    const status = metadata.billing?.status || 'active'
    return mapClerkStatusToConvex(status)
  }

  // Check subscriptions array
  for (const sub of subscriptions) {
    if (sub.plan === 'premium_monthly') {
      return mapClerkStatusToConvex(sub.status)
    }
  }

  return 'inactive'
}

/**
 * Map Clerk subscription status to Convex status
 */
function mapClerkStatusToConvex(clerkStatus: string): 'active' | 'inactive' | 'cancelled' | 'past_due' {
  switch (clerkStatus) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'cancelled':
    case 'unpaid':
      return 'cancelled'
    default:
      return 'inactive'
  }
}
