"use client"

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Trash2 } from 'lucide-react'

const schema = z.object({
  company: z.string().min(1, 'Company is required'),
  job_title: z.string().min(1, 'Job title is required'),
  status: z.enum(['saved', 'applied', 'interview', 'offer', 'rejected']),
  url: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  notes: z.string().optional(),
})

export type Application = {
  id: string | number
  company: string
  job_title: string
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
  url?: string | null
  notes?: string | null
  updated_at?: string
}

export function EditApplicationForm({
  open,
  onOpenChange,
  application,
  onSuccess,
  saveFn,
  deleteFn,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  application: Application
  onSuccess?: (updated: Application | null) => void
  saveFn?: (id: string | number, values: z.infer<typeof schema>) => Promise<Application>
  deleteFn?: (id: string | number) => Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      company: application.company ?? '',
      job_title: application.job_title ?? '',
      status: application.status ?? 'saved',
      url: (application as any).url ?? undefined,
      notes: (application as any).notes ?? undefined,
    },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setSubmitting(true)
    try {
      if (saveFn) {
        const updated = await saveFn(application.id, values)
        onSuccess?.(updated)
      } else {
        const res = await fetch(`/api/applications/${application.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to update')
        onSuccess?.(json.application)
      }
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async () => {
    if (!confirm('Delete this application?')) return
    setDeleting(true)
    try {
      if (deleteFn) {
        await deleteFn(application.id)
        onSuccess?.(null)
      } else {
        const res = await fetch(`/api/applications/${application.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete')
        onSuccess?.(null)
      }
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
          <DialogDescription>Update details for this job application.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Role title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="saved">Saved</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex items-center justify-between gap-2">
              <Button type="button" variant="outline" className="gap-2 text-destructive border-destructive" onClick={onDelete}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
