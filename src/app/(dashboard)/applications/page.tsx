'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Briefcase, Search } from 'lucide-react'
import { ApplicationCard } from '@/components/applications/ApplicationCard'
import { ApplicationDetails } from '@/components/applications/ApplicationDetails'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useRouter } from 'next/navigation'

interface Application {
  id: string | number
  company: string
  job_title: string
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
  url?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export default function ApplicationsPage() {
  const router = useRouter()
  const { user, isLoaded: clerkLoaded } = useUser()
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'applications' | 'job-search'>('applications')
  const [form, setForm] = useState({
    company: '',
    job_title: '',
    status: 'saved' as Application['status'],
    url: '',
    notes: '',
  })

  const [showDetails, setShowDetails] = useState(false)
  const [selected, setSelected] = useState<Application | null>(null)

  // Handle tab change to redirect to job-search page
  const handleTabChange = (tab: 'applications' | 'job-search') => {
    if (tab === 'job-search') {
      router.push('/job-search')
    } else {
      setActiveTab(tab)
    }
  }

  // Convex data - use directly without state duplication
  const convexApps = useQuery(api.applications.getUserApplications, user?.id ? { clerkId: user.id } : 'skip')
  const createMutation = useMutation(api.applications.createApplication)
  const updateMutation = useMutation(api.applications.updateApplication)
  const deleteMutation = useMutation(api.applications.deleteApplication)

  // Map Convex docs to local Application shape - memoized
  const apps = useMemo(() => {
    if (!convexApps) return []
    return convexApps.map((d: any) => ({
      id: d._id,
      company: d.company ?? '',
      job_title: d.job_title ?? '',
      status: d.status ?? 'saved',
      url: d.url ?? null,
      notes: d.notes ?? null,
      created_at: typeof d.created_at === 'number' ? new Date(d.created_at).toISOString() : d.created_at,
      updated_at: typeof d.updated_at === 'number' ? new Date(d.updated_at).toISOString() : d.updated_at,
    })) as Application[]
  }, [convexApps])

  const createApp = async () => {
    if (!form.company.trim() || !form.job_title.trim()) return
    setCreating(true)
    try {
      if (!user?.id) return
      await createMutation({
        clerkId: user.id,
        company: form.company,
        job_title: form.job_title,
        status: form.status,
        url: form.url || undefined,
        notes: form.notes || undefined,
      } as any)
      // Convex query will refresh automatically - no need for optimistic updates
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB]">Application Tracker</h1>
          <p className="text-muted-foreground">Track your job applications and progress.</p>
        </div>
        <Button onClick={createApp} disabled={creating}>
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Add
        </Button>
      </div>

      {/* Toggle between Applications and Job Search */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={activeTab === 'applications' ? 'default' : 'outline'}
          onClick={() => handleTabChange('applications')}
          className="flex items-center gap-2"
        >
          <Briefcase className="h-4 w-4" />
          Applications
        </Button>
        <Button
          variant={activeTab === 'job-search' ? 'default' : 'outline'}
          onClick={() => handleTabChange('job-search')}
          className="flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          Job Search
        </Button>
      </div>

      {/* Quick add form */}
      <div className="rounded-md border p-4 mb-8">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <Input
            placeholder="Job title"
            value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
          />
          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v as Application['status'] })}
          >
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
          <Button onClick={createApp} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Create
          </Button>
        </div>
      </div>

      {!clerkLoaded || !convexApps ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {apps.length === 0 ? (
            <div className="text-sm text-muted-foreground">No applications yet. Use the form above to add one.</div>
          ) : (
            apps.map((a) => (
              <ApplicationCard
                key={a.id}
                application={a}
                onChanged={() => {
                  // Convex query will refresh automatically - no need for optimistic updates
                }}
                onClick={() => {
                  setSelected(a)
                  setShowDetails(true)
                }}
                saveFn={async (id, values) => {
                  if (!user?.id) throw new Error('Not signed in')
                  await updateMutation({
                    clerkId: user.id,
                    applicationId: id as any,
                    updates: {
                      company: values.company,
                      job_title: values.job_title,
                      status: values.status as any,
                      url: (values as any).url,
                      notes: (values as any).notes,
                    },
                  } as any)
                  const updated = { ...(a as any), ...values }
                  return updated as Application
                }}
                deleteFn={async (id) => {
                  if (!user?.id) throw new Error('Not signed in')
                  await deleteMutation({ clerkId: user.id, applicationId: id as any } as any)
                }}
              />
            ))
          )}
        </div>
      )}

      {selected && (
        <ApplicationDetails
          open={showDetails}
          onOpenChange={setShowDetails}
          application={selected}
          onChanged={(updated) => {
            // Update selected state for immediate UI feedback
            setSelected((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev))
            // Convex query will refresh automatically
          }}
          saveFn={async (id, values) => {
            if (!user?.id) throw new Error('Not signed in')
            await updateMutation({ clerkId: user.id, applicationId: id as any, updates: values as any } as any)
            const updated = { ...(selected as any), ...values }
            return updated as Application
          }}
        />
      )}
    </div>
  )
}
