'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Circle,
  ExternalLink,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { format, isAfter, isBefore } from 'date-fns'

interface FollowupAction {
  id: string | number
  type: 'email' | 'call' | 'meeting' | 'linkedin' | 'other'
  description: string
  dueDate: string
  status: 'pending' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high'
  contactId?: string | number
  applicationId?: string | number
}

export function FollowupActionsSummary() {
  const { data: followupActions = [], isLoading } = useQuery<FollowupAction[]>({
    queryKey: ['/api/followup-actions'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/followup-actions')
        return await res.json()
      } catch (error) {
        console.error('Error fetching followup actions:', error)
        return []
      }
    }
  })

  // Ensure followupActions is an array and filter to show only pending and overdue actions
  const actionsArray = Array.isArray(followupActions) ? followupActions : []
  const pendingActions = actionsArray.filter(action => {
    const dueDate = new Date(action.dueDate)
    const now = new Date()
    return action.status === 'pending' || isBefore(dueDate, now)
  }).slice(0, 3) // Show top 3

  const totalActions = actionsArray.length
  const completedActions = actionsArray.filter(action => action.status === 'completed').length
  const overdueActions = actionsArray.filter(action => {
    const dueDate = new Date(action.dueDate)
    const now = new Date()
    return isBefore(dueDate, now) && action.status === 'pending'
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

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string, dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const isOverdue = isBefore(due, now)

    if (status === 'completed') {
      return 'bg-green-100 text-green-800'
    } else if (isOverdue) {
      return 'bg-red-100 text-red-800'
    } else {
      return 'bg-blue-100 text-blue-800'
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
      className="mb-6 h-full"
    >
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-medium">Follow-up Actions</CardTitle>
            <p className="text-sm text-muted-foreground">
              {completedActions} completed • {overdueActions} overdue
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
          ) : pendingActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No pending actions</p>
              <p className="text-xs">All your follow-up actions are up to date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {getTypeIcon(action.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{action.description}</h3>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(action.priority)}`}>
                          {action.priority}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(action.status, action.dueDate)}`}>
                          {action.status === 'completed' ? 'Done' :
                           (action.status === 'overdue' ? 'Overdue' : 'Pending')}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(action.dueDate), 'MMM dd, yyyy')}
                        </div>

                        <div className="flex items-center gap-1 capitalize">
                          <Clock className="h-3 w-3" />
                          {action.type}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {totalActions > 3 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    +{totalActions - 3} more actions
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
