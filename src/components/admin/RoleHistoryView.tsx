'use client'

import React, { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import type { Doc } from 'convex/_generated/dataModel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Search, Download, ArrowRight, Shield, History } from 'lucide-react'
import { format } from 'date-fns'

type AuditLog = Doc<'audit_logs'>

interface RoleHistoryViewProps {
  clerkId: string
}

export function RoleHistoryView({ clerkId }: RoleHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '30d' | '90d'>('30d')

  // Calculate start date based on time filter (used for client-side filtering)
  const startDate = React.useMemo(() => {
    if (timeFilter === 'all') return 0

    const now = Date.now()
    const days = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : 90
    return now - (days * 24 * 60 * 60 * 1000)
  }, [timeFilter])

  // Fetch role change audit logs
  const auditLogs = useQuery(
    api.audit_logs.getAuditLogs,
    {
      clerkId,
      limit: 100,
    }
  )

  // Filter logs by search query, action type, and time
  const filteredLogs = React.useMemo(() => {
    if (!auditLogs) return []

    return auditLogs.filter((log: AuditLog) => {
      // Filter for role change actions only
      if (log.action !== 'user_role_changed') return false

      // Time filter
      const logTime = log.timestamp ?? log.created_at ?? Date.now()
      if (startDate > 0 && logTime < startDate) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTarget = log.target_name?.toLowerCase().includes(query) ||
                             log.target_email?.toLowerCase().includes(query)
        const matchesPerformer = log.performed_by_name?.toLowerCase().includes(query) ||
                                log.performed_by_email?.toLowerCase().includes(query)
        if (!matchesTarget && !matchesPerformer) return false
      }

      return true
    })
  }, [auditLogs, searchQuery, startDate])

  // Statistics
  const stats = React.useMemo(() => {
    if (!filteredLogs) return { total: 0, uniqueUsers: 0, uniquePerformers: 0 }

    const uniqueUsers = new Set(filteredLogs.map((log: AuditLog) => log.target_email).filter(Boolean))
    const uniquePerformers = new Set(filteredLogs.map((log: AuditLog) => log.performed_by_email).filter(Boolean))

    return {
      total: filteredLogs.length,
      uniqueUsers: uniqueUsers.size,
      uniquePerformers: uniquePerformers.size,
    }
  }, [filteredLogs])

  const exportToCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) return

    const headers = ['Timestamp', 'User', 'Email', 'Old Role', 'New Role', 'Changed By', 'Reason']
    const rows = filteredLogs.map((log: AuditLog) => [
      format(new Date(log.timestamp ?? log.created_at ?? Date.now()), 'yyyy-MM-dd HH:mm:ss'),
      log.target_name || '',
      log.target_email || '',
      (log.metadata as Record<string, unknown>)?.old_role || '',
      (log.metadata as Record<string, unknown>)?.new_role || '',
      log.performed_by_name || '',
      log.reason || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => {
        // Escape quotes and handle newlines/carriage returns
        const str = String(cell).replace(/"/g, '""').replace(/\r?\n/g, ' ')
        return `"${str}"`
      }).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `role-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    // Delay revocation to ensure download completes
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  if (!auditLogs) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading role history...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Role Change History
            </CardTitle>
            <CardDescription>
              Audit trail of all role changes ({stats.total} changes)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground mb-1">Total Changes</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground mb-1">Unique Users</div>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
          </div>
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground mb-1">Changed By</div>
            <div className="text-2xl font-bold">{stats.uniquePerformers}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* History Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role Change</TableHead>
                <TableHead>Changed By</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No role changes found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log: AuditLog) => {
                  const metadata = log.metadata as Record<string, unknown> | undefined
                  const oldRole = metadata?.old_role as string | undefined
                  const newRole = metadata?.new_role as string | undefined
                  const logTime = log.timestamp ?? log.created_at ?? Date.now()

                  return (
                    <TableRow key={log._id}>
                      <TableCell className="text-sm">
                        <div>{format(new Date(logTime), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(logTime), 'h:mm a')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.target_name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{log.target_email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {oldRole?.replace(/_/g, ' ')}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="default" className="capitalize">
                            {newRole?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">
                              {log.performed_by_name || 'System'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.performed_by_email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs">
                        <div className="truncate" title={log.reason || 'No reason provided'}>
                          {log.reason || <span className="text-muted-foreground italic">No reason provided</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination info */}
        {auditLogs && auditLogs.length >= 100 && (
          <div className="text-sm text-muted-foreground text-center">
            Showing the most recent 100 role changes for the selected time period. Export to CSV for complete history.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
