'use client';

/**
 * SnoozeDialog - Dialog for snoozing follow-ups to a new date
 *
 * Provides quick presets (Tomorrow, Next Week, Next Month) and
 * a calendar picker for custom dates.
 */

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
import { Calendar } from '@/components/ui/calendar';
import { addDays, addWeeks, addMonths, startOfDay, format } from 'date-fns';
import { Clock, CalendarDays } from 'lucide-react';
import type { Id } from 'convex/_generated/dataModel';

interface SnoozeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followUpId: Id<'follow_ups'> | null;
  followUpTitle?: string;
  onSnooze: (followUpId: Id<'follow_ups'>, newDate: number) => Promise<void>;
}

export function SnoozeDialog({
  open,
  onOpenChange,
  followUpId,
  followUpTitle,
  onSnooze,
}: SnoozeDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleSnooze = async (date: Date) => {
    if (!followUpId) return;

    setIsSubmitting(true);
    try {
      // Set to start of day for the selected date
      const newDueDate = startOfDay(date).getTime();
      await onSnooze(followUpId, newDueDate);
      onOpenChange(false);
      setShowCalendar(false);
      setSelectedDate(undefined);
    } catch (error) {
      // Error handling delegated to parent via onSnooze - parent should show toast
      // Log for debugging but don't close dialog so user can retry
      console.error('Failed to snooze follow-up:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Quick snooze delegates to handleSnooze without awaiting.
   * The isSubmitting state provides immediate UI feedback while the async
   * operation completes. handleSnooze manages error handling (keeps dialog
   * open on failure) and state cleanup.
   */
  const handleQuickSnooze = (date: Date) => {
    handleSnooze(date);
  };

  const handleCustomSnooze = () => {
    if (selectedDate) {
      handleSnooze(selectedDate);
    }
  };

  const tomorrow = addDays(new Date(), 1);
  const nextWeek = addWeeks(new Date(), 1);
  const nextMonth = addMonths(new Date(), 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Snooze Follow-up
          </DialogTitle>
          <DialogDescription>
            {followUpTitle ? (
              <>Reschedule &ldquo;{followUpTitle}&rdquo; to a new date.</>
            ) : (
              <>Choose when you&apos;d like to be reminded about this follow-up.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Quick Presets */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Quick Options</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSnooze(tomorrow)}
                disabled={isSubmitting}
                className="flex flex-col h-auto py-2"
              >
                <span className="font-medium">Tomorrow</span>
                <span className="text-xs text-muted-foreground">
                  {format(tomorrow, 'MMM d')}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSnooze(nextWeek)}
                disabled={isSubmitting}
                className="flex flex-col h-auto py-2"
              >
                <span className="font-medium">Next Week</span>
                <span className="text-xs text-muted-foreground">
                  {format(nextWeek, 'MMM d')}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSnooze(nextMonth)}
                disabled={isSubmitting}
                className="flex flex-col h-auto py-2"
              >
                <span className="font-medium">Next Month</span>
                <span className="text-xs text-muted-foreground">
                  {format(nextMonth, 'MMM d')}
                </span>
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Custom Date */}
          {!showCalendar ? (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowCalendar(true)}
              disabled={isSubmitting}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Pick a specific date
            </Button>
          ) : (
            <div className="space-y-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < startOfDay(new Date())}
                initialFocus
              />
              <DialogFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCalendar(false);
                    setSelectedDate(undefined);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCustomSnooze}
                  disabled={!selectedDate || isSubmitting}
                >
                  {isSubmitting ? 'Snoozing...' : `Snooze to ${selectedDate ? format(selectedDate, 'MMM d') : '...'}`}
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
