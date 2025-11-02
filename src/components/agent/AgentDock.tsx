'use client'

import React, { useState } from 'react'
import { X, Bot, Send, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAgent } from '@/contexts/AgentContext'
import { ChatStream } from './ChatStream'
import { ApproveModal } from './ApproveModal'
import { motion, AnimatePresence } from 'framer-motion'

export function AgentDock() {
  const { state, openAgent, closeAgent, sendMessage, clearMessages, approveRequest, denyRequest } = useAgent()
  const [inputValue, setInputValue] = useState('')

  const handleSend = async () => {
    if (!inputValue.trim() || state.isStreaming) return

    // Clear input optimistically for better UX
    const messageToSend = inputValue
    setInputValue('')

    try {
      await sendMessage(messageToSend)
    } catch (error) {
      // If sendMessage fails unexpectedly, restore the input
      console.error('Failed to send message:', error)
      setInputValue(messageToSend)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!state.isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button
                onClick={() => openAgent()}
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90 relative"
                aria-label="Open AI Agent"
              >
                <Bot className="h-6 w-6" />
                {/* Pulse animation for attention */}
                <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-out panel */}
      <AnimatePresence>
        {state.isOpen && (
          <>
            {/* Backdrop overlay for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAgent}
              className="fixed inset-0 bg-black/30 z-40 md:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                opacity: { duration: 0.2 },
              }}
              className="fixed top-0 right-0 h-full w-full md:w-[440px] bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center justify-between p-4 border-b bg-primary text-white"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  >
                    <Bot className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <h2 className="font-semibold text-lg">AI Agent</h2>
                    <p className="text-xs opacity-90">Your Career Assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {state.messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearMessages}
                      className="text-white hover:bg-white/20"
                      title="Clear conversation"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeAgent}
                    className="text-white hover:bg-white/20"
                    aria-label="Close Agent"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </motion.div>

              {/* Context indicator */}
              {state.context && (
                <div className="px-4 py-2 bg-blue-50 border-b text-xs text-blue-900">
                  <span className="font-medium">Context:</span>{' '}
                  {state.context.source}
                  {state.context.action && ` → ${state.context.action}`}
                </div>
              )}

              {/* Chat area */}
              <ChatStream messages={state.messages} isStreaming={state.isStreaming} />

              {/* Input area */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about your career..."
                    className="resize-none min-h-[60px] max-h-[120px]"
                    disabled={state.isStreaming}
                  />
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || state.isStreaming}
                      size="icon"
                      className="h-[60px] w-[60px] flex-shrink-0"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Approval modal */}
      <ApproveModal
        isOpen={!!state.pendingApproval}
        request={state.pendingApproval}
        onApprove={approveRequest}
        onDeny={denyRequest}
      />
    </>
  )
}
