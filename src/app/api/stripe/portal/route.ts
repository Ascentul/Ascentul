import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { api } from 'convex/_generated/api'
import { convexServer } from '@/lib/convex-server';
import { requireConvexToken } from '@/lib/convex-auth';

const stripeSecret = process.env.STRIPE_SECRET_KEY
// Default to current stable Stripe API version; override via STRIPE_API_VERSION when needed.
const stripeApiVersion = (process.env.STRIPE_API_VERSION || '2025-11-17.clover') as Stripe.StripeConfig['apiVersion']

export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await requireConvexToken()
    const origin = request.headers.get('origin') || new URL(request.url).origin

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!stripeSecret) {
      // Mock manage billing URL when Stripe is not configured
      return NextResponse.json({ url: `${origin}/account?portal=mock` })
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: stripeApiVersion })

    // Fetch Convex user by Clerk ID
    const user = await convexServer.query(api.users.getUserByClerkId, { clerkId: userId }, token)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let customerId = user.stripe_customer_id as string | undefined

    // Create customer in Stripe if missing, and store in Convex
    if (!customerId) {
      if (!user.email) {
        return NextResponse.json(
          { error: 'User email is required' },
          { status: 400 },
        )
      }
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { 
          clerk_id: user.clerkId,
          clerkId: user.clerkId // Keep for backward compatibility
        },
      })
      customerId = customer.id
      try {
        await convexServer.mutation(
          api.users.setStripeCustomer,
          { clerkId: user.clerkId, stripeCustomerId: customerId },
          token
        )
      } catch (convexError) {
        // Customer exists in Stripe; checkout route's search logic will recover on next request
        console.error(`[Stripe Portal] Failed to save Stripe customer ${customerId} to Convex:`, convexError)
      }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/account`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
