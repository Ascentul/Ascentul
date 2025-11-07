/**
 * Set Advisor Role
 *
 * Quick script to set a user's role to advisor
 * Run via: npx convex run set_advisor_role:setAdvisorRole --email "test.advisor@ascentful.io"
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Role constant for type safety (matches schema definition)
const ADVISOR_ROLE = "advisor" as const;

export const setAdvisorRole = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) {
      console.log(`❌ User not found: ${args.email}`);
      return { success: false, message: `User not found: ${args.email}. Please sign in first.` };
    }

    await ctx.db.patch(user._id, {
      role: ADVISOR_ROLE,
      updated_at: Date.now(),
    });

    console.log(`✓ Set role to '${ADVISOR_ROLE}' for ${args.email}`);
    return {
      success: true,
      message: `Successfully set role to '${ADVISOR_ROLE}' for ${args.email}`,
      userId: user._id,
    };
  },
});
