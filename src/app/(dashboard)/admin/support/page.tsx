'use client'

import React, { useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import {
  Loader2,
  HelpCircle,
  Search,
  Filter,
  MoreHorizontal,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  Tag,
  Send,
  Eye,
  Edit,
  Trash2,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  Plus,
  Archive,
  UserCheck,
  Timer,
  RefreshCw,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts'

// Mock data for comprehensive support management
const mockTickets = [
  { _id: '1', subject: 'Cannot access premium features', user_id: 'john.doe@harvard.edu', status: 'open', category: 'billing', priority: 'high', created_at: Date.now() - 86400000, university: 'Harvard University', assignee: 'Sarah Wilson' },
  { _id: '2', subject: 'Resume builder not saving', user_id: 'jane.smith@stanford.edu', status: 'in_progress', category: 'technical', priority: 'medium', created_at: Date.now() - 172800000, university: 'Stanford University', assignee: 'Mike Johnson' },
  { _id: '3', subject: 'University integration issues', user_id: 'admin@mit.edu', status: 'resolved', category: 'integration', priority: 'high', created_at: Date.now() - 259200000, university: 'MIT', assignee: 'Lisa Chen' },
  { _id: '4', subject: 'Login problems with SSO', user_id: 'student@berkeley.edu', status: 'open', category: 'authentication', priority: 'high', created_at: Date.now() - 345600000, university: 'UC Berkeley', assignee: null },
  { _id: '5', subject: 'Feature request for mobile app', user_id: 'user@yale.edu', status: 'closed', category: 'feature_request', priority: 'low', created_at: Date.now() - 432000000, university: 'Yale University', assignee: 'David Park' },
]

const ticketsByDay = [
  { date: '2024-01-15', total: 12, resolved: 8, open: 4 },
  { date: '2024-01-16', total: 15, resolved: 10, open: 5 },
  { date: '2024-01-17', total: 8, resolved: 6, open: 2 },
  { date: '2024-01-18', total: 18, resolved: 12, open: 6 },
  { date: '2024-01-19', total: 22, resolved: 16, open: 6 },
  { date: '2024-01-20', total: 14, resolved: 11, open: 3 },
  { date: '2024-01-21', total: 19, resolved: 14, open: 5 },
]

const ticketsByCategory = [
  { name: 'Technical', value: 35, color: '#3b82f6' },
  { name: 'Billing', value: 25, color: '#ef4444' },
  { name: 'Integration', value: 20, color: '#f59e0b' },
  { name: 'Authentication', value: 15, color: '#8b5cf6' },
  { name: 'Feature Request', value: 5, color: '#10b981' },
]

const responseTimeData = [
  { category: 'Technical', avgTime: 4.2, target: 6 },
  { category: 'Billing', avgTime: 2.1, target: 4 },
  { category: 'Integration', avgTime: 8.5, target: 12 },
  { category: 'Authentication', avgTime: 1.8, target: 2 },
  { category: 'Feature Request', avgTime: 24.3, target: 48 },
]

export default function AdminSupportPage() {
  const { user: clerkUser } = useUser()
  const { user } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'technical' | 'billing' | 'integration' | 'authentication' | 'feature_request'>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [editingTicket, setEditingTicket] = useState<any>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<any>(null)
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(false)

  const tickets = useMemo(() => mockTickets, [])

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = !searchQuery ||
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.university || '').toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
      const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter
      const matchesAssignee = assigneeFilter === 'all' ||
        (assigneeFilter === 'assigned' && ticket.assignee) ||
        (assigneeFilter === 'unassigned' && !ticket.assignee)

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssignee
    })
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter, assigneeFilter])

  const counts = useMemo(() => {
    const list = tickets || []
    const byStatus: Record<string, number> = {}
    for (const t of list) {
      const s = t.status || 'open'
      byStatus[s] = (byStatus[s] || 0) + 1
    }
    return byStatus
  }, [tickets])

  const stats = useMemo(() => {
    const totalTickets = tickets.length
    const openTickets = tickets.filter(t => t.status === 'open').length
    const avgResponseTime = 3.2 // hours
    const resolutionRate = Math.round((tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length / totalTickets) * 100)

    return {
      totalTickets,
      openTickets,
      avgResponseTime,
      resolutionRate,
      unassignedTickets: tickets.filter(t => !t.assignee).length,
      highPriorityTickets: tickets.filter(t => t.priority === 'high').length
    }
  }, [tickets])

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast({
        title: "Status updated",
        description: `Ticket status has been updated to ${newStatus}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket status.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTicket = async (ticketId: string, assignee: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast({
        title: "Ticket assigned",
        description: `Ticket has been assigned to ${assignee}.`,
      })
      setAssignDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign ticket.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast({
        title: "Ticket deleted",
        description: "Support ticket has been permanently deleted.",
      })
      setDeleteDialogOpen(false)
      setTicketToDelete(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete ticket.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast({
        title: "Reply sent",
        description: "Your reply has been sent to the user.",
      })
      setReplyDialogOpen(false)
      setReplyContent('')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reply.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'destructive'
      case 'in_progress': return 'default'
      case 'resolved': return 'secondary'
      case 'closed': return 'outline'
      default: return 'outline'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-6 w-6" /> Support Management
        </h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">All Tickets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Stats Cards */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTickets}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.openTickets}</div>
                <p className="text-xs text-muted-foreground">-8% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                <Timer className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgResponseTime}h</div>
                <p className="text-xs text-green-600">-0.5h improvement</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.resolutionRate}%</div>
                <p className="text-xs text-green-600">+5% this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
                <UserCheck className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.unassignedTickets}</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.highPriorityTickets}</div>
                <p className="text-xs text-muted-foreground">Urgent attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Quick Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Trends (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={ticketsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <Area type="monotone" dataKey="total" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="resolved" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tickets by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ticketsByCategory}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {ticketsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Latest support tickets requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.slice(0, 5).map((ticket) => (
                  <div key={ticket._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`h-2 w-2 rounded-full ${
                        ticket.status === 'open' ? 'bg-red-500' :
                        ticket.status === 'in_progress' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground">{ticket.user_id} • {ticket.university}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getBadgeVariant(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge>
                      <Badge variant="outline" className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tickets, users, universities..."
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger>
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
                <Select value={priorityFilter} onValueChange={(v: any) => setPriorityFilter(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="authentication">Authentication</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={assigneeFilter} onValueChange={(v: any) => setAssigneeFilter(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Showing {filteredTickets.length} of {tickets.length} tickets</span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-8 gap-2 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                  <div className="col-span-2">Subject</div>
                  <div>User</div>
                  <div>University</div>
                  <div>Status</div>
                  <div>Priority</div>
                  <div>Assignee</div>
                  <div className="text-right">Actions</div>
                </div>
                <div className="divide-y">
                  {filteredTickets.map((ticket) => (
                    <div key={ticket._id} className="grid grid-cols-8 gap-2 px-4 py-3 items-center hover:bg-gray-50">
                      <div className="col-span-2 truncate">
                        <div className="font-medium">{ticket.subject}</div>
                        <div className="text-xs text-muted-foreground">
                          {ticket.category} • {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="truncate text-sm">{ticket.user_id}</div>
                      <div className="truncate text-sm">{ticket.university}</div>
                      <div>
                        <Badge variant={getBadgeVariant(ticket.status)} className="text-xs">
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        {ticket.assignee ? (
                          <span className="text-green-600">{ticket.assignee}</span>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </div>
                      <div className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setSelectedTicket(ticket)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedTicket(ticket); setReplyDialogOpen(true) }}>
                              <Mail className="h-4 w-4 mr-2" /> Reply
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setEditingTicket(ticket); setAssignDialogOpen(true) }}>
                              <UserCheck className="h-4 w-4 mr-2" /> Assign
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(ticket._id, 'in_progress')}>
                              <RefreshCw className="h-4 w-4 mr-2" /> Mark In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(ticket._id, 'resolved')}>
                              <CheckCircle className="h-4 w-4 mr-2" /> Mark Resolved
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setTicketToDelete(ticket); setDeleteDialogOpen(true) }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Response Time Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Response Time Analysis</CardTitle>
              <CardDescription>Average response times by category vs targets</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgTime" fill="#3b82f6" name="Avg Response Time" />
                  <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} name="Target" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Volume Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ticketsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total Tickets" />
                    <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
                    <Line type="monotone" dataKey="open" stroke="#ef4444" strokeWidth={2} name="Open" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>First Response Time</span>
                  <span className="font-semibold">2.1 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Resolution Time</span>
                  <span className="font-semibold">18.4 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Customer Satisfaction</span>
                  <span className="font-semibold text-green-600">94.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Escalation Rate</span>
                  <span className="font-semibold">3.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Reopened Tickets</span>
                  <span className="font-semibold">5.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Agent Productivity</span>
                  <span className="font-semibold">12.3 tickets/day</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Settings</CardTitle>
              <CardDescription>Configure support ticket system preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">General Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Auto-assign tickets</Label>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Email notifications</Label>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>SLA targets</Label>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Team Management</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Support agents</Label>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Escalation rules</Label>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Working hours</Label>
                      <Button variant="outline" size="sm">Set</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ticket Details Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTicket.subject}</DialogTitle>
              <DialogDescription>
                Ticket #{selectedTicket._id} • Created {new Date(selectedTicket.created_at).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <p className="text-sm">{selectedTicket.user_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">University</Label>
                  <p className="text-sm">{selectedTicket.university}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getBadgeVariant(selectedTicket.status)}>{selectedTicket.status.replace('_', ' ')}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge variant="outline" className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm capitalize">{selectedTicket.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Assignee</Label>
                  <p className="text-sm">{selectedTicket.assignee || 'Unassigned'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm">User is experiencing issues with accessing premium features after subscription upgrade. The features appear locked despite successful payment confirmation.</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>Close</Button>
              <Button onClick={() => { setReplyDialogOpen(true) }}>
                <Mail className="h-4 w-4 mr-2" /> Reply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Ticket</DialogTitle>
            <DialogDescription>
              Send a reply to {selectedTicket?.user_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reply Message</Label>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply here..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendReply} disabled={loading || !replyContent.trim()}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Ticket</DialogTitle>
            <DialogDescription>
              Assign this ticket to a support agent
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Assignee</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sarah">Sarah Wilson</SelectItem>
                  <SelectItem value="mike">Mike Johnson</SelectItem>
                  <SelectItem value="lisa">Lisa Chen</SelectItem>
                  <SelectItem value="david">David Park</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleAssignTicket(editingTicket?._id, 'Sarah Wilson')} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserCheck className="h-4 w-4 mr-2" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this support ticket? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTicket} className="bg-red-600 hover:bg-red-700">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
