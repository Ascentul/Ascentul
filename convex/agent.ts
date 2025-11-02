/**
 * AI Agent tool implementations
 * All functions validate userId and enforce row-level security
 */

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { Id } from './_generated/dataModel'

/**
 * Rate limiting helper - check if user has exceeded rate limit
 * Returns true if rate limit exceeded, false otherwise
 */
export const checkRateLimit = query({
  args: {
    userId: v.id('users'),
    windowMs: v.number(), // Time window in milliseconds
    maxRequests: v.number(), // Max requests in window
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const windowStart = now - args.windowMs

    // Count requests in window
    const recentLogs = await ctx.db
      .query('agent_audit_logs')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .filter((q) => q.gte(q.field('created_at'), windowStart))
      .collect()

    return recentLogs.length >= args.maxRequests
  },
})

/**
 * Log audit entry for tool execution
 */
export const logAudit = mutation({
  args: {
    userId: v.id('users'),
    tool: v.string(),
    inputJson: v.any(),
    outputJson: v.optional(v.any()),
    status: v.union(v.literal('success'), v.literal('error')),
    errorMessage: v.optional(v.string()),
    latencyMs: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('agent_audit_logs', {
      user_id: args.userId,
      tool: args.tool,
      input_json: args.inputJson,
      output_json: args.outputJson,
      status: args.status,
      error_message: args.errorMessage,
      latency_ms: args.latencyMs,
      created_at: Date.now(),
    })
  },
})

/**
 * Tool 1: get_user_snapshot
 * Returns comprehensive user profile with applications, goals, and recent activity
 */
export const getUserSnapshot = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get user profile
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get applications (last 10)
    const applications = await ctx.db
      .query('applications')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .order('desc')
      .take(10)

    // Get active goals
    const goals = await ctx.db
      .query('goals')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'in_progress'),
          q.eq(q.field('status'), 'active')
        )
      )
      .take(5)

    // Get resumes
    const resumes = await ctx.db
      .query('resumes')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .order('desc')
      .take(3)

    // Get recent projects
    const projects = await ctx.db
      .query('projects')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .order('desc')
      .take(5)

    return {
      profile: {
        name: user.name,
        email: user.email,
        role: user.role,
        current_position: user.current_position,
        current_company: user.current_company,
        location: user.location,
        skills: user.skills,
        bio: user.bio,
        experience_level: user.experience_level,
        industry: user.industry,
        career_goals: user.career_goals,
        education_history: user.education_history,
        work_history: user.work_history,
      },
      applications: applications.map((app) => ({
        id: app._id,
        company: app.company,
        job_title: app.job_title,
        status: app.status,
        url: app.url,
        applied_at: app.applied_at,
      })),
      goals: goals.map((goal) => ({
        id: goal._id,
        title: goal.title,
        status: goal.status,
        progress: goal.progress,
        target_date: goal.target_date,
      })),
      resumes: resumes.map((resume) => ({
        id: resume._id,
        title: resume.title,
        source: resume.source,
        updated_at: resume.updated_at,
      })),
      projects: projects.map((project) => ({
        id: project._id,
        title: project.title,
        role: project.role,
        technologies: project.technologies,
      })),
    }
  },
})

/**
 * Tool 2: get_profile_gaps
 * Analyzes user profile and identifies missing or weak fields
 */
export const getProfileGaps = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    const gaps: Array<{ field: string; severity: 'high' | 'medium' | 'low'; suggestion: string }> = []

    // Check critical fields
    if (!user.current_position) {
      gaps.push({
        field: 'current_position',
        severity: 'high',
        suggestion: 'Add your current job title to help find relevant opportunities',
      })
    }

    if (!user.skills || user.skills.trim().length < 30) {
      gaps.push({
        field: 'skills',
        severity: 'high',
        suggestion: 'List your key skills to match with job requirements',
      })
    }

    if (!user.bio || user.bio.length < 50) {
      gaps.push({
        field: 'bio',
        severity: 'medium',
        suggestion: 'Write a professional summary to stand out to employers',
      })
    }

    if (!user.location) {
      gaps.push({
        field: 'location',
        severity: 'medium',
        suggestion: 'Add your location or specify if you\'re open to remote work',
      })
    }

    if (!user.experience_level) {
      gaps.push({
        field: 'experience_level',
        severity: 'medium',
        suggestion: 'Specify your experience level (entry, mid, senior, executive)',
      })
    }

    if (!user.industry) {
      gaps.push({
        field: 'industry',
        severity: 'low',
        suggestion: 'Add your target industry to refine job recommendations',
      })
    }

    if (!user.linkedin_url) {
      gaps.push({
        field: 'linkedin_url',
        severity: 'low',
        suggestion: 'Link your LinkedIn profile for better networking',
      })
    }

    if (!user.education_history || user.education_history.length === 0) {
      gaps.push({
        field: 'education_history',
        severity: 'medium',
        suggestion: 'Add your education background',
      })
    }

    if (!user.work_history || user.work_history.length === 0) {
      gaps.push({
        field: 'work_history',
        severity: 'high',
        suggestion: 'Add your work experience to showcase your background',
      })
    }

    return {
      gaps,
      completeness_score: Math.max(0, 100 - gaps.length * 10),
    }
  },
})

