/**
 * Emergency script to disable MFA for all users
 * Run with: node scripts/disable-mfa-for-all-users.js
 */

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error('ERROR: CLERK_SECRET_KEY environment variable is not set');
  console.error('Run: CLERK_SECRET_KEY=your_key node scripts/disable-mfa-for-all-users.js');
  process.exit(1);
}

async function disableMFAForAllUsers() {
  console.log('Fetching all users...');

  // Fetch all users
  const usersResponse = await fetch('https://api.clerk.com/v1/users?limit=500', {
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!usersResponse.ok) {
    console.error('Failed to fetch users:', await usersResponse.text());
    process.exit(1);
  }

  const users = await usersResponse.json();
  console.log(`Found ${users.length} users`);

  let fixed = 0;
  let failed = 0;

  for (const user of users) {
    try {
      // Check if user has MFA enabled
      if (user.two_factor_enabled) {
        console.log(`Disabling MFA for user: ${user.email_addresses?.[0]?.email_address || user.id}`);

        // Disable TOTP (authenticator app)
        const disableResponse = await fetch(`https://api.clerk.com/v1/users/${user.id}/totp`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (disableResponse.ok) {
          console.log(`  ✅ Disabled MFA for ${user.email_addresses?.[0]?.email_address || user.id}`);
          fixed++;
        } else {
          const error = await disableResponse.text();
          console.error(`  ❌ Failed to disable MFA: ${error}`);
          failed++;
        }
      }
    } catch (error) {
      console.error(`  ❌ Error processing user ${user.id}:`, error.message);
      failed++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total users: ${users.length}`);
  console.log(`MFA disabled: ${fixed}`);
  console.log(`Failed: ${failed}`);
}

disableMFAForAllUsers().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
