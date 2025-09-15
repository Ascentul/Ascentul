'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Loader2 } from 'lucide-react'

export type CoverLetterDoc = {
  _id: string
  name: string
  job_title: string
  company_name?: string
  template: string
  content?: string
  closing: string
  created_at: number
  updated_at: number
}

export default function CoverLettersPage() {
  const { user } = useUser()
  const clerkId = user?.id
  const [creating, setCreating] = useState(false)

  const coverLetters = useQuery(
    api.cover_letters.getUserCoverLetters,
    clerkId ? { clerkId } : 'skip'
  ) as CoverLetterDoc[] | undefined

  const createCoverLetter = useMutation(api.cover_letters.createCoverLetter)

  const loading = !coverLetters && !!clerkId

  const sorted = useMemo(() => {
    return (coverLetters ?? []).slice().sort((a, b) => b.updated_at - a.updated_at)
  }, [coverLetters])

  const handleCreate = async () => {
    if (!clerkId) return
    setCreating(true)
    try {
      const doc = await createCoverLetter({
        clerkId,
        name: 'Untitled Cover Letter',
        job_title: 'Position',
        company_name: undefined,
        template: 'standard',
        content: '',
        closing: 'Sincerely,',
      })
      // navigate to detail page
      if (doc && (doc as any)._id) {
        window.location.href = `/cover-letters/${(doc as any)._id}`
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Cover Letter Coach</h1>
        <Button onClick={handleCreate} disabled={creating || !clerkId}>
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          New Cover Letter
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (sorted?.length ?? 0) === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No cover letters yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Create your first cover letter to get started.</p>
            <Button onClick={handleCreate} disabled={creating || !clerkId}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              New Cover Letter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sorted!.map((c) => (
            <Link href={`/cover-letters/${c._id}`} key={c._id}>
              <Card className="hover:bg-accent/50 transition-colors">
                <CardContent className="flex items-center gap-3 py-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.company_name ? `${c.job_title} @ ${c.company_name}` : c.job_title}
                    </div>
                    <div className="text-xs text-muted-foreground">Updated {new Date(c.updated_at).toLocaleString()}</div>
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
