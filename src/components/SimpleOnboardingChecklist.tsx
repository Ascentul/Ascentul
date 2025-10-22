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

export function SimpleOnboardingChecklist() {
  const { user } = useUser()
  const clerkId = user?.id

  // Fetch user's onboarding progress
  const onboardingProgress = useQuery(
    api.users.getOnboardingProgress,
    clerkId ? { clerkId } : 'skip'
  ) as { completed_tasks?: string[] } | undefined

  const updateOnboarding = useMutation(api.users.updateOnboardingProgress)

  // Also check actual data to determine completion
  const resumes = useQuery(api.resumes.getUserResumes, clerkId ? { clerkId } : 'skip')
  const goals = useQuery(api.goals.getUserGoals, clerkId ? { clerkId } : 'skip')
  const applications = useQuery(api.applications.getUserApplications, clerkId ? { clerkId } : 'skip')
  const contacts = useQuery(api.contacts.getUserContacts, clerkId ? { clerkId } : 'skip')
  const userProfile = useQuery(api.users.getUserByClerkId, clerkId ? { clerkId } : 'skip')

  const checklistItems = useMemo(() => {
    const completedTasks = onboardingProgress?.completed_tasks || []

    // Auto-detect completion based on actual data
    const hasResume = (resumes && resumes.length > 0) || completedTasks.includes('resume-creation')
    const hasGoal = (goals && goals.length > 0) || completedTasks.includes('career-goal')
    const hasApplication = (applications && applications.length > 0) || completedTasks.includes('job-application')
    const hasContact = (contacts && contacts.length > 0) || completedTasks.includes('network-contact')

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
  }, [onboardingProgress, resumes, goals, applications, contacts, userProfile])

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
      <Card className="relative overflow-hidden border border-border/60 bg-background/95 shadow-sm">
        <CardHeader className="pb-1 pt-4 px-4">
          <CardTitle className="text-lg font-medium">Get Started with Ascentful</CardTitle>
          <CardDescription className="text-sm">
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

        <CardContent className="pt-3 pb-4 px-4">
          <div className="space-y-2.5">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start p-2.5 rounded-md border transition-colors ${
                  item.completed
                    ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900'
                    : 'border-border/60 hover:bg-muted/50'
                }`}
              >
                <div
                  className="flex-shrink-0 mt-0.5 cursor-default"
                  aria-label={`${item.title} is ${item.completed ? 'complete' : 'incomplete'}`}
                >
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground opacity-60" />
                  )}
                </div>

                <div className="ml-2.5 flex-grow">
                  <h3 className={`text-sm font-medium ${
                    item.completed ? 'text-green-700 dark:text-green-400' : ''
                  }`}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>

                {!item.completed && (
                  <Link href={item.href}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 ml-2 h-7 px-2 text-xs whitespace-nowrap"
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
