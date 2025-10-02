import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get projects for a user
export const getUserProjects = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
      .collect();

    return projects;
  },
});

// Create a new project
export const createProject = mutation({
  args: {
    clerkId: v.string(),
    title: v.string(),
    role: v.optional(v.string()),
    start_date: v.optional(v.number()),
    end_date: v.optional(v.number()),
    company: v.optional(v.string()),
    url: v.optional(v.string()),
    github_url: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.string(),
    image_url: v.optional(v.string()),
    technologies: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const projectId = await ctx.db.insert("projects", {
      user_id: user._id,
      title: args.title,
      role: args.role,
      start_date: args.start_date,
      end_date: args.end_date,
      company: args.company,
      url: args.url,
      github_url: args.github_url,
      description: args.description,
      type: args.type,
      image_url: args.image_url,
      technologies: args.technologies,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    return projectId;
  },
});

// Update a project
export const updateProject = mutation({
  args: {
    clerkId: v.string(),
    projectId: v.id("projects"),
    updates: v.object({
      title: v.optional(v.string()),
      role: v.optional(v.string()),
      start_date: v.optional(v.number()),
      end_date: v.optional(v.number()),
      company: v.optional(v.string()),
      url: v.optional(v.string()),
      github_url: v.optional(v.string()),
      description: v.optional(v.string()),
      type: v.optional(v.string()),
      image_url: v.optional(v.string()),
      technologies: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.user_id !== user._id) {
      throw new Error("Project not found or unauthorized");
    }

    await ctx.db.patch(args.projectId, {
      ...args.updates,
      updated_at: Date.now(),
    });

    return args.projectId;
  },
});

// Delete a project
export const deleteProject = mutation({
  args: {
    clerkId: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.user_id !== user._id) {
      throw new Error("Project not found or unauthorized");
    }

    await ctx.db.delete(args.projectId);
    return args.projectId;
  },
});
