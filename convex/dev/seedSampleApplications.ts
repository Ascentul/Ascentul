/**
 * Seed sample applications for testing the Applications Journey component
 *
 * Run with: npx convex run dev/seedSampleApplications:seedApplications --clerkId "your_clerk_id"
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Helper to list users so you can find your Clerk ID
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(10);
    return users.map(u => ({
      clerkId: u.clerkId,
      name: u.name,
      email: u.email,
      role: u.role,
    }));
  },
});

// Sample companies and job titles for realistic data
const sampleApplications = [
  // Saved roles (Prospect stage)
  { company: "Google", job_title: "Software Engineer", status: "saved" as const },
  { company: "Meta", job_title: "Frontend Developer", status: "saved" as const },
  { company: "Apple", job_title: "iOS Developer", status: "saved" as const },
  { company: "Netflix", job_title: "Senior Engineer", status: "saved" as const },

  // Applied
  { company: "Microsoft", job_title: "Full Stack Developer", status: "applied" as const },
  { company: "Amazon", job_title: "SDE II", status: "applied" as const },
  { company: "Stripe", job_title: "Backend Engineer", status: "applied" as const },
  { company: "Airbnb", job_title: "Software Engineer", status: "applied" as const },
  { company: "Uber", job_title: "Mobile Developer", status: "applied" as const },

  // Interview stage
  { company: "Spotify", job_title: "Data Engineer", status: "interview" as const },
  { company: "Twitter", job_title: "Backend Developer", status: "interview" as const },
  { company: "LinkedIn", job_title: "Software Engineer", status: "interview" as const },

  // Offer stage
  { company: "Salesforce", job_title: "Platform Engineer", status: "offer" as const },
];

export const seedApplications = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found. Please make sure you're using the correct Clerk ID.");
    }

    const now = Date.now();
    const results: string[] = [];

    for (const app of sampleApplications) {
      const id = await ctx.db.insert("applications", {
        user_id: user._id,
        university_id: user.university_id,
        company: app.company,
        job_title: app.job_title,
        status: app.status,
        stage: app.status === "saved" ? "Prospect" :
               app.status === "applied" ? "Applied" :
               app.status === "interview" ? "Interview" :
               app.status === "offer" ? "Offer" : "Prospect",
        stage_set_at: now,
        source: "Job Board",
        notes: `Sample application for ${app.company} - ${app.job_title}`,
        created_at: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
        updated_at: now,
      });
      results.push(`${app.company} - ${app.job_title} (${app.status})`);
    }

    return {
      message: `Successfully created ${results.length} sample applications`,
      summary: {
        saved: 4,
        applied: 5,
        interview: 3,
        offer: 1,
      },
      applications: results,
    };
  },
});

// Clean up function to remove sample applications
export const cleanupSampleApplications = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all applications for this user that have "Sample application" in notes
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    const sampleApps = applications.filter(app =>
      app.notes?.includes("Sample application for")
    );

    let deleted = 0;
    for (const app of sampleApps) {
      await ctx.db.delete(app._id);
      deleted++;
    }

    return {
      message: `Deleted ${deleted} sample applications`,
    };
  },
});
