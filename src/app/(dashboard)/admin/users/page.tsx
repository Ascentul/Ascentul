'use client'

import React, { useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, MoreHorizontal, Search, ShieldCheck, User as UserIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

// Types matching Convex users table
interface UserRow {
  _id: string
  clerkId: string
  email: string
  name: string
  username?: string
  role: 'user' | 'student' | 'staff' | 'university_admin' | 'advisor' | 'admin' | 'super_admin'
  subscription_plan: 'free' | 'premium' | 'university'
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  university_id?: string
  profile_image?: string
  created_at: number
  updated_at: number
}

export default function AdminUsersPage() {
  const { user: clerkUser } = useUser()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRow['role']>('all')
  const [planFilter, setPlanFilter] = useState<'all' | UserRow['subscription_plan']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | UserRow['subscription_status']>('all')
  const [universityFilter, setUniversityFilter] = useState<'all' | string>('all')

  // Fetch users (first page only for MVP)
  const usersResult = useQuery(
    api.users.getAllUsers,
    clerkUser?.id ? { clerkId: clerkUser.id, limit: 100 } : 'skip'
  )

  // Fetch universities for the university column
  const universities = useQuery(api.universities.getAllUniversities, {})

  const updateUser = useMutation(api.users.updateUser)
  const createUserByAdmin = useMutation(api.admin_users.createUserByAdmin)

  // Create user mutation for adding new staff users
  const createUser = useMutation(api.users.createUser)

  const users: UserRow[] = useMemo(() => (usersResult ? usersResult.page as any : []), [usersResult])

  // Helper to get university name from university_id
  const getUniversityName = (universityId?: string) => {
    if (!universityId || !universities) return 'None'
    const university = universities.find(u => u._id === universityId)
    return university?.name || universityId
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(u => {
      const matchesText =
        !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q)
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      const matchesPlan = planFilter === 'all' || u.subscription_plan === planFilter
      const matchesStatus = statusFilter === 'all' || u.subscription_status === statusFilter
      const matchesUniversity = universityFilter === 'all' || u.university_id === universityFilter
      return matchesText && matchesRole && matchesPlan && matchesStatus && matchesUniversity
    })
  }, [users, search, roleFilter, planFilter, statusFilter, universityFilter])

  const [editing, setEditing] = useState<UserRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{ name: string; email: string; role: UserRow['role']; plan: UserRow['subscription_plan']; status: UserRow['subscription_status'] } | null>(null)

  // Add staff user state
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'staff' as UserRow['role'],
    plan: 'free' as UserRow['subscription_plan'],
    sendActivationEmail: true // Default ON for Staff/Super Admin
  })
  const [creatingUser, setCreatingUser] = useState(false)

  const handleAddUser = async () => {
    if (!newUserForm.name.trim() || !newUserForm.email.trim() || !clerkUser?.id) return

    setCreatingUser(true)
    try {
      // Use createUserByAdmin mutation which conditionally sends activation email
      await createUserByAdmin({
        adminClerkId: clerkUser.id,
        email: newUserForm.email,
        name: newUserForm.name,
        role: newUserForm.role as "user" | "student" | "staff" | "university_admin" | "advisor",
        sendActivationEmail: newUserForm.sendActivationEmail,
      })

      // Reset form
      setNewUserForm({ name: '', email: '', role: 'staff', plan: 'free', sendActivationEmail: true })
      setShowAddUser(false)

      // Refresh the page to show new user
      window.location.reload()
    } catch (error) {
      console.error('Error creating user:', error)
    } finally {
      setCreatingUser(false)
    }
  }

  const openEdit = (u: UserRow) => {
    setEditing(u)
    setForm({ name: u.name, email: u.email, role: u.role, plan: u.subscription_plan, status: u.subscription_status })
  }

  const submitEdit = async () => {
    if (!editing || !form) return
    setSaving(true)
    try {
      await updateUser({
        clerkId: editing.clerkId,
        updates: {
          name: form.name,
          email: form.email,
          role: form.role as any,
          subscription_plan: form.plan,
          subscription_status: form.status,
        },
      })
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const role = user?.role
  const isSuperOrAdmin = role === 'super_admin'
  if (!isSuperOrAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Only Super Admin can access User Management.</p>
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
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <Button onClick={() => setShowAddUser(true)} className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, username" className="pl-8" />
            </div>
            <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="university_admin">University Admin</SelectItem>
                <SelectItem value="advisor">Advisor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={universityFilter} onValueChange={(v: any) => setUniversityFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="University" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universities?.map(uni => (
                  <SelectItem key={uni._id} value={uni._id}>
                    {uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={(v: any) => setPlanFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="university">University</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Showing {filtered.length} of {users.length} users
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1.5fr_1fr_80px] gap-3 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="min-w-0">Name</div>
              <div className="hidden md:block min-w-0">Email</div>
              <div className="min-w-0">Role</div>
              <div className="hidden md:block min-w-0">Plan</div>
              <div className="min-w-0">University</div>
              <div className="min-w-0">Status</div>
              <div className="text-right min-w-0">Actions</div>
            </div>
            <div className="divide-y">
              {filtered.map(u => (
                <div key={u._id} className="grid grid-cols-[2fr_2fr_1fr_1fr_1.5fr_1fr_80px] gap-3 px-4 py-3 items-center">
                  <div className="min-w-0 truncate">
                    <div className="font-medium flex items-center gap-2">
                      <img
                        src={u.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=0C29AB&color=fff`}
                        alt={u.name}
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                      />
                      {u.name}
                    </div>
                    <div className="text-xs text-muted-foreground md:hidden truncate">{u.email}</div>
                  </div>
                  <div className="hidden md:block min-w-0 truncate">{u.email}</div>
                  <div className="min-w-0">
                    <Badge variant="outline" className="capitalize text-xs">{u.role.replace('_', ' ')}</Badge>
                  </div>
                  <div className="hidden md:block min-w-0"><Badge variant={u.subscription_plan === 'premium' ? 'default' : 'secondary'} className="capitalize text-xs">{u.subscription_plan}</Badge></div>
                  <div className="min-w-0 truncate">
                    <span className="text-xs text-muted-foreground">{getUniversityName(u.university_id)}</span>
                  </div>
                  <div className="min-w-0"><Badge variant={u.subscription_status === 'active' ? 'default' : 'destructive'} className="capitalize text-xs">{u.subscription_status}</Badge></div>
                  <div className="text-right min-w-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEdit(u)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => updateUser({ clerkId: u.clerkId, updates: { subscription_status: u.subscription_status === 'active' ? 'inactive' : 'active' } })}>
                          {u.subscription_status === 'active' ? 'Mark Inactive' : 'Mark Active'}
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

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user profile and access.</DialogDescription>
          </DialogHeader>
          {form ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select value={form.role} onValueChange={(v: any) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="university_admin">University Admin</SelectItem>
                      <SelectItem value="advisor">Advisor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Plan</label>
                  <Select
                    value={form.plan}
                    onValueChange={(v: any) => setForm({ ...form, plan: v })}
                    disabled={!!editing?.university_id}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                    </SelectContent>
                  </Select>
                  {editing?.university_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Plan locked to "university" for users belonging to a university
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-24"><Loader2 className="h-6 w-6 animate-spin" /></div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submitEdit} disabled={saving}>{saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>) : 'Save changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new user account and send activation email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={newUserForm.name}
                onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <Input
                value={newUserForm.email}
                onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="Enter email address"
                type="email"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={newUserForm.role} onValueChange={(v: any) => {
                // Update role and set default email checkbox based on role
                const isUniversityRole = ['student', 'university_admin', 'advisor'].includes(v)
                setNewUserForm({ ...newUserForm, role: v, sendActivationEmail: !isUniversityRole })
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="student">Student (University)</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="university_admin">University Admin</SelectItem>
                  <SelectItem value="advisor">Advisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendActivationEmail"
                checked={newUserForm.sendActivationEmail}
                onChange={e => setNewUserForm({ ...newUserForm, sendActivationEmail: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="sendActivationEmail" className="text-sm font-medium">
                Send activation email now
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={creatingUser || !newUserForm.name.trim() || !newUserForm.email.trim()}>
              {creatingUser ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>) : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
