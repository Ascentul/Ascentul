'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Target,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { format, isAfter, isBefore } from 'date-fns'

interface Goal {
  id: string | number
  title: string
  description: string
  progress: number
  status: string
  dueDate?: string
  checklist?: any[]
}

export function CareerGoalsSummary() {
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/goals')
        return await res.json()
      } catch (error) {
        console.error('Error fetching goals:', error)
        return []
      }
    }
  })

  // Ensure goals is an array and filter to show only active goals (not completed)
  const goalsArray = Array.isArray(goals) ? goals : []
  const activeGoals = goalsArray.filter(goal =>
    goal.status !== 'completed' && goal.status !== 'cancelled'
  ).slice(0, 3) // Show top 3

  const totalGoals = goalsArray.length
  const completedGoals = goalsArray.filter(goal => goal.status === 'completed').length
  const inProgressGoals = goalsArray.filter(goal => goal.status === 'in_progress').length

  const getStatusIcon = (status: string, progress: number) => {
    if (status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else if (progress > 0) {
      return <Clock className="h-4 w-4 text-blue-500" />
    } else {
      return <Target className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string, progress: number) => {
    if (status === 'completed') {
      return 'text-green-600'
    } else if (progress > 0) {
      return 'text-blue-600'
    } else {
      return 'text-muted-foreground'
    }
  }

  const isOverdue = (dueDate: string) => {
    return dueDate && isBefore(new Date(dueDate), new Date())
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
            <CardTitle className="text-base font-medium">Career Goals</CardTitle>
            <p className="text-sm text-muted-foreground">
              {completedGoals} completed • {inProgressGoals} in progress
            </p>
          </div>
          <Link href="/goals">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
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
          ) : activeGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No active goals</p>
              <p className="text-xs">Create your first goal to track your progress</p>
              <Link href="/goals">
                <Button variant="link" className="mt-2 text-sm">
                  Create Goal
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      {getStatusIcon(goal.status, goal.progress)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">{goal.title}</h3>
                        {goal.dueDate && isOverdue(goal.dueDate) && (
                          <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                        )}
                      </div>

                      {goal.description && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {goal.description}
                        </p>
                      )}

                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className={getStatusColor(goal.status, goal.progress)}>
                            {goal.progress}%
                          </span>
                        </div>
                        <Progress value={goal.progress} className="h-1.5" />
                      </div>

                      {goal.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {format(new Date(goal.dueDate), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {totalGoals > 3 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    +{totalGoals - 3} more goals
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
