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
import { Loader2, MoreHorizontal, Search, ShieldCheck, School, Plus } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
  status: 'active' | 'expired' | 'trial' | 'suspended'
  admin_email?: string
  created_by_id?: string
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

  // Fetch users to calculate admin count per university
  const usersResult = useQuery(
    api.users.getAllUsers,
    clerkUser?.id ? { clerkId: clerkUser.id, limit: 1000 } : 'skip'
  )

  // Mutations for updating universities
  const updateUniversity = useMutation(api.universities.updateUniversity)
  const createUniversityMutation = useMutation(api.universities.createUniversity)
  const assignUniversityToUser = useMutation(api.universities.assignUniversityToUser)

  const universities: UniversityRow[] = useMemo(() =>
    (universitiesResult ? universitiesResult as any : []), [universitiesResult])

  // Helper to get admin count for each university
  const getAdminCount = (universityId: string) => {
    if (!usersResult) return 0
    const users = usersResult.page as any[]
    return users.filter(u => u.university_id === universityId && u.role === 'university_admin').length
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

  const [editing, setEditing] = useState<UniversityRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{
    name: string
    slug: string
    license_plan: UniversityRow['license_plan']
    license_seats: number
    status: UniversityRow['status']
    admin_email?: string
  } | null>(null)

  // Create university state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<{
    name: string
    slug: string
    license_plan: UniversityRow['license_plan']
    license_seats: number
    status: UniversityRow['status']
    admin_email: string
  }>({
    name: '',
    slug: '',
    license_plan: 'Starter',
    license_seats: 10,
    status: 'trial',
    admin_email: ''
  })

  // Grant university account state
  const [showGrantDialog, setShowGrantDialog] = useState(false)
  const [granting, setGranting] = useState(false)
  const [grantError, setGrantError] = useState<string | null>(null)
  const [grantSuccess, setGrantSuccess] = useState(false)
  const [grantForm, setGrantForm] = useState<{
    universityId: string
    userEmail: string
    makeAdmin: boolean
    sendInviteEmail: boolean
  }>({
    universityId: '',
    userEmail: '',
    makeAdmin: false,
    sendInviteEmail: true // Default ON for invite emails
  })

  const submitEdit = async () => {
    if (!editing || !form) return
    setSaving(true)
    try {
      await updateUniversity({
        universityId: editing._id as any,
        updates: {
          name: form.name,
          slug: form.slug,
          license_plan: form.license_plan,
          license_seats: form.license_seats,
          status: form.status,
          admin_email: form.admin_email,
        },
      })
      setEditing(null)
    } catch (error) {
      console.error('Error updating university:', error)
    } finally {
      setSaving(false)
    }
  }

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

  const submitGrantAccount = async () => {
    if (!grantForm.universityId || !grantForm.userEmail.trim()) return
    setGranting(true)
    setGrantError(null)
    setGrantSuccess(false)
    try {
      // Find user by email
      const users = usersResult?.page as any[]
      const user = users?.find(u => u.email.toLowerCase() === grantForm.userEmail.toLowerCase())

      if (!user) {
        setGrantError('User not found with that email address')
        return
      }

      await assignUniversityToUser({
        userClerkId: user.clerkId,
        universitySlug: universities.find(u => u._id === grantForm.universityId)?.slug || '',
        makeAdmin: grantForm.makeAdmin,
        sendInviteEmail: grantForm.sendInviteEmail
      })

      // Show success message
      setGrantSuccess(true)
      setGrantError(null)

      // Reset form and close dialog after a short delay
      setTimeout(() => {
        setGrantForm({
          universityId: '',
          userEmail: '',
          makeAdmin: false,
          sendInviteEmail: true
        })
        setShowGrantDialog(false)
        setGrantSuccess(false)
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to grant university access. Please try again.'
      console.error('Error granting university account:', error)
      setGrantError(errorMessage)
      setGrantSuccess(false)
    } finally {
      setGranting(false)
    }
  }

  const handleGrantAccount = (universityId: string) => {
    setGrantForm({
      ...grantForm,
      universityId
    })
    setShowGrantDialog(true)
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
            <p className="text-muted-foreground">Only Admin and Super Admin can access University Management.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!universitiesResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
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
            <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr_80px] gap-3 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="min-w-0">University</div>
              <div className="min-w-0">Plan / Seats</div>
              <div className="min-w-0">Usage</div>
              <div className="min-w-0">Contract Dates</div>
              <div className="min-w-0">Status</div>
              <div className="min-w-0">Admins</div>
              <div className="text-right min-w-0">Actions</div>
            </div>
            <div className="divide-y">
              {filtered.map(u => (
                <div key={u._id} className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr_80px] gap-3 px-4 py-3 items-center">
                  <div className="min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      <School className="h-4 w-4 flex-shrink-0" /> {u.name}
                    </div>
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
                  <div className="text-right min-w-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/admin/universities/${u._id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setEditing(u)
                          setForm({
                            name: u.name,
                            slug: u.slug,
                            license_plan: u.license_plan,
                            license_seats: u.license_seats,
                            status: u.status,
                            admin_email: u.admin_email
                          })
                        }}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleGrantAccount(u._id)}>
                          Grant University Account
                        </DropdownMenuItem>
                        {u.status === 'active' && (
                          <DropdownMenuItem>Suspend</DropdownMenuItem>
                        )}
                        {u.status === 'suspended' && (
                          <DropdownMenuItem>Reactivate</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit University</DialogTitle>
            <DialogDescription>Update university settings and licensing.</DialogDescription>
          </DialogHeader>
          {form ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Plan</label>
                  <Select value={form.license_plan} onValueChange={(v: any) => setForm({ ...form, license_plan: v })}>
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
                  <label className="text-sm font-medium">Seats</label>
                  <Input
                    type="number"
                    value={form.license_seats}
                    onChange={e => setForm({ ...form, license_seats: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Admin Email</label>
                <Input
                  type="email"
                  value={form.admin_email || ''}
                  onChange={e => setForm({ ...form, admin_email: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submitEdit} disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Grant University Account Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant University Account</DialogTitle>
            <DialogDescription>
              Grant access to {universities.find(u => u._id === grantForm.universityId)?.name} for an existing user.
            </DialogDescription>
          </DialogHeader>
          {grantSuccess ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                <p className="text-sm font-medium text-green-900">Access granted successfully!</p>
                <p className="text-sm text-green-800 mt-1">
                  {grantForm.sendInviteEmail ? 'Invitation email has been sent.' : 'No invitation email was sent.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {grantError && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                  <p className="text-sm font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-800 mt-1">{grantError}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">User Email Address</label>
                <Input
                  value={grantForm.userEmail}
                  onChange={e => setGrantForm({ ...grantForm, userEmail: e.target.value })}
                  placeholder="Enter user's email address"
                  type="email"
                  disabled={granting}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="makeAdmin"
                  checked={grantForm.makeAdmin}
                  onChange={e => setGrantForm({ ...grantForm, makeAdmin: e.target.checked })}
                  className="rounded"
                  disabled={granting}
                />
                <label htmlFor="makeAdmin" className="text-sm font-medium">
                  Make this user a University Admin
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendInviteEmail"
                  checked={grantForm.sendInviteEmail}
                  onChange={e => setGrantForm({ ...grantForm, sendInviteEmail: e.target.checked })}
                  className="rounded"
                  disabled={granting}
                />
                <label htmlFor="sendInviteEmail" className="text-sm font-medium">
                  Send invite email
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantDialog(false)} disabled={granting}>Cancel</Button>
            <Button
              onClick={submitGrantAccount}
              disabled={granting || !grantForm.userEmail.trim() || grantSuccess}
            >
              {granting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Granting...</>
              ) : 'Grant Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
