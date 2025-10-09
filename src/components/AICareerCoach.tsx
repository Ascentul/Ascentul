'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Bot,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Send
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface Conversation {
  id: string | number
  title: string
  createdAt: string
  messageCount?: number
}

export function AICareerCoach() {
  const { toast } = useToast()
  const router = useRouter()
  const [quickQuestion, setQuickQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/career-coach/conversations'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/career-coach/conversations')
        return await res.json()
      } catch (error) {
        console.error('Error fetching conversations:', error)
        return []
      }
    }
  })

  // Ensure conversations is an array and get the most recent conversation
  const conversationsArray = Array.isArray(conversations) ? conversations : []
  const recentConversation = conversationsArray[0]

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest('POST', '/api/career-coach/conversations', { title })
      return await response.json()
    },
    onSuccess: async (newConversation) => {
      // Send the initial message to the new conversation
      try {
        await apiRequest('POST', `/api/career-coach/conversations/${newConversation.id}/messages`, {
          content: quickQuestion.trim()
        })

        // Redirect to the AI coach page with the new conversation
        router.push('/career-coach')
        setQuickQuestion('')
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive'
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to create conversation. Please try again.',
        variant: 'destructive'
      })
    }
  })

  const handleQuickQuestion = async () => {
    if (!quickQuestion.trim()) return

    setIsSubmitting(true)
    try {
      // Create a new conversation with the question as the title (truncated)
      const title = quickQuestion.trim().slice(0, 50) + (quickQuestion.trim().length > 50 ? '...' : '')
      await createConversationMutation.mutateAsync(title)
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuickQuestion()
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
      }}
      className="mb-6"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              AI Career Coach
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Get personalized career advice
            </p>
          </div>
          <Link href="/career-coach">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Coach
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Question Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ask a quick question</label>
            <div className="flex gap-2">
              <Textarea
                placeholder="What's your career question?"
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                className="resize-none"
                rows={2}
              />
              <Button
                onClick={handleQuickQuestion}
                disabled={!quickQuestion.trim() || isSubmitting}
                className="self-end"
                aria-label={isSubmitting ? "Sending" : "Send"}
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Recent Conversations */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentConversation ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {recentConversation.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(recentConversation.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  {recentConversation.messageCount || 0} messages
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start chatting with your AI career coach</p>
              <Link href="/career-coach">
                <Button variant="link" className="mt-2 text-sm">
                  Start Conversation
                </Button>
              </Link>
            </div>
          )}

          {/* Quick Tips */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Quick Tips</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Ask about interview preparation</p>
              <p>• Get resume feedback</p>
              <p>• Explore career paths</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
