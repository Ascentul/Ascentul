import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get all follow-ups for a user
export const getUserFollowups = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) throw new Error('User not found');

    const followups = await ctx.db
      .query('follow_ups')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .order('desc')
      .collect();

    // Get associated applications and contacts for each follow-up
    const followupsWithDetails = await Promise.all(
      followups.map(async (followup) => {
        const application = followup.application_id
          ? await ctx.db.get(followup.application_id)
          : null;
        const contact = followup.contact_id
          ? await ctx.db.get(followup.contact_id)
          : null;

        return {
          ...followup,
          application,
          contact,
        };
      }),
    );

    return followupsWithDetails;
  },
});

export const getFollowupsForApplication = query({
  args: { clerkId: v.string(), applicationId: v.id('applications') },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) throw new Error('User not found');

    const items = await ctx.db
      .query('follow_ups')
      .withIndex('by_application', (q) =>
        q.eq('application_id', args.applicationId),
      )
      .order('desc')
      .collect();

    return items.filter((f) => f.user_id === user._id);
  },
});

export const createFollowup = mutation({
  args: {
    clerkId: v.string(),
    applicationId: v.id('applications'),
    description: v.string(),
    due_at: v.optional(v.number()),
    notes: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) throw new Error('User not found');

    const now = Date.now();
    const title =
      args.description?.trim().substring(0, 100) ||
      `${args.type || 'Follow-up'} task`;

    const id = await ctx.db.insert('follow_ups', {
      // Core fields
      title,
      description: args.description,
      type: args.type ?? 'follow_up',
      notes: args.notes,

      // Ownership - student-created
      user_id: user._id,
      owner_id: user._id,
      created_by_id: user._id,
      created_by_type: 'student',

      // Multi-tenancy (optional for non-university users)
      university_id: user.university_id,

      // Relationships (dual-field pattern: populate both generic and typed fields)
      related_type: 'application',
      related_id: args.applicationId, // Generic field for polymorphic queries
      application_id: args.applicationId, // Typed field for referential integrity

      // Task management
      due_at: args.due_at,
      status: 'open',
      version: 0, // Initialize for optimistic locking on status changes

      // Timestamps
      created_at: now,
      updated_at: now,
    });

    return id;
  },
});

export const updateFollowup = mutation({
  args: {
    clerkId: v.string(),
    followupId: v.id('follow_ups'),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      due_at: v.optional(v.number()),
      notes: v.optional(v.string()),
      type: v.optional(v.string()),
      status: v.optional(v.union(v.literal('open'), v.literal('done'))),
      priority: v.optional(
        v.union(v.literal('low'), v.literal('medium'), v.literal('high'), v.literal('urgent')),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) throw new Error('User not found');

    const item = await ctx.db.get(args.followupId);
    if (!item || item.user_id !== user._id)
      throw new Error('Followup not found or unauthorized');

    const now = Date.now();

    // RACE CONDITION MITIGATION: Idempotent handling for status changes
    const statusChangingToDone = args.updates.status === 'done' && item.status !== 'done';
    const statusChangingToOpen = args.updates.status === 'open' && item.status === 'done';

    // If status is already in desired state, return success (idempotent)
    if (args.updates.status === 'done' && item.status === 'done') {
      return {
        success: true,
        followupId: args.followupId,
        alreadyCompleted: true,
        completed_at: item.completed_at,
        completed_by: item.completed_by,
        verified: true,
      };
    }

    if (args.updates.status === 'open' && item.status !== 'done') {
      return {
        success: true,
        followupId: args.followupId,
        alreadyOpen: true,
        verified: true,
      };
    }

    // Build patch data with explicit typing for completion fields
    type PatchData = Partial<typeof item> & {
      updated_at: number;
      completed_at?: number | null | undefined;
      completed_by?: typeof user._id | null | undefined;
      version?: number;
    };

    const patchData: PatchData = {
      ...args.updates,
      updated_at: now,
    };

    // FERPA COMPLIANCE: Version tracking for status changes
    // Status changes affect audit trail - version increments provide audit history
    // Note: Convex mutations are serialized at document level, so concurrent
    // modifications to the same document are handled sequentially by the runtime
    if (statusChangingToDone || statusChangingToOpen) {
      const currentVersion = item.version ?? 0;
      patchData.version = currentVersion + 1;

      // Set/clear completion fields based on status change
      if (statusChangingToDone) {
        patchData.completed_at = now;
        patchData.completed_by = user._id;
      } else if (statusChangingToOpen) {
        // Explicitly clear fields using undefined (Convex removes fields set to undefined)
        patchData.completed_at = undefined;
        patchData.completed_by = undefined;
      }

      await ctx.db.patch(args.followupId, patchData);

      // Return consistent shape with idempotent paths
      return {
        success: true,
        followupId: args.followupId,
        alreadyCompleted: false,
        alreadyOpen: false,
        completed_at: statusChangingToDone ? now : undefined,
        completed_by: statusChangingToDone ? user._id : undefined,
        version: currentVersion + 1,
      };
    } else {
      // Non-status updates don't need optimistic locking
      await ctx.db.patch(args.followupId, patchData);
      return {
        success: true,
        followupId: args.followupId,
      };
    }
  },
});

export const deleteFollowup = mutation({
  args: { clerkId: v.string(), followupId: v.id('follow_ups') },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) throw new Error('User not found');

    const item = await ctx.db.get(args.followupId);
    if (!item || item.user_id !== user._id)
      throw new Error('Followup not found or unauthorized');

    await ctx.db.delete(args.followupId);
    return args.followupId;
  },
});
