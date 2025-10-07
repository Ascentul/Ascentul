import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// List support tickets. Admins see all; regular users see their own.
export const listTickets = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!currentUser) throw new Error("User not found");

    const isAdmin = ["super_admin", "university_admin", "advisor"].includes(
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

    const isAdmin = ["super_admin", "university_admin", "advisor"].includes(
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
    category: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
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
      category: args.category || args.issue_type || "general",
      priority: args.priority || "medium",
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

    const isAdmin = ["super_admin", "university_admin", "advisor"].includes(
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

    const isAdmin = ["super_admin", "university_admin", "advisor"].includes(
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

    const isAdmin = ["super_admin", "university_admin", "advisor"].includes(
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

// Delete a ticket (admin only)
export const deleteTicket = mutation({
  args: {
    clerkId: v.string(),
    ticketId: v.id("support_tickets"),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!currentUser) throw new Error("User not found");

    const isAdmin = ["super_admin", "admin"].includes(currentUser.role);
    if (!isAdmin) throw new Error("Unauthorized - only admins can delete tickets");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    await ctx.db.delete(args.ticketId);
    return { success: true };
  },
});

// Add a response/comment to a ticket
export const addTicketResponse = mutation({
  args: {
    clerkId: v.string(),
    ticketId: v.id("support_tickets"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!currentUser) throw new Error("User not found");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    // Check if user is admin or the ticket owner
    const isAdmin = ["super_admin", "university_admin", "advisor"].includes(
      currentUser.role
    );
    const isOwner = ticket.user_id === currentUser._id;

    if (!isAdmin && !isOwner) {
      throw new Error("Unauthorized");
    }

    // Update ticket with the response in the resolution field
    // In a more complex system, you'd have a separate table for responses/comments
    const existingResolution = ticket.resolution || "";
    const newResponse = `[${new Date().toISOString()}] ${currentUser.name || currentUser.email}: ${args.message}`;
    const updatedResolution = existingResolution
      ? `${existingResolution}\n\n${newResponse}`
      : newResponse;

    await ctx.db.patch(args.ticketId, {
      resolution: updatedResolution,
      updated_at: Date.now(),
    });

    // Send email notification to ticket submitter if response is from admin
    if (isAdmin && !isOwner) {
      const ticketOwner = await ctx.db.get(ticket.user_id);
      if (ticketOwner && ticketOwner.email) {
        // Schedule email to be sent (best-effort, won't fail if email service not configured)
        try {
          await ctx.scheduler.runAfter(0, api.email.sendSupportTicketResponseEmail, {
            email: ticketOwner.email,
            name: ticketOwner.name,
            ticketSubject: ticket.subject,
            responseMessage: args.message,
            ticketId: String(args.ticketId),
          });
        } catch (emailError) {
          // Log but don't fail the mutation if email scheduling fails
          console.log("Email notification scheduling failed (non-critical):", emailError);
        }
      }
    }

    return await ctx.db.get(args.ticketId);
  },
});
