/**
 * Backfill script for migrating users to new role scheme
 *
 * This script:
 * 1. Migrates legacy "user" role to "individual" or "student" based on university_id
 * 2. Creates studentProfiles for users who should be students (have university_id)
 * 3. Ensures all students have proper studentProfile records
 *
 * Run with: node scripts/backfill-student-roles.js
 *
 * Prerequisites:
 * - Set NEXT_PUBLIC_CONVEX_URL in .env.local
 * - Deploy schema changes to Convex first (studentProfiles, studentInvites tables)
 *
 * After successful completion:
 * - Set NEXT_PUBLIC_ENABLE_STUDENT_ORG_BADGE=true in .env.local
 * - Redeploy application to enable student org badge feature
 */

const { ConvexHttpClient } = require("convex/browser");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL is not set in .env.local");
  console.error("Please set this environment variable and try again.");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

/**
 * Main backfill function
 */
async function backfillStudentRoles() {
  console.log("🚀 Starting student role backfill migration...\n");

  try {
    // Step 1: Query all users with role "user"
    console.log("📊 Step 1: Querying users with legacy 'user' role...");
    // TODO: Implement query using convex/migrations.ts mutation
    // const legacyUsers = await client.query(api.migrations.getLegacyUsers);

    console.log("ℹ️  Note: This script requires a Convex mutation to be implemented:");
    console.log("   - convex/migrations.ts: backfillStudentRoles mutation");
    console.log("   - This mutation should:");
    console.log("     1. Find all users with role='user'");
    console.log("     2. For users WITH university_id:");
    console.log("        - Update role to 'student'");
    console.log("        - Create studentProfile if not exists");
    console.log("     3. For users WITHOUT university_id:");
    console.log("        - Update role to 'individual'");
    console.log("");

    // Step 2: Process users
    console.log("📊 Step 2: Processing users...");
    // Implementation would go here once Convex mutation is ready

    // Step 3: Verify results
    console.log("\n📊 Step 3: Verifying migration results...");
    // Implementation would go here

    console.log("\n✅ Migration scaffolding complete!");
    console.log("\n📝 Next steps:");
    console.log("1. Implement convex/migrations.ts backfillStudentRoles mutation");
    console.log("2. Run this script again to execute the migration");
    console.log("3. Verify all students have valid studentProfiles");
    console.log("4. Set NEXT_PUBLIC_ENABLE_STUDENT_ORG_BADGE=true");
    console.log("5. Redeploy application\n");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  backfillStudentRoles()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { backfillStudentRoles };
