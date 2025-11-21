#!/usr/bin/env node
/**
 * Assign student to university after they've signed in
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

async function main() {
  const { ConvexHttpClient } = await import('convex/browser')
  const { api } = await import('../convex/_generated/api.js')

  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)

  const domain = process.env.SEED_TEST_DOMAIN || 'ascentful.io'
  const prefix = process.env.SEED_TEST_PREFIX || 'test.user'
  const studentEmail = `${prefix}+student@${domain}`
  const universitySlug = process.env.SEED_UNIVERSITY_SLUG || 'ascentful'

  console.log(`Assigning ${studentEmail} to university '${universitySlug}'...`)

  try {
    await client.mutation(api.universities.assignUniversityToUser, {
      userEmail: studentEmail,
      universitySlug: universitySlug,
      makeAdmin: false, // Student, not admin
    })
    console.log(`✅ Successfully assigned student to university!`)
  } catch (err) {
    if (err.message.includes('User not found')) {
      console.error('\n❌ User not found in Convex database.')
      console.error('The student needs to sign in at least once to create their Convex profile.')
      console.error('\nPlease:')
      console.error(`  1. Go to http://localhost:3000/sign-in`)
      console.error(`  2. Sign in with: ${studentEmail}`)
      console.error(`  3. Then run this script again`)
      process.exit(1)
    }
    throw err
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
  console.error(err)
  process.exit(1)
})
