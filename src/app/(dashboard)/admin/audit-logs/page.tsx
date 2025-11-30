'use client'

import React, { useState, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { usePaginatedQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Search, FileText, Shield, ChevronDown } from 'lucide-react'

export default function AuditLogsPage() {
  const { user: clerkUser } = useUser()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<'all' | string>('all')

  // Fetch audit logs with pagination (50 per page)
  const { results: auditLogs, status, loadMore } = usePaginatedQuery(
    api.audit_logs.getAuditLogsPaginated,
    clerkUser?.id
      ? {
          clerkId: clerkUser.id,
          action: actionFilter !== 'all' ? actionFilter : undefined,
        }
      : 'skip',
    { initialNumItems: 50 }
  )

  // Filter logs
  const filtered = useMemo(() => {
    if (!auditLogs) return []

    const q = search.trim().toLowerCase()
    return auditLogs.filter(log => {
      const matchesText =
        !q ||
        log.target_email?.toLowerCase().includes(q) ||
        log.target_name?.toLowerCase().includes(q) ||
        log.performed_by_email?.toLowerCase().includes(q) ||
        log.performed_by_name?.toLowerCase().includes(q) ||
        log.reason?.toLowerCase().includes(q)

      const matchesAction = actionFilter === 'all' || log.action === actionFilter

      return matchesText && matchesAction
    })
  }, [auditLogs, search, actionFilter])

  // Extract unique actions for filter
  const uniqueActions = useMemo(() => {
    if (!auditLogs) return []
    return Array.from(new Set(auditLogs.map(log => log.action)))
  }, [auditLogs])

  // Get badge variant for action type
  const getActionVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes('deleted')) return 'destructive'
    if (action.includes('restored')) return 'default'
    if (action.includes('created')) return 'secondary'
    return 'outline'
  }

  const role = user?.role
  const isSuperAdmin = role === 'super_admin'

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Only Super Admin can access Audit Logs.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'LoadingFirstPage') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
            <Shield className="h-7 w-7" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground">Complete audit trail of all admin actions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Filter audit logs by action type, user email, or admin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by email, name, or reason..."
                className="pl-8"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filtered.length} {status === 'CanLoadMore' ? '(more available)' : ''} {search || actionFilter !== 'all' ? 'filtered logs' : 'logs'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Trail ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No audit logs found matching your filters.
              </div>
            ) : (
              filtered.map((log) => (
                <div
                  key={log._id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getActionVariant(log.action)}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {(() => {
                            if (!log.timestamp) return 'N/A'
                            const date = new Date(log.timestamp)
                            return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString()
                          })()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">Target:</span>{' '}
                          <span className="text-muted-foreground">
                            {log.target_name} ({log.target_email})
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Performed by:</span>{' '}
                          <span className="text-muted-foreground">
                            {log.performed_by_name} ({log.performed_by_email})
                          </span>
                        </div>
                        {log.reason && (
                          <div className="text-sm">
                            <span className="font-medium">Reason:</span>{' '}
                            <span className="text-muted-foreground">{log.reason}</span>
                          </div>
                        )}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="text-sm mt-2">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View metadata
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More Button */}
          {status === 'CanLoadMore' && (
            <div className="flex justify-center pt-6">
              <Button
                onClick={() => loadMore(50)}
                variant="outline"
                className="gap-2"
              >
                <ChevronDown className="h-4 w-4" />
                Load More Logs
              </Button>
            </div>
          )}

          {status === 'LoadingMore' && (
            <div className="flex justify-center pt-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Audit Log Summary (Loaded)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{auditLogs?.length || 0}</div>
              <div className="text-sm text-muted-foreground">
                Loaded Logs {status === 'CanLoadMore' && '(+)'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {auditLogs?.filter(l => l.action.includes('deleted')).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Deletions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {auditLogs?.filter(l => l.action.includes('restored')).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Restorations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {auditLogs?.filter(l => l.action.includes('created')).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Created</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
