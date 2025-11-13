/**
 * Backfill script for migrating users to new role scheme
 *
 * This script:
 * 1. Migrates legacy "user" role to "individual" or "student" based on university_id
 * 2. Creates studentProfiles for users who should be students (have university_id)
 * 3. Ensures all students have proper studentProfile records
 *
 * Run with: node scripts/backfill-student-roles.js [--dry-run]
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
const { api } = require("../convex/_generated/api.js");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL is not set in .env.local");
  console.error("Please set this environment variable and try again.");
  process.exit(1);
}

// Validate URL format with comprehensive checks
try {
  const url = new URL(CONVEX_URL);
  if (url.protocol !== 'https:') {
    throw new Error('Must use HTTPS protocol');
  }
  // Additional validation: ensure it looks like a Convex deployment URL
  if (!url.hostname.endsWith('.convex.cloud') && !url.hostname.endsWith('.convex.site')) {
    console.warn("⚠️  Warning: URL doesn't match typical Convex deployment pattern");
    console.warn("Expected: https://your-deployment.convex.cloud");
    console.warn("Actual:", CONVEX_URL);
    console.warn("Proceeding anyway, but verify this is correct...\n");
  }
} catch (error) {
  console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL must be a valid HTTPS URL");
  console.error("Current value:", CONVEX_URL);
  console.error("Expected format: https://your-deployment.convex.cloud");
  console.error("Validation error:", error.message);
  process.exit(1);
}

// Initialize Convex client with error handling
let client;
try {
  client = new ConvexHttpClient(CONVEX_URL);
} catch (error) {
  console.error("❌ Error: Failed to connect to Convex:", error.message);
  console.error("Check that the URL is valid and the deployment is accessible.");
  process.exit(1);
}

/**
 * Main backfill function
 */
async function backfillStudentRoles() {
  // Check for --dry-run flag
  const dryRun = process.argv.includes("--dry-run");

  console.log("🚀 Starting student role backfill migration...");
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes will be made)" : "LIVE (changes will be applied)"}\n`);

  try {
    // Call the Convex migration mutation using type-safe generated API
    console.log("📊 Executing migration via Convex...");

    const result = await client.mutation(api.migrations.backfillStudentRoles, {
      dryRun,
    });

    // Display results
    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION RESULTS");
    console.log("=".repeat(60));
    console.log(`Status: ${result.success ? "✅ SUCCESS" : "⚠️  PARTIAL SUCCESS"}`);
    console.log(`Mode: ${result.dryRun ? "DRY RUN" : "LIVE"}`);
    console.log(`Total Processed: ${result.totalProcessed}`);
    console.log(`Students Converted: ${result.studentsConverted}`);
    console.log(`Individuals Converted: ${result.individualsConverted}`);
    console.log(`Profiles Created: ${result.profilesCreated}`);

    if (result.errors && result.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${result.errors.length}`);
      console.log("\nError details:");
      result.errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    }

    console.log("=".repeat(60));
    console.log(`\n${result.message}\n`);

    // Next steps
    if (result.success && !result.dryRun) {
      console.log("✅ Migration completed successfully!");
      console.log("\n📝 Next steps:");
      console.log("1. Verify all students have valid studentProfiles");
      console.log("   Run: npx convex run students:findDuplicateProfiles");
      console.log("2. Review students at inactive universities (if any warnings logged)");
      console.log("   Run: npx convex run students:findStudentsAtInactiveUniversities");
      console.log("3. Set NEXT_PUBLIC_ENABLE_STUDENT_ORG_BADGE=true in .env.local");
      console.log("4. Rebuild and redeploy application");
      console.log("5. Verify student badges appear in sidebar\n");
    } else if (result.dryRun && result.success) {
      console.log("ℹ️  This was a dry run. No changes were made.");
      console.log("\n📝 To apply changes:");
      console.log("   Run: node scripts/backfill-student-roles.js");
      console.log("   (without --dry-run flag)\n");
    } else if (result.dryRun) {
      console.log("⚠️  Dry run completed with errors. No changes were made.");
      console.log("\n📝 Fix the errors above before running live:");
      console.log("1. Review error details above");
      console.log("2. Fix any data issues (missing universities, capacity problems, etc.)");
      console.log("3. Run dry-run again to verify fixes:");
      console.log("   node scripts/backfill-student-roles.js --dry-run");
      console.log("4. Once dry-run succeeds, apply changes:");
      console.log("   node scripts/backfill-student-roles.js\n");
      process.exit(1);
    } else {
      console.log("⚠️  Migration completed with errors.");
      console.log("\n📝 Review errors above and:");
      console.log("1. Fix any data issues (missing universities, capacity problems, etc.)");
      console.log("2. Re-run migration for failed users");
      console.log("3. Contact support if issues persist\n");
      process.exit(1);
    }

  } catch (error) {
    console.error("\n❌ Migration failed with error:");
    console.error(error.message || error);

    if (error.data) {
      console.error("\nError details:", JSON.stringify(error.data, null, 2));
    }

    console.log("\n📝 Troubleshooting:");
    console.log("1. Ensure NEXT_PUBLIC_CONVEX_URL is correct");
    console.log("2. Verify Convex deployment is running");
    console.log("3. Check convex/migrations.ts is deployed");
    console.log("4. Review Convex logs for detailed error information\n");

    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  backfillStudentRoles()
    .then(() => process.exit(0))
    .catch((err) => {
      // Last-resort error handler for unexpected failures
      // (Normal errors are already handled in backfillStudentRoles)
      console.error("\n❌ UNEXPECTED ERROR - This should not happen:");
      console.error(err);
      console.error("\nThis error bypassed normal error handling.");
      console.error("Please report this issue with the full error trace above.\n");
      process.exit(1);
    });
}

module.exports = { backfillStudentRoles };
