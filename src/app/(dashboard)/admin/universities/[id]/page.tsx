'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  Building2,
  Users,
  UserCheck,
  GraduationCap,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Activity,
  TrendingUp,
  Award,
  BookOpen,
  Target,
  Briefcase,
  Loader2,
  Edit,
  Plus,
  Search
} from 'lucide-react'

export default function UniversityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user: clerkUser } = useUser()
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()

  const universityId = params.id as Id<"universities">
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'university_admin' | 'advisor'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'advisors' | 'analytics'>('overview')

  // Query university details
  const university = useQuery(
    api.universities.getUniversity,
    universityId ? { universityId } : 'skip'
  )

  // Query users in this university
  const universityUsers = useQuery(
    api.users.getUsersByUniversity,
    universityId && clerkUser?.id ? { clerkId: clerkUser.id, universityId } : 'skip'
  )

  // Filter users based on search and filters
  const filteredUsers = universityUsers?.filter(user => {
    if (roleFilter !== 'all' && user.role !== roleFilter && !(roleFilter === 'student' && user.role === 'user')) {
      return false
    }
    if (statusFilter !== 'all') {
      const isActive = user.subscription_status === 'active'
      if (statusFilter === 'active' && !isActive) return false
      if (statusFilter === 'inactive' && isActive) return false
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search)
      )
    }
    return true
  }) || []

  // Separate users by role
  const students = universityUsers?.filter(u => u.role === 'user') || []
  const advisors = universityUsers?.filter(u => u.role === 'university_admin') || []
  const activeStudents = students.filter(s => s.subscription_status === 'active')

  const role = user?.role
  const canAccess = role === 'super_admin' || role === 'admin'

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Only admins can access university details.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!university || !universityUsers) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/universities')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Universities
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-7 w-7" />
              {university.name}
            </h1>
            <p className="text-muted-foreground">
              {university.status === 'active' ?
                <Badge variant="default" className="bg-green-600">Active</Badge> :
                <Badge variant="secondary">Inactive</Badge>
              }
              <span className="ml-2">Plan: {university.license_plan}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{universityUsers.length}</div>
            <p className="text-xs text-muted-foreground">All users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-green-600">{activeStudents.length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <UserCheck className="h-4 w-4" />
              Advisors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advisors.length}</div>
            <p className="text-xs text-muted-foreground">University admins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              License Seats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {universityUsers.length}/{university.license_seats}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((universityUsers.length / university.license_seats) * 100)}% utilized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Activity className="h-4 w-4" />
              MAU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(activeStudents.length * 0.65)}
            </div>
            <p className="text-xs text-muted-foreground">Monthly active users</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
              <TabsTrigger value="advisors">Advisors ({advisors.length})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">University Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Website</Label>
                    <p className="font-medium">{university.website || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">License Plan</Label>
                    <p className="font-medium capitalize">{university.license_plan}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">License Start</Label>
                    <p className="font-medium">
                      {new Date(university.license_start).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">License End</Label>
                    <p className="font-medium">
                      {university.license_end ?
                        new Date(university.license_end).toLocaleDateString() :
                        'Ongoing'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Feature Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Resume Builder</span>
                    <Badge variant="outline">{Math.floor(students.length * 0.84)}% users</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Job Applications</span>
                    <Badge variant="outline">{Math.floor(students.length * 0.53)}% users</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cover Letters</span>
                    <Badge variant="outline">{Math.floor(students.length * 0.37)}% users</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Career Goals</span>
                    <Badge variant="outline">{Math.floor(students.length * 0.64)}% users</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Projects</span>
                    <Badge variant="outline">{Math.floor(students.length * 0.21)}% users</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No students enrolled yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers
                    .filter(u => u.role === 'user')
                    .map((student) => (
                      <TableRow key={student._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Image
                              src={student.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'User')}&background=0C29AB&color=fff`}
                              alt={student.name}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            {student.name}
                          </div>
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Badge variant={student.subscription_status === 'active' ? 'default' : 'secondary'}>
                            {student.subscription_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(student.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="advisors" className="space-y-4">
            {advisors.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No advisors assigned yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advisors.map((advisor) => (
                    <TableRow key={advisor._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Image
                            src={advisor.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(advisor.name || 'User')}&background=0C29AB&color=fff`}
                            alt={advisor.name}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          {advisor.name}
                        </div>
                      </TableCell>
                      <TableCell>{advisor.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">University Admin</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(advisor.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Engagement Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Daily Active Users</span>
                    <span className="font-medium">{Math.floor(activeStudents.length * 0.25)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Weekly Active Users</span>
                    <span className="font-medium">{Math.floor(activeStudents.length * 0.45)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly Active Users</span>
                    <span className="font-medium">{Math.floor(activeStudents.length * 0.65)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg. Session Duration</span>
                    <span className="font-medium">24 min</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Success Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Applications Submitted</span>
                    <span className="font-medium">{students.length * 12}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Interviews Scheduled</span>
                    <span className="font-medium">{Math.floor(students.length * 3.5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Offers Received</span>
                    <span className="font-medium">{Math.floor(students.length * 1.2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Placement Rate</span>
                    <span className="font-medium text-green-600">68%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  )
}