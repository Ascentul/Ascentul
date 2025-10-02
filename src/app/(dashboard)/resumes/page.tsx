'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Loader2, Copy, Trash2, Download, Edit, Sparkles, Upload } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { jsPDF } from 'jspdf'

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
  const { toast } = useToast()
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'my-resumes' | 'generate-ai' | 'upload-analyze'>('my-resumes')

  // AI Generation state
  const [jobDescription, setJobDescription] = useState('')
  const [generating, setGenerating] = useState(false)

  // Upload & Analyze state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analyzeJobDescription, setAnalyzeJobDescription] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const resumes = useQuery(
    api.resumes.getUserResumes,
    clerkId ? { clerkId } : 'skip'
  ) as ResumeDoc[] | undefined

  const createResumeMutation = useMutation(api.resumes.createResume)
  const deleteResumeMutation = useMutation(api.resumes.deleteResume)

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

  const duplicateResume = async (resumeId: string, title: string) => {
    if (!clerkId) return
    try {
      const original = resumes?.find(r => r._id === resumeId)
      if (!original) return

      const id = await createResumeMutation({
        clerkId,
        title: `${title} (Copy)`,
        content: original.content,
        visibility: 'private',
      })

      toast({
        title: "Resume Copied",
        description: "Your resume has been duplicated successfully",
        variant: 'success',
      })

      router.push(`/resumes/${id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy resume",
        variant: "destructive",
      })
    }
  }

  const deleteResume = async (resumeId: string) => {
    if (!clerkId) return
    if (!confirm('Are you sure you want to delete this resume?')) return

    try {
      await deleteResumeMutation({ clerkId, resumeId: resumeId as any })
      toast({
        title: "Resume Deleted",
        description: "Your resume has been deleted successfully",
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete resume",
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
        title: "Generating Resume",
        description: "AI is creating your optimized resume...",
      })

      // Placeholder: Create a resume with AI-generated content
      const id = await createResumeMutation({
        clerkId,
        title: 'AI-Generated Resume',
        content: { jobDescription },
        visibility: 'private',
      })

      router.push(`/resumes/${id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate resume",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const analyzeResume = async () => {
    if (!uploadedFile || !analyzeJobDescription.trim()) return
    setAnalyzing(true)
    try {
      // TODO: Implement resume analysis API call
      toast({
        title: "Analyzing Resume",
        description: "Analyzing your resume fit for this role...",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze resume",
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const exportResumePDF = async (resume: ResumeDoc) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
      const margin = 15
      const pageWidth = doc.internal.pageSize.getWidth()
      const usableWidth = pageWidth - margin * 2
      const pageHeight = doc.internal.pageSize.getHeight()
      let y = margin

      const moveY = (amount: number) => {
        y += amount
        if (y > pageHeight - margin) { doc.addPage(); y = margin }
      }

      // Header
      const fullName = clerkUser?.fullName || [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || ''
      const email = clerkUser?.primaryEmailAddress?.emailAddress || ''
      const phone = clerkUser?.phoneNumbers?.[0]?.phoneNumber || ''
      const contactParts = [email, phone].filter(Boolean)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text((fullName || resume.title || 'Resume') as string, margin, y)
      moveY(7)
      if (contactParts.length) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text(contactParts.join('  |  '), margin, y)
        moveY(6)
      }

      doc.setLineWidth(0.3)
      doc.line(margin, y, pageWidth - margin, y)
      moveY(4)

      const content = (resume.content || {}) as any

      // Summary
      if (content?.summary) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('Professional Summary', margin, y)
        moveY(6)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        const wrapped: string[] = (doc.splitTextToSize(content.summary, usableWidth) as unknown as string[])
        wrapped.forEach((line: string) => {
          if (y > pageHeight - margin) { doc.addPage(); y = margin }
          doc.text(line, margin, y)
          y += 5
        })
        moveY(4)
      }

      // Skills
      const skills: string[] = Array.isArray(content?.skills) ? content.skills : []
      if (skills.length) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('Skills', margin, y)
        moveY(6)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        doc.text(skills.join(', '), margin, y)
        moveY(8)
      }

      const fileName = `${(resume.title || 'resume').replace(/\s+/g, '_')}.pdf`
      doc.save(fileName)
      toast({ title: 'Exported', description: 'PDF downloaded successfully.', variant: 'success' })
    } catch (error) {
      toast({ title: "Export Failed", description: "Failed to export PDF.", variant: "destructive" })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB] mb-2">Resume Studio</h1>
        <p className="text-muted-foreground">Create, manage, and optimize your resumes</p>
      </div>

      {/* Three Toggle System */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={activeTab === 'my-resumes' ? 'default' : 'outline'}
          onClick={() => setActiveTab('my-resumes')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          My Resumes
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

      {/* My Resumes Tab */}
      {activeTab === 'my-resumes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Resumes</h2>
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
                <Card key={r._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Updated {new Date(r.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/resumes/${r._id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateResume(r._id, r.title)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteResume(r._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportResumePDF(r)}
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
              <CardTitle>Generate Resume with AI</CardTitle>
              <p className="text-sm text-muted-foreground">
                Paste a job description and AI will create an optimized resume tailored to the role
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
                      Generate Resume
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  disabled={generating}
                >
                  Optimize My Profile
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
              <CardTitle>Upload & Analyze Resume</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload your resume and paste a job description to analyze your fit for the role
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Upload Resume (PDF)</label>
                <Input
                  type="file"
                  accept=".pdf"
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
                onClick={analyzeResume}
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
                    Analyze Resume
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