'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Trash, Save, Wand2 } from 'lucide-react'

interface CoverLetterDoc {
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

export default function CoverLetterDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()

  const { user } = useUser()
  const clerkId = user?.id

  const coverLetters = useQuery(
    api.cover_letters.getUserCoverLetters,
    clerkId ? { clerkId } : 'skip'
  ) as CoverLetterDoc[] | undefined

  const updateCoverLetter = useMutation(api.cover_letters.updateCoverLetter)
  const deleteCoverLetter = useMutation(api.cover_letters.deleteCoverLetter)
  const generateContent = useMutation(api.cover_letters.generateCoverLetterContent)

  const current = useMemo(() => coverLetters?.find(c => c._id === id), [coverLetters, id])

  const [name, setName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [content, setContent] = useState('')
  const [closing, setClosing] = useState('Sincerely,')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (current) {
      setName(current.name || '')
      setJobTitle(current.job_title || '')
      setCompanyName(current.company_name || '')
      setContent(current.content || '')
      setClosing(current.closing || 'Sincerely,')
    }
  }, [current])

  const onSave = async () => {
    if (!clerkId || !id) return
    setSaving(true)
    try {
      await updateCoverLetter({
        clerkId,
        coverLetterId: id as any,
        updates: {
          name,
          job_title: jobTitle,
          company_name: companyName || undefined,
          content,
          closing,
        },
      })
    } finally {
      setSaving(false)
    }
  }

  const onGenerate = async () => {
    if (!clerkId) return
    setGenerating(true)
    try {
      const result = await generateContent({
        clerkId,
        job_title: jobTitle || 'Position',
        company_name: companyName || 'Company',
        job_description: undefined,
        user_experience: undefined,
      })
      if (result?.content) setContent(result.content)
    } finally {
      setGenerating(false)
    }
  }

  const onDelete = async () => {
    if (!clerkId || !id) return
    setDeleting(true)
    try {
      await deleteCoverLetter({ clerkId, coverLetterId: id as any })
      router.push('/cover-letters')
    } finally {
      setDeleting(false)
    }
  }

  if (!!clerkId && !coverLetters) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!current) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Cover letter not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push('/cover-letters')}>Back to list</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Cover Letter</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash className="h-4 w-4 mr-2" />}Delete
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Untitled Cover Letter" />
            </div>
            <div>
              <label className="text-sm font-medium">Job Title</label>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Software Engineer" />
            </div>
            <div>
              <label className="text-sm font-medium">Company</label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="TechCorp Inc." />
            </div>
            <div>
              <label className="text-sm font-medium">Closing</label>
              <Input value={closing} onChange={(e) => setClosing(e.target.value)} placeholder="Sincerely," />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Content</label>
              <Button type="button" variant="secondary" onClick={onGenerate} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}Generate with AI
              </Button>
            </div>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={16} placeholder="Write or generate your cover letter here..." />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
