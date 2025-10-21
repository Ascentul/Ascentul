/**
 * Phase 7 - Part A: Client-side Streaming Hook
 * React hook for consuming streaming AI suggestions
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  processStreamChunks,
  type AISuggestion,
  type StreamState,
  type StreamStatus,
  type StreamSuggestionsRequest,
} from '@/lib/ai/streaming';
import { logEvent } from '@/lib/telemetry';

export type UseAIStreamingOptions = {
  /** Called when a new suggestion arrives */
  onSuggestion?: (suggestion: AISuggestion) => void;

  /** Called when streaming completes successfully */
  onComplete?: (suggestions: AISuggestion[]) => void;

  /** Called when an error occurs */
  onError?: (error: Error) => void;
} & (
  | { autoStart?: false; request?: StreamSuggestionsRequest }
  | { autoStart: true; request: StreamSuggestionsRequest }
);

export interface UseAIStreamingReturn {
  /** Current streaming state */
  status: StreamStatus;

  /** Start streaming with given parameters */
  start: (request: StreamSuggestionsRequest) => Promise<void>;

  /** Cancel active stream */
  cancel: () => void;

  /** Clear collected suggestions and reset state */
  reset: () => void;

  /** Whether streaming is currently active */
  isStreaming: boolean;
}

/**
 * Hook for streaming AI suggestions
 *
 * @example
 * ```tsx
 * const { status, start, cancel, isStreaming } = useAIStreaming({
 *   onSuggestion: (suggestion) => console.log('New suggestion:', suggestion),
 *   onComplete: (all) => console.log('Done! Total:', all.length),
 * });
 * ```
 */
export function useAIStreaming(options: UseAIStreamingOptions = {}): UseAIStreamingReturn {
  const {
    onSuggestion,
    onComplete,
    onError,
    autoStart = false,
    request: initialRequest,
  } = options;

  const [status, setStatus] = useState<StreamStatus>({
    state: 'idle',
    suggestions: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);

  // Stable callbacks
  const onSuggestionRef = useRef(onSuggestion);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuggestionRef.current = onSuggestion;
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onSuggestion, onComplete, onError]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Check if cancelled within 200ms - if so, full rollback
    const elapsed = Date.now() - startTimeRef.current;
    logEvent('ai_stream_cancelled', {
      elapsed_ms: elapsed,
      full_rollback: elapsed < 200,
    });

    if (elapsed < 200) {
      console.log('[useAIStreaming] Cancelled within 200ms - full rollback');
      setStatus({
        state: 'idle',
        suggestions: [],
      });
    } else {
      // Partial cancel - keep suggestions received so far
      setStatus((prev) => ({
        ...prev,
        state: 'idle',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    setStatus({
      state: 'idle',
      suggestions: [],
    });
  }, [cancel]);

  const start = useCallback(async (request: StreamSuggestionsRequest) => {
    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset state
    startTimeRef.current = Date.now();
    logEvent('ai_stream_started', {
      resume_id: request.resumeId,
      block_count: request.blockIds?.length,
      has_target_role: !!request.targetRole,
    });

    setStatus({
      state: 'connecting',
      suggestions: [],
    });

    // Create abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Make fetch request
      const response = await fetch('/api/ai/stream-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Update to streaming state
      setStatus((prev) => ({
        ...prev,
        state: 'streaming',
      }));

      // Process stream chunks
      await processStreamChunks(
        response.body,
        (chunk) => {
          if (abortController.signal.aborted) {
            return;
          }

          switch (chunk.type) {
            case 'metadata':
              setStatus((prev) => ({
                ...prev,
                metadata: chunk.data,
              }));
              break;

            case 'suggestion':
              setStatus((prev) => {
                const updated = {
                  ...prev,
                  suggestions: [...prev.suggestions, chunk.data],
                };
                return updated;
              });
              logEvent('ai_stream_suggestion_received', {
                suggestion_id: chunk.data.id,
                action_type: chunk.data.actionType,
                severity: chunk.data.severity,
              });
              onSuggestionRef.current?.(chunk.data);
              break;

            case 'error':
              const error = new Error(chunk.data.message);
              logEvent('ai_stream_failed', {
                error_code: chunk.data.code,
                error_message: chunk.data.message,
              });
              setStatus((prev) => ({
                ...prev,
                state: 'error',
                error: chunk.data.message,
              }));
              onErrorRef.current?.(error);
              break;

            case 'done':
              logEvent('ai_stream_completed', {
                total_suggestions: chunk.data.totalSuggestions,
                duration_ms: chunk.data.durationMs,
              });
              setStatus((prev) => {
                const final = {
                  ...prev,
                  state: 'done' as StreamState,
                };
                onCompleteRef.current?.(final.suggestions);
                return final;
              });
              break;
          }
        },
        (error) => {
          if (abortController.signal.aborted) {
            // User cancelled - already handled
            return;
          }

          console.error('[useAIStreaming] Stream error:', error);
          setStatus((prev) => ({
            ...prev,
            state: 'error',
            error: error.message,
          }));
          onErrorRef.current?.(error);
        }
      );
    } catch (error) {
      if (abortController.signal.aborted) {
        // User cancelled - state already updated in cancel()
        return;
      }

      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[useAIStreaming] Request error:', err);

      setStatus({
        state: 'error',
        suggestions: [],
        error: err.message,
      });

      onErrorRef.current?.(err);
    } finally {
      // Clear abort controller if it's still the current one
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && initialRequest) {
      start(initialRequest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const isStreaming = status.state === 'connecting' || status.state === 'streaming';

  return {
    status,
    start,
    cancel,
    reset,
    isStreaming,
  };
}
