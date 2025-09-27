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

  // Updated stats data per testing requirements
  const stats = {
    nextInterview: "Tomorrow 2PM",
    activeApplications: 12,
    pendingTasks: 4,
    activeGoals: 3,
    upcomingInterviews: 1,
    interviewRate: 25
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
                          <Users className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <div className="font-medium">Track an Application</div>
                          <div className="text-xs text-muted-foreground">Track your job applications</div>
                        </div>
                      </div>
                    </Link>

                    <Link href="/contacts" className="w-full">
                      <div className="flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors">
                        <div className="h-9 w-9 rounded-full bg-orange-500/10 flex items-center justify-center mr-3 flex-shrink-0">
                          <Users className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <div className="font-medium">Add Contact</div>
                          <div className="text-xs text-muted-foreground">Add a new contact to your network</div>
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
                icon={<Calendar className="h-5 w-5 text-primary" />}
                iconBgColor="bg-primary/20"
                iconColor="text-primary"
                label="Next Interview"
                value={stats.nextInterview}
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
                label="Pending Tasks"
                value={stats.pendingTasks}
                change={{
                  type: stats.pendingTasks > 0 ? 'increase' : 'no-change',
                  text: stats.pendingTasks > 0
                    ? `${stats.pendingTasks} item${stats.pendingTasks !== 1 ? 's' : ''} need attention`
                    : 'No pending tasks'
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
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Updated resume for Software Engineer position</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Applied to TechCorp Inc.</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Generated cover letter with AI</p>
                      <p className="text-xs text-muted-foreground">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Missing Dashboard Components Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
            variants={staggeredContainer}
          >
            {/* Onboarding Checklist */}
            <motion.div variants={cardAnimation}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Welcome to Ascentful Onboarding</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckSquare className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground line-through">Complete your profile</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckSquare className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground line-through">Set your first career goal</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Square className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Upload your resume</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Square className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Connect with 5 professionals</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Career Goals Summary */}
            <motion.div variants={cardAnimation}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Career Goals Overview</h3>
                    <Link href="/goals" className="text-sm text-primary hover:underline">View all</Link>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Get promoted to Senior Developer</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">In Progress</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Complete React certification</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">75% done</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Build portfolio website</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Planning</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Active Interviews Summary */}
            <motion.div variants={cardAnimation}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Active Interviews</h3>
                    <Link href="/applications" className="text-sm text-primary hover:underline">View all</Link>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">TechCorp Inc.</p>
                        <p className="text-xs text-muted-foreground">Senior Developer</p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Tomorrow 2PM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">StartupXYZ</p>
                        <p className="text-xs text-muted-foreground">Full Stack Engineer</p>
                      </div>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Pending</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Follow-up Actions */}
            <motion.div variants={cardAnimation}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Follow-up Actions</h3>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">4 pending</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Thank you email to TechCorp</span>
                      <span className="text-xs text-muted-foreground">Due today</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Follow up with recruiter at StartupXYZ</span>
                      <span className="text-xs text-muted-foreground">Due tomorrow</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Update LinkedIn with new skills</span>
                      <span className="text-xs text-muted-foreground">Due Friday</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* AI Career Coach and Today's Recommendations */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
            variants={staggeredContainer}
          >
            {/* AI Career Coach */}
            <motion.div variants={cardAnimation}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Bot className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">AI Career Coach</h3>
                    {user?.subscription_plan === 'free' && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pro</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Get personalized career advice based on your goals and progress.
                    </p>
                    <Link
                      href="/ai-coach"
                      className="inline-flex items-center space-x-2 text-sm text-primary hover:underline"
                    >
                      <span>Start coaching session</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Today's Recommendations */}
            <motion.div variants={cardAnimation}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold">Today's Recommendations</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium">Update your resume</p>
                      <p className="text-xs text-muted-foreground">Add your recent project experience</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium">Practice interview questions</p>
                      <p className="text-xs text-muted-foreground">Prepare for tomorrow's interview</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium">Connect with Sarah from NetworkEvent</p>
                      <p className="text-xs text-muted-foreground">Send a LinkedIn connection request</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
    </OnboardingGuard>
  )
}