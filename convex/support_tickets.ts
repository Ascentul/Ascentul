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

// List support tickets with advanced filtering for admins
export const listTicketsWithFilters = query({
  args: {
    clerkId: v.string(),
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    issueType: v.optional(v.string()),
    priority: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!currentUser) throw new Error("User not found");

    const isAdmin = ["admin", "super_admin", "university_admin"].includes(
      currentUser.role
    );

    if (!isAdmin) throw new Error("Unauthorized");

    let query = ctx.db.query("support_tickets");

    // Apply filters
    if (args.status && args.status !== "all") {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.priority && args.priority !== "all") {
      query = query.filter((q) => q.eq(q.field("priority"), args.priority));
    }

    if (args.assignedTo && args.assignedTo !== "all") {
      if (args.assignedTo === "unassigned") {
        query = query.filter((q) => q.neq(q.field("assigned_to"), null));
      } else {
        // This would need to be handled differently if we want to filter by specific assignee
        // For now, we'll skip this filter
      }
    }

    const tickets = await query.order("desc").collect();

    // Apply text search and additional filters that can't be done in Convex easily
    let filteredTickets = tickets;

    if (args.search) {
      const searchTerm = args.search.toLowerCase();
      filteredTickets = filteredTickets.filter(ticket =>
        ticket.subject.toLowerCase().includes(searchTerm) ||
        ticket.description.toLowerCase().includes(searchTerm) ||
        (ticket.user_id && ticket.user_id.toString().includes(searchTerm))
      );
    }

    if (args.source && args.source !== "all") {
      filteredTickets = filteredTickets.filter(ticket =>
        ticket.ticket_type === args.source
      );
    }

    if (args.issueType && args.issueType !== "all") {
      filteredTickets = filteredTickets.filter(ticket =>
        ticket.category === args.issueType
      );
    }

    if (args.dateFrom && args.dateTo) {
      filteredTickets = filteredTickets.filter(ticket =>
        ticket.created_at >= args.dateFrom! && ticket.created_at <= args.dateTo!
      );
    }

    return filteredTickets;
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
      priority: "medium", // medium priority
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

// Update ticket status (admin only)
export const updateTicketStatus = mutation({
  args: {
    clerkId: v.string(),
    ticketId: v.id("support_tickets"),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!currentUser) throw new Error("User not found");

    const isAdmin = ["admin", "super_admin", "university_admin"].includes(
      currentUser.role
    );
    if (!isAdmin) throw new Error("Unauthorized");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const updates: any = {
      status: args.status,
      updated_at: Date.now(),
    };

    if (args.status === "resolved" || args.status === "closed") {
      updates.resolved_at = Date.now();
      if (args.resolution) {
        updates.resolution = args.resolution;
      }
    }

    await ctx.db.patch(args.ticketId, updates);
    return await ctx.db.get(args.ticketId);
  },
});

// Assign ticket to user (admin only)
export const assignTicket = mutation({
  args: {
    clerkId: v.string(),
    ticketId: v.id("support_tickets"),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!currentUser) throw new Error("User not found");

    const isAdmin = ["admin", "super_admin", "university_admin"].includes(
      currentUser.role
    );
    if (!isAdmin) throw new Error("Unauthorized");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    await ctx.db.patch(args.ticketId, {
      assigned_to: args.assignedTo,
      updated_at: Date.now(),
    });

    return await ctx.db.get(args.ticketId);
  },
});

// Bulk update tickets (admin only)
export const bulkUpdateTickets = mutation({
  args: {
    clerkId: v.string(),
    ticketIds: v.array(v.id("support_tickets")),
    status: v.optional(v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed"))),
    assignedTo: v.optional(v.id("users")),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!currentUser) throw new Error("User not found");

    const isAdmin = ["admin", "super_admin", "university_admin"].includes(
      currentUser.role
    );
    if (!isAdmin) throw new Error("Unauthorized");

    const updates: any = { updated_at: Date.now() };

    if (args.status) updates.status = args.status;
    if (args.assignedTo) updates.assigned_to = args.assignedTo;
    if (args.priority) updates.priority = args.priority;

    const updatedTickets = [];
    for (const ticketId of args.ticketIds) {
      await ctx.db.patch(ticketId, updates);
      const updated = await ctx.db.get(ticketId);
      updatedTickets.push(updated);
    }

    return updatedTickets;
  },
});
