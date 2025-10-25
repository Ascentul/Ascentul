import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
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

        await convex.mutation(api.users.createUserFromClerk, {
          clerkId: userData.id,
          email: userData.email_addresses?.[0]?.email_address || '',
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User',
          profile_image: userData.image_url,
          subscription_plan: subscriptionPlan,
          subscription_status: subscriptionStatus,
        })

        console.log(`[Clerk Webhook] Created user: ${userData.id}`)
        break
      }

      case 'user.updated': {
        // Sync subscription data from Clerk to Convex (cached display data)
        const metadata = userData.public_metadata || {}
        const subscriptionPlan = determineSubscriptionPlan(metadata)
        const subscriptionStatus = determineSubscriptionStatus(metadata)

        await convex.mutation(api.users.updateUser, {
          clerkId: userData.id,
          updates: {
            email: userData.email_addresses?.[0]?.email_address,
            name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
            profile_image: userData.image_url,
            subscription_plan: subscriptionPlan,
            subscription_status: subscriptionStatus,
          },
        })

        console.log(`[Clerk Webhook] Updated user: ${userData.id}, plan: ${subscriptionPlan}, status: ${subscriptionStatus}`)
        break
      }

      case 'user.deleted': {
        // Optionally soft-delete or remove user from Convex
        console.log(`[Clerk Webhook] User deleted: ${userData.id}`)
        // Note: Implement soft delete if needed
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

  // Check for premium plans
  if (currentPlan === 'premium_monthly' || currentPlan === 'premium_annual') {
    return 'premium'
  }

  // Check subscriptions array
  for (const sub of subscriptions) {
    if (sub.plan === 'premium_monthly' || sub.plan === 'premium_annual') {
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
  if (currentPlan === 'premium_monthly' || currentPlan === 'premium_annual') {
    const status = metadata.billing?.status || 'active'
    return mapClerkStatusToConvex(status)
  }

  // Check subscriptions array
  for (const sub of subscriptions) {
    if (sub.plan === 'premium_monthly' || sub.plan === 'premium_annual') {
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
