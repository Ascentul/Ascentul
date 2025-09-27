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
    </div>
  )
}
