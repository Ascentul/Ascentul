/**
 * Phase 7 - Part A: Streaming Utilities
 * Helper functions for parsing and handling streaming responses
 */

import type { StreamChunk } from './types';

/**
 * Parse a Server-Sent Events (SSE) data line into a StreamChunk
 * Expected format: "data: {json}\n\n"
 */
export function parseStreamChunk(line: string): StreamChunk | null {
  // Remove "data: " prefix if present
  const dataPrefix = 'data: ';
  if (!line.startsWith(dataPrefix)) {
    return null;
  }

  const jsonStr = line.slice(dataPrefix.length).trim();

  // Skip empty lines or SSE keep-alive comments
  if (!jsonStr || jsonStr.startsWith(':')) {
    return null;
  }

  try {
    const chunk = JSON.parse(jsonStr) as StreamChunk;
    return chunk;
  } catch (error) {
    console.error('[parseStreamChunk] Failed to parse JSON:', error, 'Line:', jsonStr);
    return null;
  }
}

/**
 * Read a ReadableStream and invoke callback for each parsed chunk
 * Handles incremental text parsing for SSE format
 */
export async function processStreamChunks(
  stream: ReadableStream<Uint8Array>,
  onChunk: (chunk: StreamChunk) => void,
  onError?: (error: Error) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Split by double newline (SSE message separator)
      const lines = buffer.split('\n\n');

      // Keep the last incomplete line in buffer
      buffer = lines.pop() || '';

      // Process complete lines
      for (const line of lines) {
        if (line.trim()) {
          const chunk = parseStreamChunk(line);
          if (chunk) {
            onChunk(chunk);
          }
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.trim()) {
      const chunk = parseStreamChunk(buffer);
      if (chunk) {
        onChunk(chunk);
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[processStreamChunks] Stream processing error:', err);
    onError?.(err);
  } finally {
    reader.releaseLock();
  }
}

/**
 * Format a StreamChunk as SSE data for server-side transmission
 * Format: "data: {json}\n\n"
 */
export function formatSSEChunk(chunk: StreamChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

/**
 * Create a ReadableStream that sends SSE-formatted chunks
 * Useful for API routes that want to stream responses
 */
export function createSSEStream(
  sendChunks: (send: (chunk: StreamChunk) => void) => Promise<void>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (chunk: StreamChunk) => {
        const formatted = formatSSEChunk(chunk);
        controller.enqueue(encoder.encode(formatted));
      };

      try {
        await sendChunks(send);
      } catch (error) {
        // Send error chunk
        const errorChunk: StreamChunk = {
          type: 'error',
          timestamp: Date.now(),
          data: {
            code: 'STREAM_ERROR',
            message: error instanceof Error ? error.message : String(error),
          },
        };
        send(errorChunk);
      } finally {
        controller.close();
      }
    },
  });
}

/**
 * Utility to measure duration and create metadata
 */
export function createDurationTracker() {
  const startTime = Date.now();
  return {
    getDuration: () => Date.now() - startTime,
  };
}
