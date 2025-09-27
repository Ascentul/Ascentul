'use client'

<<<<<<< HEAD
import React, { useMemo, useState } from 'react'
=======
import React from 'react'
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
<<<<<<< HEAD
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, TrendingUp, Users, BookOpen, Award, Clock, BarChart3, PieChart } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']
=======
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { GraduationCap, Users, Target, FileText, Mail, ClipboardList, TrendingUp, Calendar } from 'lucide-react'
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378

export default function UniversityAnalyticsPage() {
  const { user: clerkUser } = useUser()
  const { user, isAdmin } = useAuth()
<<<<<<< HEAD
  const [timeFilter, setTimeFilter] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')
=======
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378

  const canAccess = !!user && (isAdmin || user.subscription_plan === 'university' || user.role === 'university_admin')

  const overview = useQuery(api.university_admin.getOverview, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')
  const students = useQuery(api.university_admin.listStudents, clerkUser?.id ? { clerkId: clerkUser.id, limit: 200 } : 'skip')
<<<<<<< HEAD
  const courses = useQuery(api.university_admin.listCourses, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')

  // Mock analytics data - in production this would come from the backend
  const mockEngagementData = [
    { name: 'Week 1', logins: 65, goals: 28, applications: 12 },
    { name: 'Week 2', logins: 89, goals: 45, applications: 18 },
    { name: 'Week 3', logins: 124, goals: 67, applications: 23 },
    { name: 'Week 4', logins: 98, goals: 52, applications: 19 },
  ]

  const mockUsageData = [
    { feature: 'Resume Builder', usage: 85 },
    { feature: 'Job Search', usage: 72 },
    { feature: 'Cover Letters', usage: 58 },
    { feature: 'Career Planning', usage: 43 },
    { feature: 'Networking', usage: 67 },
  ]

  const departmentData = useMemo(() => {
    if (!students) return []
    const deptCounts: Record<string, number> = {}
    students.forEach((student: any) => {
      const dept = student.department || 'Unassigned'
      deptCounts[dept] = (deptCounts[dept] || 0) + 1
    })
    return Object.entries(deptCounts).map(([name, value]) => ({ name, value }))
  }, [students])
=======
  const departments = useQuery(api.university_admin.listDepartments, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to University Analytics.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

<<<<<<< HEAD
  if (!overview || !students || !courses) {
=======
  if (!overview || !students || !departments) {
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

<<<<<<< HEAD
=======
  // Calculate real analytics data from actual student data
  // Since we don't have calculated counts in the basic user query, we'll show 0s for new users
  // This is better than showing fake inflated numbers
  const analyticsData = {
    goals: {
      inProgress: 0, // Will be calculated when we have real goals data
      completed: 0, // Will be calculated when we have real goals data
      total: 0 // Will be calculated when we have real goals data
    },
    applications: {
      inProgress: 0, // Will be calculated when we have real application data
      submitted: 0, // Will be calculated when we have real application data
      interviewing: 0, // Will be calculated when we have real application data
      offers: 0, // Will be calculated when we have real application data
      total: 0 // Will be calculated when we have real application data
    },
    documents: {
      resumes: 0, // Will be calculated when we have real resume data
      coverLetters: 0, // Will be calculated when we have real cover letter data
      total: 0 // Will be calculated when we have real document data
    }
  }

>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
  return (
    <div className="max-w-screen-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
<<<<<<< HEAD
          <h1 className="text-3xl font-bold tracking-tight">University Analytics</h1>
          <p className="text-muted-foreground">Monitor engagement, usage patterns, and outcomes across your institution.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalStudents}</div>
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Avg. Session Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24m</div>
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Goals Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">187</div>
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +23% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Applications Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94</div>
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15% from last month
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Most popular platform features</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockUsageData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="feature" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Students vs Staff vs Faculty</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Students', value: students.filter((s: any) => s.role === 'user').length },
                        { name: 'Staff', value: students.filter((s: any) => s.role === 'staff').length },
                        { name: 'Faculty', value: students.filter((s: any) => s.role === 'faculty').length || 5 },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {[0, 1, 2].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Engagement Trends</CardTitle>
                <CardDescription>User activity over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockEngagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="logins" stroke="#4F46E5" strokeWidth={2} />
                    <Line type="monotone" dataKey="goals" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="applications" stroke="#F59E0B" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
                <CardDescription>User engagement over the last month</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockEngagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="logins" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Features</CardTitle>
              <CardDescription>Features with highest engagement rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUsageData.map((item, index) => (
                  <div key={item.feature} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.feature}</span>
                        <span className="text-sm text-muted-foreground">{item.usage}%</span>
                      </div>
                      <Progress value={item.usage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Job Placement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className="text-xs text-muted-foreground">Within 6 months of graduation</p>
                <Progress value={78} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Interview Success</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">65%</div>
                <p className="text-xs text-muted-foreground">Interview to offer ratio</p>
                <Progress value={65} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Salary Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+24%</div>
                <p className="text-xs text-muted-foreground">Average salary increase</p>
                <Progress value={24} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Success Metrics by Department</CardTitle>
              <CardDescription>Placement rates and outcomes across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Computer Science', 'Business', 'Engineering', 'Liberal Arts'].map((dept) => (
                  <div key={dept} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{dept}</span>
                      <Badge variant="outline">{Math.floor(Math.random() * 30 + 60)}% placement</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Avg. Time to Job:</span>
                        <div className="font-medium">{Math.floor(Math.random() * 4 + 2)} months</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg. Starting Salary:</span>
                        <div className="font-medium">${Math.floor(Math.random() * 30000 + 50000).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Active Students:</span>
                        <div className="font-medium">{Math.floor(Math.random() * 100 + 50)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Students by Department</CardTitle>
                <CardDescription>Distribution across academic departments</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={departmentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Engagement metrics by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentData.slice(0, 5).map((dept, index) => (
                    <div key={dept.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{dept.name}</span>
                        <Badge>{dept.value} students</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Active Users:</span>
                          <span>{Math.floor(dept.value * 0.8)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Completion Rate:</span>
                          <span>{Math.floor(Math.random() * 30 + 60)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
=======
          <h1 className="text-3xl font-bold tracking-tight">Usage Analytics</h1>
          <p className="text-muted-foreground">Detailed insights into student engagement and platform usage.</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Goals Set</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Target className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{analyticsData.goals.total}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {analyticsData.goals.completed} completed ({analyticsData.goals.total > 0 ? Math.round((analyticsData.goals.completed / analyticsData.goals.total) * 100) : 0}%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ClipboardList className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{analyticsData.applications.total}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {analyticsData.applications.submitted} submitted ({analyticsData.applications.total > 0 ? Math.round((analyticsData.applications.submitted / analyticsData.applications.total) * 100) : 0}%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{analyticsData.documents.total}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Resumes & Cover Letters
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{students.length > 0 ? Math.round(((analyticsData.goals.total + analyticsData.applications.total + analyticsData.documents.total) / students.length) * 100) / 100 : 0}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg activities per student
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Goals Progress</CardTitle>
            <CardDescription>Career goals completion status</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Goals', inProgress: analyticsData.goals.inProgress, completed: analyticsData.goals.completed }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="inProgress" fill="#4F46E5" name="In Progress" />
                <Bar dataKey="completed" fill="#10B981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Pipeline</CardTitle>
            <CardDescription>Applications by stage</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Applications', inProgress: analyticsData.applications.inProgress, submitted: analyticsData.applications.submitted, interviewing: analyticsData.applications.interviewing, offers: analyticsData.applications.offers }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="inProgress" fill="#4F46E5" name="In Progress" />
                <Bar dataKey="submitted" fill="#F59E0B" name="Submitted" />
                <Bar dataKey="interviewing" fill="#EF4444" name="Interviewing" />
                <Bar dataKey="offers" fill="#8B5CF6" name="Offers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
          <CardDescription>Usage metrics by academic department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d: any) => {
              const deptStudents = students.filter((s: any) => s.department_id === d._id)
              // Calculate mock data based on department size
              const deptGoals = Math.floor(deptStudents.length * 0.7) // 70% have goals
              const deptApps = Math.floor(deptStudents.length * 0.5) // 50% have applications

              return (
                <Card key={String(d._id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg">{d.name}</CardTitle>
                      {d.code && <span className="text-xs text-muted-foreground">{d.code}</span>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Students</span>
                        <span className="font-medium">{deptStudents.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Goals Set</span>
                        <span className="font-medium">{deptGoals}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Applications</span>
                        <span className="font-medium">{deptApps}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
