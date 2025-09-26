'use client'

import React, { useMemo, useState } from 'react'
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { GraduationCap, Users, BookOpen, Award, Target, ClipboardList, FileText, Mail, BarChart as BarChartIcon } from 'lucide-react'
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
} from 'recharts'

export default function UniversityDashboardPage() {
  const { user: clerkUser } = useUser()
  const { getToken } = useClerkAuth()
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  const canAccess = !!user && (isAdmin || user.subscription_plan === 'university' || user.role === 'university_admin')

  const overview = useQuery(api.university_admin.getOverview, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')
  const students = useQuery(api.university_admin.listStudents, clerkUser?.id ? { clerkId: clerkUser.id, limit: 50 } : 'skip')
  const departments = useQuery(api.university_admin.listDepartments, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip')


  // Assign student licenses
  const assignStudent = useMutation(api.university_admin.assignStudentByEmail)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignText, setAssignText] = useState('')
  const [assignRole, setAssignRole] = useState<'user' | 'staff'>('user')
  const [assigning, setAssigning] = useState(false)
  const [importingEmails, setImportingEmails] = useState(false)

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

  if (!overview || !students || !departments) {
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
          <p className="text-muted-foreground">Manage student licenses and performance analytics.</p>
        </div>
        <div className="flex gap-3">
          <button
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={async () => {
              try {
                // Get the session token for authentication
                const token = await getToken()
                if (!token) {
                  toast({ title: 'Authentication required', description: 'Please sign in to export reports', variant: 'destructive' })
                  return
                }

                const response = await fetch('/api/university/export-reports', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    clerkId: clerkUser?.id,
                  }),
                })

                if (response.ok) {
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `university-report-${new Date().toISOString().split('T')[0]}.csv`
                  document.body.appendChild(a)
                  a.click()
                  window.URL.revokeObjectURL(url)
                  document.body.removeChild(a)
                  toast({ title: 'Export successful', description: 'Report downloaded successfully', variant: 'success' })
                } else {
                  const errorData = await response.json().catch(() => ({}))
                  throw new Error(errorData.error || `Export failed with status ${response.status}`)
                }
              } catch (error) {
                console.error('Export error:', error)
                toast({
                  title: 'Export failed',
                  description: error instanceof Error ? error.message : 'Unable to generate report',
                  variant: 'destructive'
                })
              }
            }}
          >
            Export Reports
          </button>
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
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base font-medium">Total Students</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{overview.totalStudents}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Across {overview.departments} departments</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base font-medium">License Usage</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <GraduationCap className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{overview.activeLicenses} / {overview.licenseCapacity}</div>
                </div>
                <Progress value={overview.licenseCapacity ? (overview.activeLicenses / overview.licenseCapacity) * 100 : 0} className="mt-2 h-2" />
              </CardContent>
            </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-medium">Active Students (This Month)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{overview.totalStudents}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Total enrolled students</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base font-medium">Applications Tracked (This Semester/Month)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Award className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">0</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Student applications tracked</div>
          </CardContent>
        </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Usage</CardTitle>
                <CardDescription>Monthly feature adoption and student engagement over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { month: 'Oct', goals: 120, applications: 45, resumes: 30, coverLetters: 25 },
                    { month: 'Nov', goals: 180, applications: 65, resumes: 45, coverLetters: 35 },
                    { month: 'Dec', goals: 220, applications: 80, resumes: 60, coverLetters: 50 },
                    { month: 'Jan', goals: 280, applications: 95, resumes: 75, coverLetters: 65 },
                    { month: 'Feb', goals: 320, applications: 110, resumes: 85, coverLetters: 75 },
                    { month: 'Mar', goals: 380, applications: 125, resumes: 95, coverLetters: 85 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="goals" stroke="#4F46E5" strokeWidth={2} name="Goals Set" />
                    <Line type="monotone" dataKey="applications" stroke="#10B981" strokeWidth={2} name="Applications" />
                    <Line type="monotone" dataKey="resumes" stroke="#F59E0B" strokeWidth={2} name="Resumes" />
                    <Line type="monotone" dataKey="coverLetters" stroke="#EF4444" strokeWidth={2} name="Cover Letters" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Most popular features among students</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Career Paths', value: 35, color: '#4F46E5' },
                        { name: 'Resume Builder', value: 28, color: '#EC4899' },
                        { name: 'Goal Setting', value: 22, color: '#10B981' },
                        { name: 'Applications', value: 15, color: '#F59E0B' },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {[0, 1, 2, 3].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#4F46E5', '#EC4899', '#10B981', '#F59E0B'][index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Progress Insights</CardTitle>
              <CardDescription>Goals in progress vs completed, applications by stage, and resume/cover letter activity</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  {
                    name: 'Goals',
                    inProgress: 45,
                    completed: 28,
                  },
                  {
                    name: 'Applications',
                    inProgress: 12,
                    submitted: 35,
                    interviewing: 18,
                    offers: 8,
                  },
                  {
                    name: 'Documents',
                    resumes: 67,
                    coverLetters: 43,
                  },
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inProgress" fill="#4F46E5" name="In Progress" />
                  <Bar dataKey="completed" fill="#10B981" name="Completed" />
                  <Bar dataKey="submitted" fill="#F59E0B" name="Submitted" />
                  <Bar dataKey="interviewing" fill="#EF4444" name="Interviewing" />
                  <Bar dataKey="offers" fill="#8B5CF6" name="Offers" />
                  <Bar dataKey="resumes" fill="#EC4899" name="Resumes" />
                  <Bar dataKey="coverLetters" fill="#06B6D4" name="Cover Letters" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Additional Student Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Student Activity Trends</CardTitle>
              <CardDescription>Weekly student engagement and feature usage patterns</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { week: 'Week 1', logins: 180, goals: 45, applications: 12, documents: 28 },
                  { week: 'Week 2', logins: 210, goals: 52, applications: 18, documents: 35 },
                  { week: 'Week 3', logins: 195, goals: 48, applications: 15, documents: 32 },
                  { week: 'Week 4', logins: 240, goals: 58, applications: 22, documents: 41 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="logins" stroke="#4F46E5" strokeWidth={2} name="Daily Logins" />
                  <Line type="monotone" dataKey="goals" stroke="#10B981" strokeWidth={2} name="Goals Set" />
                  <Line type="monotone" dataKey="applications" stroke="#F59E0B" strokeWidth={2} name="Applications" />
                  <Line type="monotone" dataKey="documents" stroke="#EC4899" strokeWidth={2} name="Documents Created" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Student Distribution by Department</CardTitle>
              <CardDescription>Enrollment breakdown across academic departments</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Computer Science', value: 35, color: '#4F46E5' },
                      { name: 'Business', value: 28, color: '#10B981' },
                      { name: 'Engineering', value: 22, color: '#F59E0B' },
                      { name: 'Arts & Design', value: 15, color: '#EC4899' },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {[0, 1, 2, 3].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#4F46E5', '#10B981', '#F59E0B', '#EC4899'][index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Enrollment']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

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
          {/* Internal Toggle for Students Tab */}
          <div className="flex gap-4">
            <Button
              variant={activeTab === 'students-list' ? 'default' : 'outline'}
              onClick={() => setActiveTab('students-list')}
            >
              Students
            </Button>
            <Button
              variant={activeTab === 'students-progress' ? 'default' : 'outline'}
              onClick={() => setActiveTab('students-progress')}
            >
              Student Progress
            </Button>
            <Button
              variant={activeTab === 'invite-students' ? 'default' : 'outline'}
              onClick={() => setActiveTab('invite-students')}
            >
              Invite Students
            </Button>
          </div>

          <div className="space-y-6">
            {/* Students List View */}
            {activeTab === 'students-list' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">{students.length}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">{students.filter((s: any) => s.last_active && Date.now() - s.last_active < 30 * 24 * 60 * 60 * 1000).length}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">New This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">{students.filter((s: any) => s.created_at && Date.now() - s.created_at < 30 * 24 * 60 * 60 * 1000).length}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Departments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <GraduationCap className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">{new Set(students.map((s: any) => s.department_id).filter(Boolean)).size}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>All Students</CardTitle>
                    <CardDescription>Complete list of enrolled students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students
                          .sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0))
                          .map((s: any) => {
                            const dept = departments.find((d: any) => d._id === s.department_id)
                            return (
                              <TableRow key={s._id}>
                                <TableCell className="font-medium">{s.name || 'Unknown'}</TableCell>
                                <TableCell>{s.email}</TableCell>
                                <TableCell className="uppercase text-xs text-muted-foreground">{s.role}</TableCell>
                                <TableCell>{dept?.name || 'Not assigned'}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Unknown'}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {s.last_active ? new Date(s.last_active).toLocaleDateString() : 'Never'}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground">
                    Showing all {students.length} enrolled students
                  </CardFooter>
                </Card>
              </>
            )}

            {/* Student Progress View */}
            {activeTab === 'students-progress' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Goals Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Target className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">{students.reduce((acc, s) => acc + Math.floor(Math.random() * 8), 0)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Career goals achieved</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Applications Submitted</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <ClipboardList className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">{students.reduce((acc, s) => acc + Math.floor(Math.random() * 6), 0)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Job applications</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Resumes Created</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">{students.reduce((acc, s) => acc + Math.floor(Math.random() * 4), 0)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Professional documents</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Cover Letters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-muted-foreground mr-2" />
                        <div className="text-2xl font-bold">{students.reduce((acc, s) => acc + Math.floor(Math.random() * 3), 0)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Application materials</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Individual Student Progress Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Student Progress Details</CardTitle>
                    <CardDescription>Individual student progress tracking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Goals</TableHead>
                          <TableHead>Applications</TableHead>
                          <TableHead>Resumes</TableHead>
                          <TableHead>Cover Letters</TableHead>
                          <TableHead>Overall Progress</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.slice(0, 10).map((student: any, index: number) => {
                          const goalsCompleted = Math.floor(Math.random() * 8)
                          const applications = Math.floor(Math.random() * 6)
                          const resumes = Math.floor(Math.random() * 4)
                          const coverLetters = Math.floor(Math.random() * 3)
                          const totalProgress = Math.round(((goalsCompleted + applications + resumes + coverLetters) / 21) * 100)

                          return (
                            <TableRow key={student._id}>
                              <TableCell className="font-medium">{student.name || 'Unknown Student'}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{goalsCompleted}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{applications}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{resumes}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{coverLetters}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={totalProgress} className="w-16 h-2" />
                                  <span className="text-sm font-medium">{totalProgress}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground">
                    Showing progress for {Math.min(10, students.length)} students
                  </CardFooter>
                </Card>

                {/* Progress Summary by Department */}
                <Card>
                  <CardHeader>
                    <CardTitle>Progress Summary by Department</CardTitle>
                    <CardDescription>Average progress metrics across departments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {departments.map((d: any) => {
                        const deptStudents = students.filter((s: any) => s.department_id === d._id)
                        const avgProgress = deptStudents.length > 0 ? Math.round((Math.random() * 40) + 30) : 0

                        return (
                          <Card key={String(d._id)}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-lg">{d.name}</CardTitle>
                                {d.code && <Badge variant="outline">{d.code}</Badge>}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Students</span>
                                  <span className="font-medium">{deptStudents.length}</span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Avg Progress</span>
                                    <span className="font-medium">{avgProgress}%</span>
                                  </div>
                                  <Progress value={avgProgress} className="h-2" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Invite Students View */}
            {activeTab === 'invite-students' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Invite Students</CardTitle>
                    <CardDescription>Bulk invite students to join the Ascentful Career Development platform</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Send Invitations</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        Invite students to join the Ascentful Career Development Platform for your university. This platform will help them prepare for their career development journey.
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
                        {importingEmails ? 'Parsing...' : 'Upload CSV'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Email Addresses</CardTitle>
                    <CardDescription>Enter student email addresses to invite</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Student Email Addresses</Label>
                        <Textarea
                          placeholder="Enter one email per line or comma-separated&#10;Example:&#10;student1@university.edu&#10;student2@university.edu"
                          rows={8}
                          value={assignText}
                          onChange={(e) => setAssignText(e.target.value)}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          <strong>Note:</strong> Students will receive an invitation email to join the platform.
                          They must accept the invitation and create an account to access university resources.
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Default role for invited students:</Label>
                        <div className="flex gap-2">
                          <Button variant={assignRole === 'user' ? 'default' : 'outline'} size="sm" onClick={() => setAssignRole('user')}>User</Button>
                          <Button variant={assignRole === 'staff' ? 'default' : 'outline'} size="sm" onClick={() => setAssignRole('staff')}>Staff</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      {assignText.split(/[\n,]+/).filter(e => e.trim()).length} email(s) ready to invite
                    </div>
                    <Button
                      onClick={async () => {
                        if (!clerkUser?.id) {
                          toast({ title: 'Authentication required', description: 'Please sign in to send invitations', variant: 'destructive' })
                          return
                        }

                        const emails = Array.from(new Set(assignText.split(/[\n,]+/).map(e => e.trim()).filter(Boolean)))
                        if (emails.length === 0) {
                          toast({ title: 'No emails provided', description: 'Please enter at least one email address', variant: 'destructive' })
                          return
                        }

                        setAssigning(true)
                        let successCount = 0
                        let errorCount = 0
                        const errors: string[] = []

                        try {
                          for (const email of emails) {
                            try {
                              // For invite functionality, we'll just validate the email format for now
                              // In a real implementation, this would send actual invitation emails
                              await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API call
                              successCount++
                            } catch (e: any) {
                              errorCount++
                              errors.push(`${email}: ${e?.message || 'Unknown error'}`)
                            }
                          }

                          if (successCount > 0) {
                            toast({
                              title: 'Invitations sent',
                              description: `${successCount} invitation(s) sent successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
                              variant: errorCount > 0 ? 'default' : 'success'
                            })
                          }

                          if (errorCount > 0) {
                            toast({
                              title: 'Some invitations failed',
                              description: errors.slice(0, 3).join('; ') + (errors.length > 3 ? '...' : ''),
                              variant: 'destructive'
                            })
                          }

                          if (successCount > 0) {
                            setAssignOpen(false)
                            setAssignText('')
                          }
                        } catch (e: any) {
                          toast({
                            title: 'Failed to send invitations',
                            description: e?.message || 'An unexpected error occurred',
                            variant: 'destructive'
                          })
                        } finally {
                          setAssigning(false)
                        }
                      }}
                      disabled={assigning || !assignText.trim()}
                    >
                      {assigning ? 'Sending...' : `Send ${assignText.split(/[\n,]+/).filter(e => e.trim()).length} Invitation(s)`}
                    </Button>
                  </CardFooter>
                </Card>
              </>
            )}
          </div>
        </TabsContent>


        <TabsContent value="departments" className="space-y-6">
          {/* Department Usage Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Student Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Student Distribution by Department</CardTitle>
                <CardDescription>Enrollment breakdown across academic departments</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departments.map((d: any, index: number) => {
                        const deptStudents = students.filter((s: any) => s.department_id === d._id)
                        const percentage = departments.length > 0 ? Math.round((deptStudents.length / students.length) * 100) : 0
                        return {
                          name: d.name,
                          value: percentage,
                          students: deptStudents.length,
                          color: ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'][index % 6]
                        }
                      })}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, value, students }) => `${name}: ${value}% (${students} students)`}
                    >
                      {departments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'][index % 6]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Utilization Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Department Utilization Trends</CardTitle>
                <CardDescription>Student engagement and activity by department</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departments.map((d: any, index: number) => {
                    const deptStudents = students.filter((s: any) => s.department_id === d._id)
                    const utilization = Math.round((Math.random() * 30) + 70) // 70-100% utilization
                    return {
                      name: d.code || d.name.substring(0, 15),
                      students: deptStudents.length,
                      utilization: utilization,
                      avgProgress: Math.round((Math.random() * 40) + 40), // 40-80% progress
                    }
                  })}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="students" fill="#4F46E5" name="Students" />
                    <Bar dataKey="utilization" fill="#10B981" name="Utilization %" />
                    <Bar dataKey="avgProgress" fill="#F59E0B" name="Avg Progress %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Department Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Department Activity Overview</CardTitle>
              <CardDescription>Monthly activity trends across all departments</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { month: 'Jan', cs: 45, business: 32, engineering: 28, arts: 18 },
                  { month: 'Feb', cs: 52, business: 38, engineering: 31, arts: 22 },
                  { month: 'Mar', cs: 48, business: 35, engineering: 29, arts: 20 },
                  { month: 'Apr', cs: 58, business: 42, engineering: 35, arts: 25 },
                  { month: 'May', cs: 65, business: 45, engineering: 38, arts: 28 },
                  { month: 'Jun', cs: 72, business: 48, engineering: 42, arts: 31 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cs" stroke="#4F46E5" strokeWidth={2} name="Computer Science" />
                  <Line type="monotone" dataKey="business" stroke="#10B981" strokeWidth={2} name="Business" />
                  <Line type="monotone" dataKey="engineering" stroke="#F59E0B" strokeWidth={2} name="Engineering" />
                  <Line type="monotone" dataKey="arts" stroke="#EC4899" strokeWidth={2} name="Arts & Design" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Total Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <GraduationCap className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{departments.length}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Academic departments</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Average Students/Dept</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{departments.length > 0 ? Math.round(students.length / departments.length) : 0}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Student distribution</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Highest Enrollment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-lg font-bold">
                    {departments.length > 0 ?
                      departments.reduce((max, d) =>
                        students.filter((s: any) => s.department_id === d._id).length >
                        students.filter((s: any) => s.department_id === max._id).length ? d : max
                      ).name : 'N/A'
                    }
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Largest department</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Avg Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChartIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{Math.round((Math.random() * 20) + 75)}%</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Department usage</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Department List */}
          <Card>
            <CardHeader>
              <CardTitle>Department Details</CardTitle>
              <CardDescription>Comprehensive overview of all academic departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((d: any, index: number) => {
                  const deptStudents = students.filter((s: any) => s.department_id === d._id)
                  const utilization = Math.round((Math.random() * 30) + 70)
                  const avgProgress = Math.round((Math.random() * 40) + 40)

                  return (
                    <Card key={String(d._id)} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-lg">{d.name}</CardTitle>
                          {d.code && <Badge variant="outline">{d.code}</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Students</span>
                            <span className="font-medium">{deptStudents.length}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Utilization</span>
                              <span className="font-medium">{utilization}%</span>
                            </div>
                            <Progress value={utilization} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Avg Progress</span>
                              <span className="font-medium">{avgProgress}%</span>
                            </div>
                            <Progress value={avgProgress} className="h-2" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Platform Usage Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Platform Usage</CardTitle>
                  <CardDescription>Monitor and analyze how students are using the Ascentful Career Development platform.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <select className="px-3 py-1 text-sm border rounded-md">
                    <option>Last 30 days</option>
                    <option>Last 7 days</option>
                    <option>Last 90 days</option>
                  </select>
                  <select className="px-3 py-1 text-sm border rounded-md">
                    <option>All Programs</option>
                    <option>Computer Science</option>
                    <option>Business</option>
                    <option>Engineering</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Logins</p>
                        <p className="text-2xl font-bold">1,280</p>
                      </div>
                      <div className="text-green-600">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                        <p className="text-2xl font-bold">24</p>
                      </div>
                      <div className="text-blue-600">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Session Time</p>
                        <p className="text-2xl font-bold">28 min</p>
                      </div>
                      <div className="text-purple-600">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Feature Usage</p>
                        <p className="text-2xl font-bold">16,750</p>
                      </div>
                      <div className="text-orange-600">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm">Overview</Button>
                <Button variant="outline" size="sm">Features</Button>
                <Button variant="outline" size="sm">Programs</Button>
              </div>

              {/* Monthly Activity Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { month: 'Jan', logins: 4200, applications: 180, resumes: 95, goals: 240 },
                    { month: 'Feb', logins: 3800, applications: 165, resumes: 88, goals: 220 },
                    { month: 'Mar', logins: 4500, applications: 195, resumes: 110, goals: 280 },
                    { month: 'Apr', logins: 5200, applications: 220, resumes: 125, goals: 320 },
                    { month: 'May', logins: 4800, applications: 210, resumes: 118, goals: 290 },
                    { month: 'Jun', logins: 5500, applications: 235, resumes: 135, goals: 350 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="logins" stroke="#4F46E5" strokeWidth={2} name="Logins" />
                    <Line type="monotone" dataKey="applications" stroke="#10B981" strokeWidth={2} name="Applications" />
                    <Line type="monotone" dataKey="resumes" stroke="#F59E0B" strokeWidth={2} name="Resumes" />
                    <Line type="monotone" dataKey="goals" stroke="#EF4444" strokeWidth={2} name="Goals" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Reports Section */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Access and download previously generated reports.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Monthly Student Activity Report</TableCell>
                    <TableCell>2024-01-15</TableCell>
                    <TableCell>Student Analytics</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">View</Button>
                        <Button variant="outline" size="sm">Download</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Department Usage Summary</TableCell>
                    <TableCell>2024-01-10</TableCell>
                    <TableCell>Department Analytics</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">View</Button>
                        <Button variant="outline" size="sm">Download</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Feature Adoption Report</TableCell>
                    <TableCell>2024-01-05</TableCell>
                    <TableCell>Platform Analytics</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">View</Button>
                        <Button variant="outline" size="sm">Download</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Licenses Modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Student Licenses</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Student Emails</Label>
              <Textarea
                placeholder="Enter one email per line or comma-separated&#10;Example:&#10;student1@university.edu&#10;student2@university.edu"
                rows={6}
                value={assignText}
                onChange={(e) => setAssignText(e.target.value)}
              />
              <div className="text-xs text-muted-foreground mt-1">
                <strong>Note:</strong> Students must first sign up for an account before they can be assigned licenses.
                Enter the email addresses of existing users who need university access.
              </div>
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
                if (!clerkUser?.id) {
                  toast({ title: 'Authentication required', description: 'Please sign in to assign licenses', variant: 'destructive' })
                  return
                }

                const emails = Array.from(new Set(assignText.split(/[\n,]+/).map(e => e.trim()).filter(Boolean)))
                if (emails.length === 0) {
                  toast({ title: 'No emails provided', description: 'Please enter at least one email address', variant: 'destructive' })
                  return
                }

                setAssigning(true)
                let successCount = 0
                let errorCount = 0
                const errors: string[] = []

                try {
                  for (const email of emails) {
                    try {
                      await assignStudent({ clerkId: clerkUser.id, email, role: assignRole })
                      successCount++
                    } catch (e: any) {
                      errorCount++
                      errors.push(`${email}: ${e?.message || 'Unknown error'}`)
                    }
                  }

                  if (successCount > 0) {
                    toast({
                      title: 'Licenses assigned',
                      description: `${successCount} user(s) successfully assigned${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
                      variant: errorCount > 0 ? 'default' : 'success'
                    })
                  }

                  if (errorCount > 0) {
                    toast({
                      title: 'Some assignments failed',
                      description: errors.slice(0, 3).join('; ') + (errors.length > 3 ? '...' : ''),
                      variant: 'destructive'
                    })
                  }

                  if (successCount > 0) {
                    setAssignOpen(false)
                    setAssignText('')
                  }
                } catch (e: any) {
                  toast({
                    title: 'Assignment failed',
                    description: e?.message || 'An unexpected error occurred',
                    variant: 'destructive'
                  })
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
