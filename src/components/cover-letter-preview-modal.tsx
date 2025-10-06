'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { exportCoverLetterPDF } from '@/utils/exportCoverLetter'

interface CoverLetter {
  _id: string
  name: string
  job_title: string
  company_name?: string
  content?: string
  closing?: string
}

interface CoverLetterPreviewModalProps {
  open: boolean
  onClose: () => void
  letter: CoverLetter
  userName?: string
  userEmail?: string
}

export function CoverLetterPreviewModal({ open, onClose, letter, userName, userEmail }: CoverLetterPreviewModalProps) {
  const { toast } = useToast()

  const exportPDF = () => {
    try {
      exportCoverLetterPDF({ letter, userName, userEmail })
      toast({ title: 'Exported', description: 'PDF downloaded successfully.', variant: 'success' })
    } catch (e: any) {
      toast({ title: 'Export failed', description: e?.message || 'Please try again.', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{letter.name}</DialogTitle>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-6 p-6 bg-white border rounded-lg">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold">{userName || 'Your Name'}</h2>
            {userEmail && <div className="text-sm text-muted-foreground mt-1">{userEmail}</div>}
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
            {(letter.content || '').trim() || 'Your generated cover letter will appear here.'}
          </div>
          <div className="pt-4 text-gray-800 whitespace-pre-line">
            {(letter.closing || 'Sincerely,') + (userName ? `\n${userName}` : '')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

