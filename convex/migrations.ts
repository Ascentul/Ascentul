/**
 * Database migrations for schema changes
 */

import { internalMutation, query } from "./_generated/server"
import { v } from "convex/values"
import { requireSuperAdmin } from "./lib/roles"
import { INTERNAL_ROLES } from "./lib/constants"

/**
 * Migrate users with role "admin" to "super_admin"
 * This is needed after removing "admin" role from the schema
 */
export const migrateAdminToSuperAdmin = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all users
    const allUsers = await ctx.db.query("users").collect()

    let migratedCount = 0

    for (const user of allUsers) {
      // @ts-ignore - temporarily ignore type error for old "admin" role
      if (user.role === "admin") {
        await ctx.db.patch(user._id, {
          role: "super_admin",
          updated_at: Date.now(),
        })
        migratedCount++
        console.log(`Migrated user ${user.email} from admin to super_admin`)
      }
    }

    console.log(`Migration complete: ${migratedCount} users updated`)

    return {
      success: true,
      migratedCount,
      message: `Successfully migrated ${migratedCount} users from 'admin' to 'super_admin'`,
    }
  },
})

/**
 * Backfill student roles and profiles
 *
 * This migration:
 * 1. Migrates legacy "user" role to "individual" or "student" based on university_id
 * 2. Creates studentProfiles for users who should be students
 * 3. Ensures all students have proper studentProfile records
 *
 * Run via: npx convex run migrations:backfillStudentRoles
 */
