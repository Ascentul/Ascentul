/**
 * Set Clerk Advisor Role
 *
 * Updates a user's publicMetadata in Clerk to set role="advisor" with required university_id
 * Run with: npx ts-node -r dotenv/config scripts/set-clerk-advisor-role.ts <user-email> <university-id>
 *
 * Advisors must always have a university_id. This script will refuse to set the role without it.
 *
 * Note: Uses direct Clerk API calls instead of @clerk/backend to avoid version compatibility issues
 * with @clerk/nextjs. For Next.js code, use clerkClient from '@clerk/nextjs/server' instead.
 */

import 'dotenv/config';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = 'https://api.clerk.com/v1';

if (!CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY is not set in environment variables');
  console.log('\nPlease ensure CLERK_SECRET_KEY is set in your .env.local file');
  process.exit(1);
}

// Simple Clerk API client using fetch
async function clerkFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${CLERK_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Clerk API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

interface ClerkUser {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  public_metadata: Record<string, unknown>;
}

interface ClerkUserList {
  data: ClerkUser[];
}

async function setAdvisorRole(email: string, universityId: string) {
  try {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }

    if (!universityId) {
      console.error('❌ Missing university_id argument. Advisors must have a university assignment.');
      console.log('\nUsage: npx ts-node -r dotenv/config scripts/set-clerk-advisor-role.ts <email> <university-id>');
      process.exit(1);
    }

    console.log(`\n🔍 Finding user...`);

    // Look up user by email address
    const users = await clerkFetch<ClerkUserList>(
      `/users?email_address=${encodeURIComponent(email)}`
    );

    if (!users.data || users.data.length === 0) {
      console.error('❌ No user found with the provided email');
      console.log('\nPlease ensure the user has signed in at least once.');
      process.exit(1);
    }

    const user = users.data[0];
    console.log(`✓ Found user: ${user.id}`);

    // Fetch latest user to preserve any existing metadata fields
    const currentUser = await clerkFetch<ClerkUser>(`/users/${user.id}`);

    // Update publicMetadata
    await clerkFetch<ClerkUser>(`/users/${user.id}/metadata`, {
      method: 'PATCH',
      body: JSON.stringify({
        public_metadata: {
          ...(currentUser.public_metadata || {}),
          role: 'advisor',
          university_id: universityId,
        },
      }),
    });

    console.log(`✅ Successfully set role to 'advisor' for user ${user.id}`);
    console.log('\nUser details:');
    console.log(`  - User ID: ${user.id}`);
    console.log(`  - Email: ${email}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${message}`);

    // Check if error message indicates 401
    if (message.includes('(401)')) {
      console.log('\nPlease ensure CLERK_SECRET_KEY is set in your .env.local file');
    }
    process.exit(1);
  }
// Get email from command line args
const email = process.argv[2];
const universityId = process.argv[3];

if (!email || !universityId) {
  console.error('❌ Please provide an email address and university_id');
  console.log('\nUsage: npx ts-node -r dotenv/config scripts/set-clerk-advisor-role.ts <email> <university-id>');
  console.log('Example: npx ts-node -r dotenv/config scripts/set-clerk-advisor-role.ts test.advisor@ascentful.io <convex-university-id>');
  process.exit(1);
}

setAdvisorRole(email, universityId).catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
