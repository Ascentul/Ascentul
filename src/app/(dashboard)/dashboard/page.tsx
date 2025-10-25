'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { OnboardingGuard } from '@/components/OnboardingGuard'
import { SimpleOnboardingChecklist } from '@/components/SimpleOnboardingChecklist'
import { CareerGoalsSummary } from '@/components/CareerGoalsSummary'
import { ActiveInterviewsSummary } from '@/components/ActiveInterviewsSummary'
import { FollowupActionsSummary } from '@/components/FollowupActionsSummary'
import { TodaysRecommendations } from '@/components/TodaysRecommendations'
import { UsageProgressCard } from '@/components/UsageProgressCard'
import { useRouter } from 'next/navigation'
import StatCard from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Target, Award, FileText, Clock, Plus, Bot, CheckCircle, Send,
  Briefcase, Mail, Users, Eye, Edit, Calendar, ChevronDown, ChevronUp,
  Square, CheckSquare, RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

// Helper function to format time ago
function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diffTime = now - timestamp
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffTime / (1000 * 60))

  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

const activityTypeColors: Record<string, string> = {
  application: 'bg-green-500',
  application_update: 'bg-emerald-500',
  interview: 'bg-blue-500',
  followup: 'bg-orange-500',
  followup_completed: 'bg-lime-500',
  goal: 'bg-purple-500',
  goal_completed: 'bg-purple-600',
  resume: 'bg-slate-500',
  cover_letter: 'bg-rose-500',
  project: 'bg-teal-500',
  contact: 'bg-amber-500'
}

