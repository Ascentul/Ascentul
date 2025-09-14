'use client'

import React, { useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ShieldCheck, BarChart } from 'lucide-react'

export default function AdminAnalyticsPage() {
  const { user: clerkUser } = useUser()
  const { user } = useAuth()

  const role = user?.role
  const isSuperOrAdmin = role === 'super_admin' || role === 'admin'
  const usersResult = useQuery(
    api.users.getAllUsers,
    clerkUser?.id && isSuperOrAdmin ? { clerkId: clerkUser.id, limit: 500 } : 'skip'
  )

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

    const topRoles = Object.entries(byRole).sort((a, b) => b[1] - a[1])
    const topPlans = Object.entries(byPlan).sort((a, b) => b[1] - a[1])

    return { total, byRole, byPlan, byStatus, topRoles, topPlans }
  }, [usersResult])

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

  if (!usersResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><BarChart className="h-6 w-6" /> Admin Analytics</h1>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All users across roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <ul className="text-sm space-y-1">
                {metrics.topRoles.slice(0, 5).map(([role, count]) => (
                  <li key={role} className="flex justify-between"><span className="capitalize">{role.replace('_', ' ')}</span><span className="text-muted-foreground">{count}</span></li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <ul className="text-sm space-y-1">
                {metrics.topPlans.slice(0, 5).map(([plan, count]) => (
                  <li key={plan} className="flex justify-between"><span className="capitalize">{plan}</span><span className="text-muted-foreground">{count}</span></li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          {usersResult.page.length === 0 ? (
            <p className="text-muted-foreground">No users found.</p>
          ) : (
            <div className="divide-y">
              {usersResult.page.slice(0, 15).map((u: any) => (
                <div key={u._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <div className="text-xs uppercase text-muted-foreground">{u.role} • {u.subscription_plan} • {u.subscription_status}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
