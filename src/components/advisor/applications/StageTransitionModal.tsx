'use client';

import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { ApplicationStage } from '@/lib/advisor/stages';
import {
  getNextStages,
  getReasonCodesForStage,
  getStageColor,
  getStageLabel,
  isTerminalStage,
  requiresReasonCode,
} from '@/lib/advisor/stages';

interface StageTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: {
    _id: Id<'applications'>;
    company_name: string;
    position_title: string;
    student_name: string;
    stage: ApplicationStage;
  };
  clerkId: string;
  onSuccess?: (applicationId: Id<'applications'>, newStage: ApplicationStage) => void;
}

export function StageTransitionModal({
  isOpen,
  onClose,
  application,
  clerkId,
  onSuccess,
}: StageTransitionModalProps) {
  const [selectedStage, setSelectedStage] = useState<ApplicationStage | ''>('');
  const [reasonCode, setReasonCode] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const updateStage = useMutation(api.advisor_applications.updateApplicationStage);

  const currentStage = application.stage || 'Prospect';
  const nextStages = getNextStages(currentStage);

  // Determine if reason code is required for the selected stage
  const reasonCodeRequired = Boolean(selectedStage && requiresReasonCode(selectedStage));
  const availableReasonCodes = selectedStage ? getReasonCodesForStage(selectedStage) : null;

  // Notes are still required for terminal stages (Rejected, Withdrawn, Archived)
  const notesRequired = Boolean(selectedStage && isTerminalStage(selectedStage));

  const handleSubmit = async () => {
    if (!selectedStage) {
      toast({ title: 'Please select a stage', variant: 'destructive' });
      return;
    }

    if (reasonCodeRequired && !reasonCode) {
      toast({ title: `Please select a reason for ${selectedStage}`, variant: 'destructive' });
      return;
    }

    if (notesRequired && !additionalNotes.trim()) {
      toast({ title: `Notes required for ${selectedStage} stage`, variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateStage({
        clerkId,
        applicationId: application._id,
        newStage: selectedStage as ApplicationStage,
        notes: additionalNotes.trim() || undefined,
        reason_code: reasonCode || undefined,
      });

      toast({ title: `Application moved to ${selectedStage}` });

      // Capture stage before reset for callback
      const completedStage = selectedStage;

      // Reset form
      setSelectedStage('');
      setReasonCode('');
      setAdditionalNotes('');

      if (onSuccess) {
        onSuccess(application._id, completedStage);
      }

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update stage',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedStage('');
      setReasonCode('');
      setAdditionalNotes('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Change Application Stage</DialogTitle>
          <DialogDescription>Update the stage for this application</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Application Details */}
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">{application.company_name}</span>
              <span className="text-muted-foreground"> - {application.position_title}</span>
            </div>
            <div className="text-xs text-muted-foreground">Student: {application.student_name}</div>
          </div>

          {/* Current Stage */}
          <div className="space-y-2">
            <Label>Current Stage</Label>
            <div>
              <Badge variant="secondary" className={getStageColor(currentStage)}>
                {getStageLabel(currentStage)}
              </Badge>
            </div>
          </div>

          {/* New Stage Selection */}
          <div className="space-y-2">
            <Label htmlFor="stage">New Stage *</Label>
            {nextStages.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                No transitions available from {currentStage}
              </div>
            ) : (
              <Select
                value={selectedStage}
                onValueChange={(value) => {
                  setSelectedStage(value as ApplicationStage);
                  setReasonCode(''); // Reset reason code when stage changes
                }}
              >
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select new stage..." />
                </SelectTrigger>
                <SelectContent>
                  {nextStages.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        {getStageLabel(stage)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Reason Code (for Rejected/Withdrawn) */}
          {reasonCodeRequired && availableReasonCodes && (
            <div className="space-y-2">
              <Label htmlFor="reason-code">Reason *</Label>
              <Select value={reasonCode} onValueChange={setReasonCode}>
                <SelectTrigger id="reason-code">
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(availableReasonCodes).map(([code, label]) => (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {notesRequired ? 'Additional Notes *' : 'Notes (Optional)'}
            </Label>
            {notesRequired && (
              <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md mb-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Additional context is required when moving to {selectedStage} stage</span>
              </div>
            )}
            <Textarea
              id="notes"
              placeholder={
                notesRequired
                  ? `Provide additional context about this ${selectedStage} decision...`
                  : 'Add optional notes about this stage change...'
              }
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              This will be added to the application notes with a timestamp
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !selectedStage ||
              nextStages.length === 0 ||
              (reasonCodeRequired && !reasonCode) ||
              (notesRequired && !additionalNotes.trim())
            }
          >
            {isSubmitting ? 'Updating...' : 'Update Stage'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
