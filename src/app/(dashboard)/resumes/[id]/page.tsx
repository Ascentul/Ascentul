"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, Trash2, ArrowLeft, Download, Sparkles } from "lucide-react"
import { jsPDF } from 'jspdf'
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ResumeEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const clerkId = user?.id
  const resumeId = (Array.isArray((params as any)?.id) ? (params as any).id[0] : (params as any)?.id) as string

  const resume = useQuery(
    api.resumes.getResumeById,
    clerkId && resumeId ? ({ clerkId, resumeId } as any) : "skip"
  ) as any

  const updateResume = useMutation(api.resumes.updateResume)
  const deleteResume = useMutation(api.resumes.deleteResume)

  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [skillsText, setSkillsText] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  // Upload & analyze state
  const [uploading, setUploading] = useState(false)
  const [extractedText, setExtractedText] = useState<string>("")
  const [jobDescription, setJobDescription] = useState<string>("")
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<null | { score: number; summary: string; strengths: string[]; gaps: string[]; suggestions: string[] }>(null)
  // AI suggestions
  const [suggesting, setSuggesting] = useState(false)
  const [aiSummary, setAiSummary] = useState<string>("")
  const [aiSkills, setAiSkills] = useState<string[]>([])

  // hydrate local state when data loads
  useEffect(() => {
    if (!resume) return
    setTitle(resume.title || "")
    const content = resume.content || {}
    setSummary(content.summary || "")
    setSkillsText((content.skills || []).join(", "))
    // Restore analysis data
    setExtractedText(resume.extracted_text || "")
    setJobDescription(resume.job_description || "")
    setAnalysis(resume.analysis_result || null)
    setAiSummary(resume.ai_suggestions?.improvedSummary || "")
    setAiSkills(resume.ai_suggestions?.recommendedSkills || [])
  }, [resume])

  const loading = resume === undefined

  // If the resume was deleted or cannot be accessed, return to list
  useEffect(() => {
    if (resume === null) {
      router.replace('/resumes')
      router.refresh()
    }
  }, [resume, router])

  const doSave = async () => {
    if (!clerkId || !resume?._id) return
    setSaving(true)
    try {
      await updateResume({
        clerkId,
        resumeId: resume._id,
        updates: {
          title: title.trim() || "Untitled Resume",
          content: {
            ...(resume.content || {}),
            summary,
            skills: skillsText
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0),
          },
        },
      } as any)
      toast({ title: "Saved", description: "Your resume changes have been saved." })
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "Please try again.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // Debounced autosave when fields differ from server values
  useEffect(() => {
    if (!clerkId || !resume?._id) return

    const currentTitle = resume.title || ""
    const currentSummary = (resume.content?.summary as string) || ""
    const currentSkills = Array.isArray(resume.content?.skills) ? (resume.content!.skills as string[]).join(", ") : ""

    // Only autosave if values changed compared to server snapshot
    const needsSave =
      title !== currentTitle ||
      summary !== currentSummary ||
      skillsText !== currentSkills

    if (!needsSave) return

    const t = setTimeout(async () => {
      try {
        setAutoSaving(true)
        await updateResume({
          clerkId,
          resumeId: resume._id,
          updates: {
            title: title.trim() || "Untitled Resume",
            content: {
              ...(resume.content || {}),
              summary,
              skills: skillsText
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0),
            },
          },
        } as any)
      } catch (_) {
        // Silent on autosave errors; user can use Save button which shows toast
      } finally {
        setAutoSaving(false)
      }
    }, 1000)

    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, summary, skillsText, clerkId, resume?._id])

  // Upload PDF -> extract text
  const onUploadResumePdf = async (file: File) => {
    try {
      setUploading(true)
      // Client-side validation: support PDF and DOCX
      const lower = file.name.toLowerCase()
      const type = (file.type || '').toLowerCase()
      const isPdf = type === 'application/pdf' || lower.endsWith('.pdf')
      const isDocx = type.includes('officedocument.wordprocessingml.document') || lower.endsWith('.docx')
      if (!isPdf && !isDocx) {
        throw new Error('Please upload a PDF (.pdf) or Word (.docx) file.')
      }
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/resumes/extract', { method: 'POST', body: fd })
      // If the route isn't available yet (dev server needs restart), this may be HTML
      const text = await res.text()
      let json: any
      try { json = JSON.parse(text) } catch {
        throw new Error('Upload endpoint not available yet. Try restarting the dev server.')
      }
      if (!res.ok) {
        // Helpfully surface missing mammoth dependency for DOCX
        if (json?.missingDependency === 'mammoth') {
          throw new Error('DOCX support requires the mammoth package. Please run: npm install mammoth')
        }
        throw new Error(json.error || 'Failed to extract')
      }
      setExtractedText(json.text || '')
      const pages = json?.info?.pages
      const fileType = json?.info?.type || 'file'
      const warning = json?.warning
      if (warning) {
        toast({ title: 'Extracted with warning', description: warning, variant: 'destructive' })
      } else {
        toast({ title: 'Extracted', description: `Parsed ${pages ? `${pages} pages` : fileType.toUpperCase()}.` })
      }
      // Save extracted text to DB
      if (clerkId && resume?._id) {
        await updateResume({
          clerkId,
          resumeId: resume._id,
          updates: { extracted_text: json.text || '' }
        } as any)
      }
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message || 'Could not extract text', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  // Analyze extracted text vs job description
  const runAnalysis = async () => {
    if (!extractedText.trim() || !jobDescription.trim()) {
      toast({ title: 'Missing data', description: 'Upload a resume and add a job description first.', variant: 'destructive' })
      return
    }
    try {
      setAnalyzing(true)
      const res = await fetch('/api/resumes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: extractedText, jobDescription }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to analyze')
      setAnalysis(json)
      toast({ title: 'Analysis complete', description: `Estimated match ${json.score}%` })
      // Save analysis results and job description to DB
      if (clerkId && resume?._id) {
        await updateResume({
          clerkId,
          resumeId: resume._id,
          updates: { 
            job_description: jobDescription,
            analysis_result: json
          }
        } as any)
      }
    } catch (e: any) {
      toast({ title: 'Analysis failed', description: e?.message || 'Please try again', variant: 'destructive' })
    } finally {
      setAnalyzing(false)
    }
  }

  // PDF export using jsPDF
  const exportPdf = async () => {
    try {
      const doc = new jsPDF()
      const lineHeight = 8
      let y = 10
      doc.setFontSize(16)
      doc.text(title || 'Untitled Resume', 10, y)
      y += 10
      doc.setFontSize(12)
      doc.text('Professional Summary', 10, y)
      y += 6
      const summaryLines = doc.splitTextToSize(summary || '', 180)
      doc.text(summaryLines, 10, y)
      y += Math.max(lineHeight, summaryLines.length * 6) + 4
      doc.text('Skills', 10, y)
      y += 6
      const skillsLine = (skillsText || '').trim()
      const skillsLines = doc.splitTextToSize(skillsLine, 180)
      doc.text(skillsLines, 10, y)
      const fileName = `${(title || 'resume').replace(/\s+/g, '_')}.pdf`
      doc.save(fileName)
      toast({ title: 'Exported', description: 'PDF downloaded.' })
    } catch (e: any) {
      toast({ title: 'Export failed', description: e?.message || 'Please try again', variant: 'destructive' })
    }
  }

  // AI suggestions (summary + skills) — simple endpoint
  const getSuggestions = async () => {
    try {
      setSuggesting(true)
      const sourceText = extractedText || `${summary}\nSkills: ${skillsText}`
      const payload = {
        resumeText: sourceText,
        jobDescription: jobDescription || summary || ''
      }
      const res = await fetch('/api/resumes/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to get suggestions')
      setAiSummary(json.improvedSummary || '')
      setAiSkills(json.recommendedSkills || [])
      toast({ title: 'Suggestions ready', description: 'Review and apply if you like.' })
      // Save AI suggestions to DB
      if (clerkId && resume?._id) {
        await updateResume({
          clerkId,
          resumeId: resume._id,
          updates: { ai_suggestions: json }
        } as any)
      }
    } catch (e: any) {
      toast({ title: 'Suggestions failed', description: e?.message || 'Please try again', variant: 'destructive' })
    } finally {
      setSuggesting(false)
    }
  }

  const applySuggestions = async () => {
    if (aiSummary) setSummary(aiSummary)
    if (aiSkills?.length) setSkillsText(aiSkills.join(', '))
    
    // Immediately save the applied suggestions to the database
    if (clerkId && resume?._id && (aiSummary || aiSkills?.length)) {
      try {
        await updateResume({
          clerkId,
          resumeId: resume._id,
          updates: {
            title: title.trim() || "Untitled Resume",
            content: {
              ...(resume.content || {}),
              summary: aiSummary || summary,
              skills: aiSkills?.length ? aiSkills : skillsText
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0),
            },
          },
        } as any)
        toast({ title: "Applied", description: "AI suggestions have been applied to your resume." })
      } catch (e: any) {
        toast({ title: "Apply failed", description: e?.message || "Please try again.", variant: "destructive" })
      }
    }
  }

  const doDelete = async () => {
    if (!clerkId || !resume?._id) return
    const idToDelete = resume._id as any
    setDeleting(true)
    try {
      await deleteResume({ clerkId, resumeId: idToDelete } as any)
      toast({ title: "Deleted", description: "Resume removed." })
      router.replace("/resumes")
      router.refresh()
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || "Please try again.", variant: "destructive" })
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push("/resumes")}> 
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Resume</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={!resume || deleting}>
            {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />} Delete
          </Button>
          <Button variant="outline" onClick={exportPdf} disabled={!resume}>
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </Button>
          <Button onClick={doSave} disabled={saving || !resume}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
          {autoSaving && (
            <span className="text-xs text-muted-foreground ml-2">Autosaving…</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : resume === null ? (
        <Card>
          <CardHeader>
            <CardTitle>Resume not found</CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Professional Summary</label>
                <Textarea rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Skills (comma separated)</label>
                <Input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Upload & Analyze */}
          <Card>
            <CardHeader>
              <CardTitle>Upload & Analyze</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm">Upload Resume (PDF or DOCX)</label>
                <input
                  type="file"
                  accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) onUploadResumePdf(f)
                  }}
                  disabled={uploading}
                />
                {extractedText && (
                  <div className="text-xs text-muted-foreground">Extracted {extractedText.length} characters</div>
                )}
              </div>

              <div>
                <label className="block text-sm mb-1">Job Description</label>
                <Textarea
                  rows={6}
                  placeholder="Paste the job description here"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div>
                <Button onClick={runAnalysis} disabled={analyzing || !extractedText || !jobDescription}>
                  {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Analyze
                </Button>
              </div>

              {analysis && (
                <div className="space-y-3">
                  <div className="font-medium">Match Score: {analysis.score}%</div>
                  <div className="text-sm">{analysis.summary}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="font-semibold mb-1">Strengths</div>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {analysis.strengths.map((s, i) => (
                          <li key={`st-${i}`}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Gaps</div>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {analysis.gaps.map((g, i) => (
                          <li key={`gp-${i}`}>{g}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Suggestions</div>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {analysis.suggestions.map((g, i) => (
                          <li key={`sg-${i}`}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>AI Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Generate an improved summary and recommended skills based on your current resume text and job description.</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={getSuggestions} disabled={suggesting}>
                  {suggesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Get Suggestions
                </Button>
                <Button variant="outline" onClick={applySuggestions} disabled={!aiSummary && (!aiSkills || aiSkills.length === 0)}>
                  Apply to Resume
                </Button>
              </div>
              {(aiSummary || (aiSkills && aiSkills.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiSummary && (
                    <div>
                      <div className="font-semibold mb-1">Suggested Summary</div>
                      <div className="text-sm whitespace-pre-wrap border rounded p-3 bg-muted/30">{aiSummary}</div>
                    </div>
                  )}
                  {aiSkills && aiSkills.length > 0 && (
                    <div>
                      <div className="font-semibold mb-1">Recommended Skills</div>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {aiSkills.map((s, i) => (
                          <li key={`ais-${i}`}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resume?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this resume.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
