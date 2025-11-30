/**
 * Set Advisor Role (Convex-only sync)
 *
 * ⚠️  IMPORTANT: This mutation only updates Convex. For production use, you MUST
 * update Clerk first (source of truth) using:
 *   npx ts-node scripts/set-clerk-advisor-role.ts <email>
 *
 * This mutation is intended for:
 * - Syncing Convex after Clerk has been updated
 * - Development/testing scenarios
 * - Recovering from webhook sync failures
 *
 * The proper flow for setting advisor role is:
 * 1. Run: npx ts-node scripts/set-clerk-advisor-role.ts <email>
 * 2. Clerk webhook syncs role to Convex automatically
 * 3. If webhook fails, use this mutation to manually sync
 *
 * Run via: npx convex run set_advisor_role:setAdvisorRole '{"email": "test.advisor@ascentful.io"}'
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { maskEmail } from "./lib/piiSafe";

// Role constant for type safety (matches schema definition)
const ADVISOR_ROLE = "advisor" as const;

export const setAdvisorRole = internalMutation({
  args: {
    email: v.string(),
    university_id: v.optional(v.id("universities")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) {
      console.log(`❌ User not found: ${maskEmail(args.email)}`);
      return { success: false, message: `User not found: ${maskEmail(args.email)}. Please sign in first.` };
    }

    // Prevent removing last super_admin
    if (user.role === "super_admin") {
      const otherSuperAdmins = await ctx.db
        .query("users")
        .filter((q) =>
          q.and(
            q.eq(q.field("role"), "super_admin"),
            q.neq(q.field("_id"), user._id)
          )
        )
        .first();

      if (!otherSuperAdmins) {
        console.log(`❌ Cannot change last super_admin: ${maskEmail(args.email)}`);
        return {
          success: false,
          message: `Cannot change role for ${maskEmail(args.email)}: user is the last super_admin in the system.`,
        };
      }
    }

    // Ensure advisor has university_id
    const universityId = args.university_id || user.university_id;
    if (!universityId) {
      console.log(`❌ Advisor role requires university_id for ${maskEmail(args.email)}`);
      return {
        success: false,
        message: `Advisor role requires university_id for ${maskEmail(args.email)}. Please provide university_id or ensure user already has one.`,
      };
    }

    // Verify university exists to prevent orphaned references
    const university = await ctx.db.get(universityId);
    if (!university) {
      console.log(`❌ University not found: ${universityId}`);
      return {
        success: false,
        message: `University with ID ${universityId} not found. Please provide a valid university_id.`,
      };
    }

    await ctx.db.patch(user._id, {
      role: ADVISOR_ROLE,
      university_id: universityId,
      updated_at: Date.now(),
    });

    console.log(`✓ Set role to '${ADVISOR_ROLE}' for ${maskEmail(args.email)}`);
    return {
      success: true,
      message: `Successfully set role to '${ADVISOR_ROLE}' for ${maskEmail(args.email)}`,
      userId: user._id,
    };
  },
});
