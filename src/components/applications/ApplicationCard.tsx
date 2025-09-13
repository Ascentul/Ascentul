"use client"

import { useState } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Calendar, Edit } from 'lucide-react'
import { ApplicationStatusBadge } from './ApplicationStatusBadge'
import { EditApplicationForm, type Application as AppType } from './EditApplicationForm'
import { cn } from '@/lib/utils'

function mapStatusToLabel(status: AppType['status']): string {
  switch (status) {
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

export function ApplicationCard({
  application,
  className,
  onChanged,
  onClick,
  saveFn,
  deleteFn,
}: {
  application: AppType & { url?: string | null; created_at?: string; updated_at?: string }
  className?: string
  onChanged?: (updated: AppType | null) => void
  onClick?: () => void
  saveFn?: (id: string | number, values: any) => Promise<AppType>
  deleteFn?: (id: string | number) => Promise<void>
}) {
  const [showEdit, setShowEdit] = useState(false)

  const title = application.job_title || 'Untitled Role'
  const company = application.company || 'Company'

  const updatedAt = application.updated_at || application.created_at
  const statusLabel = mapStatusToLabel(application.status)

  return (
    <>
      <Card
        className={cn('transition-colors cursor-pointer hover:border-primary/50', className)}
        onClick={onClick}
      >
        <CardContent className="py-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{company} — {title}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>Updated {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}</span>
            </div>
            {application.url && (
              <a
                href={application.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" /> View posting
              </a>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ApplicationStatusBadge status={statusLabel} size="sm" />
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowEdit(true)
              }}
            >
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-4" />
      </Card>

      {showEdit && (
        <EditApplicationForm
          open={showEdit}
          onOpenChange={setShowEdit}
          application={application}
          onSuccess={onChanged}
          saveFn={saveFn}
          deleteFn={deleteFn}
        />)
      }
    </>
  )
}
