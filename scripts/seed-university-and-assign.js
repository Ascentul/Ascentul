#!/usr/bin/env node
/**
 * Create a sample university in Convex and assign the university_admin user to it.
 * - Loads .env.local for NEXT_PUBLIC_CONVEX_URL and CLERK_SECRET_KEY
 * - Finds Clerk user by email (test.user+uadmin@<domain> by default)
 * - Creates university if missing (by slug)
 * - Assigns the user to the university, sets subscription_plan=university and role=university_admin
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

const CLERK_BASE_URL = 'https://api.clerk.com/v1'

async function clerkRequest(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${CLERK_BASE_URL}${path}`, {
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
  const url = new URL(`${CLERK_BASE_URL}/users`)
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
  const uadminEmail = `${prefix}+uadmin@${domain}`

  const clerkUser = await findClerkByEmail(uadminEmail)
  if (!clerkUser) {
    console.error(`Clerk user not found for ${uadminEmail}. Seed Clerk users first.`)
    process.exit(1)
  }

  const university = {
    name: process.env.SEED_UNIVERSITY_NAME || 'Ascentful University',
    slug: process.env.SEED_UNIVERSITY_SLUG || 'ascentful',
    license_plan: (process.env.SEED_UNIVERSITY_PLAN || 'Starter'),
    license_seats: Number(process.env.SEED_UNIVERSITY_SEATS || 100),
    status: (process.env.SEED_UNIVERSITY_STATUS || 'active'),
    admin_email: process.env.SEED_UNIVERSITY_ADMIN_EMAIL || uadminEmail,
  }

  // Create university if missing
  const uniId = await client.mutation(api.universities.createUniversity, {
    name: university.name,
    slug: university.slug,
    license_plan: university.license_plan,
    license_seats: university.license_seats,
    status: university.status,
    admin_email: university.admin_email,
    created_by_clerkId: clerkUser.id,
  })
  console.log(`University ready: ${university.name} (${university.slug}) -> ${uniId}`)

  // Assign to user, ensure role+plan
  await client.mutation(api.universities.assignUniversityToUser, {
    userClerkId: clerkUser.id,
    universitySlug: university.slug,
    makeAdmin: true,
  })
  console.log(`Assigned ${uadminEmail} to university '${university.slug}' as university_admin with plan=university`)

  console.log('Done.')
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

main().catch(err => {
  console.error(err)
  process.exit(1)
})
