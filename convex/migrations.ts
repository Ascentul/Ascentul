/**
 * Database migrations for schema changes
 */

import { mutation, internalMutation } from "./_generated/server"
import { v } from "convex/values"

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
