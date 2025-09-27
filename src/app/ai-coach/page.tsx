'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Bot,
  Send,
  Plus,
  MessageSquare,
  User,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'

interface Conversation {
  id: string | number
  title: string
  createdAt: string
  userId: string
}

interface Message {
  id: string | number
  conversationId: string | number
  isUser: boolean
  message: string
  timestamp: string
}

export default function AICoachPage() {
  const { user: clerkUser, isLoaded } = useUser()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [selectedConversationId, setSelectedConversationId] = useState<string | number | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/ai-coach/conversations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/ai-coach/conversations')
      return await response.json()
    },
    enabled: !!user?.clerkId
  })

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/ai-coach/messages', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return []
      const response = await apiRequest('GET', `/api/ai-coach/conversations/${selectedConversationId}/messages`)
      return await response.json()
    },
    enabled: !!selectedConversationId && !!user?.clerkId
  })

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest('POST', '/api/ai-coach/conversations', { title })
      return await response.json()
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-coach/conversations'] })
      setSelectedConversationId(newConversation.id)
      toast({
        title: 'New conversation created',
        description: 'Start chatting with your AI career coach!'
      })
    }
  })

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string | number; content: string }) => {
      const response = await apiRequest('POST', `/api/ai-coach/conversations/${data.conversationId}/messages`, {
        content: data.content
      })
      const result = await response.json()
      console.log('API Response:', result) // Debug log
      return result
    },
    onSuccess: (newMessages) => {
      console.log('Mutation Success - newMessages:', newMessages) // Debug log
      if (Array.isArray(newMessages)) {
        queryClient.invalidateQueries({ queryKey: ['/api/ai-coach/messages', selectedConversationId] })
        queryClient.invalidateQueries({ queryKey: ['/api/ai-coach/conversations'] })
      } else {
        console.error('Expected array but got:', newMessages)
        toast({
          title: 'Error',
          description: 'Unexpected response format from server',
          variant: 'destructive'
        })
      }
    },
    onError: (error: any) => {
      console.error('Mutation Error:', error) // Debug log
      toast({
        title: 'Failed to send message',
        description: error.message || 'Please try again',
        variant: 'destructive'
      })
    }
  })

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversationId) return

    setIsLoading(true)
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversationId,
        content: message.trim()
      })
      setMessage('')
    } catch (error) {
      // Error is already handled by mutation onError
      console.log('Message send error handled by mutation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateConversation = () => {
    createConversationMutation.mutate('New Conversation')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isLoaded || !clerkUser || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect university admins to the University dashboard
  if (user.role === 'university_admin') {
    router.replace('/university')
    return null
  }

  return (
    <div className="container mx-auto p-6 h-screen flex gap-6">
      {/* Conversations sidebar */}
      <div className="w-80 border-r">
        <div className="p-4 border-b">
          <Button
            onClick={handleCreateConversation}
            className="w-full"
            disabled={createConversationMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        </div>

        <div className="h-[calc(100vh-140px)] overflow-y-auto">
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Create one to start chatting</p>
              </div>
            ) : (
              conversations.map((conversation: Conversation) => (
                <Card
                  key={conversation.id}
                  className={`cursor-pointer mb-2 ${
                    selectedConversationId === conversation.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedConversationId(conversation.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conversation.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conversation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">AI Career Coach</h3>
                    <p>Start a conversation by typing your career question below</p>
                  </div>
                ) : (
                  messages.map((msg: Message) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!msg.isUser && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>

                      {msg.isUser && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}

                {(sendMessageMutation.isPending || isLoading) && (
                  <div className="flex justify-start gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask your AI career coach anything..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="resize-none"
                  rows={3}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="self-end"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose an existing conversation or create a new one to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}