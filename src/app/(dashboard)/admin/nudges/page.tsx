'use client'

/**
 * Admin Nudge Monitoring Dashboard
 *
 * Shows global nudge metrics, rule performance, and recent activity
 */

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Bell, TrendingUp, Users, CheckCircle, Clock, X, AlertCircle } from 'lucide-react'

export default function AdminNudgesPage() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week')

  // Query metrics
  const globalMetrics = useQuery(api.nudges.metrics.getGlobalMetrics, { timeRange })
  const ruleMetrics = useQuery(api.nudges.metrics.getMetricsByRuleType, { timeRange })
  const engagementMetrics = useQuery(api.nudges.metrics.getEngagementMetrics, { timeRange })
  const recentActivity = useQuery(api.nudges.metrics.getRecentActivity, { limit: 20 })
  const volumeTrend = useQuery(api.nudges.metrics.getDailyVolumeTrend, { days: 7 })

  const isLoading = !globalMetrics || !ruleMetrics || !engagementMetrics || !recentActivity || !volumeTrend

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Nudge System Monitoring
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor proactive nudge performance and user engagement
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as 'day' | 'week' | 'month' | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Nudges</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalMetrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sent in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalMetrics.rates.acceptance}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {globalMetrics.byStatus.accepted} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementMetrics.engagementRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {engagementMetrics.usersWhoInteracted} of {engagementMetrics.usersWithNudges} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Action</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalMetrics.avgTimeToAction.hours}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              From nudge to acceptance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Nudge Status Distribution</CardTitle>
          <CardDescription>How users are responding to nudges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{globalMetrics.byStatus.accepted}</p>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{globalMetrics.byStatus.snoozed}</p>
                <p className="text-sm text-muted-foreground">Snoozed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{globalMetrics.byStatus.dismissed}</p>
                <p className="text-sm text-muted-foreground">Dismissed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{globalMetrics.byStatus.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rule Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Performance</CardTitle>
          <CardDescription>Effectiveness of different nudge types</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Type</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Accepted</TableHead>
                <TableHead className="text-right">Snoozed</TableHead>
                <TableHead className="text-right">Dismissed</TableHead>
                <TableHead className="text-right">Acceptance Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ruleMetrics.ruleTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No nudges in selected time range
                  </TableCell>
                </TableRow>
              ) : (
                ruleMetrics.ruleTypes.map((rule) => (
                  <TableRow key={rule.ruleType}>
                    <TableCell className="font-medium">
                      <code className="text-sm">{rule.ruleType}</code>
                    </TableCell>
                    <TableCell className="text-right">{rule.total}</TableCell>
                    <TableCell className="text-right text-green-600">{rule.accepted}</TableCell>
                    <TableCell className="text-right text-blue-600">{rule.snoozed}</TableCell>
                    <TableCell className="text-right text-red-600">{rule.dismissed}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={rule.acceptanceRate >= 50 ? 'default' : 'secondary'}>
                        {rule.acceptanceRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Volume Trend */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Volume Trend</CardTitle>
          <CardDescription>Daily nudge activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {volumeTrend.map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">{day.date}</div>
                <div className="flex-1 flex items-center gap-2">
                  <div
                    className="h-6 bg-primary rounded"
                    style={{ width: `${Math.max(day.total * 10, 20)}px` }}
                  />
                  <span className="text-sm font-medium">{day.total}</span>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-green-600">{day.accepted} ✓</span>
                  <span className="text-blue-600">{day.snoozed} ⏰</span>
                  <span className="text-red-600">{day.dismissed} ✗</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest nudge interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Rule Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((activity) => (
                <TableRow key={activity.nudgeId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{activity.userName}</p>
                      <p className="text-xs text-muted-foreground">{activity.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm">{activity.ruleType}</code>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        activity.status === 'accepted'
                          ? 'default'
                          : activity.status === 'pending'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {activity.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
