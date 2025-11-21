#!/usr/bin/env node
/**
 * Create a student user properly using the student invite system
 *
 * This script:
 * 1. Creates a university admin user in Clerk (if not exists)
 * 2. Signs in the admin to create their Convex profile
 * 3. Creates a student invite from the admin
 * 4. Creates the student in Clerk
 * 5. Accepts the invite as the student (creates studentProfile)
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
  const password = process.env.SEED_TEST_PASSWORD || 'V3ry$Strong!Pa55-2025#'
  const universitySlug = process.env.SEED_UNIVERSITY_SLUG || 'ascentful'

  const uadminEmail = `${prefix}+uadmin@${domain}`
  const studentEmail = `${prefix}+student@${domain}`

  console.log('Step 1: Checking university admin...')
  const adminClerkUser = await findClerkByEmail(uadminEmail)
  if (!adminClerkUser) {
    console.error(`University admin not found: ${uadminEmail}`)
    console.error('Please run: npm run seed:clerk && npm run seed:university')
    process.exit(1)
  }
  console.log(`✓ Found admin: ${adminClerkUser.id}`)

  console.log('\nStep 2: Checking university...')
  const universities = await client.query(api.universities.getAllUniversities, {})
  const university = universities.find(u => u.slug === universitySlug)
  if (!university) {
    console.error(`University '${universitySlug}' not found. Run 'npm run seed:university' first.`)
    process.exit(1)
  }
  console.log(`✓ Found university: ${university.name} (${university.slug})`)

  console.log('\nStep 3: Checking admin Convex profile...')
  // Check if admin has signed in and has Convex profile
  const adminUsers = await client.query(api.users.getUserByClerkId, { clerkId: adminClerkUser.id })
  if (!adminUsers) {
    console.error(`\n❌ University admin hasn't signed in yet!`)
    console.error('\nThe admin needs to sign in first to create their Convex profile.')
    console.error('Please:')
    console.error(`  1. Go to http://localhost:3000/sign-in`)
    console.error(`  2. Sign in with: ${uadminEmail}`)
    console.error(`  3. Password: ${password}`)
    console.error(`  4. Then run this script again`)
    process.exit(1)
  }
  console.log(`✓ Admin has Convex profile`)

  console.log('\nStep 4: Creating student in Clerk...')
  let studentClerkUser = await findClerkByEmail(studentEmail)
  if (!studentClerkUser) {
    studentClerkUser = await clerkRequest('/users', {
      method: 'POST',
      body: {
        email_address: [studentEmail],
        password: password,
        first_name: 'Test',
        last_name: 'Student',
      },
    })
    console.log(`✓ Created Clerk user: ${studentClerkUser.id}`)
  } else {
    console.log(`✓ Student already exists in Clerk: ${studentClerkUser.id}`)
  }

  // Set role to student
  await clerkRequest(`/users/${studentClerkUser.id}/metadata`, {
    method: 'PATCH',
    body: { public_metadata: { role: 'student' } },
  })
  console.log(`✓ Set role=student`)

  console.log('\nStep 5: Creating student invite...')
  try {
    const inviteResult = await client.action(api.students.createInvite, {
      universityId: university._id,
      email: studentEmail,
      createdByClerkId: adminClerkUser.id,
      expiresInDays: 30,
      metadata: {
        major: 'Computer Science',
        year: 'Junior',
      },
    })
    console.log(`✓ Created invite with token: ${inviteResult.token}`)

    console.log('\nStep 6: Student needs to accept invite...')
    console.log('\n✅ Student account created successfully!')
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Student Credentials:')
    console.log(`   Email: ${studentEmail}`)
    console.log(`   Password: ${password}`)
    console.log('\n🎫 Invite Token:')
    console.log(`   ${inviteResult.token}`)
    console.log('\n📋 Next Steps:')
    console.log('   1. Go to http://localhost:3000/sign-up')
    console.log('   2. Sign up with the email above')
    console.log('   3. The invite will be automatically detected and accepted')
    console.log('   4. Student profile will be created with university access!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (error) {
    if (error.message.includes('pending invite already exists')) {
      console.log(`\n⚠️  Invite already exists for ${studentEmail}`)
      console.log('\nThe student can sign in at: http://localhost:3000/sign-in')
      console.log(`Email: ${studentEmail}`)
      console.log(`Password: ${password}`)
    } else {
      throw error
    }
  }
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
  console.error('\n❌ Error:', err.message)
  process.exit(1)
})
