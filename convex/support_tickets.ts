import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List support tickets. Admins see all; regular users see their own.
export const listTickets = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!currentUser) throw new Error("User not found");

    const isAdmin = ["admin", "super_admin", "university_admin"].includes(
      currentUser.role
    );

    if (isAdmin) {
      const all = await ctx.db
        .query("support_tickets")
        .order("desc")
        .collect();
      return all;
    }

    const mine = await ctx.db
      .query("support_tickets")
      .withIndex("by_user", (q) => q.eq("user_id", currentUser._id))
      .order("desc")
      .collect();
    return mine;
  },
});

// Create a support ticket for the current user
export const createTicket = mutation({
  args: {
    clerkId: v.string(),
    subject: v.string(),
    description: v.string(),
    issue_type: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) throw new Error("User not found");

    const now = Date.now();

    const id = await ctx.db.insert("support_tickets", {
      user_id: user._id,
      subject: args.subject,
      category: args.issue_type || "general",
      priority: 2, // medium (1-low,2-medium,3-high,4-urgent) -> schema stores number; we mapped to v.number priority? In schema it's v.number with index by priority? It's v.number, yes.
      department: "support",
      contact_person: undefined,
      description: args.description + (args.source ? `\n\nSource: ${args.source}` : ""),
      status: "open",
      ticket_type: "regular",
      assigned_to: undefined,
      resolution: undefined,
      resolved_at: undefined,
      created_at: now,
      updated_at: now,
    } as any);

    const doc = await ctx.db.get(id);
    return doc;
  },
});
