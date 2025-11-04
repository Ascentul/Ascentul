import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'
import { sendDelta, sendTool, sendError, sendDone, createSSEWriter } from '@/lib/agent/sse'
import { TOOL_SCHEMAS, type ToolName } from '@/lib/agent/tools'
import { safeAuditPayload } from '@/lib/agent/audit-sanitizer'
import { getConvexClient } from '@/lib/convex-server'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'

// Runtime configuration for streaming
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Convex client for tool execution (server-side singleton)
const convex = getConvexClient()

// Extract valid tool names from schemas (single source of truth)
const VALID_TOOL_NAMES = TOOL_SCHEMAS.map(schema => schema.function.name) as ToolName[]

// Load system prompt
let SYSTEM_PROMPT: string
try {
  SYSTEM_PROMPT = readFileSync(
    join(process.cwd(), 'src/lib/agent/prompts/system.txt'),
    'utf-8'
  )
} catch (error) {
  console.error('[Agent] Failed to load system prompt:', error)
  SYSTEM_PROMPT = 'You are a helpful AI assistant.' // Fallback prompt
}

// Constants
const MAX_CONTEXT_SIZE = 2000 // Max chars for context JSON
const OPENAI_TIMEOUT_MS = 30000 // 30s timeout for OpenAI API calls
const CONVEX_ID_REGEX = /^[a-z0-9]{24}$/
const looksLikeConvexId = (value: unknown): value is string =>
  typeof value === 'string' && CONVEX_ID_REGEX.test(value)

const idGuard = (value: unknown, entity: string, hint?: string) =>
  looksLikeConvexId(value)
    ? null
    : {
        success: false,
        error: `Invalid ${entity} ID provided. Use get_user_snapshot to retrieve valid IDs before calling this tool.${hint ? ` ${hint}` : ''}`,
      }

/**
 * Safely stringify context with size limits and sanitization
 * Returns valid JSON even when truncated or on error
 */
function serializeContext(context: unknown): string {
  try {
    const serialized = JSON.stringify(context)

    if (serialized.length <= MAX_CONTEXT_SIZE) {
      return serialized
    }

    // Return valid JSON object indicating truncation
    return JSON.stringify({
      _truncated: true,
      _originalSize: serialized.length,
      _message: `Context too large (${serialized.length} chars, limit ${MAX_CONTEXT_SIZE})`,
    })
  } catch (error) {
    // JSON.stringify can fail on circular references or other issues
    return JSON.stringify({
      _error: true,
      _message: 'Context serialization failed',
    })
  }
}

/**
 * POST /api/agent - Streaming agent endpoint
 *
 * Request body:
 * {
 *   message: string
 *   context?: { source, recordId, action, metadata }
 *   history?: AgentMessage[]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Get Convex user ID from Clerk ID
    const convexUser = await convex.query(api.users.getUserByClerkId, {
      clerkId: clerkUserId,
    })

    if (!convexUser) {
      return new Response(JSON.stringify({ error: 'User not found in database' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userId = convexUser._id

    // 3. Parse request body
    const body = await req.json()
    const { message, context, history = [] } = body

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 4. Atomic rate limiting - check AND consume in single transaction
    const rateLimitResult = await convex.mutation(api.agent.checkAndConsumeRateLimit, {
      clerkUserId,
      windowMs: 60000, // 1 minute window
      maxRequests: 10, // 10 requests per minute
    })

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please wait before sending more messages.',
          current_count: rateLimitResult.current_count,
          limit: rateLimitResult.limit,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60',
          },
        }
      )
    }

    // 5. Create streaming response
    const stream = new TransformStream()
    const writer = createSSEWriter(stream)

    // 6. Start streaming response in background
    const responsePromise = streamAgentResponse({
      userId,
      clerkUserId,
      message,
      context,
      history,
      writer,
    })

    // Handle errors in background
    responsePromise.catch((error) => {
      console.error('[Agent API] Stream error:', error)
      try {
        writer.write(sendError(error.message || 'An error occurred'))
        writer.write(sendDone())
        writer.close()
      } catch (e) {
        console.error('[Agent API] Failed to write error:', e)
      }
    })

    // 7. Return SSE response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[Agent API] Request error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * Execute a tool by routing to the appropriate Convex function
 */
