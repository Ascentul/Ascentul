/**
 * Set Advisor Role
 *
 * Quick script to set a user's role to advisor
 * Run via: npx convex run set_advisor_role:setAdvisorRole --email "test.advisor@ascentful.io"
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

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
      role: "advisor",
      updated_at: Date.now(),
    });

    console.log(`✓ Set role to 'advisor' for ${args.email}`);
    return {
      success: true,
      message: `Successfully set role to 'advisor' for ${args.email}`,
      userId: user._id,
      currentRole: "advisor"
    };
  },
});
