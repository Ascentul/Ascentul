/**
 * Dev Sanity Check for University Lifecycle and Metrics
 *
 * This function helps verify that university lifecycle operations and metrics
 * calculations are working correctly. It creates test data, performs operations,
 * and logs the results for manual verification.
 *
 * USAGE:
 *   # First, get a super admin Clerk ID:
 *   npx convex run dev/checkMetrics:getSuperAdminClerkId
 *
 *   # Then run the sanity check with that ID:
 *   npx convex run dev/checkMetrics:runSanityCheck '{"clerkId":"YOUR_CLERK_ID"}'
 *
 * IMPORTANT:
 * - This creates real data in your database
 * - Only run in development or test environments
 * - Clean up test data after verification
 */

import { action, query } from "../_generated/server";
import { v } from "convex/values";

// Workaround for "Type instantiation is excessively deep" error in Convex
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const api: any = require("../_generated/api").api;

// Helper query to get a super admin Clerk ID for testing
export const getSuperAdminClerkId = query({
  args: {},
  handler: async (ctx) => {
    const superAdmin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "super_admin"))
      .first();

    if (!superAdmin) {
      throw new Error("No super admin found in database. Please create a super admin user first.");
    }

    return {
      clerkId: superAdmin.clerkId,
      name: superAdmin.name,
      email: superAdmin.email,
      message: `Found super admin: ${superAdmin.name} (${superAdmin.email})`
    };
  },
});

