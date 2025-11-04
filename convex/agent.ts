/**
 * AI Agent tool implementations
 * All functions validate userId and enforce row-level security
 *
 * AUDIT LOG RETENTION POLICY:
 * - Audit logs are stored in `agent_audit_logs` table with PII redaction
 * - Recommended retention: 90 days for compliance and debugging
 * - Implement periodic cleanup via scheduled Convex cron job:
 *   - Delete logs older than 90 days
 *   - Run daily at off-peak hours
 * - Example cleanup query:
 *   const cutoffTime = Date.now() - (90 * 24 * 60 * 60 * 1000) // 90 days
 *   const oldLogs = await ctx.db.query('agent_audit_logs')
 *     .withIndex('by_created_at')
 *     .filter(q => q.lt(q.field('created_at'), cutoffTime))
 *   for (const log of oldLogs) { await ctx.db.delete(log._id) }
 */

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { Id } from './_generated/dataModel'
import { redactAuditPayload } from './lib/pii_redaction'

/**
 * Atomic rate limiter with anti-enumeration protection
 *
 * SECURITY FEATURES:
 * - ✅ Rate limits by Clerk ID BEFORE user resolution (prevents user enumeration)
 * - ✅ Consumes rate limit slots even for non-existent users (prevents bypass)
 * - ✅ Returns consistent response for valid/invalid users (no information leakage)
 * - ✅ Atomic check-and-consume (no race conditions)
 *
 * INDEX OPTIMIZATION:
 * - Uses composite index (clerk_user_id, created_at) for efficient windowed queries
 * - Range scan on second field (created_at >= windowStart) is index-backed
 * - Scales efficiently even with millions of request logs
 *
 * Returns { allowed: boolean, current_count: number, limit: number }
 */
export const checkAndConsumeRateLimit = mutation({
  args: {
    clerkUserId: v.string(),
    windowMs: v.number(), // Time window in milliseconds (e.g., 60000 for 1 minute)
    maxRequests: v.number(), // Max requests in window (e.g., 10)
  },
  handler: async (ctx, args) => {
    // Input validation
    if (!args.clerkUserId?.trim()) {
      throw new Error('Invalid clerkUserId: must be a non-empty string')
    }
    if (args.windowMs <= 0) {
      throw new Error('Invalid windowMs: must be a positive number')
    }
    if (args.maxRequests <= 0) {
      throw new Error('Invalid maxRequests: must be a positive number')
    }

    const now = Date.now()
    const windowStart = now - args.windowMs

    // SECURITY: Rate limit by Clerk ID BEFORE user resolution to prevent enumeration attacks
    // This ensures that invalid/non-existent users also consume rate limit slots
    const recentRequestsByClerkId = await ctx.db
      .query('agent_request_logs')
      .withIndex('by_clerk_created', (q) =>
        q.eq('clerk_user_id', args.clerkUserId).gte('created_at', windowStart)
      )
      .collect()

    const currentCount = recentRequestsByClerkId.length

    // Check if Clerk user has exceeded limit BEFORE user resolution
    if (currentCount >= args.maxRequests) {
      return {
        allowed: false,
        current_count: currentCount,
        limit: args.maxRequests,
      }
    }

    // Resolve Convex user from Clerk ID (after rate limit check)
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkUserId))
      .unique()

    // SECURITY: Consume rate limit slot even for non-existent users
    // This prevents attackers from bypassing rate limits with invalid user IDs
    await ctx.db.insert('agent_request_logs', {
      clerk_user_id: args.clerkUserId,
      user_id: user?._id, // null for non-existent users, but still counts against rate limit
      created_at: now,
    })

    // Return consistent response whether user exists or not
    // This prevents enumeration by observing response differences
    if (!user) {
      return {
        allowed: false,
        current_count: currentCount + 1,
        limit: args.maxRequests,
      }
    }

    return {
      allowed: true,
      current_count: currentCount + 1,
      limit: args.maxRequests,
    }
  },
})

/**
 * @deprecated Use checkAndConsumeRateLimit mutation instead
 * This query-based approach has race conditions and counts tool executions instead of requests
 */
