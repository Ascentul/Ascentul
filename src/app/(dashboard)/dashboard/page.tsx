'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { OnboardingGuard } from '@/components/OnboardingGuard'
import { SimpleOnboardingChecklist } from '@/components/SimpleOnboardingChecklist'
import { CareerGoalsSummary } from '@/components/CareerGoalsSummary'
import { ActiveInterviewsSummary } from '@/components/ActiveInterviewsSummary'
import { FollowupActionsSummary } from '@/components/FollowupActionsSummary'
import { TodaysRecommendations } from '@/components/TodaysRecommendations'
import { AICareerCoach } from '@/components/AICareerCoach'
import { UsageProgressCard } from '@/components/UsageProgressCard'
import { HeatmapCard } from '@/components/streak/HeatmapCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import StatCard from '@/components/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Target, Clock, Users } from 'lucide-react'
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
  const { user, hasPremium } = useAuth()
  const { impersonation, getEffectiveRole } = useImpersonation()
  const router = useRouter()

  // Get effective role (respects impersonation)
  const effectiveRole = getEffectiveRole()

  // Get real dashboard analytics from database - must be called before any returns
  const dashboardData = useQuery(
    api.analytics.getUserDashboardAnalytics,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  )

  // Get user data to check if progress card is hidden
  const userData = useQuery(
    api.users.getUserByClerkId,
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
          className="space-y-6"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <motion.div variants={subtleUp}>
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
                <p className="text-sm text-slate-600">
                  Welcome back, {user.name}! Here's your career progress.
                </p>
              </div>
            </header>
            <div className="rounded-md border bg-white px-4 py-3">
              <p className="font-medium">Quick Actions</p>
            </div>
            <div className="mt-4">
              <AICareerCoach />
            </div>
          </motion.div>

          {/* Row 1: Stats Overview - Removed Interview Rate card */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            variants={staggeredContainer}
          >
            <motion.div variants={cardAnimation}>
              <StatCard
                variant="priority"
                icon={<Target className="h-4 w-4" />}
                iconBgColor="bg-[#EEF1FF]"
                iconColor="text-[#5371FF]"
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
                icon={<Users className="h-4 w-4" />}
                iconBgColor="bg-[#EEF1FF]"
                iconColor="text-[#5371FF]"
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
                icon={<Clock className="h-4 w-4" />}
                iconBgColor="bg-amber-50"
                iconColor="text-[#F59E0B]"
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
                icon={<Target className="h-4 w-4" />}
                iconBgColor="bg-emerald-50"
                iconColor="text-[#16A34A]"
                label="Active Goals"
                value={stats.activeGoals}
                change={{
                  type: 'increase',
                  text: '+1 from last month'
                }}
              />
            </motion.div>
          </motion.div>

          {/* Row 2: Active Interviews, Follow-up Actions, Goals */}
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

          {/* Row 3: Today's Recommendations - full width */}
          <motion.div variants={cardAnimation} className="mb-6">
            <TodaysRecommendations />
          </motion.div>

          {/* Row 4: Usage Progress / Onboarding Checklist - only show if not hidden */}
          {!hasPremium && userData && !userData.hide_progress_card && (
            <motion.div variants={cardAnimation} className="mb-6">
              <UsageProgressCard dashboardData={dashboardData} />
            </motion.div>
          )}
          {hasPremium && (
            <motion.div variants={cardAnimation} className="mb-6">
              <SimpleOnboardingChecklist dashboardData={dashboardData} />
            </motion.div>
          )}

          {/* Row 4: Activity Streak Heatmap */}
          <motion.div variants={cardAnimation} className="mb-6">
            <HeatmapCard />
          </motion.div>

          {/* Row 6: Recent Activity */}
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
