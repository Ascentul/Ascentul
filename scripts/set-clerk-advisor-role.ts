/**
 * Set Clerk Advisor Role
 *
 * Updates a user's publicMetadata in Clerk to set role="advisor" with required university_id
 * Run with: npx ts-node -r dotenv/config scripts/set-clerk-advisor-role.ts <user-email> <university-id>
 *
 * Advisors must always have a university_id. This script will refuse to set the role without it.
 */

import 'dotenv/config';
import { createClerkClient } from '@clerk/backend';

if (!process.env.CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY is not set in environment variables');
  console.log('\nPlease ensure CLERK_SECRET_KEY is set in your .env.local file');
  process.exit(1);
}

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

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
    const users = await clerkClient.users.getUserList({ emailAddress: [email] });

    if (!users.data || users.data.length === 0) {
      console.error('❌ No user found with the provided email');
      console.log('\nPlease ensure the user has signed in at least once.');
      process.exit(1);
    }

    const user = users.data[0];
    console.log(`✓ Found user: ${user.id}`);

    // Update publicMetadata
    await clerkClient.users.updateUser(user.id, {
      publicMetadata: {
        ...(user.publicMetadata || {}),
        role: 'advisor',
        university_id: universityId,
      },
    });

    console.log(`✅ Successfully set role to 'advisor' for user ${user.id}`);
    console.log('\nUser details:');
    console.log(`  - User ID: ${user.id}`);
    console.log(`  - Email: ${email}`);
    console.log('  - Role: advisor');
    console.log(`  - University ID: ${universityId}`);
    console.log('\nℹ️  Clerk refreshes tokens automatically (~60s). For immediate effect, trigger a client token refresh (e.g., session.reload or getToken({ skipCache: true })).');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${message}`);

    // Type guard for Clerk API errors with status property
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      typeof (error as { status?: unknown }).status === 'number' &&
      (error as { status: number }).status === 401
    ) {
      console.log('\nPlease ensure CLERK_SECRET_KEY is set in your .env.local file');
    }
    process.exit(1);
  }
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
