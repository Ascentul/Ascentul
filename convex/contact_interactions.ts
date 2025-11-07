import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get all follow-ups for a specific contact
export const getContactFollowups = query({
  args: { clerkId: v.string(), contactId: v.id('networking_contacts') },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) throw new Error('User not found');

    const followups = await ctx.db
      .query('follow_ups')
      .withIndex('by_contact', (q) => q.eq('contact_id', args.contactId))
      .order('desc')
      .collect();

    return followups.filter((f) => f.user_id === user._id);
  },
});

// Get all follow-ups that need attention (not completed and due)
export const getNeedFollowup = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) throw new Error('User not found');

    const allFollowups = await ctx.db
      .query('follow_ups')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .collect();

    // Filter for contact-related follow-ups that are open
    const contactFollowups = allFollowups.filter(
      (f) => f.contact_id && f.status === 'open',
    );

    return contactFollowups;
  },
});

// Create a follow-up for a contact
export const createContactFollowup = mutation({
  args: {
    clerkId: v.string(),
    contactId: v.id('networking_contacts'),
    type: v.string(),
    description: v.string(),
    due_at: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) throw new Error('User not found');

    // Verify contact ownership
    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.user_id !== user._id) {
      throw new Error('Contact not found or unauthorized');
    }

    const now = Date.now();
    const title =
      args.description?.substring(0, 100) || `${args.type} follow-up`;

    const id = await ctx.db.insert('follow_ups', {
      // Core fields
      title,
      description: args.description,
      type: args.type,
      notes: args.notes,

      // Ownership - student-created
      user_id: user._id,
      owner_id: user._id,
      created_by_id: user._id,
      created_by_type: 'student',

      // Multi-tenancy (optional for non-university users)
      university_id: user.university_id,

      // Relationships (dual-field pattern: populate both generic and typed fields)
      related_type: 'contact',
      related_id: args.contactId, // String version for composite index queries
      contact_id: args.contactId, // Typed field for referential integrity

      // Task management
      due_at: args.due_at,
      status: 'open',

      // Timestamps
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
    followupId: v.id('follow_ups'),
    updates: v.object({
      title: v.optional(v.string()),
      type: v.optional(v.string()),
      description: v.optional(v.string()),
      due_at: v.optional(v.number()),
      status: v.optional(v.union(v.literal('open'), v.literal('done'))),
      notes: v.optional(v.string()),
      priority: v.optional(
        v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) throw new Error('User not found');

    const followup = await ctx.db.get(args.followupId);
    if (!followup || followup.user_id !== user._id) {
      throw new Error('Follow-up not found or unauthorized');
    }

    const now = Date.now();

    // Build patch data with explicit typing for completion fields
    type PatchData = Partial<typeof followup> & {
      updated_at: number;
      completed_at?: number | undefined;
      completed_by?: typeof user._id | undefined;
    };

    const patchData: PatchData = {
      ...args.updates,
      updated_at: now,
    };

    // If status changed to done, set completion fields
    if (args.updates.status === 'done' && followup.status !== 'done') {
      patchData.completed_at = now;
      patchData.completed_by = user._id;
    }
    // If status changed back to open, clear completion fields
    if (args.updates.status === 'open' && followup.status === 'done') {
      patchData.completed_at = undefined;
      patchData.completed_by = undefined;
    }

    await ctx.db.patch(args.followupId, patchData);

    return args.followupId;
  },
});

// Delete a follow-up
export const deleteContactFollowup = mutation({
  args: {
    clerkId: v.string(),
    followupId: v.id('follow_ups'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) throw new Error('User not found');

    const followup = await ctx.db.get(args.followupId);
    if (!followup || followup.user_id !== user._id) {
      throw new Error('Follow-up not found or unauthorized');
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
