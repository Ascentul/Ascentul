'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user: clerkUser } = useUser()
  const { user, isAdmin, subscription } = useAuth()
  const { toast } = useToast()

  // Access control: Only university_admin, advisor, or super_admin can access
  // subscription.isUniversity is NOT sufficient - it includes regular students
  const canAccess = !!user && (isAdmin || user.role === 'university_admin' || user.role === 'advisor')

  const course = useQuery(
    api.university_admin.getCourse,
    clerkUser?.id && params?.id ? ({ clerkId: clerkUser.id, courseId: params.id as any }) : 'skip'
  ) as any

  const departments = useQuery(
    api.university_admin.listDepartments,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  ) as any[] | undefined

  const updateCourse = useMutation(api.university_admin.updateCourse)
  const deleteCourse = useMutation(api.university_admin.deleteCourse)

  const [form, setForm] = useState<{ title: string; category?: string; level?: string; departmentId?: string; published?: boolean; enrollments?: number; completion_rate?: number }>({ title: '' })

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title || '',
        category: course.category || '',
        level: course.level || '',
        departmentId: course.department_id ? String(course.department_id) : '',
        published: !!course.published,
        enrollments: typeof course.enrollments === 'number' ? course.enrollments : 0,
        completion_rate: typeof course.completion_rate === 'number' ? course.completion_rate : 0,
      })
    }
  }, [course])

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to this course.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!course || !departments) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    if (!clerkUser?.id || !params?.id) return
    try {
      await updateCourse({
        clerkId: clerkUser.id,
        courseId: params.id as any,
        patch: {
          title: form.title || course.title,
          category: form.category || undefined,
          level: form.level || undefined,
          department_id: form.departmentId ? (form.departmentId as any) : undefined,
          published: !!form.published,
        } as any,
      })
      toast({ title: 'Course updated' })
    } catch (e: any) {
      toast({ title: 'Failed to update course', description: e?.message || String(e), variant: 'destructive' })
    }
  }

  const handleSaveMetrics = async () => {
    if (!clerkUser?.id || !params?.id) return
    try {
      await updateCourse({
        clerkId: clerkUser.id,
        courseId: params.id as any,
        patch: {
          enrollments: Number(form.enrollments) || 0 as any,
          completion_rate: Number(form.completion_rate) || 0 as any,
        } as any,
      })
      toast({ title: 'Metrics updated' })
    } catch (e: any) {
      toast({ title: 'Failed to update metrics', description: e?.message || String(e), variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!clerkUser?.id || !params?.id) return
    try {
      await deleteCourse({ clerkId: clerkUser.id, courseId: params.id as any })
      toast({ title: 'Course deleted' })
      router.push('/university/courses')
    } catch (e: any) {
      toast({ title: 'Failed to delete course', description: e?.message || String(e), variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB]">Course Details</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.push('/university/courses')}>Back</Button>
          <Button variant="outline" onClick={handleDelete}>Delete</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Department</label>
              <Select value={form.departmentId || ''} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d: any) => (
                    <SelectItem key={String(d._id)} value={String(d._id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Category</label>
              <Input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Level</label>
              <Input value={form.level || ''} onChange={(e) => setForm({ ...form, level: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Badge variant={form.published ? 'default' : 'outline'}>{form.published ? 'Published' : 'Draft'}</Badge>
              <Button variant="outline" size="sm" onClick={() => setForm({ ...form, published: !form.published })}>
                {form.published ? 'Unpublish' : 'Publish'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Enrollments</label>
              <Input type="number" value={String(form.enrollments ?? 0)} onChange={(e) => setForm({ ...form, enrollments: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Completion Rate (%)</label>
              <Input type="number" min={0} max={100} value={String(form.completion_rate ?? 0)} onChange={(e) => setForm({ ...form, completion_rate: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleSaveMetrics}>Save Metrics</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
