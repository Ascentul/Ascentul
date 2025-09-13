import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

    let event: Stripe.Event
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } else {
      // If no webhook secret present, try to parse (useful for local testing)
      event = JSON.parse(rawBody)
    }

    // Only create admin client if needed
    const admin = supabaseUrl && serviceRoleKey
      ? createSupabaseAdmin(supabaseUrl, serviceRoleKey)
      : null

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const status = mapStripeStatus(subscription.status)
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
        const intervalFromPrice = subscription.items.data[0]?.price?.recurring?.interval || null
        const metaPlan = (subscription.metadata && (subscription.metadata as any)['plan']) as string | undefined
        const metaInterval = (subscription.metadata && (subscription.metadata as any)['interval']) as string | undefined

        if (admin) {
          // Find user by stripe_subscription_id or stripe_customer_id or metadata
          // Prefer metadata.user_id if set
          const userIdMeta = (subscription.metadata && subscription.metadata['user_id']) || null

          let userId = userIdMeta
          if (!userId) {
            // Try lookup by stripe_subscription_id or stripe_customer_id
            const { data: userBySub } = await admin
              .from('users')
              .select('id')
              .eq('stripe_subscription_id', subscription.id)
              .single()
            if (userBySub?.id) userId = userBySub.id
            if (!userId) {
              const { data: userByCust } = await admin
                .from('users')
                .select('id')
                .eq('stripe_customer_id', customerId)
                .single()
              if (userByCust?.id) userId = userByCust.id
            }
          }

          if (userId) {
            await admin
              .from('users')
              .update({
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription.id,
                subscription_status: status,
                subscription_plan: metaPlan || 'premium',
                subscription_cycle: metaInterval || intervalFromPrice,
              })
              .eq('id', userId)
          }
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
        if (admin) {
          // Mark user as cancelled and free
          await admin
            .from('users')
            .update({
              subscription_status: 'cancelled',
              subscription_plan: 'free',
              subscription_cycle: null,
            })
            .or(`stripe_subscription_id.eq.${subscription.id},stripe_customer_id.eq.${customerId}`)
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
