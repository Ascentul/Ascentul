'use client'

import React, { useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
<<<<<<< HEAD
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import {
  Loader2,
  ShieldCheck,
  BarChart,
  Users,
  School,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Eye,
  MessageSquare,
  Server,
  Clock,
  Globe
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts'
=======
import { Loader2, ShieldCheck, BarChart, Users, Activity, Clock, TrendingUp, Filter, Calendar, PieChart, BarChart3 } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart as RechartsBarChart, Bar } from 'recharts'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378

export default function AdminAnalyticsPage() {
  const { user: clerkUser } = useUser()
  const { user } = useAuth()

  const [dateRange, setDateRange] = useState('30d')
  const [universityFilter, setUniversityFilter] = useState('all')
  const [metricType, setMetricType] = useState('overview')

  const role = user?.role
  const isSuperOrAdmin = role === 'super_admin' || role === 'admin'
<<<<<<< HEAD
  const usersResult = useQuery(
    api.users.getAllUsers,
    clerkUser?.id && isSuperOrAdmin ? { clerkId: clerkUser.id, limit: 1000 } : 'skip'
  )

  // Enhanced mock data for comprehensive analytics
  const analyticsData = {
    overview: {
      totalUsers: 2847,
      totalUniversities: 24,
      activeUsers: 1924,
      newUsersThisMonth: 312,
      monthlyGrowthRate: 15.3,
      revenueGrowthRate: 23.1,
      supportTicketsResolved: 156,
      systemUptime: 99.9
    },
    userGrowthData: [
      { date: '2024-07', users: 1856, universities: 18, revenue: 185600 },
      { date: '2024-08', users: 2134, universities: 19, revenue: 213400 },
      { date: '2024-09', users: 2387, universities: 21, revenue: 238700 },
      { date: '2024-10', users: 2542, universities: 22, revenue: 254200 },
      { date: '2024-11', users: 2743, universities: 23, revenue: 274300 },
      { date: '2024-12', users: 2847, universities: 24, revenue: 284700 },
    ],
    dailyActivityData: [
      { day: 'Mon', logins: 1247, registrations: 23, sessions: 3421 },
      { day: 'Tue', logins: 1389, registrations: 34, sessions: 3789 },
      { day: 'Wed', logins: 1156, registrations: 28, sessions: 3234 },
      { day: 'Thu', logins: 1423, registrations: 41, sessions: 4012 },
      { day: 'Fri', logins: 1285, registrations: 36, sessions: 3567 },
      { day: 'Sat', logins: 845, registrations: 12, sessions: 2341 },
      { day: 'Sun', logins: 738, registrations: 8, sessions: 2089 },
    ],
    subscriptionData: [
      { name: 'University', value: 1824, revenue: 182400, color: '#4F46E5' },
      { name: 'Premium', value: 923, revenue: 92300, color: '#10B981' },
      { name: 'Basic', value: 100, revenue: 5000, color: '#F59E0B' },
    ],
    universityPerformance: [
      { name: 'Harvard University', users: 287, engagement: 94, satisfaction: 97 },
      { name: 'Stanford University', users: 245, engagement: 91, satisfaction: 95 },
      { name: 'MIT', users: 198, engagement: 96, satisfaction: 98 },
      { name: 'UC Berkeley', users: 176, engagement: 88, satisfaction: 92 },
      { name: 'Yale University', users: 134, engagement: 93, satisfaction: 96 },
    ],
    supportMetrics: [
      { month: 'Jul', tickets: 234, resolved: 229, satisfaction: 94 },
      { month: 'Aug', tickets: 267, resolved: 261, satisfaction: 93 },
      { month: 'Sep', tickets: 198, resolved: 195, satisfaction: 96 },
      { month: 'Oct', tickets: 245, resolved: 241, satisfaction: 95 },
      { month: 'Nov', tickets: 189, resolved: 187, satisfaction: 97 },
      { month: 'Dec', tickets: 156, resolved: 154, satisfaction: 98 },
    ],
    geoData: [
      { region: 'North America', users: 1689, universities: 15 },
      { region: 'Europe', users: 743, universities: 6 },
      { region: 'Asia Pacific', users: 315, universities: 2 },
      { region: 'Other', users: 100, universities: 1 },
    ]
  }

  const metrics = useMemo(() => {
    const users = (usersResult?.page as any[]) || []
    const total = users.length

    const byRole: Record<string, number> = {}
    const byPlan: Record<string, number> = {}
    const byStatus: Record<string, number> = {}

    for (const u of users) {
      byRole[u.role] = (byRole[u.role] || 0) + 1
      byPlan[u.subscription_plan] = (byPlan[u.subscription_plan] || 0) + 1
      byStatus[u.subscription_status] = (byStatus[u.subscription_status] || 0) + 1
    }

    return { total, byRole, byPlan, byStatus }
  }, [usersResult])
=======

  // Filter states
  const [dateFrom, setDateFrom] = useState<number | undefined>()
  const [dateTo, setDateTo] = useState<number | undefined>()
  const [userType, setUserType] = useState<string>("all")
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all")

  const analyticsResult = useQuery(
    api.analytics.getAdminAnalytics,
    clerkUser?.id && isSuperOrAdmin ? {
      clerkId: clerkUser.id,
      dateFrom,
      dateTo,
      userType: userType as any,
      subscriptionFilter: subscriptionFilter as any
    } : 'skip'
  )

  const sessionAnalytics = useQuery(
    api.analytics.getSessionAnalytics,
    clerkUser?.id && isSuperOrAdmin ? { clerkId: clerkUser.id } : 'skip'
  )
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378

  if (!isSuperOrAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Only Admin and Super Admin can access Analytics.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analyticsResult || !sessionAnalytics) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  const { overview, userGrowth, roleSegmentation, planSegmentation, featureUsage, universityGrowth, recentUsers } = analyticsResult

  // Prepare chart data
  const userGrowthData = userGrowth.map(item => ({
    month: item.month,
    users: item.users
  }))

  const roleChartData = Object.entries(roleSegmentation).map(([role, count]) => ({
    name: role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count
  }))

  const planChartData = Object.entries(planSegmentation).map(([plan, count]) => ({
    name: plan.charAt(0).toUpperCase() + plan.slice(1),
    value: count
  }))

  const universityGrowthData = universityGrowth.universityGrowth.map(item => ({
    month: item.month,
    universities: item.universities
  }))

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
<<<<<<< HEAD
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart className="h-7 w-7" />
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground">Comprehensive platform insights and metrics</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={universityFilter} onValueChange={setUniversityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="University" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Universities</SelectItem>
              <SelectItem value="harvard">Harvard University</SelectItem>
              <SelectItem value="stanford">Stanford University</SelectItem>
              <SelectItem value="mit">MIT</SelectItem>
              <SelectItem value="berkeley">UC Berkeley</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
=======
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart className="h-8 w-8" />
            Admin Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into platform usage and user engagement
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="super_admin">Super Admins</SelectItem>
                <SelectItem value="university_admin">University Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="university">University</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDateFrom(startOfMonth(new Date()).getTime())
              setDateTo(endOfMonth(new Date()).getTime())
            }}
          >
            This Month
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDateFrom(subDays(new Date(), 30).getTime())
              setDateTo(new Date().getTime())
            }}
          >
            Last 30 Days
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
          </Button>
        </div>
      </div>

