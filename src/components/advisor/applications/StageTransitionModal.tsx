'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { toast } from 'sonner';
import { getNextStages, getStageLabel, getStageColor, TERMINAL_STAGES } from '@/lib/advisor/stages';
import type { ApplicationStage } from '@/lib/advisor/stages';

interface StageTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: {
    _id: Id<'applications'>;
    company_name: string;
    position_title: string;
    student_name: string;
    stage: string;
  };
  clerkId: string;
  onSuccess?: (applicationId: Id<'applications'>, newStage: string) => void;
}

export function StageTransitionModal({
  isOpen,
  onClose,
  application,
  clerkId,
  onSuccess,
}: StageTransitionModalProps) {
  const [selectedStage, setSelectedStage] = useState<ApplicationStage | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateStage = useMutation(api.advisor_applications.updateApplicationStage);

  const currentStage = (application.stage || 'Prospect') as ApplicationStage;
  const nextStages = getNextStages(currentStage);

  // Determine if reason is required for the selected stage
  const reasonRequired = selectedStage && TERMINAL_STAGES.includes(selectedStage as ApplicationStage);

  const handleSubmit = async () => {
    if (!selectedStage) {
      toast.error('Please select a stage');
      return;
    }

    if (reasonRequired && !reason.trim()) {
      toast.error(`Reason required for ${selectedStage} stage`);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateStage({
        clerkId,
        applicationId: application._id,
        newStage: selectedStage as ApplicationStage,
        notes: reason || undefined,
      });

      toast.success(`Application moved to ${selectedStage}`);

      // Reset form
      setSelectedStage('');
      setReason('');

      if (onSuccess) {
        onSuccess(application._id, selectedStage);
      }

      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update stage');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedStage('');
      setReason('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Change Application Stage</DialogTitle>
          <DialogDescription>
            Update the stage for this application
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Application Details */}
          <div className='space-y-2'>
            <div className='text-sm'>
              <span className='font-medium'>{application.company_name}</span>
              <span className='text-muted-foreground'> - {application.position_title}</span>
            </div>
            <div className='text-xs text-muted-foreground'>
              Student: {application.student_name}
            </div>
          </div>

          {/* Current Stage */}
          <div className='space-y-2'>
            <Label>Current Stage</Label>
            <div>
              <Badge variant='secondary' className={getStageColor(currentStage)}>
                {getStageLabel(currentStage)}
              </Badge>
            </div>
          </div>

          {/* New Stage Selection */}
          <div className='space-y-2'>
            <Label htmlFor='stage'>New Stage *</Label>
            {nextStages.length === 0 ? (
              <div className='text-sm text-muted-foreground p-3 bg-muted rounded-md'>
                No transitions available from {currentStage}
              </div>
            ) : (
              <Select value={selectedStage} onValueChange={(value) => setSelectedStage(value as ApplicationStage)}>
                <SelectTrigger id='stage'>
                  <SelectValue placeholder='Select new stage...' />
                </SelectTrigger>
                <SelectContent>
                  {nextStages.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      <div className='flex items-center gap-2'>
                        <ArrowRight className='h-3 w-3 text-muted-foreground' />
                        {getStageLabel(stage)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Reason/Notes */}
          <div className='space-y-2'>
            <Label htmlFor='reason'>
              {reasonRequired ? 'Reason *' : 'Notes (Optional)'}
            </Label>
            {reasonRequired && (
              <div className='flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md mb-2'>
                <AlertCircle className='h-4 w-4 mt-0.5 flex-shrink-0' />
                <span>A reason is required when moving to {selectedStage} stage</span>
              </div>
            )}
            <Textarea
              id='reason'
              placeholder={
                reasonRequired
                  ? `Explain why this application is being marked as ${selectedStage}...`
                  : 'Add optional notes about this stage change...'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
            <p className='text-xs text-muted-foreground'>
              This will be added to the application notes with a timestamp
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedStage || nextStages.length === 0}>
            {isSubmitting ? 'Updating...' : 'Update Stage'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
