#!/usr/bin/env node
/**
 * Seed Advisor Test User
 *
 * Creates a test advisor user in Clerk and Convex with:
 * - Advisor role in Clerk public_metadata
 * - Associated with a test university
 * - Assigned test students for caseload
 *
 * Run: node scripts/seed-advisor-user.js
 */

const fs = require('fs')
const path = require('path')

// Load .env.local
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
    const err = new Error(`Clerk API ${res.status} ${res.statusText}: ${text}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

async function findUserByEmail(email) {
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

async function createOrUpdateClerkUser({ email, password, firstName, lastName, role, universityId }) {
  let user
  try {
    user = await clerkRequest('/users', {
      method: 'POST',
      body: {
        email_address: [email],
        password,
        first_name: firstName,
        last_name: lastName,
      },
    })
    console.log(`✓ Created Clerk user ${email}: ${user.id}`)
  } catch (err) {
    if (err.status === 409 || err.status === 422 || err.status === 400) {
      user = await findUserByEmail(email)
      if (!user) throw err
      console.log(`✓ Found existing Clerk user ${email}: ${user.id}`)
    } else {
      throw err
    }
  }

  // Set public_metadata with role and university_id
  await clerkRequest(`/users/${user.id}/metadata`, {
    method: 'PATCH',
    body: {
      public_metadata: {
        role,
        university_id: universityId,
      }
    },
  })
  console.log(`✓ Set role=${role}, university_id=${universityId} for ${email}`)

  return user
}

async function main() {
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('❌ Missing CLERK_SECRET_KEY in environment')
    process.exit(1)
  }

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error('❌ Missing NEXT_PUBLIC_CONVEX_URL in environment')
    process.exit(1)
  }

  const PASSWORD = process.env.SEED_TEST_PASSWORD || 'V3ry$Strong!Pa55-2025#'
  const domain = process.env.SEED_TEST_DOMAIN || 'ascentful.io'

  console.log('\n🚀 Seeding Advisor Test User\n')

  // 1. Create advisor user in Clerk
  const advisorEmail = `test.advisor@${domain}`
  const studentEmail1 = `test.student1@${domain}`
  const studentEmail2 = `test.student2@${domain}`

  const advisor = await createOrUpdateClerkUser({
    email: advisorEmail,
    password: PASSWORD,
    firstName: 'Test',
    lastName: 'Advisor',
    role: 'advisor',
    universityId: 'temp', // Will update after creating university in Convex
  })

  const student1 = await createOrUpdateClerkUser({
    email: studentEmail1,
    password: PASSWORD,
    firstName: 'Jane',
    lastName: 'Student',
    role: 'student',
    universityId: 'temp',
  })

  const student2 = await createOrUpdateClerkUser({
    email: studentEmail2,
    password: PASSWORD,
    firstName: 'John',
    lastName: 'Student',
    role: 'student',
    universityId: 'temp',
  })

  console.log('\n✅ Clerk users created/updated')
  console.log('\nNext steps:')
  console.log('1. Sign in with each user to create Convex profiles:')
  console.log(`   - Advisor: ${advisorEmail} / ${PASSWORD}`)
  console.log(`   - Student 1: ${studentEmail1} / ${PASSWORD}`)
  console.log(`   - Student 2: ${studentEmail2} / ${PASSWORD}`)
  console.log('')
  console.log('2. Run the university assignment script:')
  console.log('   node scripts/assign-advisor-students.js')
  console.log('')
  console.log('Or use Convex dashboard to:')
  console.log('   - Create/find a test university')
  console.log('   - Update user records with university_id')
  console.log('   - Create student_advisors records linking students to advisor')
}

// Node 18+ fetch
if (typeof fetch === 'undefined') {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args))
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
