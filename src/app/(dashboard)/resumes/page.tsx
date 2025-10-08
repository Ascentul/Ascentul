'use client'

import React, { useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Loader2, Copy, Trash2, Download, Edit, Sparkles, Upload, Eye, AlertCircle } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { jsPDF } from 'jspdf'
import { ResumePreviewModal } from '@/components/resume-preview-modal'
import { Alert, AlertDescription } from '@/components/ui/alert'

type ResumeDoc = {
  _id: string
  title: string
  content: any
  visibility: 'private' | 'public'
  source?: 'manual' | 'ai_generated' | 'ai_optimized' | 'pdf_upload'
  analysis_result?: any
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

  // Preview modal state
  const [previewResume, setPreviewResume] = useState<ResumeDoc | null>(null)

  // AI Generation state
  const [jobDescription, setJobDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedResume, setGeneratedResume] = useState<any>(null)

  // Upload & Analyze state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analyzeJobDescription, setAnalyzeJobDescription] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [extractedText, setExtractedText] = useState('')

  // Import resume state (for My Resumes tab)
  const [importing, setImporting] = useState(false)
  const importFileInputRef = useRef<HTMLInputElement>(null)

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

  const createResume = () => {
    if (!clerkId) return
    router.push('/resumes/new')
  }

  const getUserProfile = () => {
    return {
      name: clerkUser?.fullName || '',
      email: clerkUser?.primaryEmailAddress?.emailAddress || '',
      phone: clerkUser?.phoneNumbers?.[0]?.phoneNumber || '',
      // Add more profile fields as needed from your user schema
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
      toast({
        title: "Generating Resume",
        description: "AI is creating your optimized resume...",
      })

      const userProfile = getUserProfile()

      const response = await fetch('/api/resumes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          userProfile,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate resume')
      }

      const data = await response.json()
      setGeneratedResume(data.resume)

      toast({
        title: "Resume Generated!",
        description: "Review your AI-generated resume below. You can save it or optimize your profile.",
        variant: 'success',
      })
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

  const saveGeneratedResume = async () => {
    if (!generatedResume || !clerkId) return
    setCreating(true)
    try {
      const id = await createResumeMutation({
        clerkId,
        title: 'AI-Generated Resume',
        content: generatedResume,
        visibility: 'private',
        source: 'ai_generated',
        job_description: jobDescription,
      })

      toast({
        title: "Resume Saved",
        description: "Your AI-generated resume has been saved successfully",
        variant: 'success',
      })

      // Reset and switch to My Resumes tab
      setGeneratedResume(null)
      setJobDescription('')
      setActiveTab('my-resumes')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save resume",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const optimizeProfile = () => {
    toast({
      title: "Profile Optimization",
      description: "Redirecting to account settings to update your profile...",
    })
    router.push('/account')
  }

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !clerkId) return

    setImporting(true)

    try {
      toast({
        title: "Importing Resume",
        description: "Extracting text from your resume...",
      })

      // Extract text from PDF
      const formData = new FormData()
      formData.append('file', file)

      const extractResponse = await fetch('/api/resumes/extract', {
        method: 'POST',
        body: formData,
      })

      if (!extractResponse.ok) {
        throw new Error('Failed to extract text from resume')
      }

      const { text } = await extractResponse.json()

      if (!text || text.trim().length === 0) {
        toast({
          title: "Warning",
          description: "Could not extract text from PDF. The file may be image-based or corrupted.",
          variant: "destructive",
        })
        return
      }

      // Create resume with extracted text
      const id = await createResumeMutation({
        clerkId,
        title: `Imported Resume - ${file.name.replace('.pdf', '')}`,
        content: { extractedText: text },
        visibility: 'private',
        source: 'pdf_upload',
        extracted_text: text,
      })

      toast({
        title: "Resume Imported!",
        description: "Your resume has been imported successfully",
        variant: 'success',
      })

      // Reset file input
      if (importFileInputRef.current) {
        importFileInputRef.current.value = ''
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import resume",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const handleImportClick = () => {
    importFileInputRef.current?.click()
  }

  const analyzeResume = async () => {
    if (!uploadedFile || !analyzeJobDescription.trim()) return
    setAnalyzing(true)
    setAnalysisResult(null)
    setExtractedText('')

    try {
      toast({
        title: "Analyzing Resume",
        description: "Extracting text and analyzing your resume...",
      })

      // Step 1: Extract text from PDF
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const extractResponse = await fetch('/api/resumes/extract', {
        method: 'POST',
        body: formData,
      })

      if (!extractResponse.ok) {
        throw new Error('Failed to extract text from resume')
      }

      const { text } = await extractResponse.json()
      setExtractedText(text)

      if (!text || text.trim().length === 0) {
        toast({
          title: "Warning",
          description: "Could not extract text from PDF. The file may be image-based or corrupted.",
          variant: "destructive",
        })
        return
      }

      // Step 2: Analyze resume against job description
      const analyzeResponse = await fetch('/api/resumes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: text,
          jobDescription: analyzeJobDescription,
        }),
      })

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze resume')
      }

      const analysis = await analyzeResponse.json()
      setAnalysisResult(analysis)

      toast({
        title: "Analysis Complete!",
        description: `Match score: ${analysis.score}%. Review the suggestions below.`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze resume",
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const saveAnalyzedResume = async () => {
    if (!clerkId || !extractedText || !analysisResult) return
    setCreating(true)
    try {
      const id = await createResumeMutation({
        clerkId,
        title: `Uploaded Resume - ${uploadedFile?.name || 'Resume'}`,
        content: { extractedText },
        visibility: 'private',
        source: 'pdf_upload',
        job_description: analyzeJobDescription,
        extracted_text: extractedText,
        analysis_result: analysisResult,
      })

      toast({
        title: "Resume Saved",
        description: "Your analyzed resume has been saved successfully",
        variant: 'success',
      })

      // Reset and switch to My Resumes tab
      setAnalysisResult(null)
      setExtractedText('')
      setAnalyzeJobDescription('')
      setUploadedFile(null)
      setActiveTab('my-resumes')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save resume",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const optimizeAnalyzedResume = async () => {
    if (!clerkId || !extractedText || !analysisResult || !analyzeJobDescription) return
    setCreating(true)
    try {
      toast({
        title: "Optimizing Resume",
        description: "Creating an optimized version based on analysis...",
      })

      // Generate optimized version using AI
      const userProfile = getUserProfile()
      const response = await fetch('/api/resumes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: analyzeJobDescription,
          userProfile,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to optimize resume')
      }

      const data = await response.json()

      const id = await createResumeMutation({
        clerkId,
        title: 'AI-Optimized Resume',
        content: data.resume,
        visibility: 'private',
        source: 'ai_optimized',
        job_description: analyzeJobDescription,
        analysis_result: analysisResult,
      })

      toast({
        title: "Resume Optimized!",
        description: "An optimized version has been created and saved",
        variant: 'success',
      })

      // Reset and switch to My Resumes tab
      setAnalysisResult(null)
      setExtractedText('')
      setAnalyzeJobDescription('')
      setUploadedFile(null)
      setActiveTab('my-resumes')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to optimize resume",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
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

      // Structured content
      const content = (resume.content || {}) as any
      // Support both shapes: editor saves contactInfo/experiences; AI uses personalInfo/experience
      const personalInfo = content.contactInfo || content.personalInfo || {}
      const fullName = personalInfo.name || clerkUser?.fullName || [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || ''
      const email = personalInfo.email || clerkUser?.primaryEmailAddress?.emailAddress || ''
      const phone = personalInfo.phone || clerkUser?.phoneNumbers?.[0]?.phoneNumber || ''
      const location = personalInfo.location || ''
      const linkedin = personalInfo.linkedin || ''
      const github = personalInfo.github || ''

      // Header
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text((fullName || resume.title || 'Resume') as string, margin, y)
      moveY(7)
      if ([email, phone, location].some(Boolean)) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text([email, phone, location].filter(Boolean).join(' | '), margin, y)
        moveY(5)
      }
      if ([linkedin, github].some(Boolean)) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text([linkedin, github].filter(Boolean).join(' | '), margin, y)
        moveY(5)
      }

      doc.setLineWidth(0.5)
      doc.line(margin, y, pageWidth - margin, y)
      moveY(6)

      // Summary
      if (content?.summary) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('PROFESSIONAL SUMMARY', margin, y)
        moveY(6)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
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
        doc.text('SKILLS', margin, y)
        moveY(6)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const skillsText = skills.join(', ')
        const wrapped = doc.splitTextToSize(skillsText, usableWidth) as string[]
        wrapped.forEach((line) => {
          if (y > pageHeight - margin) { doc.addPage(); y = margin }
          doc.text(line, margin, y)
          y += 5
        })
        moveY(4)
      }

      // Experience
      const experience: any[] = Array.isArray(content?.experiences)
        ? content.experiences
        : Array.isArray(content?.experience)
          ? content.experience
          : []
      if (experience.length) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('EXPERIENCE', margin, y)
        moveY(6)

        experience.forEach((exp) => {
          if (y > pageHeight - margin - 20) { doc.addPage(); y = margin }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.text(exp.title || 'Position', margin, y)
          moveY(5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          const companyLine = [exp.company, exp.location].filter(Boolean).join(' • ')
          if (companyLine) { doc.text(companyLine, margin, y); moveY(5) }
          if (exp.startDate || exp.endDate) {
            const dates = exp.endDate ? `${exp.startDate || ''} - ${exp.endDate}` : `${exp.startDate || ''} - Present`
            doc.text(dates, margin, y)
            moveY(5)
          }
          if (exp.description) {
            const descWrapped = doc.splitTextToSize(exp.description, usableWidth - 5) as string[]
            descWrapped.forEach(line => { if (y > pageHeight - margin) { doc.addPage(); y = margin } doc.text(`• ${line}`, margin + 2, y); y += 5 })
          }
          moveY(3)
        })
      }

      // Education
      const education: any[] = Array.isArray(content?.education) ? content.education : []
      if (education.length) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('EDUCATION', margin, y)
        moveY(6)

        education.forEach((edu) => {
          if (y > pageHeight - margin - 15) { doc.addPage(); y = margin }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          const degreeText = [edu.degree, edu.field].filter(Boolean).join(' in ')
          doc.text(degreeText || 'Degree', margin, y)
          moveY(5)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          const schoolLine = [edu.school, edu.location].filter(Boolean).join(' • ')
          if (schoolLine) { doc.text(schoolLine, margin, y); moveY(5) }
          const meta = [edu.graduationYear && `Class of ${edu.graduationYear}`].filter(Boolean).join(' • ')
          if (meta) { doc.text(meta, margin, y); moveY(5) }
          moveY(2)
        })
      }

      // Achievements
      const achievements: any[] = Array.isArray(content?.achievements) ? content.achievements : []
      if (achievements.length) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('ACHIEVEMENTS', margin, y)
        moveY(6)
        achievements.forEach((ach) => {
          if (y > pageHeight - margin - 10) { doc.addPage(); y = margin }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          const achTitle = ach.title || ach.name || 'Achievement'
          doc.text(achTitle, margin, y)
          moveY(5)
          if (ach.description) {
            doc.setFont('helvetica', 'normal')
            const achWrapped = doc.splitTextToSize(ach.description, usableWidth - 5) as string[]
            achWrapped.forEach(line => { if (y > pageHeight - margin) { doc.addPage(); y = margin } doc.text(line, margin + 2, y); y += 5 })
          }
          moveY(2)
        })
      }

      // Fallback: Additional Content from uploaded resume
      const extractedText: string | undefined = typeof content.extractedText === 'string' ? content.extractedText : undefined
      if (extractedText && extractedText.trim().length > 0) {
        if (y > pageHeight - margin - 20) { doc.addPage(); y = margin }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('Additional Content (from uploaded resume)', margin, y)
        moveY(6)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const wrapped = doc.splitTextToSize(extractedText, usableWidth) as string[]
        wrapped.forEach((line) => { if (y > pageHeight - margin) { doc.addPage(); y = margin } doc.text(line, margin, y); y += 5 })
        moveY(2)
      }

      const fileName = `${(resume.title || fullName || 'resume').replace(/\s+/g, '_')}.pdf`
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
            <div className="flex gap-2">
              <Button onClick={createResume} disabled={!clerkId}>
                <Plus className="h-4 w-4 mr-2" /> New Resume
              </Button>
            </div>
          </div>

          {/* Hidden file input for import */}
          <input
            ref={importFileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleImportFileChange}
            className="hidden"
          />

          {/* Import Resume Section */}
          <Card className="mb-4 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Upload className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-1">Import Existing Resume</h3>
                  <p className="text-xs text-muted-foreground">Upload a PDF resume to scan and save it to your library</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleImportClick}
                  disabled={importing}
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    'Import'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

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
                <Button onClick={createResume} disabled={!clerkId}>
                  <Plus className="h-4 w-4 mr-2" /> New Resume
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {sorted!.map((r) => {
                const getSourceBadge = () => {
                  switch (r.source) {
                    case 'ai_generated':
                      return <span className="text-[11px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full">AI Generated</span>
                    case 'ai_optimized':
                      return <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full">AI Optimized</span>
                    case 'pdf_upload':
                      return <span className="text-[11px] bg-green-100 text-green-700 px-2 py-1 rounded-full">PDF Upload</span>
                    case 'manual':
                      return <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Manual</span>
                    default:
                      return null
                  }
                }

                return (
                  <Card
                    key={r._id}
                    className="group relative overflow-hidden border border-slate-100 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer rounded-2xl"
                    onClick={() => setPreviewResume(r)}
                  >
                    <CardContent className="p-0 h-full flex flex-col">
                      <div className="flex-1 space-y-4 px-5 pt-5 pb-4 bg-gradient-to-br from-blue-50/80 via-white to-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 shadow-sm group-hover:bg-blue-200 transition-colors">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm text-slate-900 truncate">
                                {r.title || 'Untitled Resume'}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                Last updated {new Date(r.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {getSourceBadge()}
                        </div>

                        <div className="rounded-lg border border-dashed border-slate-200 bg-white/60 px-4 py-2 text-xs text-slate-500">
                          <p>
                            Created {new Date(r.created_at).toLocaleDateString()}
                          </p>
                          <p className="mt-0.5">
                            Visibility: <span className="font-medium capitalize">{r.visibility}</span>
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          className="justify-center gap-2 text-sm w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewResume(r)
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </Button>
                      </div>

                      <div
                        className="flex items-center justify-between gap-3 px-5 py-3 border-t bg-white/90 rounded-b-2xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 px-3 text-sm"
                          onClick={() => router.push(`/resumes/${r._id}`)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-slate-500 hover:text-slate-900"
                          onClick={() => duplicateResume(r._id, r.title)}
                          title="Duplicate"
                          aria-label="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-slate-500 hover:text-slate-900"
                          onClick={() => exportResumePDF(r)}
                          title="Export as PDF"
                          aria-label="Export as PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => deleteResume(r._id)}
                          title="Delete"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Generate with AI Tab */}
      {activeTab === 'generate-ai' && (
        <div className="space-y-4">
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
              <Button
                onClick={generateWithAI}
                disabled={!jobDescription.trim() || generating}
                className="w-full"
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
            </CardContent>
          </Card>

          {/* Generated Resume Preview */}
          {generatedResume && (
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI-Generated Resume Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {/* Personal Info */}
                    {generatedResume.personalInfo && (
                      <div>
                        <h3 className="text-lg font-bold">{generatedResume.personalInfo.name}</h3>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          {generatedResume.personalInfo.email && <div>{generatedResume.personalInfo.email}</div>}
                          {generatedResume.personalInfo.phone && <div>{generatedResume.personalInfo.phone}</div>}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {generatedResume.summary && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Professional Summary</h4>
                        <p className="text-sm text-gray-700">{generatedResume.summary}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {Array.isArray(generatedResume.skills) && generatedResume.skills.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedResume.skills.map((skill: string, idx: number) => (
                            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={saveGeneratedResume}
                    disabled={creating}
                    className="flex-1"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Resume'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={optimizeProfile}
                    disabled={creating}
                    className="flex-1"
                  >
                    Optimize My Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Upload & Analyze Tab */}
      {activeTab === 'upload-analyze' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Upload & Analyze */}
          <Card>
            <CardHeader>
              <CardTitle>Upload & Analyze Resume</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload a PDF and paste a job description to analyze your fit for the role
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
                  <p className="text-sm text-muted-foreground mt-2 truncate">Selected: {uploadedFile.name}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Job Description</label>
                <Textarea
                  placeholder="Paste the job description here..."
                  value={analyzeJobDescription}
                  onChange={(e) => setAnalyzeJobDescription(e.target.value)}
                  rows={10}
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

          {/* Right: Analysis Results Panel */}
          <Card className="border-2 min-h-[420px]" style={{ borderColor: '#5270ff' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" style={{ color: '#5270ff' }} />
                AI Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyzing && (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Analyzing your resume...
                </div>
              )}

              {!analyzing && !analysisResult && (
                <div className="text-sm text-muted-foreground">
                  Submit your resume and job description to see a score and suggestions here.
                </div>
              )}

              {!analyzing && analysisResult && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600">{analysisResult.score}%</div>
                      <div className="text-sm text-muted-foreground mt-1">Match Score</div>
                    </div>
                    {analysisResult.summary && (
                      <p className="text-sm text-gray-700 mt-3 text-center">{analysisResult.summary}</p>
                    )}
                  </div>

                  {Array.isArray(analysisResult.strengthHighlights) && analysisResult.strengthHighlights.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <span className="text-green-600">✓</span> Strength Highlights
                      </h4>
                      <ul className="space-y-2">
                        {analysisResult.strengthHighlights.map((highlight: string, i: number) => (
                          <li key={i} className="text-sm text-gray-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(analysisResult.strengths) && analysisResult.strengths.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <span className="text-blue-600">#</span> Matching Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.strengths.map((s: string, i: number) => (
                          <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(analysisResult.gaps) && analysisResult.gaps.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><span className="text-orange-600">!</span> Missing Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.gaps.map((g: string, i: number) => (
                          <span key={i} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs">{g}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(analysisResult.suggestions) && analysisResult.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">💡 Suggestions for Improvement</h4>
                      <ul className="space-y-2">
                        {analysisResult.suggestions.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-gray-700 bg-blue-50 p-2 rounded">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Create an AI-optimized resume that addresses the gaps identified in the analysis.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3">
                    <Button onClick={optimizeAnalyzedResume} disabled={creating} className="w-full">
                      {creating ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Optimizing...</>) : ('Optimize Resume')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resume Preview Modal */}
      {previewResume && (
        <ResumePreviewModal
          open={!!previewResume}
          onClose={() => setPreviewResume(null)}
          resume={previewResume}
          userName={clerkUser?.fullName || ''}
          userEmail={clerkUser?.primaryEmailAddress?.emailAddress || ''}
        />
      )}
    </div>
  )
}