export default function DashboardPage() {
  const { user: clerkUser, isLoaded } = useUser()
  const { user, hasPremium } = useAuth()
  const router = useRouter()

  // Get real dashboard analytics from database - must be called before any returns
  const dashboardData = useQuery(
    api.analytics.getUserDashboardAnalytics,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  )

  // Redirect admin users immediately to prevent flash of dashboard content
  useEffect(() => {
    if (user?.role === 'university_admin') {
      router.replace('/university')
      return
    }
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      router.replace('/admin')
      return
    }
  }, [user, router])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!clerkUser || !user) {
    return null
  }

  // Prevent rendering for admin users while redirect is happening
  if (user?.role === 'university_admin' || user?.role === 'super_admin' || user?.role === 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to admin portal...</p>
        </div>
      </div>
    )
  }

  // Use real data or fallback to default values
  const stats = {
    nextInterview: dashboardData?.nextInterview || 'No Interviews',
    activeApplications: dashboardData?.applicationStats?.total || 0,
    pendingTasks: dashboardData?.pendingTasks || 0,
    activeGoals: dashboardData?.activeGoals || 0,
    upcomingInterviews: dashboardData?.upcomingInterviews || 0,
    interviewRate: dashboardData?.interviewRate || 0
  }

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  }

  const subtleUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.4
      } 
    }
  }

  const cardAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.4
      } 
    }
  }

  const staggeredContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  return (
    <OnboardingGuard>
      <motion.div 
          className="container mx-auto"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <motion.div 
            className="flex flex-col md:flex-row md:items-center justify-between mb-6"
            variants={subtleUp}
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB]">Dashboard</h1>
              <p className="text-neutral-500">Welcome back, {user.name}! Here's your career progress.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Quick Actions
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center">Quick Actions</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-2 py-4">
                    <Link href="/goals" className="w-full">
                      <div className="flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Create a Goal</div>
                          <div className="text-xs text-muted-foreground">Track your career objectives</div>
                        </div>
                      </div>
                    </Link>

                    <Link href="/resumes" className="w-full">
                      <div className="flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors">
                        <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center mr-3 flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <div className="font-medium">Create a Resume</div>
                          <div className="text-xs text-muted-foreground">Build a professional resume</div>
                        </div>
                      </div>
                    </Link>

                    <Link href="/cover-letters" className="w-full">
                      <div className="flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors">
                        <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center mr-3 flex-shrink-0">
                          <Mail className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <div className="font-medium">Create a Cover Letter</div>
                          <div className="text-xs text-muted-foreground">Craft a compelling cover letter</div>
                        </div>
                      </div>
                    </Link>

                    <Link href="/applications" className="w-full">
                      <div className="flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors">
                        <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center mr-3 flex-shrink-0">
                          <Briefcase className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <div className="font-medium">Track an Application</div>
                          <div className="text-xs text-muted-foreground">Track your job applications</div>
                        </div>
                      </div>
                    </Link>

                    <Link href="/contacts" className="w-full">
                      <div className="flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors">
                        <div className="h-9 w-9 rounded-full bg-indigo-500/10 flex items-center justify-center mr-3 flex-shrink-0">
                          <Users className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div>
                          <div className="font-medium">Add Contact</div>
                          <div className="text-xs text-muted-foreground">Add to your Network Hub</div>
                        </div>
                      </div>
                    </Link>

                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Row 1: Stats Overview - Removed Interview Rate card */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            variants={staggeredContainer}
          >
            <motion.div variants={cardAnimation}>
              <StatCard
                icon={<Target className="h-5 w-5 text-primary" />}
                iconBgColor="bg-primary/20"
                iconColor="text-primary"
                label="Next Interview"
                value={stats.nextInterview}
                fallbackOnOverflow={
                  stats.nextInterview === 'No Interviews' || stats.nextInterview === 'No upcoming interviews'
                    ? '-'
                    : undefined
                }
                change={{
                  type: 'no-change',
                  text: 'TechCorp Inc.'
                }}
              />
            </motion.div>

            <motion.div variants={cardAnimation}>
              <StatCard
                icon={<Users className="h-5 w-5 text-blue-500" />}
                iconBgColor="bg-blue-500/20"
                iconColor="text-blue-500"
                label="Active Applications"
                value={stats.activeApplications}
                change={{
                  type: 'increase',
                  text: '+4 this week'
                }}
              />
            </motion.div>

            <motion.div variants={cardAnimation}>
              <StatCard
                icon={<Clock className="h-5 w-5 text-orange-500" />}
                iconBgColor="bg-orange-500/20"
                iconColor="text-orange-500"
                label="Pending Follow ups"
                value={stats.pendingTasks}
                change={{
                  type: stats.pendingTasks > 0 ? 'increase' : 'no-change',
                  text: stats.pendingTasks > 0
                    ? `${stats.pendingTasks} item${stats.pendingTasks !== 1 ? 's' : ''} need attention`
                    : 'No pending follow ups'
                }}
              />
            </motion.div>

            <motion.div variants={cardAnimation}>
              <StatCard
                icon={<Target className="h-5 w-5 text-green-500" />}
                iconBgColor="bg-green-500/20"
                iconColor="text-green-500"
                label="Active Goals"
                value={stats.activeGoals}
                change={{
                  type: 'increase',
                  text: '+1 from last month'
                }}
              />
            </motion.div>
          </motion.div>

          {/* Row 2: Usage Progress (Free Users) or Onboarding Checklist */}
          <motion.div variants={cardAnimation} className="mb-6">
            {!hasPremium ? (
              <UsageProgressCard />
            ) : (
              <SimpleOnboardingChecklist />
            )}
          </motion.div>

          {/* Row 3: Recommendations */}
          <motion.div variants={cardAnimation} className="mb-6">
            <TodaysRecommendations />
          </motion.div>

          {/* Row 4: Active Interviews, Follow-up Actions, Goals */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
            variants={staggeredContainer}
          >
            <motion.div variants={cardAnimation}>
              <ActiveInterviewsSummary />
            </motion.div>

            <motion.div variants={cardAnimation}>
              <FollowupActionsSummary />
            </motion.div>

            <motion.div variants={cardAnimation}>
              <CareerGoalsSummary />
            </motion.div>
          </motion.div>

          {/* Row 5: Recent Activity */}
          <motion.div variants={cardAnimation}>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col space-y-1.5 mb-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight">Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">Your latest career development actions</p>
                </div>
                <div className="space-y-4">
                  {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                    dashboardData.recentActivity.map((activity) => {
                      const colorClass = activityTypeColors[activity.type] ?? 'bg-yellow-500'
                      return (
                        <div key={activity.id} className="flex items-center space-x-4">
                          <div className={`w-2 h-2 rounded-full ${colorClass}`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start by creating an application or updating your profile
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
    </OnboardingGuard>
  )
}
