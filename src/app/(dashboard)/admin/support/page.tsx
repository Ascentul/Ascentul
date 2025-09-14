'use client'

import React, { useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, HelpCircle } from 'lucide-react'

export default function AdminSupportPage() {
  const { user: clerkUser } = useUser()
  const { user } = useAuth()

  const tickets = useQuery(
    api.support_tickets.listTickets,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  ) as any[] | undefined

  const counts = useMemo(() => {
    const list = tickets || []
    const byStatus: Record<string, number> = {}
    for (const t of list) {
      const s = t.status || 'open'
      byStatus[s] = (byStatus[s] || 0) + 1
    }
    return byStatus
  }, [tickets])

  const role = user?.role
  const isSuperOrAdmin = role === 'super_admin' || role === 'admin'
  if (!isSuperOrAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Only Admin and Super Admin can access Support Tickets.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!tickets) {
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
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-6 w-6" /> Support Tickets
        </h1>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{counts['open'] || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{counts['in_progress'] || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resolved/Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{(counts['resolved'] || 0) + (counts['closed'] || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-muted-foreground">No tickets found.</p>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-6 gap-2 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div>Subject</div>
                <div className="hidden md:block">User</div>
                <div>Status</div>
                <div className="hidden md:block">Category</div>
                <div className="hidden md:block">Priority</div>
                <div className="text-right">Created</div>
              </div>
              <div className="divide-y">
                {tickets.map((t: any) => (
                  <div key={t._id} className="grid grid-cols-6 gap-2 px-4 py-3 items-center">
                    <div className="truncate">
                      <div className="font-medium">{t.subject}</div>
                      <div className="text-xs text-muted-foreground md:hidden truncate">{t.category}</div>
                    </div>
                    <div className="hidden md:block truncate">{t.user_id?.id || t.user_id}</div>
                    <div>
                      <Badge variant={t.status === 'open' ? 'default' : t.status === 'in_progress' ? 'secondary' : 'outline'} className="capitalize">
                        {String(t.status || 'open').replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="hidden md:block">
                      <Badge variant="outline" className="capitalize">{t.category || 'general'}</Badge>
                    </div>
                    <div className="hidden md:block">
                      <Badge variant="outline" className="capitalize">{String(t.priority ?? 'medium')}</Badge>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {t.created_at ? new Date(t.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
