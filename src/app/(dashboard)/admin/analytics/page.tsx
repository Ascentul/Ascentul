'use client'

import React, { useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, ShieldCheck, Users, TrendingUp, Activity, Building2, FileText, Target, FolderKanban, Mail, MessageCircle } from 'lucide-react'

function AdminAnalyticsPage() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { user: convexUser } = useAuth()

  // Check permissions using CLERK directly (source of truth for roles)
  const clerkRole = useMemo(() => (clerkUser?.publicMetadata as any)?.role as string | undefined, [clerkUser?.publicMetadata])
  const canAccess = useMemo(() => clerkRole === 'super_admin' || clerkRole === 'admin', [clerkRole])

  const analytics = useQuery(
    api.analytics.getAdminAnalytics,
    clerkLoaded && canAccess && clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  )

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to admin analytics.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-7 w-7" />
              Admin Analytics
            </h1>
            <p className="text-muted-foreground">Platform analytics and insights</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7" />
            Admin Analytics
          </h1>
          <p className="text-muted-foreground">Platform analytics and insights</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.newUsersThisMonth} new this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.systemStats.totalUsers > 0
                ? Math.round((analytics.overview.activeUsers / analytics.systemStats.totalUsers) * 100)
                : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Universities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.systemStats.totalUniversities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Institutional partners
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.systemStats.systemHealth}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.systemStats.supportTickets} open tickets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Growth & Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth (Last 12 Months)</CardTitle>
            <CardDescription>New user registrations by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.userGrowth.slice(-6).map((data) => (
                <div key={data.month} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{data.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-primary rounded-full" style={{ width: `${Math.min(data.users * 10, 100)}px` }}></div>
                    <span className="text-sm font-medium w-12 text-right">{data.users}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
            <CardDescription>Users by subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.subscriptionData.map((sub) => (
                <div key={sub.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{sub.name}</span>
                    <span className="text-muted-foreground">{sub.value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${analytics.systemStats.totalUsers > 0 ? (sub.value / analytics.systemStats.totalUsers) * 100 : 0}%`,
                        backgroundColor: sub.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage</CardTitle>
          <CardDescription>Most popular platform features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analytics.featureUsage.map((feature) => {
              const Icon = feature.feature.includes('Resume') ? FileText :
                          feature.feature.includes('Application') ? Mail :
                          feature.feature.includes('Cover') ? FileText :
                          feature.feature.includes('Goal') ? Target :
                          FolderKanban
              return (
                <div key={feature.feature} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{feature.feature}</div>
                    <div className="text-xs text-muted-foreground">{feature.count} total ({feature.percentage}% of users)</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activity (Last 7 Days)</CardTitle>
          <CardDescription>Daily registrations and logins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.activityData.map((data) => (
              <div key={data.day} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground w-12">{data.day}</span>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-muted-foreground w-20">Registrations:</span>
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${Math.min(data.registrations * 20, 100)}px` }}></div>
                    <span className="text-sm font-medium w-8">{data.registrations}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-muted-foreground w-20">Logins:</span>
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: `${Math.min(data.logins / 2, 100)}px` }}></div>
                    <span className="text-sm font-medium w-8">{data.logins}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* University Data */}
      {analytics.universityData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Universities</CardTitle>
            <CardDescription>Universities by user count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.universityData.map((uni) => (
                <div key={uni.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{uni.name}</div>
                      <div className="text-sm text-muted-foreground">{uni.status}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{uni.users} users</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Wrap the page with Error Boundary to catch Convex query errors
export default function AdminAnalyticsPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AdminAnalyticsPage />
    </ErrorBoundary>
  )
}