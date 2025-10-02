'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Loader2, Copy, Trash2, Download, Edit, Sparkles, Upload } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

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
  const router = useRouter()
  const { user } = useUser()
  const clerkId = user?.id
  const { toast } = useToast()
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'my-letters' | 'generate-ai' | 'upload-analyze'>('my-letters')

  // AI Generation state
  const [jobDescription, setJobDescription] = useState('')
  const [generating, setGenerating] = useState(false)

  // Upload & Analyze state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analyzeJobDescription, setAnalyzeJobDescription] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const coverLetters = useQuery(
    api.cover_letters.getUserCoverLetters,
    clerkId ? { clerkId } : 'skip'
  ) as CoverLetterDoc[] | undefined

  const createCoverLetter = useMutation(api.cover_letters.createCoverLetter)
  const deleteCoverLetter = useMutation(api.cover_letters.deleteCoverLetter)

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
        router.push(`/cover-letters/${(doc as any)._id}`)
      }
    } finally {
      setCreating(false)
    }
  }

  const duplicateLetter = async (letterId: string, name: string) => {
    if (!clerkId) return
    try {
      const original = coverLetters?.find(c => c._id === letterId)
      if (!original) return

      const doc = await createCoverLetter({
        clerkId,
        name: `${name} (Copy)`,
        job_title: original.job_title,
        company_name: original.company_name,
        template: original.template,
        content: original.content || '',
        closing: original.closing,
      })

      toast({
        title: "Cover Letter Copied",
        description: "Your cover letter has been duplicated successfully",
        variant: 'success',
      })

      if (doc && (doc as any)._id) {
        router.push(`/cover-letters/${(doc as any)._id}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy cover letter",
        variant: "destructive",
      })
    }
  }

  const deleteLetter = async (letterId: string) => {
    if (!clerkId) return
    if (!confirm('Are you sure you want to delete this cover letter?')) return

    try {
      await deleteCoverLetter({ clerkId, coverLetterId: letterId as any })
      toast({
        title: "Cover Letter Deleted",
        description: "Your cover letter has been deleted successfully",
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete cover letter",
        variant: "destructive",
      })
    }
  }

  const generateWithAI = async () => {
    if (!jobDescription.trim() || !clerkId) return
    setGenerating(true)
    try {
      // TODO: Implement AI generation API call
      toast({
        title: "Generating Cover Letter",
        description: "AI is creating your optimized cover letter...",
      })

      // Placeholder: Create a cover letter with AI-generated content
      const doc = await createCoverLetter({
        clerkId,
        name: 'AI-Generated Cover Letter',
        job_title: 'Position',
        company_name: undefined,
        template: 'standard',
        content: `Generated from job description: ${jobDescription.substring(0, 100)}...`,
        closing: 'Sincerely,',
      })

      if (doc && (doc as any)._id) {
        router.push(`/cover-letters/${(doc as any)._id}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate cover letter",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const analyzeLetter = async () => {
    if (!uploadedFile || !analyzeJobDescription.trim()) return
    setAnalyzing(true)
    try {
      // TODO: Implement cover letter analysis API call
      toast({
        title: "Analyzing Cover Letter",
        description: "Analyzing your cover letter fit for this role...",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze cover letter",
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB] mb-2">Cover Letter Coach</h1>
        <p className="text-muted-foreground">Create, manage, and optimize your cover letters</p>
      </div>

      {/* Three Toggle System */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={activeTab === 'my-letters' ? 'default' : 'outline'}
          onClick={() => setActiveTab('my-letters')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          My Cover Letters
        </Button>
        <Button
          variant={activeTab === 'generate-ai' ? 'default' : 'outline'}
          onClick={() => setActiveTab('generate-ai')}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </Button>
        <Button
          variant={activeTab === 'upload-analyze' ? 'default' : 'outline'}
          onClick={() => setActiveTab('upload-analyze')}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload & Analyze
        </Button>
      </div>

      {/* My Cover Letters Tab */}
      {activeTab === 'my-letters' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Cover Letters</h2>
            <Button onClick={handleCreate} disabled={creating || !clerkId}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} New Cover Letter
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
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} New Cover Letter
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sorted!.map((c) => (
                <Card key={c._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.company_name ? `${c.job_title} @ ${c.company_name}` : c.job_title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Updated {new Date(c.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/cover-letters/${c._id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateLetter(c._id, c.name)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteLetter(c._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generate with AI Tab */}
      {activeTab === 'generate-ai' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Generate Cover Letter with AI</CardTitle>
              <p className="text-sm text-muted-foreground">
                Paste a job description and AI will create a tailored cover letter for the role
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Job Description</label>
                <Textarea
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={12}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={generateWithAI}
                  disabled={!jobDescription.trim() || generating}
                  className="flex-1"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Cover Letter
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  disabled={generating}
                >
                  Use My Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload & Analyze Tab */}
      {activeTab === 'upload-analyze' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upload & Analyze Cover Letter</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload your cover letter and paste a job description to analyze your fit for the role
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Upload Cover Letter (PDF/DOCX)</label>
                <Input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                />
                {uploadedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {uploadedFile.name}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Job Description</label>
                <Textarea
                  placeholder="Paste the job description here..."
                  value={analyzeJobDescription}
                  onChange={(e) => setAnalyzeJobDescription(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>
              <Button
                onClick={analyzeLetter}
                disabled={!uploadedFile || !analyzeJobDescription.trim() || analyzing}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Analyze Cover Letter
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
