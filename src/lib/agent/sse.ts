/**
 * Server-Sent Events (SSE) utilities for streaming responses
 */

import type { SSEEvent } from './types'

/**
 * Encode an SSE event for transmission
 */
export function encodeSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

/**
 * Send a delta (streaming text chunk) event
 */
export function sendDelta(text: string): string {
  return encodeSSE({ type: 'delta', data: text })
}

/**
 * Send a tool execution event
 */
export function sendTool(toolData: {
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  input?: Record<string, unknown>
  output?: unknown
  error?: string
}): string {
  return encodeSSE({ type: 'tool', data: toolData })
}

/**
 * Send an error event
 */
export function sendError(message: string): string {
  return encodeSSE({ type: 'error', data: message })
}

/**
 * Send a done event to signal stream completion
 */
export function sendDone(): string {
  return 'data: [DONE]\n\n'
}

/**
 * Create a streaming response with SSE headers
 */
export function createSSEResponse(): Response {
  const stream = new TransformStream()
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

/**
 * Create a WritableStreamDefaultWriter for SSE events
 */
export function createSSEWriter(stream: TransformStream) {
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  return {
    write: (data: string) => writer.write(encoder.encode(data)),
    close: () => writer.close(),
  }
}