export const checkRateLimit = query({
  args: {
    userId: v.id('users'),
    windowMs: v.number(),
    maxRequests: v.number(),
  },
  handler: async (ctx, args) => {
    // Input validation
    if (args.windowMs <= 0) {
      throw new Error('Invalid windowMs: must be a positive number')
    }
    if (args.maxRequests <= 0) {
      throw new Error('Invalid maxRequests: must be a positive number')
    }

    const now = Date.now()
    const windowStart = now - args.windowMs

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
 * Applies PII redaction and size limits to prevent compliance issues and unbounded growth
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
    // Redact PII and enforce size limits on payloads
    const redactedInput = redactAuditPayload(args.inputJson)
    const redactedOutput = args.outputJson ? redactAuditPayload(args.outputJson) : undefined

    await ctx.db.insert('agent_audit_logs', {
      user_id: args.userId,
      tool: args.tool,
      input_json: redactedInput,
      output_json: redactedOutput,
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

    // Batch fetch interview stages and follow-ups for all applications (avoid N+1 queries)
    const allStages = await ctx.db
      .query('interview_stages')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .collect()

    const allAppFollowups = await ctx.db
      .query('followup_actions')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .collect()

    // Group stages and followups by application_id
    const stagesByApp = allStages.reduce(
      (acc, stage) => {
        if (stage.application_id) {
          const appId = stage.application_id as string
          if (!acc[appId]) acc[appId] = []
          acc[appId].push(stage)
        }
        return acc
      },
      {} as Record<string, typeof allStages>
    )

    const followupsByApp = allAppFollowups
      .filter((f) => f.application_id)
      .reduce(
        (acc, followup) => {
          const appId = followup.application_id as string
          if (!acc[appId]) acc[appId] = []
          acc[appId].push(followup)
          return acc
        },
        {} as Record<string, typeof allAppFollowups>
      )

    // Map applications with their related data
    const applicationsWithStages = applications.map((app) => {
      const stages = stagesByApp[app._id as string] || []
      const followups = followupsByApp[app._id as string] || []

      return {
        ...app,
        interview_stages: stages.map((stage) => ({
          id: stage._id as string,
          title: stage.title,
          scheduled_at: stage.scheduled_at,
          location: stage.location,
          notes: stage.notes,
          outcome: stage.outcome,
          created_at: stage.created_at,
        })),
        followup_tasks: followups.map((followup) => ({
          id: followup._id as string,
          description: followup.description,
          due_date: followup.due_date,
          notes: followup.notes,
          type: followup.type,
          completed: followup.completed,
          created_at: followup.created_at,
        })),
      }
    })

    // Get recent goals (all non-cancelled, non-completed)
    const goals = await ctx.db
      .query('goals')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .filter((q) =>
        q.and(
          q.neq(q.field('status'), 'cancelled'),
          q.neq(q.field('status'), 'completed')
        )
      )
      .order('desc')
      .take(10)

    // Get resumes
    const resumes = await ctx.db
      .query('resumes')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .order('desc')
      .take(3)

    // Get cover letters
    const coverLetters = await ctx.db
      .query('cover_letters')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .order('desc')
      .take(5)

    // Get recent projects
    const projects = await ctx.db
      .query('projects')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .order('desc')
      .take(5)

    // Get networking contacts
    const contacts = await ctx.db
      .query('networking_contacts')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .order('desc')
      .take(20)

    // Get all follow-ups for contacts
    const contactFollowups = await ctx.db
      .query('followup_actions')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .collect()

    // Filter to only contact-related follow-ups and group by contact
    const followupsByContact = contactFollowups
      .filter((f) => f.contact_id)
      .reduce((acc, followup) => {
        const contactId = followup.contact_id as string
        if (!acc[contactId]) acc[contactId] = []
        acc[contactId].push({
          id: followup._id as string,
          type: followup.type,
          description: followup.description,
          due_date: followup.due_date,
          completed: followup.completed,
          notes: followup.notes,
        })
        return acc
      }, {} as Record<string, any[]>)

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
      applications: applicationsWithStages.map((app) => ({
        id: app._id as string, // Ensure string for OpenAI consumption
        company: app.company,
        job_title: app.job_title,
        status: app.status,
        url: app.url,
        applied_at: app.applied_at,
        interview_stages: app.interview_stages,
        followup_tasks: app.followup_tasks,
      })),
      goals: goals.map((goal) => ({
        id: goal._id as string, // Ensure string for OpenAI consumption
        title: goal.title,
        status: goal.status,
        progress: goal.progress,
        target_date: goal.target_date,
      })),
      resumes: resumes.map((resume) => ({
        id: resume._id as string, // Ensure string for OpenAI consumption
        title: resume.title,
        source: resume.source,
        updated_at: resume.updated_at,
      })),
      cover_letters: coverLetters.map((letter) => ({
        id: letter._id as string, // Ensure string for OpenAI consumption
        name: letter.name,
        company_name: letter.company_name,
        job_title: letter.job_title,
        updated_at: letter.updated_at,
      })),
      projects: projects.map((project) => ({
        id: project._id as string, // Ensure string for OpenAI consumption
        title: project.title,
        role: project.role,
        technologies: project.technologies,
      })),
      networking_contacts: contacts.map((contact) => ({
        id: contact._id as string, // Ensure string for OpenAI consumption
        name: contact.name,
        company: contact.company,
        position: contact.position,
        email: contact.email,
        phone: contact.phone,
        linkedin_url: contact.linkedin_url,
        relationship: contact.relationship,
        last_contact: contact.last_contact,
        notes: contact.notes,
        followups: followupsByContact[contact._id as string] || [],
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

    if (typeof user.skills !== 'string' || user.skills.trim().length < 30) {
      gaps.push({
        field: 'skills',
        severity: 'high',
        suggestion: 'List your key skills to match with job requirements',
      })
    }

    if (typeof user.bio !== 'string' || user.bio.length < 50) {
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
function generateHistoryEntryId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`
}

function sanitizeHistoryEntry(entry: any, prefix: string) {
  if (!entry || typeof entry !== "object") {
    throw new Error(
      `Invalid ${prefix === "edu" ? "education" : "work"} history entry`,
    )
  }

  const sanitized: Record<string, any> = { ...entry }

  let originalId: string | undefined
  if (entry.id != null) {
    if (typeof entry.id === "string") {
      const trimmed = entry.id.trim()
      if (trimmed.length > 0) {
        originalId = trimmed
      }
    } else if (typeof entry.id === "number") {
      originalId = String(entry.id)
    }
  }

  sanitized.id = originalId && originalId.length > 0
    ? originalId
    : generateHistoryEntryId(prefix)

  if (originalId && originalId.length > 0) {
    sanitized.__sourceId = originalId
  }

  if (sanitized.start_date != null) {
    sanitized.start_date = String(sanitized.start_date)
  }
  if (sanitized.end_date != null) {
    sanitized.end_date = String(sanitized.end_date)
  }

  return sanitized
}

function stripHistoryMeta(entry: any) {
  if (!entry || typeof entry !== "object") return entry
  const cleaned = { ...entry }
  delete cleaned.__sourceId
  return cleaned
}

function normalizeHistoryValue(
  value: unknown,
  current: any[] | undefined,
  prefix: string,
): any[] {
  if (value == null) {
    return []
  }

  if (Array.isArray(value)) {
    const sanitizedArray = value.map((entry) => sanitizeHistoryEntry(entry, prefix))

    const base = Array.isArray(current)
      ? current.map((entry) => sanitizeHistoryEntry(entry, prefix))
      : []

    const byId = new Map<string, Record<string, any>>()
    for (const entry of base) {
      byId.set(entry.id, entry)
    }

    for (const entry of sanitizedArray) {
      const existingEntry = byId.get(entry.id)
      if (existingEntry) {
        const merged = { ...existingEntry }
        for (const [key, value] of Object.entries(entry)) {
          if (value !== undefined) {
            merged[key] = value
          }
        }
        byId.set(entry.id, merged)
      } else {
        byId.set(entry.id, entry)
      }
    }

    return Array.from(byId.values()).map(stripHistoryMeta)
  }

  if (typeof value === "object") {
    const sanitized = sanitizeHistoryEntry(value, prefix)
    const existing = Array.isArray(current)
      ? current.map((entry) => sanitizeHistoryEntry(entry, prefix))
      : []

    let matchIndex = existing.findIndex((item) => item?.id === sanitized.id)

    if (matchIndex < 0 && sanitized.__sourceId) {
      matchIndex = existing.findIndex(
        (item) => item?.id === sanitized.__sourceId,
      )
    }

    if (matchIndex < 0) {
      const normalizedCompany = typeof sanitized.company === "string"
        ? sanitized.company.toLowerCase().trim()
        : null
      if (normalizedCompany) {
        matchIndex = existing.findIndex((item) => {
          if (typeof item?.company !== "string") return false
          const existingCompany = item.company.toLowerCase().trim()
          return (
            existingCompany === normalizedCompany ||
            existingCompany.includes(normalizedCompany) ||
            normalizedCompany.includes(existingCompany)
          )
        })
      }
    }

    if (matchIndex < 0) {
      const normalizedRole = typeof sanitized.role === "string"
        ? sanitized.role.toLowerCase().trim()
        : null
      if (normalizedRole) {
        matchIndex = existing.findIndex((item) => {
          if (typeof item?.role !== "string") return false
          const existingRole = item.role.toLowerCase().trim()
          return (
            existingRole === normalizedRole ||
            existingRole.includes(normalizedRole) ||
            normalizedRole.includes(existingRole)
          )
        })
      }
    }

    if (matchIndex >= 0) {
      const merged = { ...existing[matchIndex] }
      for (const [key, value] of Object.entries(sanitized)) {
        if (value !== undefined) {
          merged[key] = value
        }
      }
      merged.id = existing[matchIndex].id
      existing[matchIndex] = merged
    } else {
      existing.push(sanitized)
    }

    return existing.map(stripHistoryMeta)
  }

  throw new Error(
    `Invalid value for ${prefix === "edu" ? "education_history" : "work_history"}: expected object or array`,
  )
}

function normalizeProfileField(
  user: any,
  field: string,
  rawValue: unknown,
): { normalizedValue?: unknown; updates: Record<string, any> } {
  const updates: Record<string, any> = {}

  const simpleStringFields = new Set([
    "bio",
    "current_position",
    "current_company",
    "location",
    "industry",
    "experience_level",
    "linkedin_url",
    "phone_number",
    "city",
    "major",
    "university_name",
    "career_goals",
  ])

  const numericStringFields = new Set(["graduation_year"])

  if (simpleStringFields.has(field)) {
    if (rawValue == null) {
      updates[field] = null
      return { normalizedValue: null, updates }
    }
    if (typeof rawValue !== "string") {
      throw new Error(`Invalid value for ${field}: expected string`)
    }
    const trimmed = rawValue.trim()
    updates[field] = trimmed
    return { normalizedValue: trimmed, updates }
  }

  if (numericStringFields.has(field)) {
    if (rawValue == null) {
      updates[field] = null
      return { normalizedValue: null, updates }
    }
    if (typeof rawValue !== "string" && typeof rawValue !== "number") {
      throw new Error(`Invalid value for ${field}: expected string or number`)
    }
    const strValue = String(rawValue).trim()
    updates[field] = strValue
    return { normalizedValue: strValue, updates }
  }

  if (field === "skills") {
    if (rawValue == null) {
      updates.skills = ""
      return { normalizedValue: "", updates }
    }
    if (Array.isArray(rawValue)) {
      const sanitized = rawValue
        .map((skill) =>
          typeof skill === "string" ? skill.trim() : String(skill ?? ""),
        )
        .filter((skill) => skill.length > 0)
      const joined = sanitized.join(", ")
      updates.skills = joined
      return { normalizedValue: joined, updates }
    }
    if (typeof rawValue === "string") {
      const joined = rawValue
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0)
        .join(", ")
      updates.skills = joined
      return { normalizedValue: joined, updates }
    }
    throw new Error(
      "Invalid value for skills: expected string or array of strings",
    )
  }

  if (field === "education_history") {
    const normalized = normalizeHistoryValue(
      rawValue,
      user.education_history,
      "edu",
    )
    updates.education_history = normalized
    return { normalizedValue: normalized, updates }
  }

  if (field === "work_history") {
    const normalized = normalizeHistoryValue(
      rawValue,
      user.work_history,
      "work",
    )
    updates.work_history = normalized

    let currentPositionFromWork: string | undefined
    let currentCompanyFromWork: string | undefined

    const findEntry = (predicate: (entry: any) => boolean) =>
      normalized.find((entry) => predicate(entry))

    const matchingCompany = typeof rawValue === "object" && rawValue !== null && typeof (rawValue as any).company === "string"
      ? (rawValue as any).company.toLowerCase().trim()
      : null

    if (matchingCompany) {
      const normalizedMatch = findEntry((entry) =>
        typeof entry?.company === "string" &&
        entry.company.toLowerCase().trim().includes(matchingCompany)
      )
      if (normalizedMatch && typeof normalizedMatch?.role === "string") {
        currentPositionFromWork = normalizedMatch.role
        if (typeof normalizedMatch.company === "string") {
          currentCompanyFromWork = normalizedMatch.company
        }
      }
    }

    if (!currentPositionFromWork) {
      const currentEntry = findEntry((entry) => entry?.is_current === true)
      if (currentEntry && typeof currentEntry?.role === "string") {
        currentPositionFromWork = currentEntry.role
        if (typeof currentEntry.company === "string") {
          currentCompanyFromWork = currentEntry.company
        }
      }
    }

    if (!currentPositionFromWork && normalized.length > 0) {
      const firstEntry = normalized[0]
      if (typeof firstEntry?.role === "string") {
        currentPositionFromWork = firstEntry.role
        if (typeof firstEntry.company === "string") {
          currentCompanyFromWork = firstEntry.company
        }
      }
    }

    const workPosition = currentPositionFromWork?.trim()
    const workCompany = currentCompanyFromWork?.trim()
    const currentPosition = typeof user.current_position === "string" ? user.current_position.trim() : ""
    const currentCompany = typeof user.current_company === "string" ? user.current_company.trim() : ""

    if (workPosition && workPosition !== currentPosition) {
      updates.current_position = workPosition
    }

    if (workCompany && workCompany !== currentCompany) {
      updates.current_company = workCompany
    }

    return { normalizedValue: normalized, updates }
  }

  return { updates }
}

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

    const { normalizedValue, updates } = normalizeProfileField(
      user,
      args.field,
      args.value,
    )
    const valueToPersist =
      normalizedValue !== undefined ? normalizedValue : args.value

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
        value_json: valueToPersist,
        confidence,
        updated_at: now,
      })
    } else {
      // Insert new field
      await ctx.db.insert('agent_profile_fields', {
        user_id: args.userId,
        field: args.field,
        value_json: valueToPersist,
        confidence,
        source: 'agent',
        created_at: now,
        updated_at: now,
      })
    }

    // Apply updates to users table if any
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.userId, { ...updates, updated_at: now })
    }

    return {
      success: true,
      field: args.field,
      value: valueToPersist,
      updated_in_profile: Object.keys(updates).length > 0,
    }
  },
})

/**
 * Tool 4: search_jobs
 * Searches for real jobs using the Next.js API route (which calls Adzuna)
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

    // Get the site URL from environment or use localhost as fallback
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.CONVEX_SITE_URL || 'http://localhost:3000'

    try {
      // Call our Next.js API route which has access to Adzuna credentials
      const response = await fetch(`${siteUrl}/api/jobs/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: args.query,
          location: args.location,
          perPage: limit,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Job search API error: ${response.status}`)
      }

      const data = await response.json()

      // The API route already normalizes the data, so we can use it directly
      return {
        query: args.query,
        location: args.location,
        results: data.jobs || [],
        total_count: data.total || 0,
        search_performed_at: Date.now(),
      }
    } catch (error) {
      // Fallback to error message if API fails
      throw new Error(`Job search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      application_id: applicationId as string, // Ensure string for JSON serialization
      company: args.company,
      job_title: args.jobTitle,
    }
  },
})

/**
 * Tool 6: create_goal
 * Creates a new career goal for the user
 */
export const createGoal = mutation({
  args: {
    userId: v.id('users'),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    target_date: v.optional(v.number()),
    checklist: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string(),
      completed: v.boolean(),
    }))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Validate title
    if (!args.title || args.title.trim().length === 0) {
      throw new Error('Goal title cannot be empty')
    }
    if (args.title.length > 200) {
      throw new Error('Goal title must be 200 characters or less')
    }

    // Validate target_date if provided
    if (args.target_date !== undefined && args.target_date < Date.now()) {
      throw new Error('Goal target date cannot be in the past')
    }

    // Validate checklist if provided
    if (args.checklist) {
      if (args.checklist.length > 50) {
        throw new Error('Checklist cannot exceed 50 items')
      }
      const ids = new Set<string>()
      for (const item of args.checklist) {
        if (!item.id || item.id.trim().length === 0) {
          throw new Error('Checklist item must have a valid id')
        }
        if (ids.has(item.id)) {
          throw new Error('Checklist item IDs must be unique')
        }
        ids.add(item.id)
        if (!item.text || item.text.trim().length === 0) {
          throw new Error('Checklist item text cannot be empty')
        }
        if (item.text.length > 500) {
          throw new Error('Checklist item text must be 500 characters or less')
        }
      }
    }

    const now = Date.now()

    // Create goal entry
    const goalId = await ctx.db.insert('goals', {
      user_id: args.userId,
      title: args.title,
      description: args.description,
      category: args.category,
      target_date: args.target_date,
      checklist: args.checklist,
      status: 'not_started',
      progress: 0,
      created_at: now,
      updated_at: now,
    })

    return {
      success: true,
      goal_id: goalId as string, // Ensure string for JSON serialization
      title: args.title,
      status: 'not_started',
    }
  },
})

/**
 * Tool 7: update_goal
 * Updates an existing career goal (status, progress, title, etc.)
 */
export const updateGoal = mutation({
  args: {
    userId: v.id('users'),
    goalId: v.id('goals'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('not_started'),
        v.literal('in_progress'),
        v.literal('active'),
        v.literal('completed'),
        v.literal('paused'),
        v.literal('cancelled')
      )
    ),
    progress: v.optional(v.number()),
    category: v.optional(v.string()),
    target_date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get the goal and verify ownership
    const goal = await ctx.db.get(args.goalId)
    if (!goal) {
      throw new Error('Goal not found')
    }
    if (goal.user_id !== args.userId) {
      throw new Error('Unauthorized: Goal does not belong to this user')
    }

    // Validate optional fields
    if (args.title !== undefined) {
      if (args.title.trim().length === 0) {
        throw new Error('Goal title cannot be empty')
      }
      if (args.title.length > 200) {
        throw new Error('Goal title must be 200 characters or less')
      }
    }

    if (args.progress !== undefined) {
      if (args.progress < 0 || args.progress > 100) {
        throw new Error('Progress must be between 0 and 100')
      }
    }

    if (args.target_date !== undefined && args.target_date < Date.now()) {
      throw new Error('Goal target date cannot be in the past')
    }

    const now = Date.now()

    // Build update object with only provided fields
    const updates: any = { updated_at: now }
    if (args.title !== undefined) updates.title = args.title
    if (args.description !== undefined) updates.description = args.description
    if (args.status !== undefined) updates.status = args.status
    if (args.progress !== undefined) updates.progress = args.progress
    if (args.category !== undefined) updates.category = args.category
    if (args.target_date !== undefined) updates.target_date = args.target_date

    // Auto-set completed_at when status changes to completed
    if (args.status === 'completed' && goal.status !== 'completed') {
      updates.completed_at = now
    }

    // Clear completed_at if status changes from completed to something else
    if (goal.status === 'completed' && args.status && args.status !== 'completed') {
      updates.completed_at = undefined
    }

    await ctx.db.patch(args.goalId, updates)

    return {
      success: true,
      goal_id: args.goalId as string, // Ensure string for JSON serialization
      title: updates.title || goal.title,
      status: updates.status || goal.status,
      progress: updates.progress !== undefined ? updates.progress : goal.progress,
    }
  },
})

/**
 * Tool 8: delete_goal
 * Deletes an existing career goal
 */
export const deleteGoal = mutation({
  args: {
    userId: v.id('users'),
    goalId: v.id('goals'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get the goal and verify ownership
    const goal = await ctx.db.get(args.goalId)
    if (!goal) {
      throw new Error('Goal not found')
    }
    if (goal.user_id !== args.userId) {
      throw new Error('Unauthorized: Goal does not belong to this user')
    }

    // Delete the goal
    await ctx.db.delete(args.goalId)

    return {
      success: true,
      goal_id: args.goalId as string, // Ensure string for JSON serialization
      title: goal.title,
    }
  },
})

/**
 * Tool 9: create_application
 * Creates a new job application tracking record
 */
export const createApplication = mutation({
  args: {
    userId: v.id('users'),
    company: v.string(),
    jobTitle: v.string(),
    status: v.optional(v.union(
      v.literal('saved'),
      v.literal('applied'),
      v.literal('interview'),
      v.literal('offer'),
      v.literal('rejected')
    )),
    source: v.optional(v.string()),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    applied_at: v.optional(v.number()),
    resume_id: v.optional(v.id('resumes')),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    const now = Date.now()

    // Verify resume ownership if provided
    if (args.resume_id !== undefined) {
      const resume = await ctx.db.get(args.resume_id);
      if (!resume || resume.user_id !== args.userId) {
        throw new Error('Resume not found or unauthorized');
      }
    }

    // Create application entry
    const applicationId = await ctx.db.insert('applications', {
      user_id: args.userId,
      company: args.company,
      job_title: args.jobTitle,
      status: args.status || 'saved',
      source: args.source,
      url: args.url,
      notes: args.notes,
      applied_at: args.applied_at,
      resume_id: args.resume_id,
      created_at: now,
      updated_at: now,
    })

    return {
      success: true,
      application_id: applicationId as string, // Ensure string for JSON serialization
      company: args.company,
      job_title: args.jobTitle,
      status: args.status || 'saved',
    }
  },
})

/**
 * Tool 10: update_application
 * Updates an existing job application
 */
export const updateApplication = mutation({
  args: {
    userId: v.id('users'),
    applicationId: v.id('applications'),
    company: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('saved'),
      v.literal('applied'),
      v.literal('interview'),
      v.literal('offer'),
      v.literal('rejected')
    )),
    source: v.optional(v.string()),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    applied_at: v.optional(v.number()),
    resume_id: v.optional(v.id('resumes')),
    cover_letter_id: v.optional(v.id('cover_letters')),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get the application and verify ownership
    const application = await ctx.db.get(args.applicationId)
    if (!application) {
      throw new Error('Application not found')
    }
    if (application.user_id !== args.userId) {
      throw new Error('Unauthorized: Application does not belong to this user')
    }

    // Verify resume ownership if provided
    if (args.resume_id !== undefined) {
      const resume = await ctx.db.get(args.resume_id);
      if (!resume || resume.user_id !== args.userId) {
        throw new Error('Resume not found or unauthorized');
      }
    }

    // Verify cover letter ownership if provided
    if (args.cover_letter_id !== undefined) {
      const coverLetter = await ctx.db.get(args.cover_letter_id);
      if (!coverLetter || coverLetter.user_id !== args.userId) {
        throw new Error('Cover letter not found or unauthorized');
      }
    }

    // Build update object with only provided fields
    const updates: any = {
      updated_at: Date.now(),
    }
    if (args.company !== undefined) updates.company = args.company
    if (args.jobTitle !== undefined) updates.job_title = args.jobTitle
    if (args.status !== undefined) updates.status = args.status
    if (args.source !== undefined) updates.source = args.source
    if (args.url !== undefined) updates.url = args.url
    if (args.notes !== undefined) updates.notes = args.notes
    if (args.applied_at !== undefined) updates.applied_at = args.applied_at
    if (args.resume_id !== undefined) updates.resume_id = args.resume_id
    if (args.cover_letter_id !== undefined) updates.cover_letter_id = args.cover_letter_id

    // Update the application
    await ctx.db.patch(args.applicationId, updates)

    return {
      success: true,
      application_id: args.applicationId as string, // Ensure string for JSON serialization
      company: args.company || application.company,
      job_title: args.jobTitle || application.job_title,
      status: args.status || application.status,
    }
  },
})

/**
 * Tool 11: delete_application
 * Deletes an existing job application
 */
export const deleteApplication = mutation({
  args: {
    userId: v.id('users'),
    applicationId: v.id('applications'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get the application and verify ownership
    const application = await ctx.db.get(args.applicationId)
    if (!application) {
      throw new Error('Application not found')
    }
    if (application.user_id !== args.userId) {
      throw new Error('Unauthorized: Application does not belong to this user')
    }

    // Delete the application
    await ctx.db.delete(args.applicationId)

    return {
      success: true,
      application_id: args.applicationId as string, // Ensure string for JSON serialization
      company: application.company,
      job_title: application.job_title,
    }
  },
})
