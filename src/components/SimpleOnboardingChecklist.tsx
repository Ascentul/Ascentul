'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import {
  CheckCircle,
  Circle,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'

interface SimpleOnboardingChecklistProps {
  dashboardData?: {
    onboardingProgress?: {
      completed_tasks: string[]
      resumesCount: number
      goalsCount: number
      applicationsCount: number
      contactsCount: number
      userProfile: any
    }
  }
}

export function SimpleOnboardingChecklist({ dashboardData }: SimpleOnboardingChecklistProps = {}) {
  const { user } = useUser()
  const clerkId = user?.id

  // Fetch user's onboarding progress (only if not provided via props)
  const fetchedOnboardingProgress = useQuery(
    api.users.getOnboardingProgress,
    !dashboardData && clerkId ? { clerkId } : 'skip'
  ) as { completed_tasks?: string[] } | undefined

  const updateOnboarding = useMutation(api.users.updateOnboardingProgress)

  // Also check actual data to determine completion (only if not provided via props)
  const fetchedResumes = useQuery(api.resumes.getUserResumes, !dashboardData && clerkId ? { clerkId } : 'skip')
  const fetchedGoals = useQuery(api.goals.getUserGoals, !dashboardData && clerkId ? { clerkId } : 'skip')
  const fetchedApplications = useQuery(api.applications.getUserApplications, !dashboardData && clerkId ? { clerkId } : 'skip')
  const fetchedContacts = useQuery(api.contacts.getUserContacts, !dashboardData && clerkId ? { clerkId } : 'skip')
  const fetchedUserProfile = useQuery(api.users.getUserByClerkId, !dashboardData && clerkId ? { clerkId } : 'skip')

  // Use prop data if available, otherwise use fetched data
  const onboardingProgress = dashboardData?.onboardingProgress || fetchedOnboardingProgress
  const resumes = dashboardData?.onboardingProgress ? [] : fetchedResumes // We have count from dashboardData
  const goals = dashboardData?.onboardingProgress ? [] : fetchedGoals
  const applications = dashboardData?.onboardingProgress ? [] : fetchedApplications
  const contacts = dashboardData?.onboardingProgress ? [] : fetchedContacts
  const userProfile = dashboardData?.onboardingProgress?.userProfile || fetchedUserProfile

  const resumesCount = dashboardData?.onboardingProgress?.resumesCount ?? (resumes?.length || 0)
  const goalsCount = dashboardData?.onboardingProgress?.goalsCount ?? (goals?.length || 0)
  const applicationsCount = dashboardData?.onboardingProgress?.applicationsCount ?? (applications?.length || 0)
  const contactsCount = dashboardData?.onboardingProgress?.contactsCount ?? (contacts?.length || 0)

  const checklistItems = useMemo(() => {
    const completedTasks = onboardingProgress?.completed_tasks || []

    // Auto-detect completion based on actual data
    const hasResume = resumesCount > 0 || completedTasks.includes('resume-creation')
    const hasGoal = goalsCount > 0 || completedTasks.includes('career-goal')
    const hasApplication = applicationsCount > 0 || completedTasks.includes('job-application')
    const hasContact = contactsCount > 0 || completedTasks.includes('network-contact')

    // Calculate profile completion based on 5 sections (matching profile page logic)
    const profileSections = [
      !!userProfile?.bio, // Career Summary
      !!userProfile?.linkedin_url, // LinkedIn Profile
      Array.isArray((userProfile as any)?.work_history) && (userProfile as any).work_history.length > 0, // Work History
      (Array.isArray((userProfile as any)?.education_history) && (userProfile as any).education_history.length > 0) ||
      (!!userProfile?.major || !!userProfile?.university_name), // Education
      !!userProfile?.skills, // Skills
    ]
    const profileComplete = profileSections.filter(Boolean).length === profileSections.length
    const hasProfile = profileComplete || completedTasks.includes('career-profile')

    return [
      {
        id: 'career-profile',
        title: 'Complete your career profile',
        description: 'Add your work history, education, and skills',
        completed: hasProfile,
        href: '/career-profile'
      },
      {
        id: 'career-goal',
        title: 'Set your first career goal',
        description: 'Define what you want to achieve next',
        completed: hasGoal,
        href: '/goals'
      },
      {
        id: 'resume-creation',
        title: 'Create a resume draft',
        description: 'Start building your professional resume',
        completed: hasResume,
        href: '/resumes'
      },
      {
        id: 'job-application',
        title: 'Track your first application',
        description: 'Start managing your job applications',
        completed: hasApplication,
        href: '/applications'
      },
      {
        id: 'network-contact',
        title: 'Add 1 contact to your network',
        description: 'Start building your professional network',
        completed: hasContact,
        href: '/contacts'
      }
    ]
  }, [onboardingProgress, resumesCount, goalsCount, applicationsCount, contactsCount, userProfile])

  // Auto-update onboarding progress when items are completed
  useEffect(() => {
    if (!clerkId || !onboardingProgress) return

    const completedIds = checklistItems.filter(item => item.completed).map(item => item.id)
    const currentCompleted = onboardingProgress.completed_tasks || []

    // Check if there are new completions
    const hasNewCompletions = completedIds.some(id => !currentCompleted.includes(id))

    if (hasNewCompletions) {
      updateOnboarding({ clerkId, completed_tasks: completedIds }).catch(console.error)
    }
  }, [clerkId, checklistItems, onboardingProgress, updateOnboarding])

  const completedCount = checklistItems.filter(item => item.completed).length
  const progressPercentage = (completedCount / checklistItems.length) * 100

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="mb-6"
    >
      <Card className="relative overflow-hidden p-0 shadow-sm">
        <CardHeader className="space-y-1 px-5 py-3">
          <CardTitle className="text-sm font-semibold text-slate-900">Get Started with Ascentful</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Want to personalize your dashboard and unlock advanced features? Complete these quick steps.
          </CardDescription>

          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>{completedCount} of {checklistItems.length} tasks completed</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>
        </CardHeader>

        <div className="border-t border-slate-100" />

        <CardContent className="px-5 pb-4 pt-3">
          <div className="space-y-2.5">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-2.5 rounded-xl border transition-colors ${
                  item.completed
                    ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div
                  className="mt-0.5 flex-shrink-0 cursor-default"
                  aria-label={`${item.title} is ${item.completed ? 'complete' : 'incomplete'}`}
                >
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground opacity-60" />
                  )}
                </div>

                <div className="flex-grow">
                  <h3 className={`text-sm font-medium text-slate-800 ${
                    item.completed ? 'text-green-700 dark:text-green-400' : ''
                  }`}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600">{item.description}</p>
                </div>

                {!item.completed && (
                  <Link href={item.href}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2 flex-shrink-0 h-7 rounded-xl px-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Go <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
