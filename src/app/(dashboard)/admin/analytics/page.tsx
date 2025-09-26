'use client'

import React, { useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ShieldCheck, BarChart, Users, Activity, Clock, TrendingUp, Filter, Calendar, PieChart, BarChart3 } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart as RechartsBarChart, Bar } from 'recharts'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdminAnalyticsPage() {
  const { user: clerkUser } = useUser()
  const { user } = useAuth()

  const role = user?.role
  const isSuperOrAdmin = role === 'super_admin' || role === 'admin'

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
          </Button>
        </div>
      </div>

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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
