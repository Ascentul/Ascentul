#!/usr/bin/env node
/**
 * Seed Clerk test users with roles stored in public_metadata.role
 * - Requires CLERK_SECRET_KEY in environment (auto-loaded from .env.local if present)
 * - Uses Clerk REST API (no extra deps)
 * - Safe to re-run: will update metadata if user exists
 */

const fs = require('fs')
const path = require('path')

// Best-effort load of .env.local (Next.js convention)
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

async function findUserByEmail(email) {
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

async function createOrUpdateUser({ email, password, firstName, lastName, role }) {
  let user
  try {
    user = await request('/users', {
      method: 'POST',
      body: {
        email_address: [email],
        password,
        first_name: firstName,
        last_name: lastName,
      },
    })
    console.log(`Created user ${email}: ${user.id}`)
  } catch (err) {
    if (err.status === 409 || err.status === 422 || err.status === 400) {
      user = await findUserByEmail(email)
      if (!user) throw err
      console.log(`User already exists ${email}: ${user.id}`)
    } else {
      throw err
    }
  }

  // Ensure public_metadata.role is set
  await request(`/users/${user.id}/metadata`, {
    method: 'PATCH',
    body: { public_metadata: { role } },
  })
  console.log(`Set role=${role} for ${email}`)

  return user
}

async function main() {
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('Missing CLERK_SECRET_KEY in environment')
    process.exit(1)
  }

  const PASSWORD = process.env.SEED_TEST_PASSWORD || 'V3ry$Strong!Pa55-2025#'
  const domain = process.env.SEED_TEST_DOMAIN || 'ascentful.io'
  const prefix = process.env.SEED_TEST_PREFIX || 'test.user'

  const accounts = [
    // Base free user (will remain free)
    { role: 'user', email: `${prefix}+user@${domain}` },
    // Dedicated pro user account (role remains 'user'; we'll set subscription to premium in Convex)
    { role: 'user', email: `${prefix}+pro@${domain}` },
    { role: 'staff', email: `${prefix}+staff@${domain}` },
    { role: 'university_admin', email: `${prefix}+uadmin@${domain}` },
    { role: 'admin', email: `${prefix}+admin@${domain}` },
    { role: 'super_admin', email: `${prefix}+super@${domain}` },
  ]

  const results = []
  for (const { role, email } of accounts) {
    const user = await createOrUpdateUser({
      email,
      password: PASSWORD,
      firstName: 'Test',
      lastName: role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      role,
    })
    results.push({ email, role, id: user.id })
  }

  console.log('\nSeed complete:')
  for (const r of results) {
    console.log(`- ${r.role.padEnd(15)} ${r.email} (${r.id})`)
  }
  console.log('\nNotes:')
  console.log('- If email verification is enforced in Clerk dev settings, consider disabling it for development or verify these addresses via the Dashboard.')
  console.log('- On first sign-in, Convex user profile will be created with the same role via Clerk public_metadata propagation.')
}

// Node 18+ fetch
if (typeof fetch === 'undefined') {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