<<<<<<< HEAD
      <Tabs value={metricType} onValueChange={setMetricType} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="universities">Universities</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalUsers.toLocaleString()}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{analyticsData.overview.monthlyGrowthRate}%</span>
                  <span>from last month</span>
=======
      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All users across roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Users with active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              New registrations this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionAnalytics.averageSessionTime}</div>
            <p className="text-xs text-muted-foreground">
              Average session duration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              User Growth Trend
            </CardTitle>
            <CardDescription>User registrations over the past 12 months</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              User Segmentation by Role
            </CardTitle>
            <CardDescription>Distribution of users by their roles</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Segmentation by Plan</CardTitle>
            <CardDescription>Distribution of subscription plans</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={planChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Usage Analytics</CardTitle>
            <CardDescription>Most popular features among users</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={featureUsage} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="feature" type="category" width={100} />
                <Tooltip formatter={(value, name) => [`${value} uses`, name]} />
                <Bar dataKey="count" fill="#ffc658" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* University Analytics */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>University Growth</CardTitle>
            <CardDescription>University partnerships over time</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={universityGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="universities"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>University License Distribution</CardTitle>
            <CardDescription>Current license plan distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Universities</span>
                <span className="text-2xl font-bold">{universityGrowth.totalUniversities}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Universities</span>
                <span className="text-2xl font-bold">{universityGrowth.activeUniversities}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {Object.entries(universityGrowth.licenseDistribution).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">{plan}</span>
                    <span className="font-medium">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users - Optimized */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Users
          </CardTitle>
          <CardDescription>Latest user registrations (last 30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-muted-foreground">No recent users found.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentUsers.slice(0, 12).map((u: any) => (
                <div key={u._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                  <div className="text-xs">
                    <div className="capitalize text-muted-foreground">{u.role.replace('_', ' ')}</div>
                    <div className="capitalize text-muted-foreground">{u.subscription_plan}</div>
                  </div>
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Universities</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalUniversities}</div>
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
                <div className="text-2xl font-bold">{analyticsData.overview.activeUsers.toLocaleString()}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>{Math.round((analyticsData.overview.activeUsers / analyticsData.overview.totalUsers) * 100)}% engagement</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{analyticsData.overview.systemUptime}%</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 text-green-500" />
                  <span>uptime this month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Growth</CardTitle>
                <CardDescription>Users, universities, and revenue over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analyticsData.userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="users" stackId="1" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.3} />
                    <Bar dataKey="universities" fill="#10B981" />
                    <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
                <CardDescription>User activity patterns throughout the week</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={analyticsData.dailyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="logins" fill="#4F46E5" name="Logins" />
                    <Bar dataKey="registrations" fill="#10B981" name="Registrations" />
                    <Bar dataKey="sessions" fill="#F59E0B" name="Sessions" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Revenue</CardTitle>
                <CardDescription>Revenue by subscription tier</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.subscriptionData}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                    >
                      {analyticsData.subscriptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Users and universities by region</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <div className="space-y-4">
                  {analyticsData.geoData.map((region, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{region.region}</div>
                          <div className="text-sm text-muted-foreground">{region.universities} universities</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{region.users.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">users</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Registration Trends</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.userGrowthData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stroke="#4F46E5" fillOpacity={1} fill="url(#colorUsers)" />
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
                <div className="space-y-4">
                  {Object.entries(metrics.byRole).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {role.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{count}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((count / metrics.total) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="universities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>University Performance</CardTitle>
              <CardDescription>Top performing universities by engagement and satisfaction</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={analyticsData.universityPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="engagement" fill="#4F46E5" name="Engagement %" />
                  <Bar dataKey="satisfaction" fill="#10B981" name="Satisfaction %" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly User Activity</CardTitle>
              <CardDescription>Login patterns and session data</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.dailyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="logins" stroke="#4F46E5" strokeWidth={2} />
                  <Line type="monotone" dataKey="sessions" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Ticket Trends</CardTitle>
              <CardDescription>Support ticket volume and resolution rates</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analyticsData.supportMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tickets" fill="#F59E0B" name="Total Tickets" />
                  <Bar dataKey="resolved" fill="#10B981" name="Resolved" />
                  <Line type="monotone" dataKey="satisfaction" stroke="#4F46E5" strokeWidth={2} name="Satisfaction %" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
