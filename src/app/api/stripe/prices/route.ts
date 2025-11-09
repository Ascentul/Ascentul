import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET() {
  try {
    const secret = process.env.STRIPE_SECRET_KEY
    if (!secret) {
      // No Stripe configured; return empty so UI hides amounts gracefully
      return NextResponse.json({}, { status: 200 })
    }

    const apiVersion = (process.env.STRIPE_API_VERSION || '2025-02-24.acacia') as Stripe.LatestApiVersion
    const stripe = new Stripe(secret, { apiVersion })

    const monthlyId = process.env.STRIPE_PRICE_ID_MONTHLY
    const annualId = process.env.STRIPE_PRICE_ID_ANNUAL

    const result: any = {}

    if (monthlyId) {
      const price = await stripe.prices.retrieve(monthlyId)
      result.monthly = {
        unit_amount: price.unit_amount ?? null,
        currency: price.currency ?? 'usd',
      }
    }
    if (annualId) {
      const price = await stripe.prices.retrieve(annualId)
      result.annual = {
        unit_amount: price.unit_amount ?? null,
        currency: price.currency ?? 'usd',
      }
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Stripe prices error:', error)
    return NextResponse.json({}, { status: 200 })
  }
}