async function executeTool(
  userId: Id<'users'>,
  clerkId: string,
  toolName: ToolName,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case 'get_user_snapshot':
      return await convex.query(api.agent.getUserSnapshot, {
        userId,
      })

    case 'get_profile_gaps':
      return await convex.query(api.agent.getProfileGaps, {
        userId,
      })

    case 'upsert_profile_field':
      return await convex.mutation(api.agent.upsertProfileField, {
        userId,
        field: input.field as string,
        value: input.value,
        confidence: input.confidence as number | undefined,
      })

    case 'search_jobs':
      return await convex.query(api.agent.searchJobs, {
        userId,
        query: input.query as string,
        location: input.location as string | undefined,
        limit: input.limit as number | undefined,
      })

    case 'save_job':
      return await convex.mutation(api.agent.saveJob, {
        userId,
        company: input.company as string,
        jobTitle: input.jobTitle as string,
        url: input.url as string | undefined,
        notes: input.notes as string | undefined,
      })

    case 'create_goal':
      return await convex.mutation(api.agent.createGoal, {
        userId,
        title: input.title as string,
        description: input.description as string | undefined,
        category: input.category as string | undefined,
        target_date: input.target_date as number | undefined,
        checklist: input.checklist as Array<{ id: string; text: string; completed: boolean }> | undefined,
      })

    case 'update_goal': {
      const guard = idGuard(input.goalId, 'goal')
      if (guard) return guard
      return await convex.mutation(api.agent.updateGoal, {
        userId,
        goalId: input.goalId as Id<'goals'>,
        title: input.title as string | undefined,
        description: input.description as string | undefined,
        status: input.status as 'not_started' | 'in_progress' | 'active' | 'completed' | 'paused' | 'cancelled' | undefined,
        progress: input.progress as number | undefined,
        category: input.category as string | undefined,
        target_date: input.target_date as number | undefined,
      })
    }

    case 'delete_goal': {
      const guard = idGuard(input.goalId, 'goal')
      if (guard) return guard
      return await convex.mutation(api.agent.deleteGoal, {
        userId,
        goalId: input.goalId as Id<'goals'>,
      })
    }

    case 'create_application':
      return await convex.mutation(api.agent.createApplication, {
        userId,
        company: input.company as string,
        jobTitle: input.jobTitle as string,
        status: input.status as 'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | undefined,
        source: input.source as string | undefined,
        url: input.url as string | undefined,
        notes: input.notes as string | undefined,
        applied_at: input.applied_at as number | undefined,
        resume_id: input.resume_id as Id<'resumes'> | undefined,
      })

    case 'update_application': {
      const guard = idGuard(
        input.applicationId,
        'application',
        'If you are trying to update a role in the career profile, use upsert_profile_field with the work_history field instead of application tools.'
      )
      if (guard) return guard
      return await convex.mutation(api.agent.updateApplication, {
        userId,
        applicationId: input.applicationId as Id<'applications'>,
        company: input.company as string | undefined,
        jobTitle: input.jobTitle as string | undefined,
        status: input.status as 'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | undefined,
        source: input.source as string | undefined,
        url: input.url as string | undefined,
        notes: input.notes as string | undefined,
        applied_at: input.applied_at as number | undefined,
        resume_id: input.resume_id as Id<'resumes'> | undefined,
        cover_letter_id: input.cover_letter_id as Id<'cover_letters'> | undefined,
      })
    }

    case 'delete_application': {
      const guard = idGuard(
        input.applicationId,
        'application',
        'For changing job titles in your profile, update work_history via upsert_profile_field.'
      )
      if (guard) return guard
      return await convex.mutation(api.agent.deleteApplication, {
        userId,
        applicationId: input.applicationId as Id<'applications'>,
      })
    }

    case 'create_interview_stage': {
      const applicationId = input.applicationId as Id<'applications'>
      const title = input.title as string
      const scheduled_at = input.scheduled_at as number | undefined
      const location = input.location as string | undefined
      const notes = input.notes as string | undefined

      try {
        const stageId = await convex.mutation(api.interviews.createStage, {
          clerkId,
          applicationId,
          title,
          scheduled_at,
          location,
          notes,
        })

        return {
          success: true,
          message: `Interview stage "${title}" created successfully${scheduled_at ? ' and scheduled' : ''}.`,
          stageId,
        }
      } catch (error: any) {
        console.error('[Agent] Create interview stage error:', error)
        return {
          success: false,
          error: `Failed to create interview stage: ${error.message || 'Unknown error'}`,
        }
      }
    }

    case 'update_interview_stage': {
      const guard = idGuard(input.stageId, 'interview stage')
      if (guard) return guard
      const stageId = input.stageId as Id<'interview_stages'>
      const updates: any = {}

      if (input.title !== undefined) updates.title = input.title as string
      if (input.scheduled_at !== undefined) updates.scheduled_at = input.scheduled_at as number
      if (input.location !== undefined) updates.location = input.location as string
      if (input.notes !== undefined) updates.notes = input.notes as string
      if (input.outcome !== undefined) updates.outcome = input.outcome as 'pending' | 'scheduled' | 'passed' | 'failed'

      try {
        await convex.mutation(api.interviews.updateStage, {
          clerkId,
          stageId,
          updates,
        })

        return {
          success: true,
          message: `Interview stage updated successfully${updates.outcome ? ` to ${updates.outcome}` : ''}.`,
          stageId,
        }
      } catch (error: any) {
        console.error('[Agent] Update interview stage error:', error)
        return {
          success: false,
          error: `Failed to update interview stage: ${error.message || 'Unknown error'}`,
        }
      }
    }

    case 'create_followup': {
      const guard = idGuard(input.applicationId, 'application')
      if (guard) return guard
      const applicationId = input.applicationId as Id<'applications'>
      const description = input.description as string
      const due_date = input.due_date as number | undefined
      const notes = input.notes as string | undefined
      const type = input.type as string | undefined

      try {
        const followupId = await convex.mutation(api.followups.createFollowup, {
          clerkId,
          applicationId,
          description,
          due_date,
          notes,
          type,
        })

        return {
          success: true,
          message: `Follow-up task created: "${description}"${due_date ? ' with due date' : ''}.`,
          followupId,
        }
      } catch (error: any) {
        console.error('[Agent] Create followup error:', error)
        return {
          success: false,
          error: `Failed to create follow-up: ${error.message || 'Unknown error'}`,
        }
      }
    }

    case 'update_followup': {
      const guard = idGuard(input.followupId, 'follow-up')
      if (guard) return guard
      const followupId = input.followupId as Id<'followup_actions'>
      const updates: any = {}

      if (input.description !== undefined) updates.description = input.description as string
      if (input.due_date !== undefined) updates.due_date = input.due_date as number
      if (input.notes !== undefined) updates.notes = input.notes as string
      if (input.type !== undefined) updates.type = input.type as string
      if (input.completed !== undefined) updates.completed = input.completed as boolean

      try {
        await convex.mutation(api.followups.updateFollowup, {
          clerkId,
          followupId,
          updates,
        })

        return {
          success: true,
          message: `Follow-up task updated${updates.completed ? ' and marked as completed' : ''}.`,
          followupId,
        }
      } catch (error: any) {
        console.error('[Agent] Update followup error:', error)
        return {
          success: false,
          error: `Failed to update follow-up: ${error.message || 'Unknown error'}`,
        }
      }
    }

    case 'generate_career_path': {
      // Career path generation - generate detailed path using OpenAI directly
      const targetRole = input.targetRole as string
      const currentRole = input.currentRole as string | undefined

      try {
        // Fetch user profile for AI generation
        const profile = await convex.query(api.users.getUserByClerkId, { clerkId })

        if (!profile) {
          throw new Error('User profile not found')
        }

        // Build profile context for OpenAI prompt
        const profileContext: string[] = []
        if (currentRole || profile.current_position) {
          profileContext.push(`Current role: ${currentRole || profile.current_position}`)
        }
        if (profile.skills) profileContext.push(`Skills: ${profile.skills}`)
        if (profile.industry) profileContext.push(`Industry: ${profile.industry}`)
        if (profile.experience_level) profileContext.push(`Experience level: ${profile.experience_level}`)
        if (profile.bio) profileContext.push(`Background: ${profile.bio}`)

        // Generate career path using OpenAI
        const prompt = `Create a detailed career progression path for someone aiming to become a ${targetRole}.

${profileContext.length > 0 ? `Candidate Profile:\n${profileContext.join('\n')}\n` : ''}
Generate a career path with 4-6 progressive stages from entry-level to the target role. For each stage, provide:

1. **title**: The job title for this stage
2. **level**: One of: entry, mid, senior, lead, executive
3. **yearsExperience**: Years of experience typically required (e.g., "0-2", "3-5", "5-8")
4. **salaryRange**: Realistic salary range (e.g., "$60K-$80K", "$100K-$130K")
5. **skills**: Array of 5-7 key technical and soft skills required
6. **description**: 2-3 sentence description of responsibilities and growth
7. **growthPotential**: One of: high, medium, stable

Return ONLY valid JSON in this exact format:
{
  "name": "${targetRole}",
  "description": "Brief description of this career path",
  "nodes": [
    {
      "title": "Job Title",
      "level": "entry|mid|senior|lead|executive",
      "yearsExperience": "0-2",
      "salaryRange": "$60K-$80K",
      "skills": ["Skill 1", "Skill 2", "Skill 3"],
      "description": "Role description and responsibilities",
      "growthPotential": "high|medium|stable",
      "icon": "briefcase"
    }
  ]
}`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.4, // Lower temperature for more consistent JSON generation
          max_tokens: 2000,
          messages: [
            { role: 'system', content: 'You are a career development expert. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ]
        })

        const content = completion.choices[0]?.message?.content || ''
        let careerPath: any

        try {
          careerPath = JSON.parse(content)
        } catch (parseError) {
          console.error('[Agent] Failed to parse OpenAI response:', content)
          throw new Error('Failed to generate career path structure')
        }

        // Validate the response has required structure
        if (!careerPath.nodes || !Array.isArray(careerPath.nodes) || careerPath.nodes.length === 0) {
          throw new Error('Invalid career path structure from AI')
        }

        // Validate each node has required fields
        const hasValidNodes = careerPath.nodes.every((node: any) =>
          node.title &&
          node.level &&
          node.yearsExperience &&
          node.salaryRange &&
          node.skills &&
          Array.isArray(node.skills) &&
          node.description
        )

        if (!hasValidNodes) {
          throw new Error('Career path nodes missing required fields')
        }

        // Save to database with full career path data
        const steps = {
          source: 'agent_chat',
          path: careerPath,
          generatedAt: Date.now(),
        }

        const savedPath = await convex.mutation(api.career_paths.createCareerPath, {
          clerkId,
          target_role: targetRole,
          current_level: currentRole,
          estimated_timeframe: undefined,
          steps,
          status: 'active',
        })

        return {
          success: true,
          type: 'career_path',
          message: `Created a detailed career path to ${targetRole} with ${careerPath.nodes.length} career stages.`,
          pathId: savedPath._id,
          careerPath: {
            name: careerPath.name,
            description: careerPath.description,
            nodes: careerPath.nodes,
          },
          stages: careerPath.nodes.length,
          preview: careerPath.nodes.map((n: any) => `${n.title} (${n.level})`).join(' → ')
        }
      } catch (error) {
        console.error('[Agent] Career path generation error:', error)

        // Fallback to basic creation if OpenAI call fails
        const steps = {
          path: {
            name: targetRole,
            description: `Career path to become a ${targetRole}`,
          },
          milestones: [],
          skills: [],
          timeline: currentRole ? '2-3 years' : '3-5 years',
        }

        const fallbackPath = await convex.mutation(api.career_paths.createCareerPath, {
          clerkId,
          target_role: targetRole,
          current_level: currentRole,
          estimated_timeframe: steps.timeline,
          steps,
          status: 'planning',
        })

        return {
          success: true,
          message: `Created basic career path outline to ${targetRole}. You can view and expand it in the Career Path Explorer at /career-path.`,
          pathId: fallbackPath._id,
          fallback: true,
        }
      }
    }

    case 'generate_cover_letter': {
      // Generate cover letter using AI with full user profile
      const jobDescription = input.jobDescription as string
      const companyName = input.company as string
      const jobTitle = input.jobTitle as string

      // Validate input lengths to prevent excessive token usage and costs
      if (jobDescription && jobDescription.length > 5000) {
        throw new Error('Job description too long (max 5000 characters)')
      }
      if (companyName && companyName.length > 200) {
        throw new Error('Company name too long (max 200 characters)')
      }
      if (jobTitle && jobTitle.length > 200) {
        throw new Error('Job title too long (max 200 characters)')
      }

      // Fetch comprehensive user profile
      const profile = await convex.query(api.users.getUserByClerkId, { clerkId })
      const projects = await convex.query(api.projects.getUserProjects, { clerkId }) || []

      // Build detailed profile summary for AI
      const profileSummary: string[] = []
      if (profile) {
        if (profile.current_position) profileSummary.push(`Current position: ${profile.current_position}`)
        if (profile.current_company) profileSummary.push(`Current company: ${profile.current_company}`)
        if (profile.industry) profileSummary.push(`Industry: ${profile.industry}`)
        if (profile.experience_level) profileSummary.push(`Experience level: ${profile.experience_level}`)
        if (profile.skills) profileSummary.push(`Skills: ${profile.skills}`)
        if (profile.bio) profileSummary.push(`Bio: ${profile.bio}`)
        if (profile.career_goals) profileSummary.push(`Career goals: ${profile.career_goals}`)

        // Work history
        if (profile.work_history && Array.isArray(profile.work_history) && profile.work_history.length > 0) {
          profileSummary.push('\n--- Work History ---')
          profile.work_history.forEach((job: any, idx: number) => {
            profileSummary.push(`${idx + 1}. ${job.role || 'Role'} at ${job.company || 'Company'} (${job.start_date || 'N/A'} - ${job.is_current ? 'Present' : (job.end_date || 'N/A')})`)
            if (job.summary) profileSummary.push(`   ${job.summary}`)
          })
        }

        // Education history
        if (profile.education_history && Array.isArray(profile.education_history) && profile.education_history.length > 0) {
          profileSummary.push('\n--- Education ---')
          profile.education_history.forEach((edu: any, idx: number) => {
            profileSummary.push(`${idx + 1}. ${edu.degree || 'Degree'} in ${edu.field_of_study || 'Field'} - ${edu.school || 'School'}`)
          })
        }
      }

      // Add projects
      if (projects.length > 0) {
        profileSummary.push('\n--- Projects ---')
        projects.slice(0, 5).forEach((project: any, idx: number) => {
          profileSummary.push(`${idx + 1}. ${project.title}${project.description ? ': ' + project.description : ''}`)
        })
      }

      const userProfileSummary = profileSummary.length ? profileSummary.join('\n') : 'No profile data available.'

      // Generate with OpenAI
      let content = ''
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Cost-effective model with quality prompting
          messages: [
            {
              role: "system",
              content: "You are a professional career coach and expert cover letter writer. Generate compelling, personalized cover letters that highlight relevant skills and experience."
            },
            {
              role: "user",
              content: `Create a cover letter for:

Company: ${companyName}
Role: ${jobTitle}
Job Description: ${jobDescription}

Candidate Profile:
${userProfileSummary}

Instructions:
- Create a professional cover letter body (no greeting or signature lines)
- Use specific examples from the candidate's profile
- Highlight relevant experience, skills, and accomplishments
- Show enthusiasm for the role and company
- Keep it concise but compelling (300-400 words)
- Start directly with the opening paragraph`
            }
          ],
          max_tokens: 2000, // Increased for more detailed letters with profile context
          temperature: 0.7,
        })
        content = completion.choices[0]?.message?.content || ''
      } catch (error) {
        // Fallback to basic template
        content = `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${jobTitle} position at ${companyName}.\n\n`
        if (profile?.current_position) {
          content += `Currently, I work as ${profile.current_position}${profile.current_company ? ` at ${profile.current_company}` : ''}. `
        }
        if (profile?.skills) {
          content += `My key skills include ${profile.skills}. `
        }
        content += `\n\nI would welcome the opportunity to discuss how my background can contribute to ${companyName}'s success.\n\nSincerely,\n${profile?.name || 'Applicant'}`
      }

      // Save to database
      const saved = await convex.mutation(api.cover_letters.createCoverLetter, {
        clerkId,
        name: `Cover Letter - ${companyName} ${jobTitle}`,
        job_title: jobTitle,
        company_name: companyName,
        template: 'standard',
        content,
        closing: 'Sincerely,',
        source: 'ai_generated',
      })

      // Create preview
      const preview = content.slice(0, 450)
      const truncated = content.length > 450

      return {
        success: true,
        coverLetterId: saved._id,
        content,
        preview: `${preview}${truncated ? '...' : ''}`,
        message: 'Cover letter generated with AI'
      }
    }

    case 'analyze_cover_letter':
      // Cover letter analysis - feature not yet implemented in existing codebase
      return {
        success: true,
        message: 'Cover letter analysis is not yet available. This feature is coming soon.',
        coverLetterId: input.coverLetterId,
      }

    case 'create_contact':
      // Create contact in networking_contacts table
      return await convex.mutation(api.contacts.createContact, {
        clerkId,
        name: input.name as string,
        email: input.email as string | undefined,
        company: input.company as string | undefined,
        position: input.role as string | undefined, // Note: contacts uses 'position' not 'role'
        linkedin_url: input.linkedinUrl as string | undefined,
        notes: input.notes as string | undefined,
        phone: input.phone as string | undefined,
        relationship: input.relationship as string | undefined,
        last_contact: undefined, // Not in tool schema yet
      })

    case 'update_contact':
      // Update contact details (use log_contact_interaction for interaction tracking)
      {
        const guard = idGuard(input.contactId, 'contact')
        if (guard) return guard
      }
      return await convex.mutation(api.contacts.updateContact, {
        clerkId,
        contactId: input.contactId as Id<'networking_contacts'>,
        updates: {
          name: input.name as string | undefined,
          email: input.email as string | undefined,
          company: input.company as string | undefined,
          position: input.role as string | undefined,
          linkedin_url: input.linkedinUrl as string | undefined,
          notes: input.notes as string | undefined,
          phone: input.phone as string | undefined,
          relationship: input.relationship as string | undefined,
        },
      })

    case 'delete_contact':
      // Delete contact
      {
        const guard = idGuard(input.contactId, 'contact')
        if (guard) return guard
      }
      return await convex.mutation(api.contacts.deleteContact, {
        clerkId,
        contactId: input.contactId as Id<'networking_contacts'>,
      })

    case 'log_contact_interaction':
      // Log interaction with contact (creates interaction record + updates last_contact)
      {
        const guard = idGuard(input.contactId, 'contact')
        if (guard) return guard
      }
      return await convex.mutation(api.contact_interactions.logInteraction, {
        clerkId,
        contactId: input.contactId as Id<'networking_contacts'>,
        notes: input.notes as string | undefined,
      })

    case 'create_contact_followup':
      // Create a follow-up task for a contact
      {
        const guard = idGuard(input.contactId, 'contact')
        if (guard) return guard
      }
      return await convex.mutation(api.contact_interactions.createContactFollowup, {
        clerkId,
        contactId: input.contactId as Id<'networking_contacts'>,
        type: input.type as string,
        description: input.description as string,
        due_date: input.due_date as number,
        notes: input.notes as string | undefined,
      })

    case 'update_contact_followup':
      // Update a follow-up task for a contact
      {
        const guard = idGuard(input.followupId, 'follow-up')
        if (guard) return guard
      }
      return await convex.mutation(api.contact_interactions.updateContactFollowup, {
        clerkId,
        followupId: input.followupId as Id<'followup_actions'>,
        updates: {
          type: input.type as string | undefined,
          description: input.description as string | undefined,
          due_date: input.due_date as number | undefined,
          completed: input.completed as boolean | undefined,
          notes: input.notes as string | undefined,
        },
      })

    case 'delete_contact_followup':
      // Delete a follow-up task for a contact
      {
        const guard = idGuard(input.followupId, 'follow-up')
        if (guard) return guard
      }
      return await convex.mutation(api.contact_interactions.deleteContactFollowup, {
        clerkId,
        followupId: input.followupId as Id<'followup_actions'>,
      })

    case 'create_project':
      // Create a new project
      return await convex.mutation(api.projects.createProject, {
        clerkId,
        title: input.title as string,
        description: input.description as string | undefined,
        role: input.role as string | undefined,
        company: input.company as string | undefined,
        type: input.type as string,
        technologies: input.technologies as string[],
        url: input.url as string | undefined,
        github_url: input.github_url as string | undefined,
        start_date: input.start_date as number | undefined,
        end_date: input.end_date as number | undefined,
      })

    case 'update_project':
      // Update an existing project
      {
        const guard = idGuard(input.projectId, 'project')
        if (guard) return guard
      }
      return await convex.mutation(api.projects.updateProject, {
        clerkId,
        projectId: input.projectId as Id<'projects'>,
        updates: {
          title: input.title as string | undefined,
          description: input.description as string | undefined,
          role: input.role as string | undefined,
          company: input.company as string | undefined,
          type: input.type as string | undefined,
          technologies: input.technologies as string[] | undefined,
          url: input.url as string | undefined,
          github_url: input.github_url as string | undefined,
          start_date: input.start_date as number | undefined,
          end_date: input.end_date as number | undefined,
        },
      })

    case 'delete_project':
      // Delete a project
      {
        const guard = idGuard(input.projectId, 'project')
        if (guard) return guard
      }
      return await convex.mutation(api.projects.deleteProject, {
        clerkId,
        projectId: input.projectId as Id<'projects'>,
      })

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

