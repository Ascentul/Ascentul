"use client"

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ApplicationStatusBadge } from './ApplicationStatusBadge'
import { Loader2, ExternalLink } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export type DBApplication = {
  id: string | number
  company: string
  job_title: string
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
  url?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  resume_id?: string | null
  cover_letter_id?: string | null
}

function statusLabel(s: DBApplication['status']): string {
  switch (s) {
    case 'saved':
      return 'In Progress'
    case 'applied':
      return 'Applied'
    case 'interview':
      return 'Interviewing'
    case 'offer':
      return 'Offer'
    case 'rejected':
      return 'Rejected'
    default:
      return 'In Progress'
  }
}

export function ApplicationDetails({
  open,
  onOpenChange,
  application,
  onChanged,
  saveFn,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  application: DBApplication
  onChanged?: (updated: DBApplication) => void
  saveFn?: (id: string | number, values: Partial<DBApplication>) => Promise<DBApplication>
}) {
  const [saving, setSaving] = useState(false)
  const [local, setLocal] = useState<DBApplication>(application)
  const { user } = useUser()
  const clerkId = user?.id

  // Convex data for tabs
  const stages = useQuery(
    api.interviews.getStagesForApplication,
    clerkId ? { clerkId, applicationId: local.id as any } : 'skip'
  )
  const followups = useQuery(
    api.followups.getFollowupsForApplication,
    clerkId ? { clerkId, applicationId: local.id as any } : 'skip'
  )
  const resumes = useQuery(api.resumes.getUserResumes, clerkId ? { clerkId } : 'skip')
  const coverLetters = useQuery(api.cover_letters.getUserCoverLetters, clerkId ? { clerkId } : 'skip')

  // Mutations
  const createStage = useMutation(api.interviews.createStage)
  const updateStage = useMutation(api.interviews.updateStage)
  const createFollowup = useMutation(api.followups.createFollowup)
  const updateFollowup = useMutation(api.followups.updateFollowup)
  const updateApplication = useMutation(api.applications.updateApplication)

  useEffect(() => setLocal(application), [application])

  const save = async () => {
    setSaving(true)
    try {
      if (saveFn) {
        const updated = await saveFn(application.id, {
          status: local.status,
          notes: local.notes,
          company: local.company,
          job_title: local.job_title,
          url: local.url || undefined,
        })
        onChanged?.(updated)
        onOpenChange(false)
      } else {
        if (!clerkId) return
        await updateApplication({
          clerkId,
          applicationId: application.id as any,
          updates: {
            status: local.status,
            notes: local.notes,
            company: local.company,
            job_title: local.job_title,
            url: local.url || undefined,
          } as any,
        } as any)
        onChanged?.({ ...local })
        onOpenChange(false)
      }
    } finally {
      setSaving(false)
    }
  }

  // Add Interview Stage form state
  const [stageForm, setStageForm] = useState({ title: '', scheduled_at: '', location: '', notes: '' })
  const addStage = async () => {
    if (!clerkId || !stageForm.title.trim()) return
    const scheduled = stageForm.scheduled_at ? new Date(stageForm.scheduled_at).getTime() : undefined
    await createStage({
      clerkId,
      applicationId: local.id as any,
      title: stageForm.title,
      scheduled_at: scheduled,
      location: stageForm.location || undefined,
      notes: stageForm.notes || undefined,
    } as any)
    setStageForm({ title: '', scheduled_at: '', location: '', notes: '' })
  }

  const setStageOutcome = async (stageId: any, outcome: 'pending' | 'scheduled' | 'passed' | 'failed') => {
    if (!clerkId) return
    await updateStage({ clerkId, stageId, updates: { outcome } } as any)
  }

  // Follow-up form state
  const [followForm, setFollowForm] = useState({ description: '', due_date: '' })
  const addFollowup = async () => {
    if (!clerkId || !followForm.description.trim()) return
    const due = followForm.due_date ? new Date(followForm.due_date).getTime() : undefined
    await createFollowup({
      clerkId,
      applicationId: local.id as any,
      description: followForm.description,
      due_date: due,
    } as any)
    setFollowForm({ description: '', due_date: '' })
  }

  const toggleFollowup = async (followupId: any, current: boolean) => {
    if (!clerkId) return
    await updateFollowup({ clerkId, followupId, updates: { completed: !current } } as any)
  }

  // Materials selection
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(local.resume_id || undefined)
  const [selectedCoverId, setSelectedCoverId] = useState<string | undefined>(local.cover_letter_id || undefined)
  const saveMaterials = async () => {
    if (!clerkId) return
    await updateApplication({
      clerkId,
      applicationId: local.id as any,
      updates: {
        resume_id: selectedResumeId ? (selectedResumeId as any) : undefined,
        cover_letter_id: selectedCoverId ? (selectedCoverId as any) : undefined,
      },
    } as any)
    const updated = { ...local, resume_id: selectedResumeId || null, cover_letter_id: selectedCoverId || null }
    setLocal(updated)
    onChanged?.(updated)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {local.job_title || 'Untitled Role'} · {local.company || 'Company'}
          </DialogTitle>
          <DialogDescription>View and update application details stored in your account.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ApplicationStatusBadge status={statusLabel(local.status)} />
            {local.url ? (
              <a className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1" href={local.url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> View posting
              </a>
            ) : null}
          </div>
          <div className="w-48">
            <Select value={local.status} onValueChange={(v) => setLocal((p) => ({ ...p, status: v as DBApplication['status'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saved">In Progress</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="interview">Interviewing</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-4 mb-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="followups">Follow-up</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                className="mt-1 min-h-[120px]"
                value={local.notes ?? ''}
                onChange={(e) => setLocal({ ...local, notes: e.target.value })}
                placeholder="Add notes about this application"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="interviews" className="space-y-3">
            <div className="rounded-md border p-3">
              <div className="grid md:grid-cols-4 gap-2">
                <Input placeholder="Stage title (e.g., Recruiter Screen)" value={stageForm.title} onChange={(e) => setStageForm({ ...stageForm, title: e.target.value })} />
                <Input type="datetime-local" value={stageForm.scheduled_at} onChange={(e) => setStageForm({ ...stageForm, scheduled_at: e.target.value })} />
                <Input placeholder="Location / Link" value={stageForm.location} onChange={(e) => setStageForm({ ...stageForm, location: e.target.value })} />
                <Button onClick={addStage}>Add Interview</Button>
              </div>
            </div>
            <div className="space-y-2">
              {(stages || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No interview stages yet.</div>
              ) : (
                stages!.map((s: any) => (
                  <div key={s._id} className="border rounded-md p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : 'Not scheduled'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={s.outcome} onValueChange={(v) => setStageOutcome(s._id, v as any)}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="passed">Passed</SelectItem>
                          <SelectItem value="failed">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="followups" className="space-y-3">
            <div className="rounded-md border p-3">
              <div className="grid md:grid-cols-3 gap-2">
                <Input placeholder="Description" value={followForm.description} onChange={(e) => setFollowForm({ ...followForm, description: e.target.value })} />
                <Input type="datetime-local" value={followForm.due_date} onChange={(e) => setFollowForm({ ...followForm, due_date: e.target.value })} />
                <Button onClick={addFollowup}>Add Follow-up</Button>
              </div>
            </div>
            <div className="space-y-2">
              {(followups || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No follow-up actions yet.</div>
              ) : (
                followups!.map((f: any) => (
                  <div key={f._id} className="border rounded-md p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{f.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {f.due_date ? new Date(f.due_date).toLocaleString() : 'No due date'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant={f.completed ? 'default' : 'outline'} size="sm" onClick={() => toggleFollowup(f._id, f.completed)}>
                        {f.completed ? 'Completed' : 'Mark Completed'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="materials" className="space-y-3">
            <div>
              <Label>Resume used</Label>
              <Select value={selectedResumeId} onValueChange={(v) => setSelectedResumeId(v)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select resume" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {(resumes || []).map((r: any) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cover Letter used</Label>
              <Select value={selectedCoverId} onValueChange={(v) => setSelectedCoverId(v)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select cover letter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {(coverLetters || []).map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveMaterials}>Save Materials</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
