'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Users,
  School,
  Activity,
  TrendingUp,
  TrendingDown,
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

function AdminDashboardPage() {
  const router = useRouter()
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { user: convexUser } = useAuth()
  const [activeView, setActiveView] = React.useState<'system' | 'universities' | 'users' | 'revenue'>('system')
  const [activeAnalyticsTab, setActiveAnalyticsTab] = React.useState<'overview' | 'analytics' | 'universities' | 'users' | 'system'>('overview')

  // Check permissions using CLERK directly (source of truth for roles)
  const clerkRole = useMemo(() => (clerkUser?.publicMetadata as any)?.role as string | undefined, [clerkUser?.publicMetadata])
  const canAccess = useMemo(() => clerkRole === 'super_admin', [clerkRole])

  // OPTIMIZED: Use multiple smaller queries instead of one monolithic query
  // Only query if user has access based on CLERK role
  const shouldQuery = React.useMemo(() =>
    !!(clerkLoaded && canAccess && clerkUser?.id),
    [clerkLoaded, canAccess, clerkUser?.id]
  )

  // Load critical stats first (lightweight, fast)
  const systemStats = useQuery(
    api.analytics.getSystemStatsOptimized,
    shouldQuery ? { clerkId: clerkUser!.id } : 'skip'
  )

  const supportMetrics = useQuery(
    api.analytics.getSupportMetricsOptimized,
    shouldQuery ? { clerkId: clerkUser!.id } : 'skip'
  )

  // Load chart data (can load progressively)
  const userGrowthData = useQuery(
    api.analytics.getUserGrowthOptimized,
    shouldQuery ? { clerkId: clerkUser!.id, monthsBack: 6 } : 'skip'
  )

  const activityData = useQuery(
    api.analytics.getActivityDataOptimized,
    shouldQuery ? { clerkId: clerkUser!.id } : 'skip'
  )

  const subscriptionData = useQuery(
    api.analytics.getSubscriptionDistributionOptimized,
    shouldQuery ? { clerkId: clerkUser!.id } : 'skip'
  )

  const recentUsers = useQuery(
    api.analytics.getRecentUsersOptimized,
    shouldQuery ? { clerkId: clerkUser!.id, limit: 10 } : 'skip'
  )

  const topUniversities = useQuery(
    api.analytics.getTopUniversitiesOptimized,
    shouldQuery ? { clerkId: clerkUser!.id } : 'skip'
  )

  // Load university analytics only when Universities tab is active
  const universityAnalytics = useQuery(
    api.analytics.getUniversityAnalytics,
    clerkLoaded && canAccess && clerkUser?.id && activeAnalyticsTab === 'universities' ? { clerkId: clerkUser.id } : 'skip'
  )

  // Load revenue analytics only when Revenue view or Users tab is active
  const revenueData = useQuery(
    api.analytics.getRevenueAnalytics,
    clerkLoaded && canAccess && clerkUser?.id && (activeView === 'revenue' || activeAnalyticsTab === 'users') ? { clerkId: clerkUser.id } : 'skip'
  )

  // Load minimal users only when Users tab is active
  const users = useQuery(
    api.users.getAllUsersMinimal,
    clerkLoaded && canAccess && clerkUser?.id && activeAnalyticsTab === 'users' ? { clerkId: clerkUser.id, limit: 50 } : 'skip'
  )

  // Transform recent users into activity format - memoized
  const recentActivity = useMemo(() =>
    recentUsers ? recentUsers.map((user: any) => ({
      type: 'registration',
      user: user.name,
      university: user.university_id ? 'University User' : 'Individual User',
      time: formatTimeAgo(user.created_at)
    })) : []
  , [recentUsers])

  // University data - use conditional loading
  const universityData = useMemo(() =>
    universityAnalytics?.universityData || topUniversities || [],
    [universityAnalytics?.universityData, topUniversities]
  )
  const mauTrends = useMemo(() => universityAnalytics?.mauTrends || [], [universityAnalytics?.mauTrends])

  // Memoize expensive calculations to prevent re-computation on every render
  // Use type assertion to handle both university analytics and top universities shapes
  const totalStudents = useMemo(() =>
    universityData.reduce((sum, uni) => sum + ((uni as any).students || 0), 0),
    [universityData]
  )

  const avgLicenseUtilization = useMemo(() =>
    universityData.length > 0
      ? Math.round(universityData.reduce((sum, uni) => sum + ((uni as any).licenseUtilization || 0), 0) / universityData.length)
      : 0,
    [universityData]
  )

  // Show loading state while Clerk is loading
  if (!clerkLoaded) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Show unauthorized message if user doesn't have access (based on Clerk role)
  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
          <p className="text-gray-600">
            You do not have permission to access this page.
            {clerkRole && <span className="block mt-2 text-sm">Your role: {clerkRole}</span>}
          </p>
        </div>
      </div>
    )
  }

  // Only wait for critical system stats to load initially
  // Show loading state only if systemStats is undefined (not just checking shouldQuery)
  if (!systemStats && shouldQuery) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-16 flex-col gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return <AdminDashboardContent
    systemStats={systemStats || {
      totalUsers: 0,
      totalUniversities: 0,
      activeUsers: 0,
      systemHealth: 0,
      monthlyGrowth: 0,
      supportTickets: 0,
      systemUptime: 0
    }}
    userGrowthData={userGrowthData || []}
    subscriptionData={subscriptionData || []}
    universityData={universityData}
    mauTrends={mauTrends}
    activityData={activityData || []}
    recentActivity={recentActivity}
    activeView={activeView}
    setActiveView={setActiveView}
    activeAnalyticsTab={activeAnalyticsTab}
    setActiveAnalyticsTab={setActiveAnalyticsTab}
    users={users}
    revenueData={revenueData}
    supportMetrics={supportMetrics || {
      openTickets: 0,
      resolvedToday: 0,
      avgResponseTime: '0.0',
      totalTickets: 0,
      resolvedTickets: 0,
      inProgressTickets: 0,
    }}
    universityAnalyticsLoading={activeAnalyticsTab === 'universities' && !universityAnalytics}
    revenueDataLoading={(activeView === 'revenue' || activeAnalyticsTab === 'users') && !revenueData}
    usersLoading={activeAnalyticsTab === 'users' && !users}
    userGrowthLoading={!userGrowthData}
    activityDataLoading={!activityData}
    subscriptionDataLoading={!subscriptionData}
    totalStudents={totalStudents}
    avgLicenseUtilization={avgLicenseUtilization}
  />
}

