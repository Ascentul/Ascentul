import { NextRequest, NextResponse } from 'next/server'
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY

// Plan configuration for dynamic price_data
const PLAN_CONFIG: Record<string, Record<string, { amount: number; interval: 'month' | 'year'; interval_count?: number; productName: string }>> = {
  premium: {
    monthly: { amount: 1500, interval: 'month', interval_count: 1, productName: 'Ascentul Premium' },
    quarterly: { amount: 3000, interval: 'month', interval_count: 3, productName: 'Ascentul Premium' },
    annual: { amount: 7200, interval: 'year', interval_count: 1, productName: 'Ascentul Premium' },
  },
}

export async function POST(request: NextRequest) {
  try {
    const hasSb = hasSupabaseEnv()
    const supabase = hasSb ? createClient() : null
    let user: { id: string } | null = null
    if (hasSb && supabase) {
      const { data } = await supabase.auth.getUser()
      user = data.user as any
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json().catch(() => ({} as any))
    const plan = (body?.plan as string) || 'premium'
    const interval = (body?.interval as string) || 'monthly'

    if (!PLAN_CONFIG[plan]?.[interval]) {
      return NextResponse.json({ error: 'Invalid plan or interval' }, { status: 400 })
    }

    const origin = request.headers.get('origin') || new URL(request.url).origin

    // If Stripe or Supabase is not configured, simulate checkout
    if (!stripeSecret || !hasSb || !user) {
      // Optimistically set a pending status; webhook will not run in mock mode
      if (hasSb && supabase && user) {
        await supabase
          .from('users')
          .update({
            subscription_plan: plan,
            subscription_status: 'active',
            subscription_cycle: interval,
          })
          .eq('id', user.id)
      }

      // Redirect back to account as a mock 'success'
      return NextResponse.json({ url: `${origin}/account?checkout=success&mock=1` })
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' as any })

    // Fetch current user record to get/create customer
    const { data: userRow, error: userErr } = await supabase!
      .from('users')
      .select('id, email, name, stripe_customer_id')
      .eq('id', user!.id)
      .single()

    if (userErr || !userRow) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 })
    }

    let customerId = userRow.stripe_customer_id as string | null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userRow.email || undefined,
        name: userRow.name || undefined,
        metadata: { user_id: userRow.id },
      })
      customerId = customer.id
      await supabase!.from('users').update({ stripe_customer_id: customerId }).eq('id', userRow.id)
    }

    const cfg = PLAN_CONFIG[plan][interval]
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: cfg.productName },
            recurring: {
              interval: cfg.interval,
              ...(cfg.interval_count ? { interval_count: cfg.interval_count } : {}),
            },
            unit_amount: cfg.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/account?checkout=success`,
      cancel_url: `${origin}/account?checkout=cancel`,
      allow_promotion_codes: true,
      client_reference_id: userRow.id,
      metadata: { user_id: userRow.id, plan, interval },
      subscription_data: {
        metadata: { user_id: userRow.id, plan, interval },
      },
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
