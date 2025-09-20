'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { OnboardingGuard } from '@/components/OnboardingGuard'
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
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

export default function DashboardPage() {
  const { user: clerkUser, isLoaded } = useUser()
  const { user } = useAuth()
  const router = useRouter()

  // Redirect university admins to the University dashboard
  useEffect(() => {
    if (user?.role === 'university_admin') {
      router.replace('/university')
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

  // Fetch real user data
  const goals = useQuery(api.goals.getUserGoals, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')
  const applications = useQuery(api.applications.getUserApplications, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')
  const resumes = useQuery(api.resumes.getUserResumes, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')
  const achievements = useQuery(api.achievements.getUserAchievements, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')

  // Calculate real stats from actual data
  const stats = {
    activeGoals: goals ? goals.filter(goal => goal.status === 'in_progress').length : 0,
    achievementsCount: achievements ? achievements.length : 0,
    resumesCount: resumes ? resumes.length : 0,
    pendingTasks: 0, // This would need to be calculated based on application stages or other criteria
    upcomingInterviews: 0, // Will be calculated when we have stage data
    applications: applications ? applications.length : 0,
    interviewRate: 0 // Will be calculated when we have stage data
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
              <h1 className="text-2xl font-bold font-poppins">Dashboard</h1>
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
                    <div className="flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Create a Goal</div>
                        <div className="text-xs text-muted-foreground">Track your career objectives</div>
                      </div>
                    </div>

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
                          <Users className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <div className="font-medium">Track an Application</div>
                          <div className="text-xs text-muted-foreground">Track your job applications</div>
                        </div>
                      </div>
                    </Link>

                    <Link href="/projects" className="w-full">
                      <div className="flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors">
                        <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center mr-3 flex-shrink-0">
                          <Briefcase className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <div className="font-medium">Add Work History</div>
                          <div className="text-xs text-muted-foreground">Record your work experience</div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            variants={staggeredContainer}
          >
            <motion.div variants={cardAnimation}>
              <StatCard
                icon={<Target className="h-5 w-5 text-primary" />}
                iconBgColor="bg-primary/20"
                iconColor="text-primary"
                label="Active Goals"
                value={stats.activeGoals}
                change={stats.activeGoals > 0 ? {
                  type: 'no-change',
                  text: 'Currently tracking'
                } : {
                  type: 'no-change',
                  text: 'No active goals'
                }}
              />
            </motion.div>

            <motion.div variants={cardAnimation}>
              <StatCard
                icon={<Users className="h-5 w-5 text-blue-500" />}
                iconBgColor="bg-blue-500/20"
                iconColor="text-blue-500"
                label="Applications"
                value={stats.applications}
                change={stats.applications > 0 ? {
                  type: 'no-change',
                  text: 'Currently tracking'
                } : {
                  type: 'no-change',
                  text: 'No applications yet'
                }}
              />
            </motion.div>

            <motion.div variants={cardAnimation}>
              <StatCard
                icon={<Award className="h-5 w-5 text-green-500" />}
                iconBgColor="bg-green-500/20"
                iconColor="text-green-500"
                label="Interview Rate"
                value={stats.applications > 0 ? `${stats.interviewRate}%` : '0%'}
                change={stats.applications > 0 ? {
                  type: 'no-change',
                  text: 'Based on current apps'
                } : {
                  type: 'no-change',
                  text: 'No applications yet'
                }}
              />
            </motion.div>

            <motion.div variants={cardAnimation}>
              <StatCard
                icon={<Clock className="h-5 w-5 text-orange-500" />}
                iconBgColor="bg-orange-500/20"
                iconColor="text-orange-500"
                label="Pending Tasks"
                value={stats.pendingTasks}
                change={{
                  type: 'no-change',
                  text: stats.pendingTasks > 0
                    ? `${stats.pendingTasks} item${stats.pendingTasks !== 1 ? 's' : ''} need attention`
                    : 'All caught up!'
                }}
              />
            </motion.div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            className="mb-6"
            variants={cardAnimation}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col space-y-1.5 mb-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight">Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">Your latest career development actions</p>
                </div>
                <div className="space-y-4">
                  {goals && goals.length > 0 ? (
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {goals.length > 1
                            ? `Set ${goals.length} career goals`
                            : 'Set your first career goal'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">Recent activity</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No recent activity yet</p>
                      <p className="text-xs">Start by setting your first career goal!</p>
                    </div>
                  )}

                  {applications && applications.length > 0 && (
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {applications.length > 1
                            ? `Tracking ${applications.length} job applications`
                            : 'Started tracking your first job application'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">Recent activity</p>
                      </div>
                    </div>
                  )}

                  {resumes && resumes.length > 0 && (
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {resumes.length > 1
                            ? `Created ${resumes.length} resumes`
                            : 'Created your first resume'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">Recent activity</p>
                      </div>
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