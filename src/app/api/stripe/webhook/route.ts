import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

// Minimal mapping function
function mapStripeStatus(status: string): 'active' | 'inactive' | 'cancelled' | 'past_due' {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
      return 'cancelled'
    default:
      return 'inactive'
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const sig = request.headers.get('stripe-signature') || ''

    if (!stripeSecret) {
      // Mock mode: treat as received and succeed
      return NextResponse.json({ received: true, mock: true })
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' as any })
    if (!convexUrl) {
      console.error('Missing NEXT_PUBLIC_CONVEX_URL')
    }
    const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null

    let event: Stripe.Event
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } else {
      // If no webhook secret present, try to parse (useful for local testing)
      event = JSON.parse(rawBody)
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // For payment links, pull email and customer directly from session
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
        const email = session.customer_details?.email || (session.customer as any)?.email || undefined
        const clerkIdFromRef = typeof session.client_reference_id === 'string' ? session.client_reference_id : undefined
        // If this created a subscription, session.mode may be 'subscription'
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : undefined
        if (convex && (email || customerId)) {
          await convex.mutation(api.users.updateSubscriptionByIdentifier, {
            clerkId: clerkIdFromRef,
            email,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscription_plan: 'premium',
            subscription_status: 'active',
            setStripeIds: true,
          })
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const status = mapStripeStatus(subscription.status)
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
        const intervalFromPrice = subscription.items.data[0]?.price?.recurring?.interval || null
        // Try to fetch customer to get email if needed
        let email: string | undefined
        try {
          const cust = await stripe.customers.retrieve(customerId)
          if (!('deleted' in cust)) email = (cust.email || undefined) as string | undefined
        } catch {}

        if (convex) {
          await convex.mutation(api.users.updateSubscriptionByIdentifier, {
            email,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            subscription_plan: 'premium',
            subscription_status: status,
            setStripeIds: true,
          })
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
        let email: string | undefined
        try {
          const cust = await stripe.customers.retrieve(customerId)
          if (!('deleted' in cust)) email = (cust.email || undefined) as string | undefined
        } catch {}
        if (convex) {
          await convex.mutation(api.users.updateSubscriptionByIdentifier, {
            email,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            subscription_plan: 'free',
            subscription_status: 'cancelled',
            setStripeIds: true,
          })
        }
        break
      }
      case 'invoice.payment_succeeded': {
        // no-op for now (status handled by subscription.updated)
        break
      }
      default: {
        // ignore others for MVP
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Stripe webhook error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
