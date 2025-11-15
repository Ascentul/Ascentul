'use client'

import React, { useState, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { AdvisorGate } from '@/components/advisor/AdvisorGate'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  HelpCircle,
  Loader2,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Send,
  Trash2
} from 'lucide-react'

export default function AdvisorSupportPage() {
  const { user: clerkUser } = useUser()
  const { toast } = useToast()

  // State
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    description: ''
  })

  const [responseText, setResponseText] = useState('')

  // Queries
  const tickets = useQuery(
    api.support_tickets.listTickets,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  ) as any[] | undefined

  // Mutations
  const createTicket = useMutation(api.support_tickets.createTicket)
  const updateTicketStatus = useMutation(api.support_tickets.updateTicketStatus)
  const addResponse = useMutation(api.support_tickets.addTicketResponse)
  const deleteTicket = useMutation(api.support_tickets.deleteTicket)

  // Filter tickets
  const filteredTickets = useMemo(() => {
    if (!tickets) return []

    let filtered = tickets

    // Status filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(t => t.status === activeTab)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.subject?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.contact_person?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [tickets, activeTab, priorityFilter, categoryFilter, searchQuery])

  // Handle create ticket
  const handleCreateTicket = async () => {
    if (!clerkUser?.id || !formData.subject || !formData.description) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      await createTicket({
        clerkId: clerkUser.id,
        subject: formData.subject,
        category: formData.category,
        priority: formData.priority,
        description: formData.description
      })

      toast({
        title: 'Ticket created',
        description: 'Your support ticket has been created successfully',
        variant: 'success'
      })

      setCreateDialogOpen(false)
      setFormData({
        subject: '',
        category: 'general',
        priority: 'medium',
        description: ''
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create ticket',
        variant: 'destructive'
      })
    }
  }

  // Handle update status
  const handleUpdateStatus = async (ticketId: any, newStatus: string) => {
    if (!clerkUser?.id) return

    try {
      await updateTicketStatus({
        clerkId: clerkUser.id,
        ticketId,
        status: newStatus as any
      })

      // Update local state to reflect the change immediately
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus })
      }

      toast({
        title: 'Status updated',
        description: `Ticket status changed to ${newStatus}`,
        variant: 'success'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive'
      })
    }
  }

  // Handle add response
  const handleAddResponse = async () => {
    if (!clerkUser?.id || !selectedTicket || !responseText.trim()) return

    try {
      await addResponse({
        clerkId: clerkUser.id,
        ticketId: selectedTicket._id,
        message: responseText.trim()
      })

      toast({
        title: 'Response added',
        description: 'Your response has been posted',
        variant: 'success'
      })

      setResponseText('')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add response',
        variant: 'destructive'
      })
    }
  }

  // Handle delete ticket
  const handleDeleteTicket = async (ticketId: any) => {
    if (!clerkUser?.id) return

    if (!confirm('Are you sure you want to delete this ticket?')) return

    try {
      await deleteTicket({
        clerkId: clerkUser.id,
        ticketId
      })

      toast({
        title: 'Ticket deleted',
        description: 'The ticket has been permanently deleted',
        variant: 'success'
      })

      setDetailDialogOpen(false)
      setSelectedTicket(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete ticket',
        variant: 'destructive'
      })
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-blue-600"><Clock className="h-3 w-3 mr-1" />Open</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-amber-600"><AlertTriangle className="h-3 w-3 mr-1" />In Progress</Badge>
      case 'resolved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>
      case 'closed':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>
      case 'high':
        return <Badge variant="default" className="bg-orange-600">High</Badge>
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>
      case 'low':
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  if (!tickets) {
    return (
      <AdvisorGate requiredFlag='advisor.support'>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AdvisorGate>
    )
  }

  return (
    <AdvisorGate requiredFlag='advisor.support'>
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2" style={{ color: '#0C29AB' }}>
              <HelpCircle className="h-7 w-7" />
              Support Tickets
            </h1>
            <p className="text-muted-foreground">Submit and track your support requests</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {tickets.filter(t => t.status === 'open').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {tickets.filter(t => t.status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {tickets.filter(t => t.status === 'resolved').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>My Tickets</CardTitle>
            <CardDescription>View and manage your support tickets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tabs for status filter */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search and filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="bug_report">Bug Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tickets Table */}
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No tickets found</p>
                <Button onClick={() => setCreateDialogOpen(true)} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first ticket
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket: any) => (
                    <TableRow key={String(ticket._id)} className="cursor-pointer hover:bg-gray-50">
                      <TableCell className="font-medium">{ticket.subject}</TableCell>
                      <TableCell className="capitalize">{ticket.category.replace('_', ' ')}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setDetailDialogOpen(true)
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Ticket Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Submit a new support request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of the issue"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="bug_report">Bug Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority *</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your issue..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTicket}>
                <Send className="h-4 w-4 mr-2" />
                Submit Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ticket Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedTicket && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedTicket.subject}
                  </DialogTitle>
                  <DialogDescription>
                    Ticket #{String(selectedTicket._id).slice(-6)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Ticket Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Priority</Label>
                      <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Category</Label>
                      <div className="mt-1 capitalize">{selectedTicket.category.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Created</Label>
                      <div className="mt-1">{new Date(selectedTicket.created_at).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Card className="mt-2">
                      <CardContent className="pt-4">
                        <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdvisorGate>
  )
}
