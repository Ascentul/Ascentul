'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Search, School, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Types matching Convex universities table
interface UniversityRow {
  _id: string
  name: string
  slug: string
  license_plan: 'Starter' | 'Basic' | 'Pro' | 'Enterprise'
  license_seats: number
  license_used: number
  license_start: number
  license_end?: number
  status: 'active' | 'expired' | 'trial' | 'suspended' | 'archived' | 'deleted'
  admin_email?: string
  created_by_id?: string
  is_test?: boolean
  archived_at?: number
  deleted_at?: number
  created_at: number
  updated_at: number
}

export default function AdminUniversitiesPage() {
  const router = useRouter()
  const { user: clerkUser } = useUser()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | UniversityRow['status']>('all')
  const [planFilter, setPlanFilter] = useState<'all' | UniversityRow['license_plan']>('all')

  // Fetch universities
  const universitiesResult = useQuery(
    api.universities.getAllUniversities,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  )

  // Fetch university admin counts (optimized - no longer fetching all users)
  const adminCounts = useQuery(
    api.universities.getUniversityAdminCounts,
    {}
  )

  // Mutations for creating universities
  const createUniversityMutation = useMutation(api.universities.createUniversity)

  const universities: UniversityRow[] = useMemo(() =>
    (universitiesResult ? universitiesResult as any : []), [universitiesResult])

  // Helper to get admin count for each university (using optimized admin counts query)
  const getAdminCount = (universityId: string) => {
    if (!adminCounts) return 0
    return adminCounts[universityId] || 0
  }

  // Helper to format dates
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return universities.filter(u => {
      const matchesText = !q || u.name.toLowerCase().includes(q) || u.slug.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter
      const matchesPlan = planFilter === 'all' || u.license_plan === planFilter
      return matchesText && matchesStatus && matchesPlan
    })
  }, [universities, search, statusFilter, planFilter])

  // Create university state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<{
    name: string
    slug: string
    license_plan: UniversityRow['license_plan']
    license_seats: number
    status: 'active' | 'expired' | 'trial' | 'suspended' // Only statuses allowed for creation
    admin_email: string
  }>({
    name: '',
    slug: '',
    license_plan: 'Starter',
    license_seats: 10,
    status: 'trial',
    admin_email: ''
  })

  const submitCreate = async () => {
    if (!createForm.name.trim() || !createForm.slug.trim()) return
    setCreating(true)
    try {
      await createUniversityMutation({
        name: createForm.name.trim(),
        slug: createForm.slug.trim(),
        license_plan: createForm.license_plan,
        license_seats: createForm.license_seats,
        status: createForm.status,
        admin_email: createForm.admin_email.trim() || undefined,
        created_by_clerkId: clerkUser?.id,
      })

      // Reset form and close dialog
      setCreateForm({
        name: '',
        slug: '',
        license_plan: 'Starter',
        license_seats: 10,
        status: 'trial',
        admin_email: ''
      })
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Error creating university:', error)
    } finally {
      setCreating(false)
    }
  }

  const role = user?.role
  const isSuperAdmin = role === 'super_admin'
  if (!isSuperAdmin) {
    return (
      <div className="space-y-4 min-w-0">
        <div className="w-full min-w-0 rounded-3xl bg-white p-6 shadow-sm">
          <Card>
            <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Only Super Admin can access University Management.</p>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  if (!universitiesResult) {
    return (
      <div className="space-y-4 min-w-0">
        <div className="w-full min-w-0 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 min-w-0">
      <div className="w-full min-w-0 rounded-3xl bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Universities
        </h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add University
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
          <div className="relative col-span-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search universities..." className="pl-8" />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={(v: any) => setPlanFilter(v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="Starter">Starter</SelectItem>
              <SelectItem value="Basic">Basic</SelectItem>
              <SelectItem value="Pro">Pro</SelectItem>
              <SelectItem value="Enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Universities ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr_120px] gap-3 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="min-w-0">University</div>
              <div className="min-w-0">Plan / Seats</div>
              <div className="min-w-0">Usage</div>
              <div className="min-w-0">Contract Dates</div>
              <div className="min-w-0">Status</div>
              <div className="min-w-0">Admins</div>
              <div className="text-center min-w-0">Actions</div>
            </div>
            <div className="divide-y">
              {filtered.map(u => (
                <div key={u._id} className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr_120px] gap-3 px-4 py-3 items-center">
                  <div className="min-w-0">
                    <button
                      onClick={() => router.push(`/admin/universities/${u._id}`)}
                      className="font-medium flex items-center gap-2 hover:text-primary-600 transition-colors cursor-pointer text-left"
                    >
                      <School className="h-4 w-4 flex-shrink-0" /> {u.name}
                    </button>
                    <div className="text-xs text-muted-foreground truncate">{u.slug}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium">{u.license_plan}</div>
                    <div className="text-xs text-muted-foreground">{u.license_seats} seats</div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium">{u.license_used}/{u.license_seats}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.license_seats > 0 ? Math.round((u.license_used / u.license_seats) * 100) : 0}% used
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs">
                      <div>Start: {formatDate(u.license_start)}</div>
                      {u.license_end && <div>End: {formatDate(u.license_end)}</div>}
                      {!u.license_end && <div className="text-muted-foreground">No end date</div>}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <Badge variant={u.status === 'active' ? 'default' : 'destructive'} className="capitalize text-xs">
                      {u.status}
                    </Badge>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium">{getAdminCount(u._id)}</div>
                    <div className="text-xs text-muted-foreground">admins</div>
                  </div>
                  <div className="flex justify-center min-w-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/universities/${u._id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create University Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New University</DialogTitle>
            <DialogDescription>Add a new university to the system with licensing details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">University Name</label>
              <Input
                value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g., Harvard University"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={createForm.slug}
                onChange={e => setCreateForm({ ...createForm, slug: e.target.value })}
                placeholder="e.g., harvard"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">License Plan</label>
                <Select value={createForm.license_plan} onValueChange={(v: any) => setCreateForm({ ...createForm, license_plan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">License Seats</label>
                <Input
                  type="number"
                  value={createForm.license_seats}
                  onChange={e => setCreateForm({ ...createForm, license_seats: parseInt(e.target.value) || 0 })}
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Initial Status</label>
              <Select value={createForm.status} onValueChange={(v: any) => setCreateForm({ ...createForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Admin Email (Optional)</label>
              <Input
                type="email"
                value={createForm.admin_email}
                onChange={e => setCreateForm({ ...createForm, admin_email: e.target.value })}
                placeholder="admin@university.edu"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              onClick={submitCreate}
              disabled={creating || !createForm.name.trim() || !createForm.slug.trim()}
            >
              {creating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
              ) : 'Create University'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </div>
  )
}
