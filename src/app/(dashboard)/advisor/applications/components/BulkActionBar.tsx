'use client';

/**
 * Bulk Action Bar Component
 *
 * Floating action bar that appears when applications are selected.
 * Provides quick access to bulk operations:
 * - Change stage (with validation)
 * - Archive applications
 * - Assign to advisor
 * - Mark as reviewed
 *
 * Design principles:
 * - Fixed position at bottom of viewport
 * - Slide-up animation on appear
 * - Clear selection count
 * - Grouped actions by type
 * - Confirmation dialogs for destructive actions
 * - Accessible with keyboard navigation
 */

import React, { useState } from 'react';
import {
  Archive,
  ChevronRight,
  X,
  AlertTriangle,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApplicationStage, TERMINAL_STAGES } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onChangeStage: (newStage: ApplicationStage, notes?: string) => Promise<void>;
  onArchive: (reason: string) => Promise<void>;
  onUpdateNextStep: (nextStep: string, dueDate?: number) => Promise<void>;
  onMarkReviewed: () => Promise<void>;
  className?: string;
}

interface ConfirmationDialogState {
  isOpen: boolean;
  action: 'change-stage' | 'archive' | 'update-next-step' | null;
  stage?: ApplicationStage;
}

// ============================================================================
// Main Component
// ============================================================================

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onChangeStage,
  onArchive,
  onUpdateNextStep,
  onMarkReviewed,
  className = '',
}: BulkActionBarProps) {
  const [selectedStage, setSelectedStage] = useState<ApplicationStage | ''>('');
  const [notes, setNotes] = useState('');
  const [archiveReason, setArchiveReason] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialogState>({
    isOpen: false,
    action: null,
  });

  // Only render if items are selected
  if (selectedCount === 0) {
    return null;
  }

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleChangeStage = async () => {
    if (!selectedStage) return;

    // Terminal stages require notes - show confirmation dialog
    if (TERMINAL_STAGES.includes(selectedStage)) {
      setConfirmDialog({
        isOpen: true,
        action: 'change-stage',
        stage: selectedStage,
      });
      return;
    }

    // Non-terminal stages can be updated immediately
    setIsProcessing(true);
    try {
      await onChangeStage(selectedStage);
      setSelectedStage('');
      setNotes('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = () => {
    setConfirmDialog({
      isOpen: true,
      action: 'archive',
    });
  };

  const handleUpdateNextStep = () => {
    setConfirmDialog({
      isOpen: true,
      action: 'update-next-step',
    });
  };

  const handleMarkReviewed = async () => {
    setIsProcessing(true);
    try {
      await onMarkReviewed();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAction = async () => {
    setIsProcessing(true);
    try {
      if (confirmDialog.action === 'change-stage' && confirmDialog.stage) {
        await onChangeStage(confirmDialog.stage, notes);
      } else if (confirmDialog.action === 'archive') {
        await onArchive(archiveReason || 'Bulk archived by advisor');
      } else if (confirmDialog.action === 'update-next-step') {
        if (!nextStep.trim()) {
          // Button should already be disabled via line 433
          // This is a defensive check
          return;
        }
        let dueDateTimestamp: number | undefined = undefined;
        if (dueDate) {
          const parsedDate = new Date(dueDate);
          if (!isNaN(parsedDate.getTime())) {
            dueDateTimestamp = parsedDate.getTime();
          }
        }
        await onUpdateNextStep(nextStep, dueDateTimestamp);
      }

      // Reset state
      setConfirmDialog({ isOpen: false, action: null });
      setSelectedStage('');
      setNotes('');
      setArchiveReason('');
      setNextStep('');
      setDueDate('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelDialog = () => {
    setConfirmDialog({ isOpen: false, action: null });
    setNotes('');
    setArchiveReason('');
    setNextStep('');
    setDueDate('');
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {/* Fixed bottom bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 animate-slide-up border-t border-gray-200 bg-white shadow-2xl ${className}`}
        role="toolbar"
        aria-label="Bulk actions toolbar"
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Selection count */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {selectedCount}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {selectedCount === 1
                  ? '1 application selected'
                  : `${selectedCount} applications selected`}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Change Stage */}
              <div className="flex items-center gap-2">
                <Select
                  value={selectedStage}
                  onValueChange={(value) => setSelectedStage(value as ApplicationStage)}
                  disabled={isProcessing}
                >
                  <SelectTrigger className="w-40" aria-label="Select new stage">
                    <SelectValue placeholder="Change stage..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Interview">Interview</SelectItem>
                    <SelectItem value="Offer">Offer</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleChangeStage}
                  disabled={!selectedStage || isProcessing}
                  variant="default"
                  size="sm"
                  className="gap-1"
                >
                  Apply
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300" aria-hidden="true" />

              {/* Update Next Step */}
              <Button
                onClick={handleUpdateNextStep}
                disabled={isProcessing}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" aria-hidden="true" />
                Set Next Step
              </Button>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300" aria-hidden="true" />

              {/* Mark as Reviewed */}
              <Button
                onClick={handleMarkReviewed}
                disabled={isProcessing}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Mark Reviewed
              </Button>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300" aria-hidden="true" />

              {/* Archive */}
              <Button
                onClick={handleArchive}
                disabled={isProcessing}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Archive className="h-4 w-4" aria-hidden="true" />
                Archive
              </Button>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300" aria-hidden="true" />

              {/* Clear Selection */}
              <Button
                onClick={onClearSelection}
                disabled={isProcessing}
                variant="ghost"
                size="sm"
                className="gap-2"
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && handleCancelDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.action === 'archive' ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                  Archive Applications
                </>
              ) : confirmDialog.action === 'update-next-step' ? (
                <>
                  <Edit2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
                  Set Next Step
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                  Change Stage
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'archive' ? (
                <>
                  You are about to archive <strong>{selectedCount}</strong>{' '}
                  {selectedCount === 1 ? 'application' : 'applications'}. Archived
                  applications can be restored later.
                </>
              ) : confirmDialog.action === 'update-next-step' ? (
                <>
                  Set the next step for <strong>{selectedCount}</strong>{' '}
                  {selectedCount === 1 ? 'application' : 'applications'}. This will help
                  you and students track what needs to be done.
                </>
              ) : (
                <>
                  You are about to change <strong>{selectedCount}</strong>{' '}
                  {selectedCount === 1 ? 'application' : 'applications'} to{' '}
                  <strong>{confirmDialog.stage}</strong>. This action requires a note.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Form fields based on action type */}
          {confirmDialog.action === 'update-next-step' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="bulk-next-step"
                  className="text-sm font-medium text-gray-700"
                >
                  Next Step (required)
                </label>
                <Input
                  id="bulk-next-step"
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                  placeholder="e.g., Follow up on interview, Submit references..."
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="bulk-due-date"
                  className="text-sm font-medium text-gray-700"
                >
                  Due Date (optional)
                </label>
                <Input
                  id="bulk-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label
                htmlFor="bulk-action-notes"
                className="text-sm font-medium text-gray-700"
              >
                {confirmDialog.action === 'archive' ? 'Reason (optional)' : 'Notes (required)'}
              </label>
              <Textarea
                id="bulk-action-notes"
                value={confirmDialog.action === 'archive' ? archiveReason : notes}
                onChange={(e) =>
                  confirmDialog.action === 'archive'
                    ? setArchiveReason(e.target.value)
                    : setNotes(e.target.value)
                }
                placeholder={
                  confirmDialog.action === 'archive'
                    ? 'Why are you archiving these applications?'
                    : 'Provide context for this stage change...'
                }
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleCancelDialog} variant="outline" disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={
                isProcessing ||
                (confirmDialog.action === 'change-stage' && !notes.trim()) ||
                (confirmDialog.action === 'update-next-step' && !nextStep.trim())
              }
              variant={confirmDialog.action === 'archive' ? 'destructive' : 'default'}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// Slide-up animation (add to globals.css)
// ============================================================================

/**
 * Add this to your globals.css or tailwind.config.js:
 *
 * @keyframes slide-up {
 *   from {
 *     transform: translateY(100%);
 *     opacity: 0;
 *   }
 *   to {
 *     transform: translateY(0);
 *     opacity: 1;
 *   }
 * }
 *
 * .animate-slide-up {
 *   animation: slide-up 0.2s ease-out;
 * }
 */
