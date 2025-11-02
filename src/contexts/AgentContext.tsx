'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react'
import { nanoid } from 'nanoid'
import type {
  AgentContextType,
  AgentState,
  AgentContext as AgentContextData,
  AgentMessage,
  SSEEvent,
} from '@/lib/agent/types'

// Maximum number of previous messages to include in API requests for context
const MAX_HISTORY_MESSAGES = 10

/**
 * Update or append a tool call to the existing array
 * Updates existing call if name matches, otherwise appends new call
 */
function updateOrAppendToolCall(
  existingCalls: AgentMessage['toolCalls'] = [],
  toolData: {
    name: string
    status?: 'pending' | 'running' | 'success' | 'error'
    input?: Record<string, unknown>
    output?: unknown
    error?: string
  }
) {
  const existingIndex = existingCalls.findIndex((tc) => tc.name === toolData.name)
  const newToolCall = {
    id: existingIndex >= 0 ? existingCalls[existingIndex].id : nanoid(),
    name: toolData.name,
    status: toolData.status || 'success',
    input: toolData.input,
    output: toolData.output,
    error: toolData.error,
  }

  if (existingIndex >= 0) {
    const updated = [...existingCalls]
    updated[existingIndex] = newToolCall
    return updated
  }
  return [...existingCalls, newToolCall]
}

/**
 * Process SSE stream from agent API
 * Handles delta, tool, and error events with callbacks
 */
