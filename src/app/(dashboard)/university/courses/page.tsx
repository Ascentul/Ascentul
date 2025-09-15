'use client'

import React, { useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function UniversityCoursesPage() {
  const { user, isAdmin } = useAuth()
  const { user: clerkUser } = useUser()
  const { toast } = useToast()

  const canAccess = !!user && (isAdmin || user.subscription_plan === 'university' || user.role === 'university_admin')

  const courses = useQuery(api.university_admin.listCourses, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip') as any[] | undefined
  const departments = useQuery(api.university_admin.listDepartments, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip') as any[] | undefined

  const createCourse = useMutation(api.university_admin.createCourse)
  const updateCourse = useMutation(api.university_admin.updateCourse)
  const deleteCourse = useMutation(api.university_admin.deleteCourse)

  const deptById = useMemo(() => {
    const map = new Map<string, any>()
    for (const d of departments || []) map.set(String(d._id), d)
    return map
  }, [departments])

  const [form, setForm] = useState<{ title: string; category?: string; level?: string; departmentId?: string }>({ title: '' })
  const [submitting, setSubmitting] = useState(false)
  const [importing, setImporting] = useState(false)

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to University Courses.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const exportCoursesCsv = () => {
    const headers = ['title','department','category','level','published']
    const rows = (courses || []).map((c: any) => [
      JSON.stringify(c.title ?? ''),
      JSON.stringify((c.department_id && deptById.get(String(c.department_id))?.name) || ''),
      JSON.stringify(c.category ?? ''),
      JSON.stringify(c.level ?? ''),
      JSON.stringify(c.published ? 'yes' : 'no'),
    ].join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'courses.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportCsv = async (file: File) => {
    if (!clerkUser?.id) return
    setImporting(true)
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(Boolean)
      if (lines.length <= 1) return
      const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      const idx = (name: string) => header.findIndex(h => h.toLowerCase() === name)
      const iTitle = idx('title')
      const iCategory = idx('category')
      const iLevel = idx('level')
      const iDepartment = idx('department')
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].match(/\"[^\"]*\"|[^,]+/g)?.map(c => c.replace(/^\"|\"$/g, '')) || []
        const title = cols[iTitle]?.trim()
        if (!title) continue
        const departmentName = iDepartment >= 0 ? cols[iDepartment]?.trim() : ''
        let departmentId: string | undefined
        if (departmentName) {
          const found = (departments || []).find((d: any) => (d.name || '').toLowerCase() === departmentName.toLowerCase())
          if (found) departmentId = String(found._id)
        }
        await createCourse({
          clerkId: clerkUser.id,
          title,
          category: iCategory >= 0 ? cols[iCategory] : undefined,
          level: iLevel >= 0 ? cols[iLevel] : undefined,
          departmentId: departmentId ? (departmentId as any) : undefined,
          published: false,
        })
      }
      toast({ title: 'Courses imported', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Failed to import CSV', description: e?.message || String(e), variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  if (!courses || !departments) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  const handleCreate = async () => {
    if (!clerkUser?.id || !form.title.trim()) return
    try {
      setSubmitting(true)
      await createCourse({
        clerkId: clerkUser.id,
        title: form.title.trim(),
        category: form.category || undefined,
        level: form.level || undefined,
        departmentId: form.departmentId ? (form.departmentId as any) : undefined,
        published: false,
      })
      setForm({ title: '' })
      toast({ title: 'Course created', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Failed to create course', description: e?.message || String(e), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleTogglePublished = async (course: any) => {
    if (!clerkUser?.id) return
    try {
      await updateCourse({ clerkId: clerkUser.id, courseId: course._id, patch: { published: !course.published } })
    } catch (e: any) {
      toast({ title: 'Failed to update course', description: e?.message || String(e), variant: 'destructive' })
    }
  }

  const handleDelete = async (course: any) => {
    if (!clerkUser?.id) return
    try {
      await deleteCourse({ clerkId: clerkUser.id, courseId: course._id })
      toast({ title: 'Course deleted', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Failed to delete course', description: e?.message || String(e), variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Courses
        </h1>
        <div className="flex gap-2">
          <input
            id="coursesCsv"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files && e.target.files[0] && handleImportCsv(e.target.files[0])}
          />
          <Button variant="outline" onClick={() => document.getElementById('coursesCsv')?.click()} disabled={importing}>
            {importing ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button variant="outline" onClick={exportCoursesCsv}>Export CSV</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Course</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input placeholder="Level" value={form.level || ''} onChange={(e) => setForm({ ...form, level: e.target.value })} />
            <Select value={form.departmentId || ''} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Department (optional)" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d: any) => (
                  <SelectItem key={String(d._id)} value={String(d._id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={!form.title.trim() || submitting}>Create</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-muted-foreground">No courses yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c: any) => {
                  const dept = c.department_id ? deptById.get(String(c.department_id)) : undefined
                  return (
                    <TableRow key={String(c._id)}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>{dept?.name || '—'}</TableCell>
                      <TableCell>{c.category || '—'}</TableCell>
                      <TableCell>{c.level || '—'}</TableCell>
                      <TableCell>{c.published ? <Badge>Published</Badge> : <Badge variant="outline">Draft</Badge>}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/university/courses/${String(c._id)}`} className="inline-block">
                          <Button variant="outline" size="sm">Open</Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => handleTogglePublished(c)}>
                          {c.published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(c)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
