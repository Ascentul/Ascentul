'use client'

import React, { useState, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, HelpCircle, Search, Filter, Eye, MessageSquare, UserCheck, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminSupportPage() {
  const { user: clerkUser } = useUser()
  const { user } = useAuth()

  const role = user?.role
  const isSuperOrAdmin = role === 'super_admin' || role === 'admin'

  // Filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [issueTypeFilter, setIssueTypeFilter] = useState('all')
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])

  const tickets = useQuery(
    api.support_tickets.listTicketsWithFilters,
    clerkUser?.id && isSuperOrAdmin ? {
      clerkId: clerkUser.id,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      source: sourceFilter !== 'all' ? sourceFilter : undefined,
      issueType: issueTypeFilter !== 'all' ? issueTypeFilter : undefined,
    } : 'skip'
  ) as any[] | undefined

  const updateTicketStatus = useMutation(api.support_tickets.updateTicketStatus)
  const assignTicket = useMutation(api.support_tickets.assignTicket)
  const bulkUpdateTickets = useMutation(api.support_tickets.bulkUpdateTickets)

  const counts = useMemo(() => {
    const list = tickets || []
    const byStatus: Record<string, number> = {}
    for (const t of list) {
      const s = t.status || 'open'
      byStatus[s] = (byStatus[s] || 0) + 1
    }
    return byStatus
  }, [tickets])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(tickets?.map(t => t._id) || [])
    } else {
      setSelectedTickets([])
    }
  }

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    if (checked) {
      setSelectedTickets(prev => [...prev, ticketId])
    } else {
      setSelectedTickets(prev => prev.filter(id => id !== ticketId))
    }
  }

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    if (!clerkUser?.id) return
    try {
      await updateTicketStatus({
        clerkId: clerkUser.id,
        ticketId: ticketId as any,
        status: status as any,
      })
    } catch (error) {
      console.error('Error updating ticket status:', error)
    }
  }

  const handleBulkStatusUpdate = async (status: string) => {
    if (!clerkUser?.id || selectedTickets.length === 0) return
    try {
      await bulkUpdateTickets({
        clerkId: clerkUser.id,
        ticketIds: selectedTickets as any,
        status: status as any,
      })
      setSelectedTickets([])
    } catch (error) {
      console.error('Error bulk updating tickets:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { variant: 'default' as const, icon: AlertTriangle, color: 'text-orange-600' },
      in_progress: { variant: 'secondary' as const, icon: Clock, color: 'text-blue-600' },
      resolved: { variant: 'outline' as const, icon: CheckCircle, color: 'text-green-600' },
      closed: { variant: 'outline' as const, icon: XCircle, color: 'text-gray-600' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="capitalize">
        <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: number) => {
    const priorityConfig = {
      1: { label: 'Low', variant: 'outline' as const, color: 'text-green-600' },
      2: { label: 'Medium', variant: 'outline' as const, color: 'text-yellow-600' },
      3: { label: 'High', variant: 'secondary' as const, color: 'text-orange-600' },
      4: { label: 'Urgent', variant: 'destructive' as const, color: 'text-red-600' },
    }
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig[2]

    return (
      <Badge variant={config.variant} className="capitalize">
        {config.label}
      </Badge>
    )
  }

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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <HelpCircle className="h-8 w-8" />
            Support Tickets
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track customer support requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground">
              All support tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts['open'] || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts['in_progress'] || 0}</div>
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(counts['resolved'] || 0) + (counts['closed'] || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Completed tickets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
          <CardDescription>Filter tickets by status, source, and type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by subject, description, or user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>

              <Select value={issueTypeFilter} onValueChange={setIssueTypeFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTickets.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedTickets.length} ticket{selectedTickets.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('in_progress')}
                >
                  Mark In Progress
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('resolved')}
                >
                  Mark Resolved
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('closed')}
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tickets found matching your filters.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <Checkbox
                          checked={selectedTickets.length === tickets.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Ticket ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Submitted At
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        User Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Issue Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tickets.map((ticket: any) => (
                      <tr key={ticket._id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedTickets.includes(ticket._id)}
                            onCheckedChange={(checked) => handleSelectTicket(ticket._id, checked as boolean)}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">
                          {ticket._id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs">
                            <div className="font-medium truncate">{ticket.subject}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {ticket.description?.slice(0, 100)}
                              {ticket.description?.length > 100 && '...'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {ticket.created_at ? format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm') : ''}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {ticket.user_id?.email || 'Unknown'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">
                            {ticket.ticket_type || 'regular'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">
                            {ticket.category || 'general'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(ticket.status || 'open')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(ticket._id, 'in_progress')}
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(ticket._id, 'resolved')}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(ticket._id, 'closed')}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
