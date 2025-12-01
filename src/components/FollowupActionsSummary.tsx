'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Calendar,
  CheckCircle,
  ExternalLink,
  Clock,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type FollowupAction = {
  _id: string
  description?: string
  due_date?: number
  notes?: string
  type?: string
  completed: boolean
  application?: {
    _id: string
    company: string
    job_title: string
    status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
  } | null
  contact?: {
    _id: string
    name?: string
    company?: string
  } | null
  created_at: number
  updated_at: number
}

export function FollowupActionsSummary() {
  const { user } = useAuth()
  // SECURITY: Query uses authenticated user from JWT, no clerkId needed
  const followupActions = useQuery(
    api.followups.getUserFollowups,
    user?.clerkId ? {} : 'skip'
  ) as FollowupAction[] | undefined

  const isLoading = followupActions === undefined

  // Memoize fallback array to prevent dependency changes on every render
  const actionsArray = useMemo(() => followupActions ?? [], [followupActions])

  const activeActions = useMemo(() => {
    const now = Date.now()

    return actionsArray
      .filter((action) => {
        if (action.completed) return false
        if (!action.application) return true
        return action.application.status !== 'offer' && action.application.status !== 'rejected'
      })
      .sort((a, b) => {
        const aDue = a.due_date
        const bDue = b.due_date
        const aOverdue = !!aDue && aDue < now
        const bOverdue = !!bDue && bDue < now

        if (aOverdue !== bOverdue) {
          return aOverdue ? -1 : 1
        }

        if (aDue && bDue) {
          return aDue - bDue
        }

        if (aDue || bDue) {
          return aDue ? -1 : 1
        }

        return b.updated_at - a.updated_at
      })
  }, [actionsArray])

  const totalTracked = actionsArray.length
  const totalActive = activeActions.length
  const overdueActions = activeActions.filter((action) => {
    return !!action.due_date && action.due_date < Date.now()
  }).length

  const getStatusConfig = (completed: boolean, dueDate?: number) => {
    if (completed) {
      return { text: 'Done', tone: 'success' as const }
    }

    if (dueDate && dueDate < Date.now()) {
      return { text: 'Overdue', tone: 'danger' as const }
    }

    return { text: 'Pending', tone: 'neutral' as const }
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
        className="h-full flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-sm"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-3">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">Follow-up Actions</CardTitle>
            <p className="text-xs text-slate-500">
              {totalActive} active • {overdueActions} overdue
            </p>
          </div>
          <Link href="/applications">
            <Button variant="outline" size="sm" className="h-8 rounded-lg px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <ExternalLink className="mr-2 h-4 w-4" />
              View All
            </Button>
          </Link>
        </CardHeader>

        <div className="border-t border-slate-200/70" />

        <CardContent className="flex-1 px-5 pb-4 pt-3 text-sm text-slate-600">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : activeActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-sm text-slate-500">No pending actions</p>
              <Link href="/applications" className="mt-2">
                <Button variant="outline" size="sm" className="text-xs">
                  View applications
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {activeActions.map((action, idx) => {
                const status = getStatusConfig(action.completed, action.due_date)
                return (
                <div key={action._id} className={cn("py-3", idx === 0 ? "pt-0" : "", idx === activeActions.length - 1 ? "pb-0" : "")}>
                  <div className="flex min-h-[90px] flex-col rounded-lg bg-white border border-slate-200 p-3 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                    <div className="min-w-0 max-w-full flex-1 overflow-hidden">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 truncate flex-1 min-w-0">
                          {action.description || action.notes || 'Follow-up action'}
                        </h3>
                        <StatusBadge tone={status.tone}>
                          {status.text}
                        </StatusBadge>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-1 pt-1 text-xs text-slate-500">
                        <div className="flex flex-wrap items-center gap-3">
                          {action.due_date && (
                            <div className="flex flex-shrink-0 items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(action.due_date), 'MMM dd, yyyy')}
                            </div>
                          )}

                          <div className="flex flex-shrink-0 items-center gap-1 capitalize">
                            <Clock className="h-3 w-3" />
                            {action.type || 'follow_up'}
                          </div>
                        </div>

                        {action.application && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-slate-700 break-words">
                              {action.application.company}
                            </span>
                            <span className="text-[11px] text-slate-500 break-words">
                              {action.application.job_title}
                            </span>
                          </div>
                        )}

                        {action.contact && action.contact.name && (
                          <div className="text-xs break-words text-slate-600">
                            Contact: {action.contact.name}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
