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
        const name = session.customer_details?.name || 'Valued Customer'
        const clerkIdFromRef = typeof session.client_reference_id === 'string' ? session.client_reference_id : undefined
        // If this created a subscription, session.mode may be 'subscription'
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : undefined
        const amount = session.amount_total || 0

        if (convex && (email || customerId)) {
          await convex.mutation(api.users.updateSubscriptionByIdentifier, {
            clerkId: clerkIdFromRef,
            email,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscription_plan: 'premium',
            subscription_status: 'active',
            setStripeIds: true,
            onboarding_completed: true, // Auto-complete onboarding for premium users
          })

          // Send payment confirmation email
          if (email && amount > 0) {
            try {
              await convex.action(api.email.sendPaymentConfirmationEmail, {
                email,
                name,
                amount,
                plan: 'Premium Monthly',
              })
            } catch (emailError) {
              console.error('Failed to send payment confirmation email:', emailError)
              // Don't fail the webhook if email fails
            }
          }
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

          // Record subscription event
          await convex.mutation(api.stripe.recordSubscriptionEvent, {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            event_type: event.type === 'customer.subscription.created' ? 'created' : 'updated',
            subscription_status: status === 'active' ? 'active' : status === 'cancelled' ? 'cancelled' : status === 'past_due' ? 'past_due' : 'inactive',
            plan_name: 'premium',
            amount: subscription.items.data[0]?.price?.unit_amount || undefined,
            event_date: subscription.current_period_start * 1000,
            metadata: {
              interval: intervalFromPrice,
              current_period_end: subscription.current_period_end,
            },
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

          // Record subscription cancelled event
          await convex.mutation(api.stripe.recordSubscriptionEvent, {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            event_type: 'cancelled',
            subscription_status: 'cancelled',
            plan_name: 'premium',
            event_date: subscription.ended_at ? subscription.ended_at * 1000 : Date.now(),
            metadata: {},
          })
        }
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id

        if (convex && customerId && invoice.amount_paid) {
          // Determine payment type
          const paymentType = subscriptionId ? 'subscription' : 'one_time'

          // Get interval from invoice lines
          const interval = invoice.lines.data[0]?.price?.recurring?.interval || undefined

          // Record the payment
          await convex.mutation(api.stripe.recordPayment, {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_invoice_id: invoice.id,
            stripe_payment_intent_id: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : undefined,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'succeeded',
            payment_type: paymentType as 'subscription' | 'one_time',
            plan_name: 'premium',
            interval,
            description: invoice.description || undefined,
            metadata: {
              billing_reason: invoice.billing_reason,
              period_start: invoice.period_start,
              period_end: invoice.period_end,
            },
            payment_date: invoice.status_transitions?.paid_at ? invoice.status_transitions.paid_at * 1000 : Date.now(),
          })
        }
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