export const runSanityCheck = action({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const logs: string[] = [];

    const log = (message: string) => {
      console.log(message);
      logs.push(message);
    };

    log("=".repeat(80));
    log("UNIVERSITY LIFECYCLE & METRICS SANITY CHECK");
    log("=".repeat(80));

    try {
      // Get initial metrics
      log("\n📊 INITIAL METRICS:");
      const initialMetrics = await ctx.runQuery(api.metrics.getAllMetrics, {});
      log(`  Total Universities All Time: ${initialMetrics.totalUniversitiesAllTime}`);
      log(`  Active Universities Current: ${initialMetrics.activeUniversitiesCurrent}`);
      log(`  Archived Universities: ${initialMetrics.archivedUniversities}`);
      log(`  Total Users All Time: ${initialMetrics.totalUsersAllTime}`);
      log(`  Active Users 30d: ${initialMetrics.activeUsers30d}`);

      // Step 1: Create a test university
      log("\n🏫 STEP 1: Creating test university...");
      const testUniversityId = await ctx.runMutation(api.universities.createUniversity, {
        name: "Sanity Check Test University",
        slug: `sanity-test-${Date.now()}`,
        license_plan: "Starter",
        license_seats: 10,
        status: "active",
        admin_email: "test@example.com",
        created_by_clerkId: args.clerkId,
      });
      log(`  ✓ Created university: ${testUniversityId}`);

      // Mark it as test immediately
      await ctx.runMutation(api.universities.toggleTestUniversity, {
        universityId: testUniversityId,
        isTest: true,
      });
      log(`  ✓ Marked as test university`);

      // Step 2: Check metrics after test university creation
      log("\n📊 METRICS AFTER TEST UNIVERSITY CREATION:");
      const afterTestMetrics = await ctx.runQuery(api.metrics.getAllMetrics, {});
      log(`  Total Universities All Time: ${afterTestMetrics.totalUniversitiesAllTime}`);
      log(`  Active Universities Current: ${afterTestMetrics.activeUniversitiesCurrent}`);
      log(`  ✓ Test university should NOT appear in metrics (excluded automatically)`);

      if (afterTestMetrics.totalUniversitiesAllTime === initialMetrics.totalUniversitiesAllTime) {
        log(`  ✓ PASS: Test university correctly excluded from metrics`);
      } else {
        log(`  ❌ FAIL: Test university incorrectly included in metrics`);
      }

      // Step 3: Create a real university
      log("\n🏫 STEP 2: Creating real university...");
      const realUniversityId = await ctx.runMutation(api.universities.createUniversity, {
        name: "Sanity Check Real University",
        slug: `sanity-real-${Date.now()}`,
        license_plan: "Pro",
        license_seats: 50,
        status: "active",
        admin_email: "real@example.com",
        created_by_clerkId: args.clerkId,
      });
      log(`  ✓ Created university: ${realUniversityId}`);

      // Step 4: Check metrics after real university creation
      log("\n📊 METRICS AFTER REAL UNIVERSITY CREATION:");
      const afterRealMetrics = await ctx.runQuery(api.metrics.getAllMetrics, {});
      log(`  Total Universities All Time: ${afterRealMetrics.totalUniversitiesAllTime}`);
      log(`  Active Universities Current: ${afterRealMetrics.activeUniversitiesCurrent}`);

      const expectedTotal = initialMetrics.totalUniversitiesAllTime + 1;
      const expectedActive = initialMetrics.activeUniversitiesCurrent + 1;

      if (afterRealMetrics.totalUniversitiesAllTime === expectedTotal) {
        log(`  ✓ PASS: Total universities increased by 1`);
      } else {
        log(`  ❌ FAIL: Expected ${expectedTotal}, got ${afterRealMetrics.totalUniversitiesAllTime}`);
      }

      if (afterRealMetrics.activeUniversitiesCurrent === expectedActive) {
        log(`  ✓ PASS: Active universities increased by 1`);
      } else {
        log(`  ❌ FAIL: Expected ${expectedActive}, got ${afterRealMetrics.activeUniversitiesCurrent}`);
      }

      // Step 5: Archive the real university
      log("\n📦 STEP 3: Archiving real university...");
      await ctx.runMutation(api.universities.archiveUniversity, {
        universityId: realUniversityId,
      });
      log(`  ✓ University archived`);

      // Step 6: Check metrics after archiving
      log("\n📊 METRICS AFTER ARCHIVING:");
      const afterArchiveMetrics = await ctx.runQuery(api.metrics.getAllMetrics, {});
      log(`  Total Universities All Time: ${afterArchiveMetrics.totalUniversitiesAllTime}`);
      log(`  Active Universities Current: ${afterArchiveMetrics.activeUniversitiesCurrent}`);
      log(`  Archived Universities: ${afterArchiveMetrics.archivedUniversities}`);

      const expectedArchived = initialMetrics.archivedUniversities + 1;

      if (afterArchiveMetrics.totalUniversitiesAllTime === expectedTotal) {
        log(`  ✓ PASS: Total universities still includes archived university`);
      } else {
        log(`  ❌ FAIL: Archived university should still count in total`);
      }

      if (afterArchiveMetrics.activeUniversitiesCurrent === initialMetrics.activeUniversitiesCurrent) {
        log(`  ✓ PASS: Active universities decreased (archived removed from active count)`);
      } else {
        log(`  ❌ FAIL: Expected ${initialMetrics.activeUniversitiesCurrent}, got ${afterArchiveMetrics.activeUniversitiesCurrent}`);
      }

      if (afterArchiveMetrics.archivedUniversities === expectedArchived) {
        log(`  ✓ PASS: Archived count increased by 1`);
      } else {
        log(`  ❌ FAIL: Expected ${expectedArchived}, got ${afterArchiveMetrics.archivedUniversities}`);
      }

      // Step 7: Hard delete the test university
      log("\n🗑️  STEP 4: Hard deleting test university...");
      const deleteResult = await ctx.runMutation(api.universities.hardDeleteUniversity, {
        universityId: testUniversityId,
      });
      log(`  ✓ Test university hard deleted`);
      log(`  Deleted counts: ${JSON.stringify(deleteResult.deletedCounts)}`);

      // Step 8: Try to hard delete real university (should fail)
      log("\n🛡️  STEP 5: Testing guard for real university hard delete...");
      try {
        await ctx.runMutation(api.universities.hardDeleteUniversity, {
          universityId: realUniversityId,
        });
        log(`  ❌ FAIL: Hard delete should have been blocked for real university`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes("disabled for real universities")) {
          log(`  ✓ PASS: Hard delete correctly blocked for real university`);
          log(`  Error message: "${errorMsg}"`);
        } else {
          log(`  ❌ FAIL: Wrong error: ${errorMsg}`);
        }
      }

      // Step 9: Final metrics check
      log("\n📊 FINAL METRICS:");
      const finalMetrics = await ctx.runQuery(api.metrics.getAllMetrics, {});
      log(`  Total Universities All Time: ${finalMetrics.totalUniversitiesAllTime}`);
      log(`  Active Universities Current: ${finalMetrics.activeUniversitiesCurrent}`);
      log(`  Archived Universities: ${finalMetrics.archivedUniversities}`);
      log(`  Total Users All Time: ${finalMetrics.totalUsersAllTime}`);
      log(`  Active Users 30d: ${finalMetrics.activeUsers30d}`);

      log("\n✅ SANITY CHECK COMPLETE");
      log("\n⚠️  CLEANUP INSTRUCTIONS:");
      log(`   The archived real university should be cleaned up via:`);
      log(`   1. Toggle to test: npx convex run universities:toggleTestUniversity --universityId "${realUniversityId}" --isTest true`);
      log(`   2. Hard delete: npx convex run universities:hardDeleteUniversity --universityId "${realUniversityId}"`);
      log(`   Or use the admin UI to delete it.`);

    } catch (error) {
      log(`\n❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
      log(error instanceof Error ? error.stack || "" : "");
    }

    log("\n" + "=".repeat(80));

    return {
      success: true,
      logs,
    };
  },
});