/**
 * Stream agent response with OpenAI and tool execution
 * Supports multi-turn agentic loop for complex tasks
 */
async function streamAgentResponse({
  userId,
  clerkUserId,
  message,
  context,
  history,
  writer,
}: {
  userId: Id<'users'>
  clerkUserId: string
  message: string
  context?: Record<string, unknown>
  history: Array<{ role: string; content: string }>
  writer: { write: (data: string) => Promise<void>; close: () => Promise<void> }
}) {
  try {
    // Build initial messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      // Add conversation history (last 10 messages)
      ...history
        .slice(-10)
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      {
        role: 'user',
        content: context
          ? `Context: ${serializeContext(context)}\n\nUser: ${message}`
          : message,
      },
    ]

    // Use tool registry from tools/index.ts
    const tools = TOOL_SCHEMAS

    // Set up timeout for entire agentic loop
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

    try {
      // Multi-turn agentic loop (max 5 iterations to prevent infinite loops)
      const MAX_TURNS = 5
      let currentTurn = 0
      let finalResponse = ''

      let lastErrorMessage: string | null = null

      while (currentTurn < MAX_TURNS) {
        currentTurn++

        // Call OpenAI with streaming
        const completion = await openai.chat.completions.create(
          {
            model: 'gpt-4o-mini',
            messages,
            tools,
            tool_choice: 'auto',
            stream: true,
            temperature: 0.7,
            max_tokens: 1500,
          },
          {
            signal: controller.signal,
          }
        )

        let assistantMessage = ''
        const toolCallsMap = new Map<
          number,
          {
            id: string
            name: string
            arguments: string
          }
        >()

        // Process stream
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta

          // Handle content delta
          if (delta?.content) {
            assistantMessage += delta.content
            await writer.write(sendDelta(delta.content))
          }

          // Handle tool calls
          if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              if (!toolCallsMap.has(toolCall.index)) {
                toolCallsMap.set(toolCall.index, {
                  id: toolCall.id || '',
                  name: toolCall.function?.name || '',
                  arguments: '',
                })
              }
              const entry = toolCallsMap.get(toolCall.index)
              if (entry && toolCall.function?.arguments) {
                entry.arguments += toolCall.function.arguments
              }
            }
          }

          // Check for finish reason
          const finishReason = chunk.choices[0]?.finish_reason
          if (finishReason === 'tool_calls') {
            // Execute tool calls and add results to message history
            const toolCalls = Array.from(toolCallsMap.values())
            const toolResults: OpenAI.Chat.ChatCompletionToolMessageParam[] = []

            // Add assistant message with tool calls to history
            messages.push({
              role: 'assistant',
              content: assistantMessage || null,
              tool_calls: toolCalls.map((tc) => ({
                id: tc.id,
                type: 'function' as const,
                function: {
                  name: tc.name,
                  arguments: tc.arguments,
                },
              })),
            })

            for (const toolCall of toolCalls) {
              // Parse tool arguments with error handling
              let parsedInput: Record<string, unknown>
              try {
                parsedInput = JSON.parse(toolCall.arguments)
              } catch (error) {
                // Invalid JSON in tool arguments - send error and skip this tool
                await writer.write(
                  sendTool({
                    name: toolCall.name,
                    status: 'error',
                    error: 'Invalid tool arguments - malformed JSON',
                  })
                )
                toolResults.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({ error: 'Invalid tool arguments' }),
                })
                continue
              }

              await writer.write(
                sendTool({
                  name: toolCall.name,
                  status: 'pending',
                  input: parsedInput,
                })
              )

              // Validate tool name
              if (!VALID_TOOL_NAMES.includes(toolCall.name as ToolName)) {
                await writer.write(
                  sendTool({
                    name: toolCall.name,
                    status: 'error',
                    error: `Unknown tool: ${toolCall.name}`,
                  })
                )
                toolResults.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({ error: `Unknown tool: ${toolCall.name}` }),
                })
                continue
              }

              // Execute tool via Convex
              try {
                const startTime = Date.now()
                const toolOutput = await executeTool(userId, clerkUserId, toolCall.name as ToolName, parsedInput)
                const latencyMs = Date.now() - startTime
                const isErrorOutput =
                  toolOutput &&
                  typeof toolOutput === 'object' &&
                  'success' in (toolOutput as Record<string, unknown>) &&
                  (toolOutput as Record<string, unknown>).success === false
                const toolStatus = isErrorOutput ? 'error' : 'success'

                if (isErrorOutput) {
                  const outputObj = toolOutput as Record<string, unknown>
                  if (typeof outputObj.error === 'string') {
                    lastErrorMessage = outputObj.error
                  }
                }

                // Log successful execution with client-side sanitization (defense in depth)
                await convex.mutation(api.agent.logAudit, {
                  userId,
                  tool: toolCall.name,
                  inputJson: safeAuditPayload(parsedInput),
                  outputJson: safeAuditPayload(toolOutput),
                  status: toolStatus,
                  latencyMs,
                })

                await writer.write(
                  sendTool({
                    name: toolCall.name,
                    status: toolStatus,
                    input: parsedInput,
                    output: toolOutput,
                  })
                )

                // Add tool result to message history for next turn
                toolResults.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: JSON.stringify(toolOutput),
                })
              } catch (toolError) {
                const errorMessage = toolError instanceof Error ? toolError.message : 'Tool execution failed'
                lastErrorMessage = errorMessage

                // Log failed execution with client-side sanitization (defense in depth)
                await convex.mutation(api.agent.logAudit, {
                  userId,
                  tool: toolCall.name,
                  inputJson: safeAuditPayload(parsedInput),
                  status: 'error',
                  errorMessage,
                  latencyMs: 0,
                })

                await writer.write(
                  sendTool({
                    name: toolCall.name,
                    status: 'error',
                    input: parsedInput,
                    error: errorMessage,
                  })
                )

                toolResults.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({ error: errorMessage }),
                })
              }
            }

            // Add all tool results to message history
            messages.push(...toolResults)

            // Continue to next turn to let agent see tool results
            break
          } else if (finishReason === 'stop' || finishReason === 'length') {
            // Agent provided final response without tool calls
            finalResponse = assistantMessage
            break
          }
        }

        // If we got a final response (no more tool calls), exit the loop
        if (finalResponse) {
          break
        }

        // Safety check: if no tool calls were made, exit to avoid infinite loop
        if (toolCallsMap.size === 0) {
          break
        }
      }

      // If OpenAI didn't produce a final assistant message, provide a fallback so the user isn't left hanging
      if (!finalResponse) {
        const fallback = lastErrorMessage
          ? `I ran into an issue completing that request: ${lastErrorMessage}`
          : 'I ran into an issue completing that request. Please provide more details or try again with a different instruction.'
        await writer.write(sendDelta(fallback))
      }

      // Stream complete
      await writer.write(sendDone())
      await writer.close()
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    console.error('[Agent] Stream error:', error)
    await writer.write(
      sendError(error instanceof Error ? error.message : 'Stream error')
    )
    await writer.write(sendDone())
    await writer.close()
    throw error
  }
}
