'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { OnboardingGuard } from '@/components/OnboardingGuard'
import { CareerGoalsSummary } from '@/components/CareerGoalsSummary'
import { InterviewsAndFollowUpsCard } from '@/components/InterviewsAndFollowUpsCard'
import { TodaysRecommendations } from '@/components/TodaysRecommendations'
import { HeatmapCard } from '@/components/streak/HeatmapCard'
import { NextBestStepHero } from '@/components/NextBestStepHero'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { UpcomingSection } from '@/components/UpcomingSection'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { hasAdvisorAccess, hasUniversityAdminAccess, hasPlatformAdminAccess } from '@/lib/constants/roles'

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
  const { user } = useAuth()
  const { impersonation, getEffectiveRole } = useImpersonation()
  const router = useRouter()

  // Get effective role (respects impersonation)
  const effectiveRole = getEffectiveRole()

  // Get real dashboard analytics from database - must be called before any returns
  const dashboardData = useQuery(
    api.analytics.getUserDashboardAnalytics,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  )


  // Redirect admin users immediately to prevent flash of dashboard content
  // Skip redirect if impersonating a non-admin role
  useEffect(() => {
    // If impersonating, don't redirect based on real role
    if (impersonation.isImpersonating) {
      // If impersonating university_admin, redirect to university dashboard
      if (effectiveRole === 'university_admin') {
        router.replace('/university')
        return
      }
      // If impersonating super_admin, redirect to admin dashboard
      if (effectiveRole === 'super_admin') {
        router.replace('/admin')
        return
      }
      // If impersonating advisor, redirect to advisor dashboard
      if (effectiveRole === 'advisor') {
        router.replace('/advisor')
        return
      }
      // Otherwise stay on this page (student, individual, staff)
      return
    }

    // Not impersonating - use real role
    if (user?.role === 'advisor') {
      router.replace('/advisor')
      return
    }
    if (hasUniversityAdminAccess(user?.role) && user?.role !== 'super_admin') {
      router.replace('/university')
      return
    }
    if (hasPlatformAdminAccess(user?.role)) {
      router.replace('/admin')
      return
    }
  }, [user, router, impersonation.isImpersonating, effectiveRole])

  if (!isLoaded) {
    return <LoadingSpinner />
  }

  if (!clerkUser || !user) {
    return null
  }

  // Prevent rendering for admin users while redirect is happening
  // But allow rendering if impersonating a non-admin role
  const shouldRedirectToAdmin = !impersonation.isImpersonating && hasAdvisorAccess(user?.role)

  if (shouldRedirectToAdmin) {
    let message = "Redirecting to admin portal..."
    if (user?.role === 'advisor') {
      message = "Redirecting to advisor dashboard..."
    } else if (user?.role === 'university_admin') {
      message = "Redirecting to university dashboard..."
    }
    return <LoadingSpinner message={message} />
  }

  // Show dashboard for students and individual users only
  const showStudentDashboard = effectiveRole === 'student' || effectiveRole === 'individual' || effectiveRole === 'user' || user?.role === 'student' || user?.role === 'individual' || user?.role === 'user'

  // Use real data or fallback to default values
  const stats = {
    nextInterview: dashboardData?.nextInterview || 'No Interviews',
    activeApplications: dashboardData?.applicationStats?.total || 0,
    pendingTasks: dashboardData?.pendingTasks || 0,
    activeGoals: dashboardData?.activeGoals || 0,
    upcomingInterviews: dashboardData?.upcomingInterviews || 0,
    interviewRate: dashboardData?.interviewRate || 0,
    thisWeekActions: dashboardData?.thisWeek?.totalActions || 0,
    applicationsThisWeek: dashboardData?.thisWeek?.applicationsAdded || 0,
    overdueFollowups: dashboardData?.overdueFollowups || 0,
  }

  // Determine user status message
  const getStatusMessage = () => {
    if (stats.thisWeekActions > 0) {
      return 'You are on track this week'
    }
    if (stats.pendingTasks > 0) {
      return `${stats.pendingTasks} follow-up${stats.pendingTasks !== 1 ? 's' : ''} waiting for you`
    }
    return null
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
          className="space-y-6"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          {/* Row 1: Page Header */}
          <motion.div variants={subtleUp} className="mb-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Left side - Header with status */}
              <div>
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Hello, {user.name?.split(' ')[0] || 'there'}</h1>
                <p className="text-base mt-0.5 tracking-tight bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 bg-[length:200%_auto] animate-gradient-x bg-clip-text text-transparent">
                  How can I help you today?
                </p>
              </div>

              {/* Right side - This week chip */}
              {showStudentDashboard && (
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-primary-600">
                    <TrendingUp className="h-3.5 w-3.5" />
                    This week: {stats.thisWeekActions} action{stats.thisWeekActions !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Row 2: Next Best Step Hero */}
          {showStudentDashboard && (
            <motion.div variants={cardAnimation}>
              <NextBestStepHero
                hasApplications={(dashboardData?.applicationStats?.total || 0) > 0}
                hasGoals={(dashboardData?.activeGoals || 0) > 0}
                nextInterviewDetails={dashboardData?.nextInterviewDetails}
                userName={user.name?.split(' ')[0]}
              />
            </motion.div>
          )}

          {/* Row 3: Interviews, Follow-ups & Goals (2-column grid) */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            variants={staggeredContainer}
          >
            <motion.div variants={cardAnimation} className="lg:col-span-2">
              <InterviewsAndFollowUpsCard />
            </motion.div>

            <motion.div variants={cardAnimation}>
              <CareerGoalsSummary />
            </motion.div>
          </motion.div>

          {/* Row 6: Smart Recommendations */}
          <motion.div variants={cardAnimation} id="recommendations">
            <TodaysRecommendations />
          </motion.div>


          {/* Row 8: Activity Streak Heatmap */}
          <motion.div variants={cardAnimation}>
            <HeatmapCard />
          </motion.div>

          {/* Row 9: Recent Activity */}
          <motion.div variants={cardAnimation}>
            <Card className="overflow-hidden p-0 shadow-sm">
              <div className="flex items-center justify-between px-5 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
                  <p className="text-xs text-slate-500">Your latest career development actions</p>
                </div>
              </div>
              <div className="border-t border-slate-100" />
              <CardContent className="px-5 pb-4 pt-3">
                <div className="h-[280px] space-y-4 overflow-y-auto pr-2 text-sm text-slate-700 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                    dashboardData.recentActivity.map((activity) => {
                      const colorClass = activityTypeColors[activity.type] ?? 'bg-yellow-500'
                      return (
                        <div key={activity.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                          <div className={`h-2 w-2 rounded-full ${colorClass}`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                            <p className="text-xs text-slate-500">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-8 text-center text-slate-600">
                      <p className="text-sm">No recent activity</p>
                      <p className="mt-1 text-xs text-slate-500">
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
