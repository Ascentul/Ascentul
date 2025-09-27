'use client'

import React, { useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
<<<<<<< HEAD
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
=======
import { Loader2, ShieldCheck } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'

const PIE_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378

export default function AdminDashboardPage() {
  const { user: clerkUser } = useUser()
  const { user } = useAuth()

<<<<<<< HEAD
  const users = useQuery(api.users.getAllUsers, clerkUser?.id ? { clerkId: clerkUser.id, limit: 100 } : 'skip')

  // Mock data for comprehensive analytics
  const systemStats = {
    totalUsers: 2847,
    totalUniversities: 23,
    activeUsers: 1924,
    systemHealth: 98.5,
    monthlyGrowth: 15.3,
    supportTickets: 45,
    systemUptime: 99.9
  }

  const userGrowthData = [
    { month: 'Jul', users: 1856, universities: 18 },
    { month: 'Aug', users: 2134, universities: 19 },
    { month: 'Sep', users: 2387, universities: 21 },
    { month: 'Oct', users: 2542, universities: 22 },
    { month: 'Nov', users: 2743, universities: 23 },
    { month: 'Dec', users: 2847, universities: 23 },
  ]

  const subscriptionData = [
    { name: 'University', value: 1824, color: '#4F46E5' },
    { name: 'Premium', value: 923, color: '#10B981' },
    { name: 'Free', value: 100, color: '#F59E0B' },
  ]

  const universityData = [
    { name: 'Harvard University', users: 287, status: 'Active' },
    { name: 'Stanford University', users: 245, status: 'Active' },
    { name: 'MIT', users: 198, status: 'Active' },
    { name: 'UC Berkeley', users: 176, status: 'Active' },
    { name: 'Yale University', users: 134, status: 'Active' },
  ]

  const activityData = [
    { day: 'Mon', logins: 1247, registrations: 23 },
    { day: 'Tue', logins: 1389, registrations: 34 },
    { day: 'Wed', logins: 1156, registrations: 28 },
    { day: 'Thu', logins: 1423, registrations: 41 },
    { day: 'Fri', logins: 1285, registrations: 36 },
    { day: 'Sat', logins: 845, registrations: 12 },
    { day: 'Sun', logins: 738, registrations: 8 },
  ]

  const recentActivity = [
    { type: 'registration', user: 'John Smith', university: 'Harvard University', time: '2 minutes ago' },
    { type: 'support', user: 'Sarah Johnson', issue: 'Login issues', time: '5 minutes ago' },
    { type: 'university', action: 'New university registered', name: 'Princeton University', time: '1 hour ago' },
    { type: 'alert', message: 'High API usage detected', severity: 'warning', time: '2 hours ago' },
    { type: 'registration', user: 'Mike Chen', university: 'Stanford University', time: '3 hours ago' },
  ]
=======
  const role = user?.role
  const canAccess = role === 'super_admin' || role === 'admin'
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378

  const usersResult = useQuery(
    api.users.getAllUsers,
    clerkUser?.id && canAccess ? { clerkId: clerkUser.id, limit: 500 } : 'skip'
  )

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

<<<<<<< HEAD
  if (!users) {
=======
  const metrics = useMemo(() => {
    if (!usersResult) return null

    const users = (usersResult?.page as any[]) || []

    const totalUsers = users.length
    const now = Date.now()
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000) // 30 days in milliseconds

    // Calculate real metrics from user data
    const activeUsers = users.filter((u: any) => {
      // Consider users active if they have been updated in the last 7 days
      // or if they signed up in the last 30 days
      const lastActivity = u.updated_at || u.created_at
      return lastActivity > (now - (7 * 24 * 60 * 60 * 1000))
    }).length

    const newSignups = users.filter((u: any) => {
      // Users who signed up in the last 30 days
      return u.created_at > thirtyDaysAgo
    }).length

    const universitiesCount = new Set(
      users
        .filter((u: any) => u.university_id)
        .map((u: any) => String(u.university_id))
    ).size

    // Real growth data based on created_at timestamps
    const monthlyGrowth: Record<string, number> = {}
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        timestamp: date.getTime()
      }
    })

    // Count users by month they were created
    for (const user of users) {
      const createdDate = new Date(user.created_at)
      const monthKey = createdDate.toLocaleDateString('en-US', { month: 'short' })
      monthlyGrowth[monthKey] = (monthlyGrowth[monthKey] || 0) + 1
    }

    // Fill in missing months with 0
    const growth = last6Months.map(({ month }) => ({
      month,
      users: monthlyGrowth[month] || 0
    }))

    const byRole: Record<string, number> = {}
    const byPlan: Record<string, number> = {}
    for (const u of users) {
      byRole[u.role] = (byRole[u.role] || 0) + 1
      byPlan[u.subscription_plan] = (byPlan[u.subscription_plan] || 0) + 1
    }

    const roleData = Object.entries(byRole).map(([name, value]) => ({ name, value }))
    const planData = Object.entries(byPlan).map(([name, value]) => ({ name, value }))

    // Feature usage based on actual user counts (more realistic estimates)
    // These could be calculated from real usage data when available
    const featureUsage = [
      { name: 'Goals', value: Math.max(1, Math.round(totalUsers * 0.45)) },
      { name: 'Applications', value: Math.max(1, Math.round(totalUsers * 0.3)) },
      { name: 'Interviews', value: Math.max(1, Math.round(totalUsers * 0.2)) },
      { name: 'Documents', value: Math.max(1, Math.round(totalUsers * 0.35)) },
      { name: 'Contacts', value: Math.max(1, Math.round(totalUsers * 0.25)) },
    ]

    return { totalUsers, activeUsers, universitiesCount, newSignups, growth, roleData, planData, featureUsage }
  }, [usersResult])

  if (!usersResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!metrics) {
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
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

<<<<<<< HEAD
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="universities">Universities</TabsTrigger>
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
                          {activity.type === 'registration' && (
                            <>New user <strong>{activity.user}</strong> registered at {activity.university}</>
                          )}
                          {activity.type === 'support' && (
                            <>Support ticket from <strong>{activity.user}</strong>: {activity.issue}</>
                          )}
                          {activity.type === 'university' && (
                            <>{activity.action}: <strong>{activity.name}</strong></>
                          )}
                          {activity.type === 'alert' && (
                            <>System alert: {activity.message}</>
                          )}
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
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analytics</CardTitle>
              <CardDescription>In-depth platform metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Advanced analytics features coming soon...</p>
            </CardContent>
          </Card>
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
=======
      {/* Top Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Users</CardTitle>
            <CardDescription>+2% from last month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{metrics?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Active Users</CardTitle>
            <CardDescription>+1% from last month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{metrics?.activeUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Universities</CardTitle>
            <CardDescription>+1 from last month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{metrics?.universitiesCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New Signups (30d)</CardTitle>
            <CardDescription>+4% from last month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{metrics?.newSignups || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Growth + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics?.growth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#4F46E5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>By Role and Plan</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics?.roleData || []} dataKey="value" nameKey="name" outerRadius={90} label>
                    {(metrics?.roleData || []).map((_, i) => (
                      <Cell key={String(i)} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics?.planData || []} dataKey="value" nameKey="name" outerRadius={90} label>
                    {(metrics?.planData || []).map((_, i) => (
                      <Cell key={String(i)} fill={PIE_COLORS[(i+2) % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage</CardTitle>
          <CardDescription>Aggregate usage signals</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics?.featureUsage || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Usage" fill="#0EA5E9" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
    </div>
  )
}