// Extract helper function outside component
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

// Memoized content component to prevent unnecessary re-renders
const AdminDashboardContent = React.memo(function AdminDashboardContent({
  systemStats,
  userGrowthData,
  subscriptionData,
  universityData,
  mauTrends,
  activityData,
  recentActivity,
  activeView,
  setActiveView,
  activeAnalyticsTab,
  setActiveAnalyticsTab,
  users,
  revenueData,
  supportMetrics,
  universityAnalyticsLoading,
  revenueDataLoading,
  usersLoading,
  userGrowthLoading,
  activityDataLoading,
  subscriptionDataLoading,
  totalStudents,
  avgLicenseUtilization
}: {
  systemStats: any
  userGrowthData: any[]
  subscriptionData: any[]
  universityData: any[]
  mauTrends: any[]
  activityData: any[]
  recentActivity: any[]
  activeView: 'system' | 'universities' | 'users' | 'revenue'
  setActiveView: (view: 'system' | 'universities' | 'users' | 'revenue') => void
  activeAnalyticsTab: 'overview' | 'analytics' | 'universities' | 'users' | 'system'
  setActiveAnalyticsTab: (tab: 'overview' | 'analytics' | 'universities' | 'users' | 'system') => void
  users: any
  revenueData: any
  supportMetrics: any
  universityAnalyticsLoading: boolean
  revenueDataLoading: boolean
  usersLoading: boolean
  userGrowthLoading: boolean
  activityDataLoading: boolean
  subscriptionDataLoading: boolean
  totalStudents: number
  avgLicenseUtilization: number
}) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#0C29AB' }}>
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

      <Tabs defaultValue="overview" className="space-y-6" onValueChange={(value) => setActiveAnalyticsTab(value as any)}>
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
                  <School className="h-3 w-3" />
                  <span>Active institutions</span>
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
                  <span>{systemStats.totalUsers > 0 ? Math.round((systemStats.activeUsers / systemStats.totalUsers) * 100) : 0}% active</span>
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
                {userGrowthLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>Daily logins and new registrations</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {activityDataLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
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
                )}
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
                {subscriptionDataLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
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
                )}
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Connect to Vercel Analytics or Convex Dashboard</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      For real-time system monitoring, connect to <a href="https://vercel.com/docs/analytics" target="_blank" rel="noopener noreferrer" className="underline font-medium">Vercel Analytics</a> for web vitals and performance metrics,
                      or use the <a href="https://dashboard.convex.dev" target="_blank" rel="noopener noreferrer" className="underline font-medium">Convex Dashboard</a> for database metrics.
                      Alternatively, integrate with Datadog or New Relic for comprehensive monitoring.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Platform Uptime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">--</div>
                    <p className="text-xs text-muted-foreground mt-1">Requires monitoring</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-muted-foreground mt-1">Requires monitoring</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-muted-foreground mt-1">Requires monitoring</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Database Load</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-muted-foreground mt-1">Requires monitoring</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>System Monitoring Setup</CardTitle>
                  <CardDescription>Configure monitoring services for real-time metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Performance Monitoring</h4>
                        <p className="text-sm text-muted-foreground mt-1">Track API response times, error rates, and system health</p>
                      </div>
                      <Badge variant="outline">Not Configured</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Uptime Monitoring</h4>
                        <p className="text-sm text-muted-foreground mt-1">Monitor platform availability and downtime</p>
                      </div>
                      <Badge variant="outline">Not Configured</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Database Metrics</h4>
                        <p className="text-sm text-muted-foreground mt-1">Monitor database load, query performance, and storage</p>
                      </div>
                      <Badge variant="outline">Not Configured</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* University Performance View */}
          {activeView === 'universities' && (
            universityAnalyticsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading university analytics...</span>
              </div>
            ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Universities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.totalUniversities}</div>
                    <p className="text-xs text-muted-foreground mt-1">Active institutions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {totalStudents.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Across all universities</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg License Utilization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {avgLicenseUtilization}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Average across all institutions</p>
                  </CardContent>
                </Card>
              </div>

              {/* License Utilization Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>License Utilization by University</CardTitle>
                  <CardDescription>Percentage of licenses activated (students & advisors)</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  {universityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={universityData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} label={{ value: 'Utilization %', position: 'insideBottom', offset: -5 }} />
                        <YAxis type="category" dataKey="name" width={120} />
                        <Tooltip />
                        <Bar dataKey="licenseUtilization" fill="#4F46E5" name="License Utilization %" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No university data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* MAU Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Active Students (MAU) per University</CardTitle>
                  <CardDescription>Student engagement trends over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  {mauTrends.length > 0 && universityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mauTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {universityData.map((uni, index) => (
                          <Line
                            key={uni.name}
                            type="monotone"
                            dataKey={uni.name}
                            stroke={['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'][index % 6]}
                            strokeWidth={2}
                            name={uni.name}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No MAU data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Feature Usage by University */}
              <Card>
                <CardHeader>
                  <CardTitle>Feature Usage by University</CardTitle>
                  <CardDescription>Comparing engagement depth across schools</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  {universityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={universityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis label={{ value: 'Feature Usage Count', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="featureUsage.applications" stackId="a" fill="#4F46E5" name="Applications" />
                        <Bar dataKey="featureUsage.resumes" stackId="a" fill="#10B981" name="Resumes" />
                        <Bar dataKey="featureUsage.goals" stackId="a" fill="#F59E0B" name="Goals" />
                        <Bar dataKey="featureUsage.projects" stackId="a" fill="#EC4899" name="Projects" />
                        <Bar dataKey="featureUsage.coverLetters" stackId="a" fill="#8B5CF6" name="Cover Letters" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No feature usage data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            )
          )}

          {/* User Behavior View */}
          {activeView === 'users' && (
            usersLoading || revenueDataLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading user analytics...</span>
              </div>
            ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">All-time registrations</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.activeUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {systemStats.totalUsers > 0 ? Math.round((systemStats.activeUsers / systemStats.totalUsers) * 100) : 0}% of total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(revenueData?.payingUsersCount ?? 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {systemStats.totalUsers > 0 ? Math.round(((revenueData?.payingUsersCount ?? 0) / systemStats.totalUsers) * 100) : 0}% conversion
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStats.monthlyGrowth}%</div>
                    <p className="text-xs text-muted-foreground mt-1">User growth rate</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>User Activity Summary</CardTitle>
                  <CardDescription>Overview of user engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Weekly Activity</h4>
                        <p className="text-sm text-muted-foreground mt-1">User registrations and logins over the past 7 days</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Subscription Status</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {revenueData?.payingUsersCount ?? 0} active subscriptions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Note</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Detailed user behavior analytics require session tracking implementation
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            )
          )}

          {/* Revenue & Subscriptions View */}
          {activeView === 'revenue' && (
            revenueDataLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading revenue analytics...</span>
              </div>
            ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${(revenueData?.monthlyRevenue ?? 0).toLocaleString()}</div>
                    <p className={`text-xs mt-1 ${(revenueData?.monthlyGrowthPercent ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(revenueData?.monthlyGrowthPercent ?? 0) >= 0 ? '+' : ''}{revenueData?.monthlyGrowthPercent ?? 0}% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Revenue Per User</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${revenueData?.arpu ?? '0.00'}</div>
                    <p className="text-xs text-muted-foreground mt-1">{revenueData?.payingUsersCount ?? 0} paying users</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{revenueData?.churnRate ?? '0.0'}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${revenueData?.estimatedLTV ?? 0}</div>
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
                      <AreaChart data={revenueData?.revenueGrowth ?? []}>
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
                    <BarChart data={revenueData?.subscriptionLifecycle ?? []}>
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
            )
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
                <div className="text-2xl font-bold">{systemStats.activeUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {systemStats.totalUsers > 0 ? Math.round((systemStats.activeUsers / systemStats.totalUsers) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(revenueData?.payingUsersCount ?? 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {systemStats.totalUsers > 0 ? Math.round(((revenueData?.payingUsersCount ?? 0) / systemStats.totalUsers) * 100) : 0}% conversion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">University Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalStudents.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {systemStats.totalUsers > 0
                    ? Math.round((totalStudents / systemStats.totalUsers) * 100)
                    : 0}% of total users
                </p>
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
                {users?.page && users.page.slice(0, 10).map((user: any) => (
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
                <CardDescription>Infrastructure monitoring (requires integration)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    System metrics require external monitoring integration (Datadog, New Relic, etc.)
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">CPU Usage</span>
                  <span className="text-sm font-medium text-muted-foreground">--</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Memory Usage</span>
                  <span className="text-sm font-medium text-muted-foreground">--</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Database Response</span>
                  <span className="text-sm font-medium text-muted-foreground">--</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Connections</span>
                  <span className="text-sm font-medium text-muted-foreground">--</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Support Metrics</CardTitle>
                <CardDescription>Real-time support ticket data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Open Tickets</span>
                  <span className={`text-sm font-medium ${supportMetrics.openTickets > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                    {supportMetrics.openTickets}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">In Progress</span>
                  <span className="text-sm font-medium text-blue-500">
                    {supportMetrics.inProgressTickets}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Resolved Today</span>
                  <span className="text-sm font-medium text-green-500">
                    {supportMetrics.resolvedToday}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Response Time</span>
                  <span className="text-sm font-medium">
                    {supportMetrics.avgResponseTime} hours
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Resolved</span>
                  <span className="text-sm font-medium">
                    {supportMetrics.resolvedTickets}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
})

// Wrap the page with Error Boundary to catch Convex query errors
export default function AdminDashboardPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AdminDashboardPage />
    </ErrorBoundary>
  )
}