async function processSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: {
    onDelta: (content: string) => void
    onTool: (toolData: {
      name: string
      status?: 'pending' | 'running' | 'success' | 'error'
      input?: Record<string, unknown>
      output?: unknown
      error?: string
    }) => void
    onError: (error: string) => void
  }
) {
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (!line.trim() || !line.startsWith('data: ')) continue

      const data = line.substring(6)
      if (data === '[DONE]') continue

      try {
        const event: SSEEvent = JSON.parse(data)

        if (event.type === 'delta') {
          callbacks.onDelta((event.data as string) || '')
        } else if (event.type === 'tool') {
          callbacks.onTool(event.data as {
            name: string
            status?: 'pending' | 'running' | 'success' | 'error'
            input?: Record<string, unknown>
            output?: unknown
            error?: string
          })
        } else if (event.type === 'error') {
          callbacks.onError(event.data as string)
        }
      } catch (e) {
        console.error('Failed to parse SSE event:', e)
      }
    }
  }
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const isStreamingRef = useRef(false)
  const approvalResolverRef = useRef<((approved: boolean) => void) | null>(null)
  const [state, setState] = useState<AgentState>({
    isOpen: false,
    context: null,
    messages: [],
    isStreaming: false,
    pendingApproval: null,
  })

  const openAgent = useCallback((context?: AgentContextData) => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      context: context || prev.context,
    }))
  }, [])

  const closeAgent = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }))
  }, [])

  const setContext = useCallback((context: AgentContextData) => {
    setState((prev) => ({
      ...prev,
      context,
    }))
  }, [])

  const clearMessages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
    }))
  }, [])

  const requestApproval = useCallback(
    (request: AgentState['pendingApproval']) => {
      return new Promise<boolean>((resolve) => {
        approvalResolverRef.current = resolve
        setState((prev) => ({
          ...prev,
          pendingApproval: request,
        }))
      })
    },
    []
  )

  const approveRequest = useCallback(() => {
    if (approvalResolverRef.current) {
      approvalResolverRef.current(true)
      approvalResolverRef.current = null
    }
    setState((prev) => ({
      ...prev,
      pendingApproval: null,
    }))
  }, [])

  const denyRequest = useCallback(() => {
    if (approvalResolverRef.current) {
      approvalResolverRef.current(false)
      approvalResolverRef.current = null
    }
    setState((prev) => ({
      ...prev,
      pendingApproval: null,
    }))
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    // Concurrency guard using ref
    if (isStreamingRef.current) {
      console.warn('[Agent] Message send already in progress')
      return
    }
    isStreamingRef.current = true

    // Capture context and history at the time of the call
    let capturedContext: AgentContextData | null = null
    let capturedHistory: AgentMessage[] = []

    // State capture and update
    setState((prev) => {
      capturedContext = prev.context
      capturedHistory = prev.messages.slice(-MAX_HISTORY_MESSAGES)

      // Add user message
      const userMessage: AgentMessage = {
        id: nanoid(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      }

      return {
        ...prev,
        messages: [...prev.messages, userMessage],
        isStreaming: true,
      }
    })

    // Prepare assistant message placeholder
    const assistantMessageId = nanoid()
    let assistantContent = ''
    const assistantMessage: AgentMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      toolCalls: [],
    }

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, assistantMessage],
    }))

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), 60000) // 60s timeout

    try {
      // Call streaming API endpoint
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
        body: JSON.stringify({
          message: content,
          context: capturedContext,
          history: capturedHistory,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Process SSE stream
      const reader = response.body?.getReader()

      if (!reader) {
        throw new Error('No response body')
      }

      await processSSEStream(reader, {
        onDelta: (content) => {
          assistantContent += content
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: assistantContent } : msg
            ),
          }))
        },
        onTool: (toolData) => {
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    toolCalls: updateOrAppendToolCall(msg.toolCalls, toolData),
                  }
                : msg
            ),
          }))

          // Broadcast data mutation events for cache invalidation
          if (toolData.status === 'success') {
            if (toolData.name === 'create_goal') {
              console.log('[AgentContext] Dispatching agent:goal:created event')
              window.dispatchEvent(new CustomEvent('agent:goal:created'))
            } else if (toolData.name === 'update_goal') {
              console.log('[AgentContext] Dispatching agent:goal:updated event')
              window.dispatchEvent(new CustomEvent('agent:goal:updated'))
            } else if (toolData.name === 'delete_goal') {
              console.log('[AgentContext] Dispatching agent:goal:deleted event')
              window.dispatchEvent(new CustomEvent('agent:goal:deleted'))
            } else if (toolData.name === 'create_application') {
              console.log('[AgentContext] Dispatching agent:application:created event')
              window.dispatchEvent(new CustomEvent('agent:application:created'))
            } else if (toolData.name === 'update_application') {
              console.log('[AgentContext] Dispatching agent:application:updated event')
              window.dispatchEvent(new CustomEvent('agent:application:updated'))
            } else if (toolData.name === 'delete_application') {
              console.log('[AgentContext] Dispatching agent:application:deleted event')
              window.dispatchEvent(new CustomEvent('agent:application:deleted'))
            } else if (toolData.name === 'save_job') {
              console.log('[AgentContext] Dispatching agent:job:saved event')
              window.dispatchEvent(new CustomEvent('agent:job:saved'))
            } else if (toolData.name === 'upsert_profile_field') {
              console.log('[AgentContext] Dispatching agent:profile:updated event')
              window.dispatchEvent(new CustomEvent('agent:profile:updated'))
            }
          }
        },
        onError: (error) => {
          assistantContent += `\n\n[Error: ${error}]`
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: assistantContent } : msg
            ),
          }))
        },
      })
    } catch (error) {
      console.error('Agent message error:', error)
      const isTimeout = error instanceof Error && error.name === 'AbortError'
      const errorMessage = isTimeout
        ? 'Request timed out after 60 seconds. Please try again.'
        : 'Sorry, I encountered an error. Please try again.'
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: errorMessage,
              }
            : msg
        ),
      }))
    } finally {
      clearTimeout(timeoutId)
      isStreamingRef.current = false
      setState((prev) => ({
        ...prev,
        isStreaming: false,
      }))
    }
  }, []) // No dependencies - state captured via functional updates

  const value = useMemo(
    () => ({
      state,
      openAgent,
      closeAgent,
      setContext,
      sendMessage,
      clearMessages,
      requestApproval,
      approveRequest,
      denyRequest,
    }),
    [state, openAgent, closeAgent, setContext, sendMessage, clearMessages, requestApproval, approveRequest, denyRequest]
  )

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
}

export function useAgent() {
  const context = useContext(AgentContext)
  if (context === undefined) {
    // During development or SSR, context might not be available yet
    // Return a safe default instead of throwing
    console.warn('[useAgent] Called outside of AgentProvider context')
    return {
      state: {
        isOpen: false,
        context: null,
        messages: [],
        isStreaming: false,
        pendingApproval: null,
      },
      openAgent: () => {},
      closeAgent: () => {},
      setContext: () => {},
      sendMessage: async () => {},
      clearMessages: () => {},
      requestApproval: async () => false,
      approveRequest: () => {},
      denyRequest: () => {},
    } as AgentContextType
  }
  return context
}