export const backfillStudentRoles = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()), // If true, only logs changes without applying them
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const dryRun = args.dryRun ?? false

    console.log(`🚀 Starting student role backfill (dryRun: ${dryRun})...`)

    // Get all users with role "user" (legacy role)
    const legacyUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "user"))
      .collect()

    console.log(`📊 Found ${legacyUsers.length} users with legacy 'user' role`)

    let studentsConverted = 0
    let individualsConverted = 0
    let profilesCreated = 0
    const errors: string[] = []

    for (const user of legacyUsers) {
      const userLabel = `user:${user._id}`
      try {
        // Determine if user should be a student (has university_id)
        const isStudent = !!user.university_id

        if (isStudent) {
          // TypeScript type narrowing: assert university_id is defined
          const universityId = user.university_id!

          // User should be a student
          console.log(`👨‍🎓 Converting ${userLabel} to student (university: ${universityId})`)

          // Validate university exists and has capacity
          const university = await ctx.db.get(universityId)
          if (!university) {
            const errorMsg = `University ${user.university_id} not found for ${userLabel}`
            console.error(`❌ ${errorMsg}`)
            errors.push(errorMsg)
            continue
          }

          // Status check: Log warning but proceed (backfill context)
          // These are EXISTING users who are already enrolled and using the system.
          // Skipping them would leave the database in an inconsistent state.
          // If university is inactive, admins should review these users post-migration.
          if (university.status !== "active") {
            const warnMsg = `⚠️  University ${university.name} is ${university.status} for ${userLabel}`
            console.warn(warnMsg)
            console.warn(`   This user is already enrolled - proceeding with migration.`)
            console.warn(`   Admin action: Review students at inactive universities and decide:`)
            console.warn(`     - Keep them as students (if university will be reactivated)`)
            console.warn(`     - Change role to "individual" (if permanently leaving university)`)
            // Continue with migration - don't skip existing enrolled users
          }

          // Check if studentProfile already exists BEFORE capacity check
          // (Capacity only increases if we create a NEW profile)
          const existingProfile = await ctx.db
            .query("studentProfiles")
            .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
            .first()

          // Capacity check: Only warn if we'll actually create a profile
          // These are EXISTING users who are already enrolled and using the system.
          // Skipping them would leave the database in an inconsistent state.
          // If capacity is exceeded, university admins should increase license_seats.
          if (!existingProfile) {
            const currentUsage = university.license_used || 0
            if (currentUsage >= university.license_seats) {
              const warnMsg = `⚠️  University ${university.name} will exceed capacity: ${currentUsage + 1}/${university.license_seats} after creating profile for ${userLabel}`
              console.warn(warnMsg)
              console.warn(`   This user is already enrolled - proceeding with migration.`)
              console.warn(`   Admin action: Increase license_seats for ${university.name} to accommodate existing students.`)
              // Continue with migration - don't skip existing enrolled users
            }
          }

          if (!existingProfile) {
            console.log(`  📝 Creating studentProfile for ${userLabel}`)

            if (!dryRun) {
              // Double-check immediately before insert to prevent race condition
              // If migration runs concurrently or is re-executed, this prevents duplicates
              const raceCheck = await ctx.db
                .query("studentProfiles")
                .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
                .first()

              if (raceCheck) {
                console.log(`  ⚠️  Profile created by concurrent operation for ${userLabel}`)
                // Profile exists - count it as created (ensures dry run matches actual run counts)
                profilesCreated++
              } else {
                // Safe to create profile
                // Create student profile FIRST (before updating user role)
                // CRITICAL: This ordering prevents orphaned "student" users without profiles
                // If profile creation fails, user role remains unchanged (data integrity preserved)
                await ctx.db.insert("studentProfiles", {
                  user_id: user._id,
                  university_id: universityId,
                  major: user.major,
                  // Use user account creation date as enrollment_date estimate
                  // NOTE: This is an approximation - actual enrollment may be earlier/later
                  // Real enrollment dates should be set via invite acceptance or admin import
                  enrollment_date: user.created_at,
                  status: "active",
                  created_at: now,
                  updated_at: now,
                })

                // Increment university license usage
                // IDEMPOTENCY NOTE: This only runs when profile is actually inserted
                // If migration is re-run, the race check above (line 144) skips profile
                // creation AND this license increment, preventing double-counting
                await ctx.db.patch(universityId, {
                  license_used: (university.license_used || 0) + 1,
                  updated_at: now,
                })

                profilesCreated++
              }
            } else {
              profilesCreated++
            }
          } else {
            console.log(`  ✓ studentProfile already exists for ${userLabel}`)
          }

          if (!dryRun) {
            // Update role to student AFTER ensuring profile exists
            // This ensures we NEVER have a student role without a valid profile
            await ctx.db.patch(user._id, {
              role: "student",
              subscription_plan: "university",
              subscription_status: "active",
              updated_at: now,
            })
          }
          studentsConverted++
        } else {
          // User should be an individual (no university)
          console.log(`👤 Converting ${userLabel} to individual`)

          if (!dryRun) {
            await ctx.db.patch(user._id, {
              role: "individual",
              updated_at: now,
            })
          }
          individualsConverted++
        }
      } catch (error) {
        const errorMsg = `Error processing ${userLabel}: ${error}`
        console.error(`❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    const summary = {
      success: errors.length === 0,
      dryRun,
      totalProcessed: legacyUsers.length,
      studentsConverted,
      individualsConverted,
      profilesCreated,
      errors,
      message: dryRun
        ? `DRY RUN: Would convert ${studentsConverted} students and ${individualsConverted} individuals`
        : `Successfully converted ${studentsConverted} students and ${individualsConverted} individuals`,
    }

    console.log("\n✅ Migration complete!")
    console.log(JSON.stringify(summary, null, 2))

    return summary
  },
})

/**
 * List all super_admin users
 * Run via: npx convex run migrations:listSuperAdmins '{"clerkId": "your_clerk_id"}'
 */
export const listSuperAdmins = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // Use shared authorization utility
    await requireSuperAdmin(ctx)

    // PERFORMANCE: Use by_role index for efficient query
    const superAdmins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "super_admin"))
      .collect()

    return {
      count: superAdmins.length,
      users: superAdmins.map(u => ({
        name: u.name,
        email: u.email,
        clerkId: u.clerkId,
        created_at: u.created_at,
      }))
    }
  },
})

/**
 * Backfill account_status for existing users
 *
 * This migration sets account_status to "active" for all users who don't have it set.
 * This must run before updating the schema to add "deleted" as a new status option.
 *
 * Run via: npx convex run migrations:backfillAccountStatus
 */
export const backfillAccountStatus = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting account_status backfill...");

    // Query all users
    const allUsers = await ctx.db.query("users").collect();

    let updatedCount = 0;
    let alreadySetCount = 0;

    for (const user of allUsers) {
      // Check if account_status is undefined or null
      if (!user.account_status) {
        await ctx.db.patch(user._id, {
          account_status: "active",
        });
        updatedCount++;

        if (updatedCount % 10 === 0) {
          console.log(`Updated ${updatedCount} users so far...`);
        }
      } else {
        alreadySetCount++;
      }
    }

    console.log("Backfill complete!");
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Updated to "active": ${updatedCount}`);
    console.log(`Already had status: ${alreadySetCount}`);

    return {
      success: true,
      total: allUsers.length,
      updated: updatedCount,
      alreadySet: alreadySetCount,
    };
  },
})

/**
 * Set internal roles to 'free' plan
 *
 * This migration ensures that staff, super_admin, university_admin, and advisor
 * accounts have subscription_plan set to 'free' to prevent them from inflating
 * investor metrics and MRR calculations.
 *
 * Run via: npx convex run migrations:setInternalRolesToFreePlan
 */
