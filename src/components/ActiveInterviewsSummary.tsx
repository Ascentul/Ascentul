'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Building,
  MapPin,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@clerk/nextjs'
import { useQuery as useConvexQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { format } from 'date-fns'

type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
type StageOutcome = 'pending' | 'scheduled' | 'passed' | 'failed'

interface ApplicationDoc {
  _id: string
  company: string
  job_title: string
  status: ApplicationStatus
  applied_at?: number
  created_at: number
  updated_at: number
}

interface InterviewStageDoc {
  _id: string
  application_id: string
  title: string
  scheduled_at?: number
  outcome: StageOutcome
  location?: string
  notes?: string
  created_at: number
  updated_at: number
}

type CombinedItem =
  | {
      id: string
      applicationId: string
      company: string
      position: string
      status: ApplicationStatus
      type: 'application'
      appliedAt?: number
      updatedAt?: number
    }
  | {
      id: string
      applicationId: string
      company: string
      position: string
      status: StageOutcome
      type: 'interview'
      scheduledAt?: number
      location?: string
      updatedAt?: number
      stageTitle?: string
    }

const badgeStyles = {
  application: {
    saved: { label: 'In Progress', className: 'bg-gray-100 text-gray-800' },
    applied: { label: 'Applied', className: 'bg-blue-100 text-blue-800' },
    interview: { label: 'Interviewing', className: 'bg-purple-100 text-purple-800' },
    offer: { label: 'Offer', className: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' }
  },
  interview: {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800' },
    passed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
    failed: { label: 'Canceled', className: 'bg-red-100 text-red-800' }
  }
} as const

export function ActiveInterviewsSummary() {
  const { user } = useUser()
  const clerkId = user?.id

  const applications = useConvexQuery(
    api.applications.getUserApplications,
    clerkId ? { clerkId } : 'skip'
  ) as ApplicationDoc[] | undefined

  const interviewStages = useConvexQuery(
    api.interviews.getUserInterviewStages,
    clerkId ? { clerkId } : 'skip'
  ) as InterviewStageDoc[] | undefined

  const isLoading = Boolean(clerkId) && (applications === undefined || interviewStages === undefined)

  // Memoize fallback arrays to prevent dependency changes on every render
  const applicationDocs = useMemo(() => applications ?? [], [applications])
  const stageDocs = useMemo(() => interviewStages ?? [], [interviewStages])

  const activeApplications = useMemo(
    () => applicationDocs.filter((app) => app.status !== 'offer' && app.status !== 'rejected'),
    [applicationDocs]
  )

  const stageItems = useMemo(() => {
    if (!stageDocs.length) return [] as CombinedItem[]

    const applicationMap = new Map(applicationDocs.map((app) => [app._id, app]))

    const items = stageDocs
      .filter((stage) => stage.outcome !== 'failed' && stage.outcome !== 'passed')
      .map((stage) => {
        const app = applicationMap.get(stage.application_id)
        return {
          id: stage._id,
          applicationId: stage.application_id,
          company: app?.company ?? 'Unknown Company',
          position: app?.job_title ?? stage.title,
          status: stage.outcome,
          type: 'interview' as const,
          scheduledAt: stage.scheduled_at,
          location: stage.location,
          updatedAt: stage.updated_at,
          stageTitle: stage.title
        }
      })

    return items.sort((a, b) => {
      const aHasDate = a.scheduledAt ? 0 : 1
      const bHasDate = b.scheduledAt ? 0 : 1
      if (aHasDate !== bHasDate) return aHasDate - bHasDate
      if (a.scheduledAt && b.scheduledAt) return a.scheduledAt - b.scheduledAt
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
    })
  }, [stageDocs, applicationDocs])

  const coveredApplicationIds = useMemo(
    () => new Set(stageItems.map((item) => item.applicationId)),
    [stageItems]
  )

  const applicationItems = useMemo(() => {
    const items = activeApplications
      .filter((app) => !coveredApplicationIds.has(app._id))
      .map((app) => ({
        id: app._id,
        applicationId: app._id,
        company: app.company,
        position: app.job_title,
        status: app.status,
        type: 'application' as const,
        appliedAt: app.applied_at ?? app.created_at,
        updatedAt: app.updated_at
      }))

    return items.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  }, [activeApplications, coveredApplicationIds])

  const combinedItems = useMemo(
    () => [...stageItems, ...applicationItems],
    [stageItems, applicationItems]
  )

  const upcomingCount = useMemo(
    () =>
      stageItems.filter(
        (item) => item.type === 'interview' && item.scheduledAt && item.scheduledAt > Date.now()
      ).length,
    [stageItems]
  )

  const totalCount = combinedItems.length
  const displayItems = combinedItems.slice(0, 3)
  const extraCount = Math.max(0, totalCount - displayItems.length)

  const renderDate = (item: CombinedItem) => {
    if (item.type === 'interview' && item.scheduledAt) {
      return (
        <>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(item.scheduledAt), 'MMM dd, yyyy')}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(item.scheduledAt), 'p')}
          </div>
        </>
      )
    }

    const timestamp = item.type === 'application' ? item.appliedAt ?? item.updatedAt : item.updatedAt

    if (!timestamp) return null

    return (
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {`Updated ${format(new Date(timestamp), 'MMM dd, yyyy')}`}
      </div>
    )
  }

  const renderLocation = (item: CombinedItem) => {
    if (item.type === 'interview' && item.location) {
      return (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {item.location}
        </div>
      )
    }
    return null
  }

  const getBadgeConfig = (item: CombinedItem) => {
    if (item.type === 'interview') {
      return badgeStyles.interview[item.status]
    }

    return badgeStyles.application[item.status]
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
      }}
      className="mb-6 h-full"
    >
      <Card
        className="h-full flex flex-col"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-medium">Active Interviews</CardTitle>
            <p className="text-sm text-muted-foreground">
              {upcomingCount} upcoming • {totalCount} active
            </p>
          </div>
          <Link href="/applications">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="flex-1">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                  <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No active interviews or applications</p>
              <p className="text-xs">Your upcoming interviews and applications will appear here</p>
              <Link href="/applications">
                <Button variant="link" className="mt-2 text-sm">
                  View Applications
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {displayItems.map((item) => {
                const badge = getBadgeConfig(item)
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border min-h-[90px]">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate flex-1 min-w-0">{item.position}</h3>
                          <Badge variant="outline" className={`text-xs flex-shrink-0 ${badge.className}`}>
                            {badge.label}
                          </Badge>
                        </div>

                        {item.type === 'interview' && item.stageTitle && (
                          <p className="text-xs text-muted-foreground mb-1">
                            Stage: {item.stageTitle}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {item.company}
                          </div>
                          {renderDate(item)}
                          {renderLocation(item)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {extraCount > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    +{extraCount} more active {extraCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
