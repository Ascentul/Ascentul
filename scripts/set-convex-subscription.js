#!/usr/bin/env node
/**
 * Set a user's subscription fields in Convex by email.
 *
 * Usage:
 *   NEXT_PUBLIC_CONVEX_URL="https://<your-convex>.convex.cloud" \
 *   TARGET_EMAIL="test.user+pro@ascentful.io" \
 *   SUBSCRIPTION_PLAN="premium" \
 *   SUBSCRIPTION_STATUS="active" \
 *   node scripts/set-convex-subscription.js
 *
 * Notes:
 * - The target user must already exist in Convex (e.g., created on first sign-in via Clerk).
 * - Plans: free | premium | university
 * - Status: active | inactive | cancelled | past_due
 */

const fs = require('fs')
const path = require('path')

// Best-effort load of .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      if (!line || /^\s*#/.test(line)) continue
      const idx = line.indexOf('=')
      if (idx === -1) continue
      const key = line.slice(0, idx).trim()
      let val = line.slice(idx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  }
} catch {}

async function main() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  const email = process.env.TARGET_EMAIL
  const plan = process.env.SUBSCRIPTION_PLAN || 'premium'
  const status = process.env.SUBSCRIPTION_STATUS || 'active'

  if (!convexUrl) {
    console.error('Missing NEXT_PUBLIC_CONVEX_URL in environment')
    process.exit(1)
  }
  if (!email) {
    console.error('Missing TARGET_EMAIL in environment')
    process.exit(1)
  }

  // Polyfill fetch and related globals for Node < 18
  if (typeof fetch === 'undefined') {
    const nodeFetch = require('node-fetch')
    const fetch_ = nodeFetch.default || nodeFetch
    global.fetch = fetch_
    global.Request = nodeFetch.Request
    global.Response = nodeFetch.Response
    global.Headers = nodeFetch.Headers
  }

  const { ConvexHttpClient } = require('convex/browser')
  const { api } = require('../convex/_generated/api')

  const client = new ConvexHttpClient(convexUrl)

  try {
    await client.mutation(api.users.updateSubscriptionByIdentifier, {
      email,
      subscription_plan: plan,
      subscription_status: status,
    })
    console.log(`Updated subscription for ${email} -> plan=${plan}, status=${status}`)
  } catch (err) {
    console.error('Failed to update subscription:', err?.message || err)
    process.exit(1)
  }
}

main()
