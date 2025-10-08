'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  ExternalLink,
  Clock,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { format } from 'date-fns'

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
  const followupActions = useQuery(
    api.followups.getUserFollowups,
    user?.clerkId ? { clerkId: user.clerkId } : 'skip'
  ) as FollowupAction[] | undefined

  const isLoading = followupActions === undefined

  const actionsArray = followupActions ?? []

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

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return <Mail className="h-3 w-3" />
      case 'call':
        return <Phone className="h-3 w-3" />
      case 'meeting':
        return <Calendar className="h-3 w-3" />
      case 'linkedin':
        return <Mail className="h-3 w-3" />
      default:
        return <Calendar className="h-3 w-3" />
    }
  }

  const getStatusColor = (completed: boolean, dueDate?: number) => {
    if (completed) {
      return 'bg-green-100 text-green-800'
    }

    if (dueDate && dueDate < Date.now()) {
      return 'bg-red-100 text-red-800'
    }

    return 'bg-blue-100 text-blue-800'
  }

  const getStatusText = (completed: boolean, dueDate?: number) => {
    if (completed) return 'Done'
    if (dueDate && dueDate < Date.now()) return 'Overdue'
    return 'Pending'
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
        className={`${activeActions.length > 0 ? "h-full" : "min-h-[220px]"} flex flex-col`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-medium">Follow-up Actions</CardTitle>
            <p className="text-sm text-muted-foreground">
              {totalActive} active • {overdueActions} overdue
            </p>
          </div>
          <Link href="/applications">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </CardHeader>

        <CardContent className={activeActions.length > 0 ? "flex-1" : ""}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No pending actions</p>
              <p className="text-xs">
                {totalTracked === 0
                  ? 'Create follow-up reminders from your applications'
                  : 'All your follow-up actions are up to date'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {activeActions.map((action) => (
                <div key={action._id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {getTypeIcon(action.type || 'other')}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-sm break-words">
                          {action.description || action.notes || 'Follow-up action'}
                        </h3>
                        <Badge variant="outline" className={`text-xs flex-shrink-0 ${getStatusColor(action.completed, action.due_date)}`}>
                          {getStatusText(action.completed, action.due_date)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        {action.due_date && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(action.due_date), 'MMM dd, yyyy')}
                          </div>
                        )}

                        <div className="flex items-center gap-1 capitalize flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {action.type || 'follow_up'}
                        </div>

                        {action.application && (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-xs text-gray-600 break-words">
                              {action.application.company}
                            </span>
                            <span className="text-[11px] text-muted-foreground break-words">
                              {action.application.job_title}
                            </span>
                          </div>
                        )}

                        {action.contact && action.contact.name && (
                          <div className="text-xs break-words">
                            Contact: {action.contact.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
