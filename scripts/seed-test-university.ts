/**
 * @deprecated Use the Convex mutation instead:
 *   npx convex run dev/seedTestUniversity:seed
 *
 * The Convex mutation (convex/dev/seedTestUniversity.ts) is the complete
 * implementation that creates the university AND assigns users in a single
 * atomic operation with direct database access.
 *
 * This script is kept for reference but has incomplete user assignment logic.
 *
 * ---
 * Original description:
 * Seed Test University Script
 *
 * This script creates a test university and assigns test users to it.
 * Run with: npx ts-node scripts/seed-test-university.ts
 *
 * Prerequisites:
 * - Test users must already exist (run seed-clerk-test-users.js first)
 * - Convex must be running
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL in environment");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// Test university data
const TEST_UNIVERSITY = {
  name: "Acme University",
  slug: "acme-university",
  logo_url: "https://ui-avatars.com/api/?name=Acme+University&background=5371FF&color=fff&size=128&bold=true",
  description: "A test university for development purposes",
  website: "https://acme-university.edu",
  contact_email: "admin@acme-university.edu",
  license_plan: "Enterprise" as const,
  license_seats: 100,
  license_used: 0,
  max_students: 1000,
  license_start: Date.now(),
  license_end: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
  status: "active" as const,
  is_test: true,
};

// Test user emails to assign to the university
const TEST_USER_EMAILS = [
  "test.user+student@ascentful.io",
  "test.user+advisor@ascentful.io",
  "test.user+uadmin@ascentful.io",
];

async function main() {
  console.log("⚠️  DEPRECATED: This script has incomplete user assignment logic.");
  console.log("   Use the Convex mutation instead:");
  console.log("   npx convex run dev/seedTestUniversity:seed\n");
  console.log("   Continuing anyway for reference...\n");

  console.log("🏫 Setting up test university...\n");

  try {
    // Check if test university already exists
    const existingUniversities = await client.query(api.universities_admin.getAllUniversities, {});
    const existing = existingUniversities.find((u: any) => u.slug === TEST_UNIVERSITY.slug);

    let universityId: string;

    if (existing) {
      console.log(`✓ Test university "${TEST_UNIVERSITY.name}" already exists (ID: ${existing._id})`);
      universityId = existing._id;
    } else {
      // Create the test university
      const result = await client.mutation(api.universities_admin.createUniversity, {
        name: TEST_UNIVERSITY.name,
        slug: TEST_UNIVERSITY.slug,
        description: TEST_UNIVERSITY.description,
        website: TEST_UNIVERSITY.website,
        contact_email: TEST_UNIVERSITY.contact_email,
        license_plan: TEST_UNIVERSITY.license_plan,
        license_seats: TEST_UNIVERSITY.license_seats,
        max_students: TEST_UNIVERSITY.max_students,
        license_start: TEST_UNIVERSITY.license_start,
        license_end: TEST_UNIVERSITY.license_end,
        status: TEST_UNIVERSITY.status,
      });

      universityId = result;
      console.log(`✓ Created test university "${TEST_UNIVERSITY.name}" (ID: ${universityId})`);

      // Update with logo_url and is_test flag (if mutation doesn't support them)
      // This would require a separate mutation or direct db update
    }

    console.log("\n👥 Assigning test users to university...\n");

    // Get all users and find test users by email
    for (const email of TEST_USER_EMAILS) {
      try {
        // We need to find the user by email and update their university_id
        // This requires a mutation that can update user's university_id
        console.log(`  Looking for user: ${email}`);

        // Note: You may need to create a specific mutation for this
        // For now, we'll document what needs to happen
        console.log(`  → Would assign to university ${universityId}`);
      } catch (err) {
        console.error(`  ✗ Failed to process ${email}:`, err);
      }
    }

    console.log("\n✅ Test university setup complete!");
    console.log("\nTo fully assign users to the university, run the following in Convex dashboard:");
    console.log(`
// For each test user (student, advisor, uadmin), update their university_id:
// 1. Go to Convex Dashboard → Data → users
// 2. Find users with emails: ${TEST_USER_EMAILS.join(", ")}
// 3. Update their university_id field to: ${universityId}
`);

  } catch (error) {
    console.error("Failed to set up test university:", error);
    process.exit(1);
  }
}

main();
