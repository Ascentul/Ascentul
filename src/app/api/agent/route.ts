import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'
import { sendDelta, sendTool, sendError, sendDone, createSSEWriter } from '@/lib/agent/sse'

// Runtime configuration for streaming
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
          ? `Context: ${JSON.stringify(context)}\n\nUser: ${message}`
          : message,
      },
    ]

    // Tool registry (stub - will expand in Phase 4)
    const tools: OpenAI.Chat.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'get_user_snapshot',
          description: 'Get current user profile, applications, goals, and recent activity',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'upsert_profile_field',
          description: 'Update or insert a user profile field with confidence score',
          parameters: {
            type: 'object',
            properties: {
              field: {
                type: 'string',
                description: 'The profile field to update (e.g., "skills", "experience", "education")',
              },
              value: {
                type: 'string',
                description: 'The value to set for the field',
              },
              confidence: {
                type: 'number',
                description: 'Confidence score between 0 and 1',
                minimum: 0,
                maximum: 1,
              },
            },
            required: ['field', 'value'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_jobs',
          description: 'Search for jobs based on user profile and preferences',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Job search query or keywords',
              },
              location: {
                type: 'string',
                description: 'Job location or "remote"',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return',
                default: 10,
              },
            },
            required: ['query'],
          },
        },
      },
    ]

    // Call OpenAI with streaming
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
      stream: true,
      temperature: 0.7,
      max_tokens: 1500,
    })

    let assistantMessage = ''
    const toolCalls: Array<{
      id: string
      name: string
      arguments: string
    }> = []

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
          if (!toolCalls[toolCall.index]) {
            toolCalls[toolCall.index] = {
              id: toolCall.id || '',
              name: toolCall.function?.name || '',
              arguments: '',
            }
          }
          if (toolCall.function?.arguments) {
            toolCalls[toolCall.index].arguments += toolCall.function.arguments
          }
        }
      }

      // Check for finish reason
      if (chunk.choices[0]?.finish_reason === 'tool_calls') {
        // Execute tool calls (Phase 4 implementation)
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
            continue
          }

          await writer.write(
            sendTool({
              name: toolCall.name,
              status: 'pending',
              input: parsedInput,
            })
          )

          // TODO: Execute actual tool in Phase 4
          await writer.write(
            sendTool({
              name: toolCall.name,
              status: 'success',
              input: parsedInput,
              output: { message: 'Tool execution not yet implemented' },
            })
          )
        }
      }
    }

    // Stream complete
    await writer.write(sendDone())
    await writer.close()
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
