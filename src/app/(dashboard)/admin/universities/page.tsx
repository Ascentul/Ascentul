'use client'

import React, { useState, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  School,
  Users,
  Calendar,
  MapPin,
  Globe,
  Mail,
  Plus,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  TrendingUp,
  Activity,
  Settings,
  Shield
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
} from 'recharts'

interface University {
  _id: string
  name: string
  domain: string
  contact_email: string
  website_url?: string
  description?: string
  logo_url?: string
  status: 'active' | 'inactive' | 'pending'
  student_count: number
  admin_count: number
  created_at: number
  updated_at: number
  location?: string
  subscription_tier: 'basic' | 'premium' | 'enterprise'
}

interface UniversityFormData {
  name: string
  domain: string
  contact_email: string
  website_url: string
  description: string
  logo_url: string
  location: string
  subscription_tier: 'basic' | 'premium' | 'enterprise'
}

const initialFormData: UniversityFormData = {
  name: '',
  domain: '',
  contact_email: '',
  website_url: '',
  description: '',
  logo_url: '',
  location: '',
  subscription_tier: 'basic'
}

export default function UniversitiesPage() {
  const { user: clerkUser } = useUser()
  const { isAdmin } = useAuth()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')
  const [tierFilter, setTierFilter] = useState<'all' | 'basic' | 'premium' | 'enterprise'>('all')

  const [showDialog, setShowDialog] = useState(false)
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null)
  const [formData, setFormData] = useState<UniversityFormData>(initialFormData)
  const [saving, setSaving] = useState(false)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [universityToDelete, setUniversityToDelete] = useState<University | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Mock data for universities
  const universities: University[] = [
    {
      _id: '1',
      name: 'Harvard University',
      domain: 'harvard.edu',
      contact_email: 'admin@harvard.edu',
      website_url: 'https://harvard.edu',
      description: 'Harvard University is a private Ivy League research university in Cambridge, Massachusetts.',
      location: 'Cambridge, MA',
      status: 'active',
      student_count: 287,
      admin_count: 12,
      subscription_tier: 'enterprise',
      created_at: Date.now() - 86400000 * 30,
      updated_at: Date.now() - 3600000
    },
    {
      _id: '2',
      name: 'Stanford University',
      domain: 'stanford.edu',
      contact_email: 'admin@stanford.edu',
      website_url: 'https://stanford.edu',
      description: 'Stanford University is a private research university in Stanford, California.',
      location: 'Stanford, CA',
      status: 'active',
      student_count: 245,
      admin_count: 8,
      subscription_tier: 'premium',
      created_at: Date.now() - 86400000 * 25,
      updated_at: Date.now() - 7200000
    },
    {
      _id: '3',
      name: 'MIT',
      domain: 'mit.edu',
      contact_email: 'admin@mit.edu',
      website_url: 'https://mit.edu',
      description: 'Massachusetts Institute of Technology is a private research university in Cambridge, Massachusetts.',
      location: 'Cambridge, MA',
      status: 'active',
      student_count: 198,
      admin_count: 6,
      subscription_tier: 'premium',
      created_at: Date.now() - 86400000 * 20,
      updated_at: Date.now() - 14400000
    },
    {
      _id: '4',
      name: 'Princeton University',
      domain: 'princeton.edu',
      contact_email: 'admin@princeton.edu',
      website_url: 'https://princeton.edu',
      description: 'Princeton University is a private Ivy League research university in Princeton, New Jersey.',
      location: 'Princeton, NJ',
      status: 'pending',
      student_count: 0,
      admin_count: 1,
      subscription_tier: 'basic',
      created_at: Date.now() - 86400000 * 2,
      updated_at: Date.now() - 86400000 * 2
    },
  ]

  const universityGrowthData = [
    { month: 'Jul', universities: 18, students: 1856 },
    { month: 'Aug', universities: 19, students: 2134 },
    { month: 'Sep', universities: 21, students: 2387 },
    { month: 'Oct', universities: 22, students: 2542 },
    { month: 'Nov', universities: 23, students: 2743 },
    { month: 'Dec', universities: 24, students: 2847 },
  ]

  const tierDistribution = [
    { name: 'Basic', value: 8, color: '#F59E0B' },
    { name: 'Premium', value: 12, color: '#10B981' },
    { name: 'Enterprise', value: 4, color: '#4F46E5' },
  ]

  const filteredUniversities = useMemo(() => {
    return universities.filter(university => {
      const matchesSearch = !searchQuery ||
        university.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        university.domain.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || university.status === statusFilter
      const matchesTier = tierFilter === 'all' || university.subscription_tier === tierFilter

      return matchesSearch && matchesStatus && matchesTier
    })
  }, [universities, searchQuery, statusFilter, tierFilter])

  const handleCreateEdit = (university?: University) => {
    if (university) {
      setEditingUniversity(university)
      setFormData({
        name: university.name,
        domain: university.domain,
        contact_email: university.contact_email,
        website_url: university.website_url || '',
        description: university.description || '',
        logo_url: university.logo_url || '',
        location: university.location || '',
        subscription_tier: university.subscription_tier
      })
    } else {
      setEditingUniversity(null)
      setFormData(initialFormData)
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.domain.trim() || !formData.contact_email.trim()) {
      toast({
        title: "Error",
        description: "Name, domain, and contact email are required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: editingUniversity ? "University updated" : "University created",
        description: `${formData.name} has been ${editingUniversity ? 'updated' : 'created'} successfully.`,
        variant: "success",
      })
      setShowDialog(false)
      setEditingUniversity(null)
      setFormData(initialFormData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save university. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (university: University) => {
    setUniversityToDelete(university)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!universityToDelete) return

    setDeleting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "University deleted",
        description: `${universityToDelete.name} has been deleted successfully.`,
        variant: "success",
      })
      setDeleteConfirmOpen(false)
      setUniversityToDelete(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete university. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: University['status']) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      pending: 'outline'
    } as const
    return <Badge variant={variants[status]} className="capitalize">{status}</Badge>
  }

  const getTierBadge = (tier: University['subscription_tier']) => {
    const variants = {
      basic: 'secondary',
      premium: 'default',
      enterprise: 'default'
    } as const
    const colors = {
      basic: 'bg-yellow-500',
      premium: 'bg-green-500',
      enterprise: 'bg-blue-500'
    }
    return <Badge variant={variants[tier]} className={`capitalize ${colors[tier]}`}>{tier}</Badge>
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to university management.</p>
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
            <School className="h-7 w-7" />
            Universities Management
          </h1>
          <p className="text-muted-foreground">Manage university accounts and subscriptions</p>
        </div>
        <Button onClick={() => handleCreateEdit()}>
          <Plus className="h-4 w-4 mr-2" />
          Add University
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="universities">Universities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Universities</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{universities.length}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+2 new</span>
                  <span>this month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{universities.reduce((acc, u) => acc + u.student_count, 0).toLocaleString()}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>Across all universities</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Universities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{universities.filter(u => u.status === 'active').length}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{Math.round((universities.filter(u => u.status === 'active').length / universities.length) * 100)}% active rate</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{universities.filter(u => u.status === 'pending').length}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>Require review</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>University Growth</CardTitle>
                <CardDescription>Universities and student growth over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={universityGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="universities" fill="#4F46E5" name="Universities" />
                    <Bar dataKey="students" fill="#10B981" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Tiers</CardTitle>
                <CardDescription>Distribution of university subscription tiers</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {tierDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="universities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search & Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or domain..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tierFilter} onValueChange={(v: any) => setTierFilter(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {filteredUniversities.length} of {universities.length} universities
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredUniversities.map((university) => (
              <Card key={university._id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <School className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{university.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{university.domain}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleCreateEdit(university)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(university)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    {getStatusBadge(university.status)}
                    {getTierBadge(university.subscription_tier)}
                  </div>

                  {university.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {university.location}
                    </div>
                  )}

                  {university.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {university.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{university.student_count}</div>
                      <div className="text-muted-foreground">Students</div>
                    </div>
                    <div>
                      <div className="font-medium">{university.admin_count}</div>
                      <div className="text-muted-foreground">Admins</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <Calendar className="h-3 w-3" />
                    Created {formatDate(university.created_at)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>University Analytics</CardTitle>
              <CardDescription>Detailed insights and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Advanced university analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit University Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUniversity ? 'Edit University' : 'Add New University'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">University Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Harvard University"
                />
              </div>
              <div>
                <Label htmlFor="domain">Email Domain *</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="harvard.edu"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_email">Contact Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="admin@harvard.edu"
                />
              </div>
              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://harvard.edu"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Cambridge, MA"
                />
              </div>
              <div>
                <Label htmlFor="subscription_tier">Subscription Tier</Label>
                <Select value={formData.subscription_tier} onValueChange={(v: any) => setFormData({ ...formData, subscription_tier: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the university..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingUniversity ? 'Update University' : 'Create University'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete University</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {universityToDelete?.name}? This action cannot be undone and will affect all associated users and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete University'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}