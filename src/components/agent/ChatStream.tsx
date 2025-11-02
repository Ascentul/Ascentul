'use client'

import React, { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { User, Bot, AlertCircle, WifiOff, Clock, AlertTriangle } from 'lucide-react'
import { ToolStepCard } from './ToolStepCard'
import type { AgentMessage } from '@/lib/agent/types'

interface ChatStreamProps {
  messages: AgentMessage[]
  isStreaming: boolean
}

/**
 * Detect error type from message content
 *
 * Handles error markers like [Error: message] where message may contain brackets
 * Example: [Error: Failed to parse [data]] → extracts "Failed to parse [data]"
 *
 * Strategy: Find "[Error:" prefix, then extract everything up to the LAST "]"
 * This handles nested brackets correctly by using greedy matching.
 */
function detectErrorType(content: string): {
  isError: boolean
  type: 'timeout' | 'network' | 'rate_limit' | 'generic' | null
  message: string
} {
  const lowerContent = content.toLowerCase()

  if (lowerContent.includes('[error:')) {
    // Match "[Error:" followed by everything (greedy) up to the last "]"
    // The greedy .+ will consume all characters including brackets
    const errorMatch = content.match(/\[Error:\s*(.+)\]/i)
    const message = errorMatch ? errorMatch[1].trim() : content

    if (lowerContent.includes('timeout') || lowerContent.includes('timed out')) {
      return { isError: true, type: 'timeout', message }
    }
    if (lowerContent.includes('network') || lowerContent.includes('connection')) {
      return { isError: true, type: 'network', message }
    }
    if (lowerContent.includes('rate limit')) {
      return { isError: true, type: 'rate_limit', message }
    }
    return { isError: true, type: 'generic', message }
  }

  return { isError: false, type: null, message: content }
}

/**
 * Error configuration for different error types
 */
const ERROR_CONFIG = {
  timeout: {
    icon: Clock,
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-900',
    iconColor: 'text-orange-600',
  },
  network: {
    icon: WifiOff,
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-900',
    iconColor: 'text-red-600',
  },
  rate_limit: {
    icon: AlertTriangle,
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-900',
    iconColor: 'text-yellow-600',
  },
  generic: {
    icon: AlertCircle,
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-900',
    iconColor: 'text-red-600',
  },
} as const

/**
 * Error type to human-readable title mapping
 */
const ERROR_TITLES = {
  timeout: 'Request Timeout',
  network: 'Connection Error',
  rate_limit: 'Rate Limit Exceeded',
  generic: 'Error',
} as const

/**
 * Assistant message card component
 * Renders either an error message or normal assistant response
 */
function AssistantMessageCard({ content }: { content: string }) {
  const errorInfo = detectErrorType(content)

  if (errorInfo.isError) {
    const config = ERROR_CONFIG[errorInfo.type || 'generic']
    const ErrorIcon = config.icon
    const title = ERROR_TITLES[errorInfo.type || 'generic']

    return (
      <Card className={`${config.bgColor} border ${config.borderColor} p-3 rounded-2xl`}>
        <div className="flex items-start gap-2">
          <ErrorIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${config.textColor}`}>{title}</p>
            <p className={`text-sm mt-1 ${config.textColor} opacity-90`}>
              {errorInfo.message}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-50 p-3 rounded-2xl">
      <p className="text-sm whitespace-pre-wrap text-gray-900">{content}</p>
    </Card>
  )
}

export function ChatStream({ messages, isStreaming }: ChatStreamProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Only auto-scroll if user is near bottom (within 100px)
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isStreaming])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <Bot className="h-12 w-12 mx-auto mb-4 text-primary opacity-50" />
          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            Hey! I'm your AI Career Assistant
          </h3>
          <p className="text-sm text-gray-500">
            Ask me to update your profile, find jobs, plan follow-ups, or help with
            applications. I can read and write your career data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      role="log"
      aria-label="Chat messages"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
          role="article"
          aria-label={`${message.role === 'user' ? 'Your' : 'Assistant'} message`}
        >
          {message.role === 'assistant' && (
            <Avatar
              className="h-8 w-8 bg-primary flex items-center justify-center flex-shrink-0"
              aria-label="AI Assistant"
            >
              <Bot className="h-5 w-5 text-white" />
            </Avatar>
          )}

          <div
            className={`flex-1 max-w-[85%] ${
              message.role === 'user' ? 'flex justify-end' : ''
            }`}
          >
            {message.role === 'user' ? (
              <Card className="bg-primary text-white p-3 rounded-2xl">
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </Card>
            ) : (
              <div className="space-y-2">
                <AssistantMessageCard content={message.content} />

                {/* Render tool calls if present */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {message.toolCalls.map((toolCall) => (
                      <ToolStepCard key={toolCall.id} toolCall={toolCall} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {message.role === 'user' && (
            <Avatar
              className="h-8 w-8 bg-gray-300 flex items-center justify-center flex-shrink-0"
              aria-label="You"
            >
              <User className="h-5 w-5 text-gray-700" />
            </Avatar>
          )}
        </div>
      ))}

      {/* Typing indicator */}
      {isStreaming && (
        <div className="flex gap-3 justify-start" role="status" aria-label="Assistant is typing">
          <Avatar
            className="h-8 w-8 bg-primary flex items-center justify-center flex-shrink-0"
            aria-label="AI Assistant"
          >
            <Bot className="h-5 w-5 text-white" />
          </Avatar>
          <Card className="bg-gray-50 p-3 rounded-2xl">
            <div className="flex gap-1" aria-hidden="true">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </Card>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
