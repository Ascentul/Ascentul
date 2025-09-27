'use client'

import React, { useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
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

export default function UniversityAnalyticsPage() {
  const { user: clerkUser } = useUser()
  const { user, isAdmin } = useAuth()
  const [timeFilter, setTimeFilter] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')

  const canAccess = !!user && (isAdmin || user.subscription_plan === 'university' || user.role === 'university_admin')

  const overview = useQuery(api.university_admin.getOverview, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')
  const students = useQuery(api.university_admin.listStudents, clerkUser?.id ? { clerkId: clerkUser.id, limit: 200 } : 'skip')
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

  if (!overview || !students || !courses) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-screen-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
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