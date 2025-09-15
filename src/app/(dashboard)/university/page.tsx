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
import { GraduationCap, Users, BookOpen, Award } from 'lucide-react'
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
              <CardHeader className="pb-2"><CardTitle className="text-base font-medium">Courses</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">{overview.totalCourses}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base font-medium">Completion Rate</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-muted-foreground mr-2" />
                  <div className="text-2xl font-bold">—</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Collect from course data (future)</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Courses Published Status</CardTitle>
                <CardDescription>Published vs Draft</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
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
                      outerRadius={90}
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
                <CardTitle>Course Completion Rates</CardTitle>
                <CardDescription>Per course (0-100%)</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courses.map((c: any) => ({ name: c.title, completion: c.completion_rate ?? 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="completion" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>Manage student accounts and licenses</CardDescription>
                </div>
              </div>
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
                  {students.map((s: any) => (
                    <TableRow key={s._id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell className="uppercase text-xs text-muted-foreground">{s.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
