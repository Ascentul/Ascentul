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
      try {
        // Determine if user should be a student (has university_id)
        const isStudent = !!user.university_id

        if (isStudent && user.university_id) {
          // User should be a student
          console.log(`👨‍🎓 Converting ${user.email} to student (university: ${user.university_id})`)

          if (!dryRun) {
            // Update role to student
            await ctx.db.patch(user._id, {
              role: "student",
              subscription_plan: "university",
              subscription_status: "active",
              updated_at: now,
            })
          }
          studentsConverted++

          // Check if studentProfile already exists
          const existingProfile = await ctx.db
            .query("studentProfiles")
            .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
            .first()

          if (!existingProfile) {
            console.log(`  📝 Creating studentProfile for ${user.email}`)

            if (!dryRun) {
              // Create student profile
              await ctx.db.insert("studentProfiles", {
                user_id: user._id,
                university_id: user.university_id,
                major: user.major,
                enrollment_date: user.created_at,
                status: "active",
                created_at: now,
                updated_at: now,
              })
            }
            profilesCreated++
          } else {
            console.log(`  ✓ studentProfile already exists for ${user.email}`)
          }
        } else {
          // User should be an individual (no university)
          console.log(`👤 Converting ${user.email} to individual`)

          if (!dryRun) {
            await ctx.db.patch(user._id, {
              role: "individual",
              updated_at: now,
            })
          }
          individualsConverted++
        }
      } catch (error) {
        const errorMsg = `Error processing user ${user.email}: ${error}`
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
