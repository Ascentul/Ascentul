import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all follow-ups for a specific contact
export const getContactFollowups = query({
  args: { clerkId: v.string(), contactId: v.id("networking_contacts") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const followups = await ctx.db
      .query("followup_actions")
      .withIndex("by_contact", (q) => q.eq("contact_id", args.contactId))
      .order("desc")
      .collect();

    return followups.filter((f) => f.user_id === user._id);
  },
});

// Get all follow-ups that need attention (not completed and due)
export const getNeedFollowup = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const allFollowups = await ctx.db
      .query("followup_actions")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Filter for contact-related follow-ups that are not completed
    const contactFollowups = allFollowups.filter(
      (f) => f.contact_id && !f.completed
    );

    return contactFollowups;
  },
});

// Create a follow-up for a contact
export const createContactFollowup = mutation({
  args: {
    clerkId: v.string(),
    contactId: v.id("networking_contacts"),
    type: v.string(),
    description: v.string(),
    due_date: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    // Verify contact ownership
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.user_id !== user._id) {
      throw new Error("Contact not found or unauthorized");
    }

    const now = Date.now();
    const id = await ctx.db.insert("followup_actions", {
      user_id: user._id,
      contact_id: args.contactId,
      type: args.type,
      description: args.description,
      due_date: args.due_date,
      completed: false,
      notes: args.notes,
      created_at: now,
      updated_at: now,
    });

    return id;
  },
});

// Update a follow-up
export const updateContactFollowup = mutation({
  args: {
    clerkId: v.string(),
    followupId: v.id("followup_actions"),
    updates: v.object({
      type: v.optional(v.string()),
      description: v.optional(v.string()),
      due_date: v.optional(v.number()),
      completed: v.optional(v.boolean()),
      notes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const followup = await ctx.db.get(args.followupId);
    if (!followup || followup.user_id !== user._id) {
      throw new Error("Follow-up not found or unauthorized");
    }

    await ctx.db.patch(args.followupId, {
      ...args.updates,
      updated_at: Date.now(),
    });

    return args.followupId;
  },
});

// Delete a follow-up
export const deleteContactFollowup = mutation({
  args: {
    clerkId: v.string(),
    followupId: v.id("followup_actions"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const followup = await ctx.db.get(args.followupId);
    if (!followup || followup.user_id !== user._id) {
      throw new Error("Follow-up not found or unauthorized");
    }

    await ctx.db.delete(args.followupId);
    return args.followupId;
  },
});

// Get all interactions for a specific contact
export const getContactInteractions = query({
  args: { clerkId: v.string(), contactId: v.id("networking_contacts") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const interactions = await ctx.db
      .query("contact_interactions")
      .withIndex("by_contact", (q) => q.eq("contact_id", args.contactId))
      .order("desc")
      .collect();

    return interactions.filter((i) => i.user_id === user._id);
  },
});

// Log an interaction with a contact (updates last_contact and creates interaction record)
export const logInteraction = mutation({
  args: {
    clerkId: v.string(),
    contactId: v.id("networking_contacts"),
    notes: v.optional(v.string()),
    noteDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.user_id !== user._id) {
      throw new Error("Contact not found or unauthorized");
    }

    const now = Date.now();

    // Create interaction record
    await ctx.db.insert("contact_interactions", {
      user_id: user._id,
      contact_id: args.contactId,
      notes: args.notes,
      interaction_date: now,
      created_at: now,
    });

    const trimmedNotes = args.notes?.trim();
    let updatedNotes = contact.notes;

    if (trimmedNotes && trimmedNotes.length > 0) {
      const dateStamp =
        args.noteDate && args.noteDate.trim().length > 0
          ? args.noteDate.trim()
          : new Date(now).toLocaleDateString("en-US");
      const entry = `[${dateStamp}] ${trimmedNotes}`;
      updatedNotes = contact.notes ? `${contact.notes}\n\n${entry}` : entry;
    }

    // Update contact's last_contact timestamp (and notes when provided)
    await ctx.db.patch(args.contactId, {
      last_contact: now,
      notes: updatedNotes,
      updated_at: now,
    });

    return args.contactId;
  },
});
