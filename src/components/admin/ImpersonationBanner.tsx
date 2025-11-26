'use client'

import { X, Eye, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useImpersonation } from '@/contexts/ImpersonationContext'

/**
 * Banner displayed when super_admin is impersonating another role
 * Shows current impersonation status and allows quick exit
 */
export function ImpersonationBanner() {
  const { impersonation, stopImpersonating } = useImpersonation()

  if (!impersonation.isImpersonating) {
    return null
  }

  const roleLabels: Record<string, string> = {
    student: 'Student',
    individual: 'Individual User',
    advisor: 'Advisor',
    staff: 'Staff',
    university_admin: 'University Admin',
  }

  const planLabels: Record<string, string> = {
    free: 'Free Plan',
    premium: 'Premium Plan',
    university: 'University Plan',
  }

  const roleLabel = impersonation.role ? roleLabels[impersonation.role] || impersonation.role : 'Unknown'
  const planLabel = impersonation.plan ? planLabels[impersonation.plan] : null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 py-2 px-4 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">
            Viewing as: <strong>{roleLabel}</strong>
            {planLabel && (
              <span className="ml-2 text-amber-800">({planLabel})</span>
            )}
          </span>
          {impersonation.universityName && (
            <span className="flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-amber-400/50 rounded-full text-sm">
              <Building2 className="h-3.5 w-3.5" />
              {impersonation.universityName}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={stopImpersonating}
          className="text-amber-950 hover:bg-amber-400/50 hover:text-amber-950"
        >
          <X className="h-4 w-4 mr-1" />
          Exit View
        </Button>
      </div>
    </div>
  )
}
