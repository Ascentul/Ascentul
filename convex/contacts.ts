import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { requireMembership } from "./lib/roles";

// List contacts for the current user by Clerk ID
export const getUserContacts = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const membership = user.role === "student"
      ? (await requireMembership(ctx, { role: "student" })).membership
      : null;

    // OPTIMIZED: Add limit to prevent bandwidth issues
    const contacts = await ctx.db
      .query("networking_contacts")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
      .take(200); // Limit to 200 most recent contacts

    return contacts;
  },
});

// Create a contact for the current user
export const createContact = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedin_url: v.optional(v.string()),
    notes: v.optional(v.string()),
    relationship: v.optional(v.string()),
    last_contact: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const membership = user.role === "student"
      ? (await requireMembership(ctx, { role: "student" })).membership
      : null;

    // TEMPORARILY DISABLED: Free plan limit check
    // NOTE: Clerk Billing (publicMetadata) is the source of truth for subscriptions.
    // The subscription_plan field in Convex is cached display data only (see CLAUDE.md).
    // Backend mutations should NOT use subscription_plan for feature gating.
    // Frontend enforces limits via useSubscription() hook + Clerk's has() method.
    // TODO: Re-enable this check by integrating Clerk SDK or passing verified subscription status from frontend.

    // if (user.subscription_plan === "free") {
    //   const existingContacts = await ctx.db
    //     .query("networking_contacts")
    //     .withIndex("by_user", (q) => q.eq("user_id", user._id))
    //     .collect();
    //
    //   if (existingContacts.length >= 1) {
    //     throw new Error("Free plan limit reached. Upgrade to Premium for unlimited contacts.");
    //   }
    // }

    const now = Date.now();
    const id = await ctx.db.insert("networking_contacts", {
      user_id: user._id,
      university_id: membership?.university_id ?? user.university_id,
      name: args.name,
      company: args.company,
      position: args.position,
      email: args.email,
      phone: args.phone,
      linkedin_url: args.linkedin_url,
      notes: args.notes,
      relationship: args.relationship,
      last_contact: args.last_contact,
      created_at: now,
      updated_at: now,
    });

    // Track activity for streak (fire-and-forget)
    await ctx.scheduler.runAfter(0, api.activity.markActionForToday, {});

    const doc = await ctx.db.get(id);
    return doc;
  },
});

// Update a contact (ownership enforced)
export const updateContact = mutation({
  args: {
    clerkId: v.string(),
    contactId: v.id("networking_contacts"),
    updates: v.object({
      name: v.optional(v.string()),
      company: v.optional(v.string()),
      position: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      linkedin_url: v.optional(v.string()),
      notes: v.optional(v.string()),
      relationship: v.optional(v.string()),
      last_contact: v.optional(v.number()),
      saved: v.optional(v.boolean()),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const membership = user.role === "student"
      ? (await requireMembership(ctx, { role: "student" })).membership
      : null;

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.user_id !== user._id) {
      throw new Error("Contact not found or unauthorized");
    }

    if (contact.university_id && membership && contact.university_id !== membership.university_id) {
      throw new Error("Unauthorized: Contact belongs to another university");
    }

    await ctx.db.patch(args.contactId, {
      ...args.updates,
      updated_at: Date.now(),
    });

    return args.contactId;
  },
});

// Delete a contact (ownership enforced)
export const deleteContact = mutation({
  args: {
    clerkId: v.string(),
    contactId: v.id("networking_contacts"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const membership = user.role === "student"
      ? (await requireMembership(ctx, { role: "student" })).membership
      : null;

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.user_id !== user._id) {
      throw new Error("Contact not found or unauthorized");
    }

    if (contact.university_id && membership && contact.university_id !== membership.university_id) {
      throw new Error("Unauthorized: Contact belongs to another university");
    }

    await ctx.db.delete(args.contactId);
    return args.contactId;
  },
});
