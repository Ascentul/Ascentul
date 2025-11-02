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
      })

    case 'update_goal':
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

    case 'delete_goal':
      return await convex.mutation(api.agent.deleteGoal, {
        userId,
        goalId: input.goalId as Id<'goals'>,
      })

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
      })

    case 'update_application':
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
      })

    case 'delete_application':
      return await convex.mutation(api.agent.deleteApplication, {
        userId,
        applicationId: input.applicationId as Id<'applications'>,
      })

    case 'generate_career_path':
      // Career path generation calls the existing Convex function
      return await convex.mutation(api.career_paths.createCareerPath, {
        clerkId,
        target_role: input.targetRole as string,
        current_level: input.currentRole as string | undefined,
        estimated_timeframe: undefined, // Will be calculated by the function
        status: 'planning',
      })

    case 'generate_cover_letter':
      // Generate cover letter using existing function
      return await convex.mutation(api.cover_letters.generateCoverLetterContent, {
        clerkId,
        job_description: input.jobDescription as string | undefined,
        company_name: input.company as string,
        job_title: input.jobTitle as string,
        user_experience: undefined, // Will pull from user profile
      })

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
        phone: undefined,
        relationship: undefined,
        last_contact: undefined,
      })

    case 'update_contact':
      // Update contact
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
        },
      })

    case 'delete_contact':
      // Delete contact
      return await convex.mutation(api.contacts.deleteContact, {
        clerkId,
        contactId: input.contactId as Id<'networking_contacts'>,
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

                // Log successful execution with client-side sanitization (defense in depth)
                await convex.mutation(api.agent.logAudit, {
                  userId,
                  tool: toolCall.name,
                  inputJson: safeAuditPayload(parsedInput),
                  outputJson: safeAuditPayload(toolOutput),
                  status: 'success',
                  latencyMs,
                })

                await writer.write(
                  sendTool({
                    name: toolCall.name,
                    status: 'success',
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
