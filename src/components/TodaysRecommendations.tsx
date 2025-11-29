'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [localRecommendations, setLocalRecommendations] = useState<Recommendation[]>([])
  const removalTimeouts = useRef<Map<string | number, ReturnType<typeof setTimeout>>>(new Map())

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

  const recommendationsArray = useMemo(
    () => (Array.isArray(recommendations) ? recommendations : []),
    [recommendations]
  )

  // Sync local state when server data changes (compare hash to catch content updates)
  const prevRecommendationsHash = useRef<string>('')
  useEffect(() => {
    const newHash = JSON.stringify(
      recommendationsArray.map(r => ({
        id: r.id,
        text: r.text,
        type: r.type,
        completed: r.completed,
        completedAt: r.completedAt,
        relatedEntityId: r.relatedEntityId,
        relatedEntityType: r.relatedEntityType,
      }))
    )
    if (newHash !== prevRecommendationsHash.current) {
      prevRecommendationsHash.current = newHash
      removalTimeouts.current.forEach(timeout => clearTimeout(timeout))
      removalTimeouts.current.clear()
      setLocalRecommendations(recommendationsArray.map(rec => ({ ...rec })))
    }
  }, [recommendationsArray])

  useEffect(() => () => {
    removalTimeouts.current.forEach(timeout => clearTimeout(timeout))
    removalTimeouts.current.clear()
  }, [])

  const sortedRecommendations = useMemo(() => {
    return [...localRecommendations].sort((a, b) => {
      return a.completed === b.completed
        ? a.type.localeCompare(b.type)
        : a.completed
        ? 1
        : -1
    })
  }, [localRecommendations])

  // Show only first incomplete recommendation by default, or all if showAll is true
  // Include completed items temporarily so animation can play
  const displayedRecommendations = useMemo(() => {
    if (showAll) return sortedRecommendations

    // Find first incomplete recommendation and any recently completed ones
    const incomplete = sortedRecommendations.filter(r => !r.completed)
    const completed = sortedRecommendations.filter(r => r.completed)

    // Show first incomplete + any completed (they'll auto-remove after animation)
    return [...completed, ...incomplete.slice(0, 1)]
  }, [sortedRecommendations, showAll])

  useEffect(() => {
    if (showAll && sortedRecommendations.length <= 1) {
      setShowAll(false)
    }
  }, [showAll, sortedRecommendations.length])

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

  const getTypePillIcon = (type: string) => {
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

  const handleRefresh = async () => {
    try {
      const result = await refetch()
      const newRecommendations = result.data || []

      toast({
        title: 'Recommendations refreshed',
        description: newRecommendations.length > 0
          ? `Found ${newRecommendations.length} recommendation${newRecommendations.length !== 1 ? 's' : ''} based on your current activity.`
          : 'No new recommendations at this time. Keep making progress on your goals!'
      })
    } catch (error) {
      toast({
        title: 'Failed to refresh recommendations',
        description: 'Please try again later.',
        variant: 'destructive'
      })
    }
  }

  const markCompleted = (recommendationId: Recommendation['id']) => {
    // Check if already completed to avoid duplicate clicks
    const alreadyCompleted = localRecommendations.find(
      rec => rec.id === recommendationId
    )?.completed

    if (alreadyCompleted) return

    setLocalRecommendations(prev => {
      return prev.map(rec => {
        if (rec.id !== recommendationId) return rec
        return {
          ...rec,
          completed: true,
          completedAt: new Date().toISOString()
        }
      })
    })

    // Schedule removal after green animation is visible
    const existingTimeout = removalTimeouts.current.get(recommendationId)
    if (existingTimeout) clearTimeout(existingTimeout)

    const timeout = setTimeout(() => {
      setLocalRecommendations(prev => prev.filter(rec => rec.id !== recommendationId))
      removalTimeouts.current.delete(recommendationId)
    }, 600)

    removalTimeouts.current.set(recommendationId, timeout)
  }

  return (
    <section className="h-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-[0_6px_18px_rgba(0,0,0,0.05)] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Lightbulb className="h-4 w-4 text-[#F59E0B]" />
              Today's Recommendations
            </h3>
            <p className="text-xs text-slate-500">
              AI-powered suggestions for your career
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 rounded-xl px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="border-t border-slate-100" />

        <div className="flex-1 px-5 pb-4 pt-3 text-sm text-slate-700">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start rounded-xl border border-slate-100 bg-white p-3">
                    <div className="mr-3 flex h-4 w-4 flex-shrink-0 rounded-full bg-slate-100 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded bg-slate-100 animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-4 w-16 rounded bg-slate-100 animate-pulse" />
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
              <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 p-6 text-slate-600">
                <Lightbulb className="mb-4 h-12 w-12 text-slate-400" />
                <p className="mb-2 text-slate-600">No recommendations for today</p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Generate Recommendations
                </Button>
              </div>
            ) : (
            <>
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {displayedRecommendations.map((recommendation) => {
                    const link = getRecommendationLink(recommendation)

                    return (
                      <motion.li
                        key={recommendation.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, borderWidth: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => markCompleted(recommendation.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            markCompleted(recommendation.id)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={recommendation.completed}
                        className={`flex items-start rounded-xl border cursor-pointer px-3 py-3 transition-all duration-300 focus:outline-none ${
                          recommendation.completed
                            ? 'border-green-200 bg-green-50 text-slate-600'
                            : 'border-slate-200 bg-white hover:border-[#5371FF]/50 focus:ring-2 focus:ring-[#5371FF]/40'
                        }`}
                      >
                        <div
                          className="mt-0.5 flex-shrink-0"
                          aria-label={`Recommendation ${recommendation.completed ? 'complete' : 'incomplete'}`}
                        >
                          {recommendation.completed ? (
                            <CheckCircle className="h-4 w-4 text-[#16A34A]" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-start">
                            <span
                              className={`text-sm ${recommendation.completed ? 'line-through' : ''}`}
                            >
                              {recommendation.text}
                            </span>

                            {link && !recommendation.completed && (
                              <Link
                                href={link}
                                className="ml-2 inline-flex"
                                onClick={(event) => event.stopPropagation()}
                                onKeyDown={(event) => event.stopPropagation()}
                              >
                                <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1" title="Go to related item">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                              {getTypePillIcon(recommendation.type)}
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
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
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
        </div>
    </section>
  )
}
