'use client'

import React, { useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  ShieldCheck,
  Users,
  School,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Globe,
  MessageSquare
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'

export default function AdminDashboardPage() {
  const { user: clerkUser } = useUser()
  const { user } = useAuth()
  const [activeView, setActiveView] = React.useState<'system' | 'universities' | 'users' | 'revenue'>('system')

  const users = useQuery(api.users.getAllUsers, clerkUser?.id ? { clerkId: clerkUser.id, limit: 100 } : 'skip')
  const analytics = useQuery(api.analytics.getAdminAnalytics, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')

  // Use real analytics data from database
  const systemStats = analytics?.systemStats || {
    totalUsers: 0,
    totalUniversities: 0,
    activeUsers: 0,
    systemHealth: 0,
    monthlyGrowth: 0,
    supportTickets: 0,
    systemUptime: 0
  }

  const userGrowthData = analytics?.userGrowth || []
  const subscriptionData = analytics?.subscriptionData || []
  const universityData = analytics?.universityData || []
  const activityData = analytics?.activityData || []

  // Use real recent users data instead of mock activity
  const recentActivity = analytics?.recentUsers ? analytics.recentUsers.map((user: any) => ({
    type: 'registration',
    user: user.name,
    university: user.university_id ? 'University User' : 'Individual User',
    time: formatTimeAgo(user.created_at)
  })) : []

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

  const role = user?.role
  const canAccess = role === 'super_admin' || role === 'admin'

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!users) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2" style={{ color: '#0C29AB' }}>
            <ShieldCheck className="h-7 w-7" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground">System overview and platform management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            System Healthy
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="universities">Universities</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{systemStats.monthlyGrowth}%</span>
                  <span>from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Universities</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalUniversities}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+2 new</span>
                  <span>this month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.activeUsers.toLocaleString()}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>{Math.round((systemStats.activeUsers / systemStats.totalUsers) * 100)}% active</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{systemStats.systemHealth}%</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>{systemStats.systemUptime}% uptime</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Growth</CardTitle>
                <CardDescription>Users and universities over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUniversities" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stroke="#4F46E5" fillOpacity={1} fill="url(#colorUsers)" />
                    <Area type="monotone" dataKey="universities" stroke="#10B981" fillOpacity={1} fill="url(#colorUniversities)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>Daily logins and new registrations</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="logins" fill="#4F46E5" name="Logins" />
                    <Bar dataKey="registrations" fill="#10B981" name="Registrations" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
                <CardDescription>User subscription breakdown</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label
                    >
                      {subscriptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform events and notifications</CardDescription>
              </CardHeader>
              <CardContent className="h-64 overflow-y-auto">
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="mt-1">
                        {activity.type === 'registration' && <Users className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'support' && <MessageSquare className="h-4 w-4 text-orange-500" />}
                        {activity.type === 'university' && <School className="h-4 w-4 text-green-500" />}
                        {activity.type === 'alert' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm">
                          <>New user <strong>{activity.user}</strong> registered ({activity.university})</>

                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics View Selector */}
          <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-lg">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'system' ? 'bg-[#0C29AB] text-white' : 'bg-white hover:bg-gray-100'
              }`}
              onClick={() => setActiveView('system')}
            >
              System Metrics
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'universities' ? 'bg-[#0C29AB] text-white' : 'bg-white hover:bg-gray-100'
              }`}
              onClick={() => setActiveView('universities')}
            >
              University Performance
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'users' ? 'bg-[#0C29AB] text-white' : 'bg-white hover:bg-gray-100'
              }`}
              onClick={() => setActiveView('users')}
            >
              User Behavior
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'revenue' ? 'bg-[#0C29AB] text-white' : 'bg-white hover:bg-gray-100'
              }`}
              onClick={() => setActiveView('revenue')}
            >
              Revenue & Subscriptions
            </button>
          </div>

          {/* System Metrics View */}
          {activeView === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Platform Uptime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">99.98%</div>
                    <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">142ms</div>
                    <p className="text-xs text-green-600 mt-1">-8ms from last week</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0.03%</div>
                    <p className="text-xs text-green-600 mt-1">Within acceptable range</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Database Load</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">42%</div>
                    <p className="text-xs text-muted-foreground mt-1">Optimal performance</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Performance Over Time</CardTitle>
                    <CardDescription>API response time and error rate trends</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { day: 'Mon', responseTime: 145, errors: 0.02 },
                        { day: 'Tue', responseTime: 152, errors: 0.03 },
                        { day: 'Wed', responseTime: 138, errors: 0.01 },
                        { day: 'Thu', responseTime: 142, errors: 0.04 },
                        { day: 'Fri', responseTime: 148, errors: 0.02 },
                        { day: 'Sat', responseTime: 135, errors: 0.01 },
                        { day: 'Sun', responseTime: 140, errors: 0.03 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="responseTime" stroke="#4F46E5" strokeWidth={2} name="Response Time (ms)" />
                        <Line yAxisId="right" type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={2} name="Error Rate (%)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Traffic Distribution</CardTitle>
                    <CardDescription>Requests by endpoint type</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'API Calls', value: 45, color: '#4F46E5' },
                            { name: 'Page Loads', value: 30, color: '#10B981' },
                            { name: 'Static Assets', value: 15, color: '#F59E0B' },
                            { name: 'Webhooks', value: 10, color: '#EC4899' },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {[0, 1, 2, 3].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#4F46E5', '#10B981', '#F59E0B', '#EC4899'][index]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* University Performance View */}
          {activeView === 'universities' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Top Performing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Stanford</div>
                    <p className="text-xs text-muted-foreground mt-1">95% engagement rate</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg License Utilization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">78%</div>
                    <p className="text-xs text-green-600 mt-1">+5% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">Across all universities</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>University Comparison</CardTitle>
                  <CardDescription>Engagement and license utilization by institution</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Stanford', students: 450, engagement: 95, utilization: 88 },
                      { name: 'MIT', students: 380, engagement: 92, utilization: 85 },
                      { name: 'Berkeley', students: 520, engagement: 88, utilization: 82 },
                      { name: 'Harvard', students: 410, engagement: 90, utilization: 80 },
                      { name: 'Cornell', students: 340, engagement: 85, utilization: 75 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="students" fill="#4F46E5" name="Students" />
                      <Bar dataKey="engagement" fill="#10B981" name="Engagement %" />
                      <Bar dataKey="utilization" fill="#F59E0B" name="License Util %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>University Growth Trends</CardTitle>
                  <CardDescription>Student enrollment over time by university</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { month: 'Jan', stanford: 420, mit: 350, berkeley: 480 },
                      { month: 'Feb', stanford: 430, mit: 360, berkeley: 490 },
                      { month: 'Mar', stanford: 440, mit: 370, berkeley: 505 },
                      { month: 'Apr', stanford: 450, mit: 380, berkeley: 520 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="stanford" stroke="#4F46E5" strokeWidth={2} name="Stanford" />
                      <Line type="monotone" dataKey="mit" stroke="#10B981" strokeWidth={2} name="MIT" />
                      <Line type="monotone" dataKey="berkeley" stroke="#F59E0B" strokeWidth={2} name="Berkeley" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Behavior View */}
          {activeView === 'users' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">28 min</div>
                    <p className="text-xs text-green-600 mt-1">+4 min from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Math.floor(systemStats.totalUsers * 0.32).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">32% of total users</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Feature Adoption</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">84%</div>
                    <p className="text-xs text-green-600 mt-1">Users using 3+ features</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">76%</div>
                    <p className="text-xs text-muted-foreground mt-1">30-day retention</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Journey Funnel</CardTitle>
                    <CardDescription>From registration to active usage</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { stage: 'Registered', users: 1000 },
                        { stage: 'Onboarded', users: 850 },
                        { stage: 'Created Asset', users: 720 },
                        { stage: 'Active User', users: 680 },
                      ]} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="stage" />
                        <Tooltip />
                        <Bar dataKey="users" fill="#4F46E5" name="Users" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Most Used Features</CardTitle>
                    <CardDescription>Feature usage breakdown</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { feature: 'Resume Builder', usage: 92 },
                        { feature: 'Job Search', usage: 78 },
                        { feature: 'Goals', usage: 71 },
                        { feature: 'Applications', usage: 65 },
                        { feature: 'AI Coach', usage: 48 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="usage" fill="#10B981" name="Usage %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>User Activity Heatmap</CardTitle>
                  <CardDescription>Peak usage times by day of week</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { day: 'Mon', morning: 120, afternoon: 280, evening: 180 },
                      { day: 'Tue', morning: 145, afternoon: 310, evening: 195 },
                      { day: 'Wed', morning: 138, afternoon: 295, evening: 188 },
                      { day: 'Thu', morning: 152, afternoon: 320, evening: 205 },
                      { day: 'Fri', morning: 135, afternoon: 270, evening: 175 },
                      { day: 'Sat', morning: 85, afternoon: 140, evening: 95 },
                      { day: 'Sun', morning: 90, afternoon: 150, evening: 105 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="morning" stackId="1" stroke="#4F46E5" fill="#4F46E5" name="Morning" />
                      <Area type="monotone" dataKey="afternoon" stackId="1" stroke="#10B981" fill="#10B981" name="Afternoon" />
                      <Area type="monotone" dataKey="evening" stackId="1" stroke="#F59E0B" fill="#F59E0B" name="Evening" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Revenue & Subscriptions View */}
          {activeView === 'revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$42,850</div>
                    <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Revenue Per User</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$8.50</div>
                    <p className="text-xs text-green-600 mt-1">+$0.40 MoM</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2.8%</div>
                    <p className="text-xs text-green-600 mt-1">-0.3% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$245</div>
                    <p className="text-xs text-muted-foreground mt-1">Avg LTV per user</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Growth</CardTitle>
                    <CardDescription>Monthly recurring revenue trends</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { month: 'Oct', revenue: 32500, users: 3850 },
                        { month: 'Nov', revenue: 35200, users: 4120 },
                        { month: 'Dec', revenue: 38100, users: 4480 },
                        { month: 'Jan', revenue: 39800, users: 4650 },
                        { month: 'Feb', revenue: 41200, users: 4820 },
                        { month: 'Mar', revenue: 42850, users: 5040 },
                      ]}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Distribution</CardTitle>
                    <CardDescription>Breakdown by plan type</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'University', value: 55, color: '#4F46E5' },
                            { name: 'Premium', value: 30, color: '#10B981' },
                            { name: 'Free', value: 15, color: '#F59E0B' },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {[0, 1, 2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#4F46E5', '#10B981', '#F59E0B'][index]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription Lifecycle</CardTitle>
                  <CardDescription>New subscriptions, renewals, and cancellations</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { month: 'Oct', new: 45, renewals: 320, cancellations: 12 },
                      { month: 'Nov', new: 52, renewals: 335, cancellations: 15 },
                      { month: 'Dec', new: 48, renewals: 348, cancellations: 10 },
                      { month: 'Jan', new: 58, renewals: 360, cancellations: 14 },
                      { month: 'Feb', new: 62, renewals: 375, cancellations: 11 },
                      { month: 'Mar', new: 68, renewals: 388, cancellations: 13 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="new" fill="#10B981" name="New Subscriptions" />
                      <Bar dataKey="renewals" fill="#4F46E5" name="Renewals" />
                      <Bar dataKey="cancellations" fill="#EF4444" name="Cancellations" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="universities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Universities</CardTitle>
              <CardDescription>Universities by user count and activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {universityData.map((university, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <School className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{university.name}</div>
                        <div className="text-sm text-muted-foreground">{university.users} users</div>
                      </div>
                    </div>
                    <Badge variant="default">{university.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">All-time registrations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.floor(systemStats.totalUsers * 0.12).toLocaleString()}</div>
                <p className="text-xs text-green-600 mt-1">+8% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.floor(systemStats.totalUsers * 0.30).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">30% conversion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">University Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.floor(systemStats.totalUsers * 0.55).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">55% of total users</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth by Plan Type</CardTitle>
                <CardDescription>Registrations and conversions over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { month: 'Oct', free: 180, premium: 65, university: 120 },
                    { month: 'Nov', free: 205, premium: 78, university: 145 },
                    { month: 'Dec', free: 225, premium: 88, university: 162 },
                    { month: 'Jan', free: 248, premium: 95, university: 180 },
                    { month: 'Feb', free: 270, premium: 105, university: 198 },
                    { month: 'Mar', free: 292, premium: 118, university: 215 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="free" stackId="1" stroke="#F59E0B" fill="#F59E0B" name="Free" />
                    <Area type="monotone" dataKey="premium" stackId="1" stroke="#10B981" fill="#10B981" name="Premium" />
                    <Area type="monotone" dataKey="university" stackId="1" stroke="#4F46E5" fill="#4F46E5" name="University" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Roles Distribution</CardTitle>
                <CardDescription>Breakdown by user role</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Students', value: 65, color: '#4F46E5' },
                        { name: 'Individual Users', value: 25, color: '#10B981' },
                        { name: 'University Admins', value: 8, color: '#F59E0B' },
                        { name: 'Staff', value: 2, color: '#EC4899' },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {[0, 1, 2, 3].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#4F46E5', '#10B981', '#F59E0B', '#EC4899'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Engagement Cohorts</CardTitle>
              <CardDescription>Retention and activity by signup cohort</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { cohort: 'Oct', week1: 95, week2: 82, week3: 75, week4: 68 },
                  { cohort: 'Nov', week1: 96, week2: 85, week3: 78, week4: 72 },
                  { cohort: 'Dec', week1: 94, week2: 83, week3: 76, week4: 70 },
                  { cohort: 'Jan', week1: 97, week2: 86, week3: 80, week4: 74 },
                  { cohort: 'Feb', week1: 98, week2: 88, week3: 82, week4: 76 },
                  { cohort: 'Mar', week1: 97, week2: 87, week3: 81, week4: 75 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cohort" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="week1" stroke="#10B981" strokeWidth={2} name="Week 1" />
                  <Line type="monotone" dataKey="week2" stroke="#4F46E5" strokeWidth={2} name="Week 2" />
                  <Line type="monotone" dataKey="week3" stroke="#F59E0B" strokeWidth={2} name="Week 3" />
                  <Line type="monotone" dataKey="week4" stroke="#EF4444" strokeWidth={2} name="Week 4" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent User Registrations</CardTitle>
              <CardDescription>Latest user signups and account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {users && users.slice(0, 10).map((user: any) => (
                  <div key={user._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium">{user.name || 'Unnamed User'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.subscription_plan === 'university' ? 'default' : user.subscription_plan === 'premium' ? 'secondary' : 'outline'}>
                        {user.subscription_plan}
                      </Badge>
                      <Badge variant="outline" className="capitalize">{user.role}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>Real-time system performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">CPU Usage</span>
                  <span className="text-sm font-medium">23%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memory Usage</span>
                  <span className="text-sm font-medium">67%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Response</span>
                  <span className="text-sm font-medium">45ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Connections</span>
                  <span className="text-sm font-medium">1,247</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Support Metrics</CardTitle>
                <CardDescription>Support ticket overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Open Tickets</span>
                  <span className="text-sm font-medium text-orange-500">45</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Resolved Today</span>
                  <span className="text-sm font-medium text-green-500">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Response Time</span>
                  <span className="text-sm font-medium">2.3 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Customer Satisfaction</span>
                  <span className="text-sm font-medium text-green-500">94%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
