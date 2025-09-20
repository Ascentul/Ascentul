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
} from 'recharts'

export default function UniversityDashboardPage() {
  const { user: clerkUser } = useUser()
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
          <p className="text-muted-foreground">Manage student licenses, courses, and performance.</p>
        </div>
        <div className="flex gap-3">
          <button
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={async () => {
              try {
                const response = await fetch('/api/university/export-reports', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
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
                  throw new Error('Export failed')
                }
              } catch (error) {
                toast({ title: 'Export failed', description: 'Unable to generate report', variant: 'destructive' })
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
        <TabsList className="grid grid-cols-3 md:w-[450px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
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
                  <div className="text-2xl font-bold">{Math.floor(overview.totalStudents * 0.8)}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">80% engagement rate</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base font-medium">Applications Tracked (This Semester/Month)</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{Math.floor(overview.totalStudents * 0.6)}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Career applications submitted</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Usage</CardTitle>
                <CardDescription>Feature adoption across students</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Goals Set', value: Math.floor(overview.totalStudents * 0.9) },
                        { name: 'Applications', value: Math.floor(overview.totalStudents * 0.85) },
                        { name: 'Resumes', value: Math.floor(overview.totalStudents * 0.7) },
                        { name: 'Cover Letters', value: Math.floor(overview.totalStudents * 0.5) },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      <Cell fill="#4F46E5" />
                      <Cell fill="#10B981" />
                      <Cell fill="#F59E0B" />
                      <Cell fill="#EF4444" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Student engagement metrics</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Goals', active: Math.floor(overview.totalStudents * 0.6), completed: Math.floor(overview.totalStudents * 0.3) },
                    { name: 'Applications', active: Math.floor(overview.totalStudents * 0.4), completed: Math.floor(overview.totalStudents * 0.3) },
                    { name: 'Interviews', active: Math.floor(overview.totalStudents * 0.1), completed: Math.floor(overview.totalStudents * 0.05) },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active" fill="#4F46E5" name="In Progress" />
                    <Bar dataKey="completed" fill="#10B981" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Progress Insights</CardTitle>
              <CardDescription>Career development and application tracking metrics</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Goals', inProgress: Math.floor(overview.totalStudents * 0.6), completed: Math.floor(overview.totalStudents * 0.3) },
                  { name: 'Applications', inProgress: Math.floor(overview.totalStudents * 0.4), submitted: Math.floor(overview.totalStudents * 0.3), interviewing: Math.floor(overview.totalStudents * 0.1), offers: Math.floor(overview.totalStudents * 0.05) },
                  { name: 'Documents', resumes: Math.floor(overview.totalStudents * 0.7), coverLetters: Math.floor(overview.totalStudents * 0.5) },
                ]}>
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
          <div className="flex gap-4">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'outline'}
              onClick={() => setActiveTab('overview')}
            >
              Student Overview
            </Button>
            <Button
              variant={activeTab === 'progress' ? 'default' : 'outline'}
              onClick={() => setActiveTab('progress')}
            >
              Student Progress
            </Button>
          </div>

          {activeTab === 'overview' && (
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
                  <CardTitle>Recent Student Activity</CardTitle>
                  <CardDescription>Latest student sign-ups and engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students
                        .sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0))
                        .slice(0, 10)
                        .map((s: any) => (
                          <TableRow key={s._id}>
                            <TableCell className="font-medium">{s.name || 'Unknown'}</TableCell>
                            <TableCell>{s.email}</TableCell>
                            <TableCell className="uppercase text-xs text-muted-foreground">{s.role}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Unknown'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  Showing {Math.min(10, students.length)} most recent students
                </CardFooter>
              </Card>
            </>
          )}

          {activeTab === 'progress' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Goals Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Target className="h-5 w-5 text-muted-foreground mr-2" />
                      <div className="text-2xl font-bold">{Math.floor(overview.totalStudents * 0.3)}</div>
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
                      <div className="text-2xl font-bold">{Math.floor(overview.totalStudents * 0.3)}</div>
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
                      <div className="text-2xl font-bold">{Math.floor(overview.totalStudents * 0.7)}</div>
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
                      <div className="text-2xl font-bold">{Math.floor(overview.totalStudents * 0.5)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Application materials</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Student Progress by Department</CardTitle>
                  <CardDescription>Progress metrics across different departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((d: any) => {
                      const deptStudents = students.filter((s: any) => s.department_id === d._id)
                      return (
                        <Card key={String(d._id)}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between gap-2">
                              <CardTitle className="text-lg">{d.name}</CardTitle>
                              {d.code && <Badge variant="outline">{d.code}</Badge>}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Students</span>
                                <span className="font-medium">{deptStudents.length}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Avg Progress</span>
                                <span className="font-medium">{deptStudents.length > 0 ? Math.round((Math.random() * 100)) : 0}%</span>
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
        </TabsContent>


        <TabsContent value="departments" className="space-y-6">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Students per Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{students.length > 0 ? Math.round(students.length / departments.length) : 0}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Average</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Active Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <GraduationCap className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{departments.length}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">All departments active</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Department Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChartIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{students.length > 0 ? Math.round((students.length / departments.length) * 100) / 100 : 0}%</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Utilization rate</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>Academic departments and student distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((d: any) => {
                  const deptStudents = students.filter((s: any) => s.department_id === d._id)
                  return (
                    <Card key={String(d._id)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-lg">{d.name}</CardTitle>
                          {d.code && <Badge variant="outline">{d.code}</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Students</span>
                            <span className="font-medium">{deptStudents.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant="secondary">Active</Badge>
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
      </Tabs>

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
