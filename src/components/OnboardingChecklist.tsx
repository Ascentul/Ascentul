'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'next/link'
import {
  CheckCircle,
  Circle,
  Briefcase,
  Users,
  FileText,
  Target,
  ChevronRight,
  X,
  Star
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  href: string
  icon: JSX.Element
}

interface OnboardingChecklistProps {
  userId: string
}

export function OnboardingChecklist({ userId }: OnboardingChecklistProps) {
  const { toast } = useToast()

  // Fetch career data to check profile completion
  const { data: careerData } = useQuery({
    queryKey: ['/api/career-data/profile'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/career-data/profile')
        return await res.json()
      } catch (error) {
        console.error('Error fetching career data:', error)
        return {}
      }
    },
    refetchInterval: 5000,
    staleTime: 0,
  })


  // Fetch network contacts
  const { data: networkContacts = [] } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/contacts')
        return await res.json()
      } catch (error) {
        console.error('Error fetching network contacts:', error)
        return []
      }
    },
    refetchInterval: 5000,
    staleTime: 0,
  })

  // Fetch user goals
  const { data: userGoals = [] } = useQuery({
    queryKey: ['/api/goals'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/goals')
        return await res.json()
      } catch (error) {
        console.error('Error fetching user goals:', error)
        return []
      }
    },
    refetchInterval: 5000,
    staleTime: 0,
  })

  // Fetch job applications
  const { data: jobApplications = [] } = useQuery({
    queryKey: ['/api/applications'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/applications')
        return await res.json()
      } catch (error) {
        console.error('Error fetching job applications:', error)
        return []
      }
    },
    refetchInterval: 5000,
    staleTime: 0,
  })

  // Fetch user resumes
  const { data: userResumes = [] } = useQuery({
    queryKey: ['/api/resumes'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/resumes')
        return await res.json()
      } catch (error) {
        console.error('Error fetching user resumes:', error)
        return []
      }
    },
    refetchInterval: 5000,
    staleTime: 0,
  })

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: 'career-profile',
      title: 'Complete your career profile',
      description: 'Add your work history, education, and skills',
      completed: false,
      href: '/career-profile',
      icon: <Briefcase className="h-4 w-4 text-primary" />
    },
    {
      id: 'career-goal',
      title: 'Set your first career goal',
      description: 'Define what you want to achieve next',
      completed: false,
      href: '/goals',
      icon: <Target className="h-4 w-4 text-green-500" />
    },
    {
      id: 'resume-creation',
      title: 'Create a resume draft',
      description: 'Start building your professional resume',
      completed: false,
      href: '/resumes',
      icon: <FileText className="h-4 w-4 text-orange-500" />
    },
    {
      id: 'job-application',
      title: 'Track your first application',
      description: 'Start managing your job applications',
      completed: false,
      href: '/applications',
      icon: <FileText className="h-4 w-4 text-blue-500" />
    },
    {
      id: 'network-contact',
      title: 'Add 1 contact to your network',
      description: 'Start building your professional network',
      completed: false,
      href: '/contacts',
      icon: <Users className="h-4 w-4 text-indigo-500" />
    }
  ])

  // Update the network contact checklist item based on actual data
  useEffect(() => {
    if (!networkContacts || !Array.isArray(networkContacts)) return

    const hasAtLeastOneContact = networkContacts.length > 0

    setChecklistItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === 'network-contact') {
          return { ...item, completed: hasAtLeastOneContact }
        }
        return item
      })
    })
  }, [networkContacts])

  // Update the career goal checklist item based on actual data
  useEffect(() => {
    if (!userGoals || !Array.isArray(userGoals)) return

    const hasAtLeastOneGoal = userGoals.length > 0

    setChecklistItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === 'career-goal') {
          return { ...item, completed: hasAtLeastOneGoal }
        }
        return item
      })
    })
  }, [userGoals])

  // Update the job application checklist item based on actual data
  useEffect(() => {
    if (!jobApplications || !Array.isArray(jobApplications)) return

    const hasAtLeastOneApplication = jobApplications.length > 0

    setChecklistItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === 'job-application') {
          return { ...item, completed: hasAtLeastOneApplication }
        }
        return item
      })
    })
  }, [jobApplications])

  // Update the resume checklist item based on actual data
  useEffect(() => {
    if (!userResumes || !Array.isArray(userResumes)) return

    const hasAtLeastOneResume = userResumes.length > 0

    setChecklistItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === 'resume-creation') {
          return { ...item, completed: hasAtLeastOneResume }
        }
        return item
      })
    })
  }, [userResumes])

  // Update the career profile checklist item based on profile completion
  useEffect(() => {
    if (!careerData) return

    const sections = [
      !!(careerData as any).careerSummary,
      ((careerData as any).workHistory?.length || 0) > 0,
      ((careerData as any).educationHistory?.length || 0) > 0,
      ((careerData as any).skills?.length || 0) > 0,
      ((careerData as any).certifications?.length || 0) > 0
    ]

    const completedSections = sections.filter(Boolean).length
    const totalSections = sections.length
    const percentageComplete = Math.round((completedSections / totalSections) * 100)
    const isProfileComplete = percentageComplete === 100

    setChecklistItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === 'career-profile') {
          return { ...item, completed: isProfileComplete }
        }
        return item
      })
    })
  }, [careerData])

  // Calculate progress
  const completedCount = checklistItems.filter(item => item.completed).length
  const progressPercentage = (completedCount / checklistItems.length) * 100

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 }
    }
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
