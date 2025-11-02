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

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const isStreamingRef = useRef(false)
  const [state, setState] = useState<AgentState>({
    isOpen: false,
    context: null,
    messages: [],
    isStreaming: false,
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
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

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
              assistantContent += (event.data as string) || ''
              setState((prev) => ({
                ...prev,
                messages: prev.messages.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent }
                    : msg
                ),
              }))
            } else if (event.type === 'tool') {
              const toolData = event.data as {
                name: string
                status?: 'pending' | 'running' | 'success' | 'error'
                input?: Record<string, unknown>
                output?: unknown
                error?: string
              }
              setState((prev) => ({
                ...prev,
                messages: prev.messages.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        toolCalls: (() => {
                          const existing = (msg.toolCalls || []).findIndex(
                            (tc) => tc.name === toolData.name
                          )
                          const newToolCall = {
                            id: existing >= 0 ? msg.toolCalls![existing].id : nanoid(),
                            name: toolData.name,
                            status: toolData.status || 'success',
                            input: toolData.input,
                            output: toolData.output,
                            error: toolData.error,
                          }
                          if (existing >= 0) {
                            const updated = [...(msg.toolCalls || [])]
                            updated[existing] = newToolCall
                            return updated
                          }
                          return [...(msg.toolCalls || []), newToolCall]
                        })(),
                      }
                    : msg
                ),
              }))
            } else if (event.type === 'error') {
              assistantContent += `\n\n[Error: ${event.data}]`
              setState((prev) => ({
                ...prev,
                messages: prev.messages.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent }
                    : msg
                ),
              }))
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e)
          }
        }
      }
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
    }),
    [state, openAgent, closeAgent, setContext, sendMessage, clearMessages]
  )

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
}

export function useAgent() {
  const context = useContext(AgentContext)
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider')
  }
  return context
}
