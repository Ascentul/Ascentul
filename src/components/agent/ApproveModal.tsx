'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { ApprovalRequest } from '@/lib/agent/types'

interface ApproveModalProps {
  isOpen: boolean
  request: ApprovalRequest | null
  onApprove: () => void
  onDeny: () => void
}

/**
 * ApproveModal - Confirmation dialog for multi-record writes
 *
 * Shows when agent attempts bulk operations like:
 * - Saving multiple job applications
 * - Updating multiple profile fields
 * - Batch creating goals or projects
 *
 * Usage:
 * <ApproveModal
 *   isOpen={showApproval}
 *   request={approvalRequest}
 *   onApprove={handleApprove}
 *   onDeny={handleDeny}
 * />
 */
export function ApproveModal({ isOpen, request, onApprove, onDeny }: ApproveModalProps) {
  if (!request) return null

  // Zero-record operations indicate a bug in calling code
  if (request.recordCount === 0) {
    console.error('[ApproveModal] recordCount is 0, denying invalid request')
    onDeny()
    return null
  }

  const isBulkOperation = request.recordCount > 1
  const warningLevel = request.recordCount > 5 ? 'high' : 'medium'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onDeny()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 rounded-full p-2 ${
                warningLevel === 'high'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {warningLevel === 'high' ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle>
                {isBulkOperation ? 'Approve Bulk Action' : 'Approve Action'}
              </DialogTitle>
              <DialogDescription className="mt-1.5">
                {request.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tool Info */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="text-sm font-medium text-gray-700">Tool: {request.toolName}</div>
            <div className="mt-1 text-sm text-gray-600">
              {isBulkOperation
                ? `Will affect ${request.recordCount} records`
                : 'Will affect 1 record'}
            </div>
          </div>

          {/* Records Preview */}
          {request.records.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">
                {isBulkOperation ? 'Records to modify:' : 'Record to modify:'}
              </div>
              <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-md border border-gray-200 bg-white p-3">
                {request.records.map((record, idx) => (
                  <div
                    key={record.id || `${record.type}-${record.summary}-${idx}`}
                    className="flex items-start gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{record.type}</div>
                      <div className="text-sm text-gray-600 truncate">{record.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning for high-impact operations */}
          {warningLevel === 'high' && (
            <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
              <div className="text-sm text-orange-800">
                This operation will modify {request.recordCount} records. Please review carefully
                before approving.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onDeny}>
            Cancel
          </Button>
          <Button
            onClick={onApprove}
            className={warningLevel === 'high' ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            {isBulkOperation ? 'Approve All' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