export const setInternalRolesToFreePlan = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("🚀 Starting migration: Set internal roles to 'free' plan");
    console.log(`📋 Internal roles: ${INTERNAL_ROLES.join(", ")}`);

    // Fetch all users
    const allUsers = await ctx.db.query("users").collect();
    console.log(`✅ Fetched ${allUsers.length} total users`);

    // Filter for internal roles
    const internalUsers = allUsers.filter((u) =>
      INTERNAL_ROLES.includes(u.role as any)
    );

    console.log(`🔍 Found ${internalUsers.length} internal role users`);

    // Group by role for reporting
    const roleStats: Record<string, { total: number; alreadyFree: number; needsUpdate: number }> = {};

    INTERNAL_ROLES.forEach(role => {
      const usersWithRole = internalUsers.filter((u) => u.role === role);
      const alreadyFree = usersWithRole.filter((u) => u.subscription_plan === 'free').length;
      const needsUpdate = usersWithRole.filter((u) => u.subscription_plan !== 'free').length;

      roleStats[role] = {
        total: usersWithRole.length,
        alreadyFree,
        needsUpdate,
      };

      console.log(`  ${role}: ${usersWithRole.length} total (${alreadyFree} already free, ${needsUpdate} need update)`);
    });

    // Find users that need updating
    const usersToUpdate = internalUsers.filter(
      (u) => u.subscription_plan !== "free"
    );

    if (usersToUpdate.length === 0) {
      console.log("✅ All internal role users already have 'free' plan. No migration needed!");
      return {
        success: true,
        message: "No migration needed - all internal users already have 'free' plan",
        stats: {
          totalInternalUsers: internalUsers.length,
          alreadyFree: internalUsers.length,
          updated: 0,
        },
        roleBreakdown: roleStats,
      };
    }

    console.log(`🔄 Updating ${usersToUpdate.length} users to 'free' plan...`);

    // Update each user
    let successCount = 0;
    const errors: Array<{ userId: string; name: string; email: string; error: string }> = [];
    const updatedUsers: Array<{ name: string; email: string; role: string; oldPlan: string }> = [];

    for (const user of usersToUpdate) {
      try {
        console.log(
          `  ⏳ Updating ${user.name} (${user.email}) - Role: ${user.role}, Current plan: ${user.subscription_plan}`
        );

        await ctx.db.patch(user._id, {
          subscription_plan: "free",
          updated_at: Date.now(),
        });

        successCount++;
        updatedUsers.push({
          name: user.name,
          email: user.email,
          role: user.role,
          oldPlan: user.subscription_plan || 'unknown',
        });
        console.log(`  ✅ Updated successfully`);
      } catch (error) {
        errors.push({
          userId: user._id,
          name: user.name,
          email: user.email,
          error: String(error),
        });
        console.error(`  ❌ Error updating user: ${error}`);
      }
    }

    console.log("═══════════════════════════════════════════════════");
    console.log("📊 Migration Summary:");
    console.log(`  ✅ Successfully updated: ${successCount} users`);
    console.log(`  ❌ Failed: ${errors.length} users`);
    console.log(`  📈 Total processed: ${usersToUpdate.length} users`);
    console.log("═══════════════════════════════════════════════════");

    return {
      success: errors.length === 0,
      message:
        errors.length === 0
          ? `Successfully updated ${successCount} internal users to 'free' plan`
          : `Updated ${successCount} users, ${errors.length} errors occurred`,
      stats: {
        totalInternalUsers: internalUsers.length,
        alreadyFree: internalUsers.length - usersToUpdate.length,
        updated: successCount,
        errors: errors.length,
      },
      roleBreakdown: roleStats,
      updatedUsers,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
})

/**
 * Diagnostic: Find internal users with non-free plans
 * This should return empty if billable role architecture is working correctly
 *
 * Run via: npx convex run migrations:findMisconfiguredInternalUsers
 */
export const findMisconfiguredInternalUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("🔍 Checking for internal users with non-free plans...");

    const allUsers = await ctx.db.query("users").collect();

    // Find internal users with non-free plans (incorrect!)
    const misconfigured = allUsers.filter(
      (u) =>
        !u.is_test_user &&
        INTERNAL_ROLES.includes(u.role as any) &&
        u.subscription_plan !== "free"
    );

    // Count by role and plan for overview
    const breakdown: Record<string, Record<string, number>> = {};

    for (const user of allUsers.filter((u) => !u.is_test_user)) {
      const role = user.role || "unknown";
      const plan = user.subscription_plan || "unknown";

      if (!breakdown[role]) {
        breakdown[role] = {};
      }
      breakdown[role][plan] = (breakdown[role][plan] || 0) + 1;
    }

    console.log("📊 Role/Plan Breakdown:");
    console.log(JSON.stringify(breakdown, null, 2));

    if (misconfigured.length > 0) {
      console.log(`⚠️ Found ${misconfigured.length} misconfigured internal users:`);
      misconfigured.forEach((u) => {
        console.log(`  - ${u.name} (${u.email}): role=${u.role}, plan=${u.subscription_plan}`);
      });
    } else {
      console.log("✅ All internal users have 'free' plan");
    }

    return {
      misconfigured_count: misconfigured.length,
      misconfigured_users: misconfigured.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        subscription_plan: u.subscription_plan,
        account_status: u.account_status || "active",
      })),
      role_plan_breakdown: breakdown,
      warning:
        misconfigured.length > 0
          ? `⚠️ Run migration: npx convex run migrations:setInternalRolesToFreePlan`
          : "✅ All internal users correctly configured",
    };
  },
})
