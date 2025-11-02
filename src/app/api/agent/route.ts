import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'
import { sendDelta, sendTool, sendError, sendDone, createSSEWriter } from '@/lib/agent/sse'
import { TOOL_SCHEMAS, type ToolName } from '@/lib/agent/tools'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../convex/_generated/api'

// Runtime configuration for streaming
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Convex client for tool execution
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is required')
}
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)

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
    const { userId } = await auth()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Parse request body
    const body = await req.json()
    const { message, context, history = [] } = body

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 3. Rate limiting check (placeholder - will implement in Phase 6)
    // TODO: Check Convex agent_rate_limits table

    // 4. Create streaming response
    const stream = new TransformStream()
    const writer = createSSEWriter(stream)

    // 5. Start streaming response in background
    const responsePromise = streamAgentResponse({
      userId,
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

    // 6. Return SSE response
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
  userId: string,
  toolName: ToolName,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case 'get_user_snapshot':
      return await convex.query(api.agent.getUserSnapshot, {
        userId: userId as any,
      })

    case 'get_profile_gaps':
      return await convex.query(api.agent.getProfileGaps, {
        userId: userId as any,
      })

    case 'upsert_profile_field':
      return await convex.mutation(api.agent.upsertProfileField, {
        userId: userId as any,
        field: input.field as string,
        value: input.value,
        confidence: input.confidence as number | undefined,
      })

    case 'search_jobs':
      return await convex.query(api.agent.searchJobs, {
        userId: userId as any,
        query: input.query as string,
        location: input.location as string | undefined,
        limit: input.limit as number | undefined,
      })

    case 'save_job':
      return await convex.mutation(api.agent.saveJob, {
        userId: userId as any,
        company: input.company as string,
        jobTitle: input.jobTitle as string,
        url: input.url as string | undefined,
        notes: input.notes as string | undefined,
      })

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

/**
 * Stream agent response with OpenAI and tool execution
 */
async function streamAgentResponse({
  userId,
  message,
  context,
  history,
  writer,
}: {
  userId: string
  message: string
  context?: Record<string, unknown>
  history: Array<{ role: string; content: string }>
  writer: { write: (data: string) => Promise<void>; close: () => Promise<void> }
}) {
  try {
    // Build messages array
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

    // Set up timeout for OpenAI API call
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

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

    try {
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
      if (chunk.choices[0]?.finish_reason === 'tool_calls') {
        // Execute tool calls (Phase 4 implementation)
        for (const toolCall of Array.from(toolCallsMap.values())) {
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
          const validToolNames: ToolName[] = [
            'get_user_snapshot',
            'get_profile_gaps',
            'upsert_profile_field',
            'search_jobs',
            'save_job',
          ]
          if (!validToolNames.includes(toolCall.name as ToolName)) {
            await writer.write(
              sendTool({
                name: toolCall.name,
                status: 'error',
                error: `Unknown tool: ${toolCall.name}`,
              })
            )
            continue
          }

          // Execute tool via Convex
          try {
            const startTime = Date.now()
            const toolOutput = await executeTool(userId, toolCall.name as ToolName, parsedInput)
            const latencyMs = Date.now() - startTime

            // Log successful execution
            await convex.mutation(api.agent.logAudit, {
              userId: userId as any,
              tool: toolCall.name,
              inputJson: parsedInput,
              outputJson: toolOutput,
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
          } catch (toolError) {
            const errorMessage = toolError instanceof Error ? toolError.message : 'Tool execution failed'

            // Log failed execution
            await convex.mutation(api.agent.logAudit, {
              userId: userId as any,
              tool: toolCall.name,
              inputJson: parsedInput,
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
          }
        }
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