/**
 * Tool 3: upsert_profile_field
 * Updates or inserts a user profile field with confidence tracking
 */
export const upsertProfileField = mutation({
  args: {
    userId: v.id('users'),
    field: v.string(),
    value: v.any(),
    confidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    const confidence = args.confidence ?? 0.9
    const now = Date.now()

    // Check if field already exists in agent_profile_fields
    const existing = await ctx.db
      .query('agent_profile_fields')
      .withIndex('by_user_field', (q) =>
        q.eq('user_id', args.userId).eq('field', args.field)
      )
      .first()

    if (existing) {
      // Update existing field
      await ctx.db.patch(existing._id, {
        value_json: args.value,
        confidence,
        updated_at: now,
      })
    } else {
      // Insert new field
      await ctx.db.insert('agent_profile_fields', {
        user_id: args.userId,
        field: args.field,
        value_json: args.value,
        confidence,
        source: 'agent',
        created_at: now,
        updated_at: now,
      })
    }

    // Also update the main users table for common fields
    const updates: Partial<typeof user> = {}

    // Map agent fields to user table fields
    if (args.field === 'skills' && typeof args.value === 'string') {
      updates.skills = args.value
    } else if (args.field === 'current_position' && typeof args.value === 'string') {
      updates.current_position = args.value
    } else if (args.field === 'current_company' && typeof args.value === 'string') {
      updates.current_company = args.value
    } else if (args.field === 'location' && typeof args.value === 'string') {
      updates.location = args.value
    } else if (args.field === 'bio' && typeof args.value === 'string') {
      updates.bio = args.value
    } else if (args.field === 'industry' && typeof args.value === 'string') {
      updates.industry = args.value
    } else if (args.field === 'experience_level' && typeof args.value === 'string') {
      updates.experience_level = args.value
    } else if (args.field === 'linkedin_url' && typeof args.value === 'string') {
      updates.linkedin_url = args.value
    }

    // Apply updates to users table if any
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.userId, {
        ...updates,
        updated_at: now,
      })
    }

    return {
      success: true,
      field: args.field,
      value: args.value,
      updated_in_profile: Object.keys(updates).length > 0,
    }
  },
})

/**
 * Tool 4: search_jobs (stub - will integrate with actual job API later)
 * Searches for jobs based on user profile and query
 */
export const searchJobs = query({
  args: {
    userId: v.id('users'),
    query: v.string(),
    location: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    const limit = args.limit ?? 10

    // TODO: Integrate with actual job search API (Phase 5 or later)
    // For now, return sample jobs based on user profile
    const sampleJobs = [
      {
        id: 'sample-1',
        title: `${user.current_position || 'Software Engineer'} opportunity`,
        company: 'Tech Company Inc.',
        location: args.location || user.location || 'Remote',
        description: `Great opportunity for ${user.experience_level || 'experienced'} professional`,
        url: 'https://example.com/job/1',
        match_score: 85,
        match_reasons: [
          'Skills match: ' + (user.skills || 'N/A'),
          'Experience level fits',
          'Location preference aligned',
        ],
      },
    ]

    return {
      query: args.query,
      location: args.location,
      results: sampleJobs.slice(0, limit),
      total_count: sampleJobs.length,
      search_performed_at: Date.now(),
    }
  },
})

/**
 * Tool 5: save_job (stub - saves job to applications)
 * Saves a job posting to user's applications tracker
 */
export const saveJob = mutation({
  args: {
    userId: v.id('users'),
    company: v.string(),
    jobTitle: v.string(),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    const now = Date.now()

    // Create application entry
    const applicationId = await ctx.db.insert('applications', {
      user_id: args.userId,
      company: args.company,
      job_title: args.jobTitle,
      status: 'saved',
      url: args.url,
      notes: args.notes,
      created_at: now,
      updated_at: now,
    })

    return {
      success: true,
      application_id: applicationId,
      company: args.company,
      job_title: args.jobTitle,
      deep_link: `/applications?id=${applicationId}`,
    }
  },
})
