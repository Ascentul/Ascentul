/**
 * Set Clerk Advisor Role
 *
 * Updates a user's publicMetadata in Clerk to set role="advisor"
 * Run with: npx ts-node scripts/set-clerk-advisor-role.ts <user-email>
 */

import { createClerkClient } from '@clerk/backend';

if (!process.env.CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY is not set in environment variables');
  console.log('\nPlease ensure CLERK_SECRET_KEY is set in your .env.local file');
  process.exit(1);
}

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

async function setAdvisorRole(email: string) {
  try {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format');
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
      },
    });

    console.log(`✅ Successfully set role to 'advisor' for user ${user.id}`);
    console.log('\nUser details:');
    console.log(`  - User ID: ${user.id}`);
    console.log('  - Email: [redacted for privacy]');
    console.log('  - Role: advisor');
    console.log('\n⚠️  Important: The user must LOG OUT and LOG BACK IN for changes to take effect!');
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

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('\nUsage: npx ts-node scripts/set-clerk-advisor-role.ts <email>');
  console.log('Example: npx ts-node scripts/set-clerk-advisor-role.ts test.advisor@ascentful.io');
  process.exit(1);
}

setAdvisorRole(email).catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
