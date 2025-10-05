'use client'

import React from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { LineChart, BarChart, Users, Target, TrendingUp, Calendar } from 'lucide-react'

export default function UniversityStudentProgressPage() {
  const { user, isAdmin } = useAuth()
  const { user: clerkUser } = useUser()

  const canAccess = !!user && (isAdmin || user.subscription_plan === 'university' || user.role === 'university_admin')

  const students = useQuery(api.university_admin.listStudents, clerkUser?.id ? { clerkId: clerkUser.id, limit: 1000 } : 'skip') as any[] | undefined

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to Student Progress.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!students) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  // Calculate progress metrics
  const totalStudents = students.length
  const activeStudents = students.filter((s: any) => s.status === 'active' || !s.status).length
  const completedGoals = students.reduce((acc: number, s: any) => acc + (s.completed_goals_count || 0), 0)
  const totalGoals = students.reduce((acc: number, s: any) => acc + (s.total_goals_count || 0), 0)
  const avgProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

  // Department breakdown
  const departmentStats = students.reduce((acc: any, s: any) => {
    const dept = s.department_name || 'Unassigned'
    if (!acc[dept]) {
      acc[dept] = { total: 0, completed: 0, students: 0 }
    }
    acc[dept].students++
    acc[dept].completed += s.completed_goals_count || 0
    acc[dept].total += s.total_goals_count || 0
    return acc
  }, {})

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <LineChart className="h-6 w-6" /> Student Progress
        </h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{totalStudents}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Target className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{activeStudents}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Goals Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{completedGoals}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{avgProgress}%</div>
            </div>
            <Progress value={avgProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Department Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Department</CardTitle>
          <CardDescription>Student progress breakdown by academic department</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(departmentStats).length === 0 ? (
            <p className="text-muted-foreground">No department data available.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(departmentStats).map(([deptName, stats]: [string, any]) => {
                const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
                return (
                  <div key={deptName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{deptName}</h3>
                      <Badge variant="secondary">{stats.students} students</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{stats.completed} of {stats.total} goals completed</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Student Activity</CardTitle>
          <CardDescription>Latest goal completions and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Activity tracking coming soon</p>
            <p className="text-sm text-muted-foreground">Real-time student activity will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

