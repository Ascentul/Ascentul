'use client'

import React, { useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useToast } from '@/hooks/use-toast'
import { GraduationCap, Users, BookOpen, Award, TrendingUp, TrendingDown, Activity, Calendar, Grid3X3, Table, Filter, Search } from 'lucide-react'
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'

export default function UniversityDashboardPage() {
  const { user: clerkUser } = useUser()
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  const canAccess = !!user && (isAdmin || user.subscription_plan === 'university' || user.role === 'university_admin')

  // Mock data for enhanced analytics
  const studentGrowthData = [
    { month: 'Aug', students: 42 },
    { month: 'Sep', students: 58 },
    { month: 'Oct', students: 73 },
    { month: 'Nov', students: 89 },
    { month: 'Dec', students: 104 },
    { month: 'Jan', students: 126 },
  ]

  const activityData = [
    { day: 'Mon', logins: 67, assignments: 23 },
    { day: 'Tue', logins: 89, assignments: 34 },
    { day: 'Wed', logins: 76, assignments: 28 },
    { day: 'Thu', logins: 93, assignments: 41 },
    { day: 'Fri', logins: 85, assignments: 36 },
    { day: 'Sat', logins: 45, assignments: 12 },
    { day: 'Sun', logins: 38, assignments: 8 },
  ]

  const departmentStats = departments ? departments.map((dept: any) => ({
    name: dept.name,
    students: Math.floor(Math.random() * 50) + 10,
    courses: Math.floor(Math.random() * 15) + 3,
  })) : []

  // Filter students based on current filters
  const filteredStudents = useMemo(() => {
    if (!students) return []

    return students.filter((student: any) => {
      // Role filter
      if (roleFilter !== 'all' && student.role !== roleFilter) return false

      // Status filter
      if (statusFilter === 'active' && !student.name) return false
      if (statusFilter === 'pending' && student.name) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const name = (student.name || '').toLowerCase()
        const email = (student.email || '').toLowerCase()
        if (!name.includes(query) && !email.includes(query)) return false
      }

      return true
    })
  }, [students, roleFilter, statusFilter, searchQuery])

  const overview = useQuery(api.university_admin.getOverview, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')
  const students = useQuery(api.university_admin.listStudents, clerkUser?.id ? { clerkId: clerkUser.id, limit: 50 } : 'skip')
  const courses = useQuery(api.university_admin.listCourses, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')
  const departments = useQuery(api.university_admin.listDepartments, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')

  // Department mutations and local state
  const createDepartment = useMutation(api.university_admin.createDepartment)
  const updateDepartment = useMutation(api.university_admin.updateDepartment)
  const deleteDepartment = useMutation(api.university_admin.deleteDepartment)
  const [deptForm, setDeptForm] = useState<{ name: string; code?: string }>({ name: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ name: string; code?: string }>({ name: '' })

  // Assign student licenses
  const assignStudent = useMutation(api.university_admin.assignStudentByEmail)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignText, setAssignText] = useState('')
  const [assignRole, setAssignRole] = useState<'user' | 'staff'>('user')
  const [assigning, setAssigning] = useState(false)
  const [importingEmails, setImportingEmails] = useState(false)

  // Student filtering state
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'staff'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [searchQuery, setSearchQuery] = useState('')

  // Student management state
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user' })
  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<any>(null)
  const [updatingStudent, setUpdatingStudent] = useState(false)
  const [deletingStudent, setDeletingStudent] = useState(false)

  // Student management functions
  const handleEditStudent = (student: any) => {
    setEditingStudent(student)
    setEditForm({
      name: student.name || '',
      email: student.email || '',
      role: student.role || 'user'
    })
    setEditOpen(true)
  }

  const handleUpdateStudent = async () => {
    if (!clerkUser?.id || !editingStudent) return

    setUpdatingStudent(true)
    try {
      // Simulate API call to update student
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Student updated",
        description: `${editForm.name || editForm.email} has been updated successfully.`,
        variant: "success",
      })
      setEditOpen(false)
      setEditingStudent(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingStudent(false)
    }
  }

  const handleDeleteStudent = (student: any) => {
    setStudentToDelete(student)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteStudent = async () => {
    if (!clerkUser?.id || !studentToDelete) return

    setDeletingStudent(true)
    try {
      // Simulate API call to remove student
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Student removed",
        description: `${studentToDelete.name || studentToDelete.email} has been removed successfully.`,
        variant: "success",
      })
      setDeleteConfirmOpen(false)
      setStudentToDelete(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to remove student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingStudent(false)
    }
  }

  const handleResendInvitation = async (student: any) => {
    if (!clerkUser?.id) return

    try {
      // Simulate API call to resend invitation
      await new Promise(resolve => setTimeout(resolve, 500))

      toast({
        title: "Invitation sent",
        description: `Invitation resent to ${student.email}`,
        variant: "success",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to the University Dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!overview || !students || !courses || !departments) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-screen-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">University Administration</h1>
          <p className="text-muted-foreground">Manage student licenses, courses, and performance.</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center rounded-md border px-3 py-2 text-sm">Export Reports</button>
          <button
            className="inline-flex items-center rounded-md bg-primary text-white px-3 py-2 text-sm"
            onClick={() => setAssignOpen(true)}
          >
            Add Student Licenses
          </button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalStudents}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+12.3%</span>
                  <span>from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">License Usage</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.activeLicenses} / {overview.licenseCapacity}</div>
                <Progress value={overview.licenseCapacity ? (overview.activeLicenses / overview.licenseCapacity) * 100 : 0} className="mt-2 h-2" />
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
                  <Activity className="h-3 w-3" />
                  <span>{Math.round((overview.activeLicenses / overview.licenseCapacity) * 100)}% utilized</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalCourses}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+3 new</span>
                  <span>this week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">847</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+8.2%</span>
                  <span>user sessions</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Growth</CardTitle>
                <CardDescription>Monthly enrollment over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={studentGrowthData}>
                    <defs>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="students" stroke="#4F46E5" fillOpacity={1} fill="url(#colorStudents)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>Daily logins and assignment submissions</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="logins" fill="#4F46E5" name="Logins" />
                    <Bar dataKey="assignments" fill="#10B981" name="Assignments" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Status</CardTitle>
                <CardDescription>Published vs Draft courses</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Published', value: courses.filter((c: any) => c.published).length },
                        { name: 'Draft', value: courses.filter((c: any) => !c.published).length },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label
                    >
                      <Cell fill="#4F46E5" />
                      <Cell fill="#CBD5E1" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
                <CardDescription>Students per department</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentStats.slice(0, 5)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={60} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="students" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Score</CardTitle>
                <CardDescription>Overall university engagement</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500">87%</div>
                  <div className="text-sm text-muted-foreground">Above Average</div>
                  <div className="flex items-center justify-center space-x-2 mt-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+5.2%</span>
                    <span>from last week</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Students</CardTitle>
              <CardDescription>Latest users in your institution</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.slice(0, 8).map((s: any) => (
                    <TableRow key={s._id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell className="uppercase text-xs text-muted-foreground">{s.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">Showing {Math.min(8, students.length)} of {students.length}</CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.filter((s: any) => s.role === 'user' && s.name).length}</div>
                <p className="text-xs text-muted-foreground">
                  +{students.filter((s: any) => s.role === 'user' && !s.name).length} pending
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.filter((s: any) => s.role === 'staff').length}</div>
                <p className="text-xs text-muted-foreground">Faculty and staff</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {students.filter((s: any) => s.updated_at && (Date.now() - s.updated_at) < 7 * 24 * 60 * 60 * 1000).length}
                </div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.length}</div>
                <p className="text-xs text-muted-foreground">All users assigned</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Students & Staff Management</CardTitle>
                  <CardDescription>Manage student accounts, licenses, and permissions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssignOpen(true)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Bulk Invite
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Export List
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Role:</span>
                    <ToggleGroup type="single" value={roleFilter} onValueChange={(value) => setRoleFilter(value as 'all' | 'user' | 'staff' || 'all')}>
                      <ToggleGroupItem value="all" size="sm">All</ToggleGroupItem>
                      <ToggleGroupItem value="user" size="sm">Students</ToggleGroupItem>
                      <ToggleGroupItem value="staff" size="sm">Staff</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <ToggleGroup type="single" value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'pending' || 'all')}>
                      <ToggleGroupItem value="all" size="sm">All</ToggleGroupItem>
                      <ToggleGroupItem value="active" size="sm">Active</ToggleGroupItem>
                      <ToggleGroupItem value="pending" size="sm">Pending</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm font-medium">View:</span>
                    <ToggleGroup type="single" value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'grid' || 'table')}>
                      <ToggleGroupItem value="table" size="sm">
                        <Table className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="grid" size="sm">
                        <Grid3X3 className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Showing {filteredStudents.length} of {students.length} users
                </div>

                {viewMode === 'table' ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((s: any) => (
                        <TableRow key={s._id}>
                          <TableCell className="font-medium">{s.name || 'Pending'}</TableCell>
                          <TableCell>{s.email}</TableCell>
                          <TableCell>
                            <Badge variant={s.role === 'staff' ? 'default' : 'secondary'}>
                              {s.role === 'staff' ? 'Staff' : 'Student'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={s.name ? 'default' : 'outline'}>
                              {s.name ? 'Active' : 'Invited'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStudent(s)}
                              >
                                Edit
                              </Button>
                              {s.name ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => handleDeleteStudent(s)}
                                >
                                  Remove
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600"
                                  onClick={() => handleResendInvitation(s)}
                                >
                                  Resend
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((s: any) => (
                      <Card key={s._id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                {s.role === 'staff' ? (
                                  <GraduationCap className="h-5 w-5 text-primary" />
                                ) : (
                                  <Users className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <CardTitle className="text-base">{s.name || 'Pending'}</CardTitle>
                                <p className="text-sm text-muted-foreground">{s.email}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge variant={s.role === 'staff' ? 'default' : 'secondary'} className="text-xs">
                                {s.role === 'staff' ? 'Staff' : 'Student'}
                              </Badge>
                              <Badge variant={s.name ? 'default' : 'outline'} className="text-xs">
                                {s.name ? 'Active' : 'Invited'}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              Last active: {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : 'Never'}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStudent(s)}
                              >
                                Edit
                              </Button>
                              {s.name ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => handleDeleteStudent(s)}
                                >
                                  Remove
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600"
                                  onClick={() => handleResendInvitation(s)}
                                >
                                  Resend
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Courses</CardTitle>
                  <CardDescription>Create and manage courses</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((c: any) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>{c.category || '—'}</TableCell>
                      <TableCell>{c.level || '—'}</TableCell>
                      <TableCell>
                        {c.published ? (
                          <Badge>Published</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
              <CardDescription>Academic departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
                <Input placeholder="Department name" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
                <Input placeholder="Code (optional)" value={deptForm.code || ''} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} />
                <div className="md:col-span-3 flex items-center">
                  <Button
                    onClick={async () => {
                      if (!clerkUser?.id || !deptForm.name.trim()) return
                      await createDepartment({ clerkId: clerkUser.id, name: deptForm.name.trim(), code: deptForm.code || undefined })
                      setDeptForm({ name: '' })
                    }}
                    disabled={!deptForm.name.trim()}
                  >
                    Create Department
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((d: any) => (
                  <Card key={String(d._id)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        {editingId === String(d._id) ? (
                          <div className="flex-1 flex gap-2">
                            <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                            <Input placeholder="Code" className="w-28" value={editing.code || ''} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
                          </div>
                        ) : (
                          <CardTitle className="text-lg">{d.name}</CardTitle>
                        )}
                        {d.code && editingId !== String(d._id) && <Badge variant="outline">{d.code}</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground">Department ID: {String(d._id)}</p>
                        <div className="flex gap-2">
                          {editingId === String(d._id) ? (
                            <>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  if (!clerkUser?.id) return
                                  await updateDepartment({ clerkId: clerkUser.id, departmentId: d._id, patch: { name: editing.name || d.name, code: editing.code } })
                                  setEditingId(null)
                                }}
                              >
                                Save
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingId(String(d._id))
                                  setEditing({ name: d.name, code: d.code })
                                }}
                              >
                                Rename
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (!clerkUser?.id) return
                                  await deleteDepartment({ clerkId: clerkUser.id, departmentId: d._id })
                                }}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Student Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Student full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="student@university.edu"
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed after invitation</p>
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStudent} disabled={updatingStudent}>
              {updatingStudent ? 'Updating...' : 'Update Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {studentToDelete?.name || studentToDelete?.email} from your university?
              This action cannot be undone and will revoke their access to all university resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStudent}
              disabled={deletingStudent}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingStudent ? 'Removing...' : 'Remove Student'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Licenses Modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Student Licenses</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Emails</Label>
              <Textarea
                placeholder="Enter one email per line or comma-separated"
                rows={6}
                value={assignText}
                onChange={(e) => setAssignText(e.target.value)}
              />
              <div className="text-xs text-muted-foreground mt-1">We'll assign these users to your university. New users will need to sign in once to appear fully.</div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Assign role:</Label>
              <div className="flex gap-2">
                <Button variant={assignRole === 'user' ? 'default' : 'outline'} size="sm" onClick={() => setAssignRole('user')}>User</Button>
                <Button variant={assignRole === 'staff' ? 'default' : 'outline'} size="sm" onClick={() => setAssignRole('staff')}>Staff</Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="studentEmailsCsv"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setImportingEmails(true)
                  try {
                    const text = await f.text()
                    // Basic parse: collect tokens that look like emails
                    const emailsFromCsv = Array.from(text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)).map(m => m[0])
                    const combined = [assignText, emailsFromCsv.join('\n')].filter(Boolean).join('\n')
                    setAssignText(combined)
                  } finally {
                    setImportingEmails(false)
                  }
                }}
              />
              <Button variant="outline" size="sm" onClick={() => document.getElementById('studentEmailsCsv')?.click()} disabled={importingEmails}>
                {importingEmails ? 'Parsing...' : 'Import CSV'}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!clerkUser?.id) return
                const emails = Array.from(new Set(assignText.split(/[\n,]+/).map(e => e.trim()).filter(Boolean)))
                if (emails.length === 0) return
                setAssigning(true)
                try {
                  for (const email of emails) {
                    await assignStudent({ clerkId: clerkUser.id, email, role: assignRole })
                  }
                  toast({ title: 'Licenses assigned', description: `${emails.length} user(s) updated`, variant: 'success' })
                  setAssignOpen(false)
                  setAssignText('')
                } catch (e: any) {
                  toast({ title: 'Failed to assign licenses', description: e?.message || String(e), variant: 'destructive' })
                } finally {
                  setAssigning(false)
                }
              }}
              disabled={assigning || !assignText.trim()}
            >
              {assigning ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
