'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import {
  CheckCircle,
  Circle,
  ExternalLink,
  RefreshCw,
  Lightbulb,
  Target,
  Users,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'

interface Recommendation {
  id: string | number
  text: string
  type: string
  completed: boolean
  completedAt: string | null
  relatedEntityId: string | number | null
  relatedEntityType: string | null
  createdAt: string
}

export function TodaysRecommendations() {
  const { toast } = useToast()
  const [showAll, setShowAll] = useState(false)

  const {
    data: recommendations = [],
    isLoading,
    error,
    refetch
  } = useQuery<Recommendation[]>({
    queryKey: ['/api/recommendations/daily'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/recommendations/daily')
        if (!response.ok) throw new Error('Failed to fetch recommendations')
        return await response.json()
      } catch (error) {
        console.error('Error fetching recommendations:', error)
        return []
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Ensure recommendations is an array and sort by completion status
  const recommendationsArray = Array.isArray(recommendations) ? recommendations : []
  const sortedRecommendations = [...recommendationsArray].sort((a, b) => {
    return a.completed === b.completed
      ? a.type.localeCompare(b.type)
      : a.completed ? 1 : -1
  })

  // Show only first incomplete recommendation by default, or all if showAll is true
  const displayedRecommendations = showAll
    ? sortedRecommendations
    : sortedRecommendations.slice(0, 1)

  // Function to determine correct link for recommendation type
  const getRecommendationLink = (recommendation: Recommendation): string | null => {
    if (!recommendation.relatedEntityId || !recommendation.relatedEntityType) {
      return null
    }

    switch (recommendation.relatedEntityType) {
      case 'resume':
        return `/resumes/${recommendation.relatedEntityId}`
      case 'job_application':
        return `/applications/${recommendation.relatedEntityId}`
      case 'contact':
        return `/contacts/${recommendation.relatedEntityId}`
      case 'followup_action':
        return `/applications`
      case 'interview_stage':
        return `/interviews`
      case 'goal':
        return `/goals/${recommendation.relatedEntityId}`
      default:
        return null
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'resume':
        return <FileText className="h-3 w-3" />
      case 'networking':
      case 'contact':
        return <Users className="h-3 w-3" />
      case 'goal':
        return <Target className="h-3 w-3" />
      case 'application':
      case 'interview':
        return <CheckCircle className="h-3 w-3" />
      default:
        return <Lightbulb className="h-3 w-3" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'resume':
        return 'Resume'
      case 'networking':
      case 'contact':
        return 'Networking'
      case 'goal':
        return 'Goal'
      case 'application':
        return 'Application'
      case 'interview':
        return 'Interview'
      default:
        return 'General'
    }
  }

  const handleRefresh = async () => {
    try {
      await refetch()
      toast({
        title: 'Recommendations refreshed',
        description: 'New AI-powered recommendations have been generated.'
      })
    } catch (error) {
      toast({
        title: 'Failed to refresh recommendations',
        description: 'Please try again later.',
        variant: 'destructive'
      })
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
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Today's Recommendations
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              AI-powered suggestions for your career
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start p-3 bg-background rounded-lg border">
                  <div className="h-4 w-4 bg-muted rounded-full animate-pulse mr-3 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-5 text-center">
              <p className="text-red-500 mb-2">Failed to load recommendations</p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : sortedRecommendations.length === 0 ? (
            <div className="text-center p-6 border border-dashed rounded-lg flex flex-col items-center">
              <Lightbulb className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-2">No recommendations for today</p>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Generate Recommendations
              </Button>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {displayedRecommendations.map((recommendation) => {
                  const link = getRecommendationLink(recommendation)

                  return (
                    <li
                      key={recommendation.id}
                      className={`flex items-start p-3 rounded-lg border transition-all duration-300 ${
                        recommendation.completed
                          ? 'bg-green-50/50 text-muted-foreground border-border/50'
                          : 'bg-background border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="mt-0.5 mr-3 flex-shrink-0">
                        <div className="h-4 w-4 bg-muted rounded-full flex items-center justify-center">
                          {getTypeIcon(recommendation.type)}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-start">
                          <span
                            className={`text-sm ${recommendation.completed ? 'line-through' : ''}`}
                          >
                            {recommendation.text}
                          </span>

                          {link && !recommendation.completed && (
                            <Link href={link} className="ml-2 inline-flex">
                              <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1" title="Go to related item">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            {getTypeLabel(recommendation.type)}
                          </span>

                          {recommendation.completed && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {sortedRecommendations.length > 1 && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs"
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show All ({sortedRecommendations.length})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
