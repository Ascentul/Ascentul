#!/usr/bin/env node
/**
 * Synchronize Convex user roles with seeded Clerk test users.
 * - Loads .env.local for NEXT_PUBLIC_CONVEX_URL and CLERK_SECRET_KEY
 * - Creates Convex users if missing, otherwise updates roles
 */

const fs = require('fs')
const path = require('path')

// Load env from .env.local
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

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.error('Missing NEXT_PUBLIC_CONVEX_URL in environment/.env.local')
  process.exit(1)
}
if (!process.env.CLERK_SECRET_KEY) {
  console.error('Missing CLERK_SECRET_KEY in environment/.env.local')
  process.exit(1)
}

const BASE_URL = 'https://api.clerk.com/v1'

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`HTTP ${res.status} ${res.statusText}: ${text}`)
    err.status = res.status
    err.body = text
    throw err
  }
  return res.json()
}

async function findClerkByEmail(email) {
  const url = new URL(`${BASE_URL}/users`)
  url.searchParams.set('email_address', email)
  const res = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  const items = Array.isArray(data) ? data : (data?.data || [])
  return items[0] || null
}

async function main() {
  const { ConvexHttpClient } = await import('convex/browser')
  const { api } = await import('../convex/_generated/api.js')

  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)

  const domain = process.env.SEED_TEST_DOMAIN || 'ascentful.io'
  const prefix = process.env.SEED_TEST_PREFIX || 'test.user'

  const targets = [
    { email: `${prefix}+user@${domain}`, role: 'user' },
    { email: `${prefix}+staff@${domain}`, role: 'staff' },
    { email: `${prefix}+uadmin@${domain}`, role: 'university_admin', plan: 'university' },
    { email: `${prefix}+admin@${domain}`, role: 'admin' },
    { email: `${prefix}+super@${domain}`, role: 'super_admin' },
  ]

  for (const t of targets) {
    try {
      const clerk = await findClerkByEmail(t.email)
      if (!clerk) {
        console.warn(`Clerk user not found for ${t.email}, skipping`)
        continue
      }

      const clerkId = clerk.id
      const name = `${clerk.first_name || 'Test'} ${clerk.last_name || 'User'}`.trim()
      const username = clerk.username || undefined

      // Try to load Convex user
      let convexUser = null
      try {
        convexUser = await client.query(api.users.getUserByClerkId, { clerkId })
      } catch {}

      if (!convexUser) {
        // Create in Convex
        await client.mutation(api.users.createUser, {
          clerkId,
          email: t.email,
          name,
          username,
          role: t.role,
        })
        console.log(`Created Convex user for ${t.email} with role=${t.role}`)
      } else {
        // Update if role differs or plan needs setting
        const updates = {}
        if (convexUser.role !== t.role) updates.role = t.role
        if (t.plan && convexUser.subscription_plan !== t.plan) updates.subscription_plan = t.plan
        if (Object.keys(updates).length > 0) {
          await client.mutation(api.users.updateUser, { clerkId, updates })
          console.log(`Updated Convex user for ${t.email}:`, updates)
        } else {
          console.log(`No Convex update needed for ${t.email}`)
        }
      }
    } catch (e) {
      console.error(`Failed to sync ${t.email}:`, e?.message || e)
    }
  }

  console.log('Convex role sync complete.')
}

if (typeof fetch === 'undefined') {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
