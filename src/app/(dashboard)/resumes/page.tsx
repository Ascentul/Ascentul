'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'

type ResumeDoc = {
  _id: string
  title: string
  content: any
  visibility: 'private' | 'public'
  created_at: number
  updated_at: number
}

export default function ResumesPage() {
  const router = useRouter()
  const { user: clerkUser } = useUser()
  const clerkId = clerkUser?.id
  const [creating, setCreating] = useState(false)

  const resumes = useQuery(
    api.resumes.getUserResumes,
    clerkId ? { clerkId } : 'skip'
  ) as ResumeDoc[] | undefined

  const createResumeMutation = useMutation(api.resumes.createResume)

  const loading = !resumes && !!clerkId

  const sorted = useMemo(() => {
    return (resumes ?? []).slice().sort((a, b) => b.updated_at - a.updated_at)
  }, [resumes])

  const createResume = async () => {
    if (!clerkId) return
    setCreating(true)
    try {
      const id = await createResumeMutation({
        clerkId,
        title: 'Untitled Resume',
        content: {},
        visibility: 'private',
      })
      // Navigate straight to the editor
      router.push(`/resumes/${id}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Resumes</h1>
        <Button onClick={createResume} disabled={creating || !clerkId}>
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} New Resume
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (sorted?.length ?? 0) === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No resumes yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Create your first resume to get started.</p>
            <Button onClick={createResume} disabled={creating || !clerkId}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} New Resume
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sorted!.map((r) => (
            <Link href={`/resumes/${r._id}`} key={r._id}>
              <Card className="hover:bg-accent/50 transition-colors">
                <CardContent className="flex items-center gap-3 py-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">Updated {new Date(r.updated_at).toLocaleString()}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}