'use client'

import React, { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { User, Bot } from 'lucide-react'
import { ToolStepCard } from './ToolStepCard'
import type { AgentMessage } from '@/lib/agent/types'

interface ChatStreamProps {
  messages: AgentMessage[]
  isStreaming: boolean
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
                <Card className="bg-gray-50 p-3 rounded-2xl">
                  <p className="text-sm whitespace-pre-wrap text-gray-900">
                    {message.content}
                  </p>
                </Card>

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
