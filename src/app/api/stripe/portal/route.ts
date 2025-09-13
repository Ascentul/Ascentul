import { NextRequest, NextResponse } from 'next/server'
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY

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

    const origin = request.headers.get('origin') || new URL(request.url).origin

    if (!stripeSecret || !hasSb || !user) {
      // Mock manage billing URL when Stripe is not configured
      return NextResponse.json({ url: `${origin}/account?portal=mock` })
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' as any })

    // Get user's stripe_customer_id
    const { data: userRow, error: userErr } = await supabase!
      .from('users')
      .select('id, stripe_customer_id')
      .eq('id', user!.id)
      .single()

    if (userErr || !userRow) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 })
    }

    if (!userRow.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing customer found' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: userRow.stripe_customer_id,
      return_url: `${origin}/account`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
