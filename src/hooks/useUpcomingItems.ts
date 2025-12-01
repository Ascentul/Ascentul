'use client'

import { useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery as useConvexQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { format, isToday, isTomorrow } from 'date-fns'

export type UpcomingItemType = 'interview' | 'followUp' | 'goal'

export interface UpcomingItem {
  id: string
  type: UpcomingItemType
  title: string
  subtitle?: string
  date: number
  displayDate: string
  href: string
  isOverdue?: boolean
}

interface UseUpcomingItemsReturn {
  items: UpcomingItem[]
  totalCount: number
  isLoading: boolean
}

// Format date for display in the pill
function formatUpcomingDate(timestamp: number, hasTime: boolean = true): string {
  const date = new Date(timestamp)
  const now = Date.now()

  if (timestamp < now) {
    return 'Overdue'
  }

  if (isToday(date)) {
    return hasTime ? `Today ${format(date, 'h:mma').toLowerCase()}` : 'Today'
  }

  if (isTomorrow(date)) {
    return hasTime ? `Tomorrow ${format(date, 'h:mma').toLowerCase()}` : 'Tomorrow'
  }

  // Within the week - show day name
  return hasTime ? format(date, "EEE h:mma").replace(/AM|PM/gi, m => m.toLowerCase()) : format(date, 'EEE')
}

export function useUpcomingItems(): UseUpcomingItemsReturn {
  const { user: clerkUser } = useUser()
  const clerkId = clerkUser?.id

  // Fetch applications (needed to get company names for interviews)
  const applications = useConvexQuery(
    api.applications.getUserApplications,
    clerkId ? { clerkId } : 'skip'
  )

  // Fetch interview stages
  const interviewStages = useConvexQuery(
    api.interviews.getUserInterviewStages,
    clerkId ? { clerkId } : 'skip'
  )

  // Fetch follow-ups
  const followupActions = useConvexQuery(
    api.followups.getUserFollowups,
    clerkId ? {} : 'skip'
  )

  // Fetch goals via the API (same as CareerGoalsSummary)
  const goals = useConvexQuery(
    api.goals.getUserGoals,
    clerkId ? { clerkId } : 'skip'
  )

  const isLoading = Boolean(clerkId) && (
    applications === undefined ||
    interviewStages === undefined ||
    followupActions === undefined ||
    goals === undefined
  )

  const items = useMemo<UpcomingItem[]>(() => {
    if (isLoading) return []

    const now = Date.now()
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000
    const result: UpcomingItem[] = []

    // Create application lookup map
    const applicationMap = new Map(
      (applications ?? []).map((app: { _id: string; company: string; job_title: string }) => [app._id, app])
    )

    // Process interviews
    if (interviewStages) {
      for (const stage of interviewStages as Array<{
        _id: string
        application_id: string
        title: string
        scheduled_at?: number
        outcome: string
      }>) {
        // Only include scheduled interviews that haven't passed/failed and are in the next 7 days
        if (
          stage.scheduled_at &&
          stage.outcome !== 'passed' &&
          stage.outcome !== 'failed' &&
          stage.scheduled_at <= sevenDaysFromNow
        ) {
          const app = applicationMap.get(stage.application_id)
          const company = app?.company ?? 'Unknown Company'
          const position = app?.job_title ?? stage.title

          result.push({
            id: `interview-${stage._id}`,
            type: 'interview',
            title: `${company} - ${position}`,
            subtitle: stage.title,
            date: stage.scheduled_at,
            displayDate: formatUpcomingDate(stage.scheduled_at, true),
            href: `/applications/${stage.application_id}`,
            isOverdue: stage.scheduled_at < now
          })
        }
      }
    }

    // Process follow-ups
    // Note: follow_ups table uses 'status' ('open'|'done') and 'due_at' fields
    if (followupActions) {
      for (const action of followupActions as unknown as Array<{
        _id: string
        title?: string
        description?: string
        notes?: string
        due_at?: number
        status: 'open' | 'done'
        application?: { _id: string; company: string; status: string } | null
      }>) {
        // Only include open follow-ups with due dates in the next 7 days (or overdue)
        if (
          action.status === 'open' &&
          action.due_at &&
          action.due_at <= sevenDaysFromNow &&
          // Exclude follow-ups for closed applications
          (!action.application || (action.application.status !== 'offer' && action.application.status !== 'rejected'))
        ) {
          const title = action.title || action.description || action.notes || 'Follow-up action'
          const companyNote = action.application?.company ? ` (${action.application.company})` : ''

          result.push({
            id: `followup-${action._id}`,
            type: 'followUp',
            title: title + companyNote,
            date: action.due_at,
            displayDate: formatUpcomingDate(action.due_at, false),
            href: action.application ? `/applications/${action.application._id}` : '/applications',
            isOverdue: action.due_at < now
          })
        }
      }
    }

    // Process goals
    if (goals) {
      for (const goal of goals as Array<{
        _id: string
        title: string
        status: string
        target_date?: number
      }>) {
        // Only include active goals with target dates in the next 7 days (or overdue)
        if (
          goal.target_date &&
          goal.status !== 'completed' &&
          goal.status !== 'cancelled' &&
          goal.target_date <= sevenDaysFromNow
        ) {
          result.push({
            id: `goal-${goal._id}`,
            type: 'goal',
            title: goal.title,
            date: goal.target_date,
            displayDate: formatUpcomingDate(goal.target_date, false),
            href: '/goals',
            isOverdue: goal.target_date < now
          })
        }
      }
    }

    // Sort by date ascending, with overdue items first
    result.sort((a, b) => {
      // Overdue items come first
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      // Then sort by date
      return a.date - b.date
    })

    // Limit to 5 items for display
    return result.slice(0, 5)
  }, [isLoading, applications, interviewStages, followupActions, goals])

  // Total count includes all items, not just the displayed 5
  const totalCount = useMemo(() => {
    if (isLoading) return 0

    const now = Date.now()
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000
    let count = 0

    // Count interviews
    if (interviewStages) {
      for (const stage of interviewStages as Array<{
        scheduled_at?: number
        outcome: string
      }>) {
        if (
          stage.scheduled_at &&
          stage.outcome !== 'passed' &&
          stage.outcome !== 'failed' &&
          stage.scheduled_at <= sevenDaysFromNow
        ) {
          count++
        }
      }
    }

    // Count follow-ups
    if (followupActions) {
      for (const action of followupActions as unknown as Array<{
        due_at?: number
        status: 'open' | 'done'
        application?: { status: string } | null
      }>) {
        if (
          action.status === 'open' &&
          action.due_at &&
          action.due_at <= sevenDaysFromNow &&
          (!action.application || (action.application.status !== 'offer' && action.application.status !== 'rejected'))
        ) {
          count++
        }
      }
    }

    // Count goals
    if (goals) {
      for (const goal of goals as Array<{
        status: string
        target_date?: number
      }>) {
        if (
          goal.target_date &&
          goal.status !== 'completed' &&
          goal.status !== 'cancelled' &&
          goal.target_date <= sevenDaysFromNow
        ) {
          count++
        }
      }
    }

    return count
  }, [isLoading, interviewStages, followupActions, goals])

  return {
    items,
    totalCount,
    isLoading
  }
}
