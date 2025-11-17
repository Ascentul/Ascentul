'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { getErrorMessage } from '@/lib/errors';
import { Save, Loader2, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Id } from 'convex/_generated/dataModel';

const DATETIME_LOCAL_FORMAT = 'yyyy-MM-dd\'T\'HH:mm';

interface Session {
  _id: Id<'advisor_sessions'>;
  student_id: Id<'users'>;
  title: string;
  session_type: string;
  start_at: number;
  duration_minutes: number;
  location?: string | null;
  meeting_url?: string | null;
  notes?: string | null;
  visibility: string;
  status?: string;
  version: number;
}

interface SessionEditorProps {
  session: Session;
  clerkId: string;
  onSaveSuccess?: () => void;
}

export function SessionEditor({ session, clerkId, onSaveSuccess }: SessionEditorProps) {
  const { toast } = useToast();
  const updateSession = useMutation(api.advisor_sessions_mutations.updateSession);

  // Form state
  const [title, setTitle] = useState(session.title);
  const [sessionType, setSessionType] = useState(session.session_type);
  const [startAt, setStartAt] = useState(
    format(new Date(session.start_at), DATETIME_LOCAL_FORMAT)
  );
  const [durationMinutes, setDurationMinutes] = useState(
    session.duration_minutes.toString()
  );
  const [location, setLocation] = useState(session.location || '');
  const [meetingUrl, setMeetingUrl] = useState(session.meeting_url || '');
  const [notes, setNotes] = useState(session.notes || '');
  const [visibility, setVisibility] = useState(session.visibility);
  const [status, setStatus] = useState(session.status || 'scheduled');

  // Autosave state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState(session.version);

  // Sync form state when session updates
  useEffect(() => {
    setTitle(session.title);
    setSessionType(session.session_type);
    setStartAt(format(new Date(session.start_at), DATETIME_LOCAL_FORMAT));
    setDurationMinutes(session.duration_minutes.toString());
    setLocation(session.location || '');
    setMeetingUrl(session.meeting_url || '');
    setNotes(session.notes || '');
    setVisibility(session.visibility);
    setStatus(session.status || 'scheduled');
    setCurrentVersion(session.version);
    setHasUnsavedChanges(false);
  }, [session._id, session.version]);

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track if any field has changed
  useEffect(() => {
    const changed =
      title !== session.title ||
      sessionType !== session.session_type ||
      startAt !== format(new Date(session.start_at), DATETIME_LOCAL_FORMAT) ||
      durationMinutes !== session.duration_minutes.toString() ||
      location !== (session.location || '') ||
      meetingUrl !== (session.meeting_url || '') ||
      notes !== (session.notes || '') ||
      visibility !== session.visibility ||
      status !== (session.status || 'scheduled');

    setHasUnsavedChanges(changed);
  }, [
    title,
    sessionType,
    startAt,
    durationMinutes,
    location,
    meetingUrl,
    notes,
    visibility,
    status,
    session,
  ]);

  // Autosave function
  const saveChanges = useCallback(async () => {
    if (!hasUnsavedChanges || isSaving) return false;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Validate inputs before saving
      if (!title.trim()) {
        throw new Error('Title is required');
      }

      const parsedDuration = parseInt(durationMinutes, 10);
      if (isNaN(parsedDuration) || parsedDuration < 1) {
        throw new Error('Duration must be a valid positive number');
      }

      const startTimestamp = new Date(startAt).getTime();
      if (isNaN(startTimestamp)) {
        throw new Error('Invalid date/time format');
      }

      const result = await updateSession({
        clerkId,
        session_id: session._id,
        title: title.trim(),
        session_type: sessionType,
        start_at: startTimestamp,
        duration_minutes: parsedDuration,
        location: location.trim() || undefined,
        meeting_url: meetingUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        visibility,
        status,
        version: currentVersion,
      });

      setCurrentVersion(result.version);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      if (onSaveSuccess) {
        try {
          onSaveSuccess();
        } catch (callbackError) {
          console.error('onSaveSuccess callback failed:', callbackError);
        }
      }

      return true;
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      // Check if it's a version conflict
      if (message.includes('version') || message.includes('conflict')) {
        setSaveError('This session was updated elsewhere. Please refresh to see the latest version.');
        toast({
          title: 'Version conflict',
          description: 'Please refresh the page to see the latest changes.',
          variant: 'destructive',
        });
        return false;
      }

      setSaveError(message);
      toast({
        title: 'Save failed',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    hasUnsavedChanges,
    isSaving,
    clerkId,
    session._id,
    title,
    sessionType,
    startAt,
    durationMinutes,
    location,
    meetingUrl,
    notes,
    visibility,
    status,
    currentVersion,
    updateSession,
    toast,
    onSaveSuccess,
  ]);

  // Autosave on change (debounced)
  useEffect(() => {
    if (hasUnsavedChanges) {
      // Clear existing timer
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      // Set new timer (2 seconds debounce)
      autosaveTimerRef.current = setTimeout(() => {
        saveChanges();
      }, 2000);
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      // Save on unmount if there are unsaved changes
      if (hasUnsavedChanges) {
        saveChanges();
      }
    };
  }, [hasUnsavedChanges, saveChanges]);

  // Manual save button
  const handleManualSave = async () => {
    const success = await saveChanges();
    if (success) {
      toast({
        title: 'Saved',
        description: 'Session updated successfully',
      });
    }
  };

  return (
    <div className='space-y-6'>
      {/* Save indicator */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {isSaving ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin text-blue-500' />
              <span className='text-sm text-muted-foreground'>Saving...</span>
            </>
          ) : hasUnsavedChanges ? (
            <>
              <AlertCircle className='h-4 w-4 text-orange-500' />
              <span className='text-sm text-muted-foreground'>Unsaved changes</span>
            </>
          ) : lastSaved ? (
            <>
              <Check className='h-4 w-4 text-green-500' />
              <span className='text-sm text-muted-foreground'>
                Saved {format(lastSaved, 'h:mm a')}
              </span>
            </>
          ) : null}
        </div>

        <Button
          onClick={handleManualSave}
          disabled={!hasUnsavedChanges || isSaving}
          size='sm'
        >
          <Save className='h-4 w-4 mr-2' />
          Save Now
        </Button>
      </div>

      {saveError && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
          <p className='text-sm text-red-800'>{saveError}</p>
        </div>
      )}

      {/* Form fields */}
      <div className='grid gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='title'>Session Title *</Label>
          <Input
            id='title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g., Career Planning Discussion'
            required
          />
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='session_type'>Session Type *</Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger id='session_type'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='1-on-1'>1-on-1 Meeting</SelectItem>
                <SelectItem value='group'>Group Session</SelectItem>
                <SelectItem value='workshop'>Workshop</SelectItem>
                <SelectItem value='virtual'>Virtual Meeting</SelectItem>
                <SelectItem value='phone'>Phone Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='status'>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id='status'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='scheduled'>Scheduled</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
                <SelectItem value='cancelled'>Cancelled</SelectItem>
                <SelectItem value='no-show'>No-Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='start_at'>Start Date & Time *</Label>
            <Input
              id='start_at'
              type='datetime-local'
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='duration'>Duration (minutes) *</Label>
            <Input
              id='duration'
              type='number'
              min='15'
              step='15'
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
            />
          </div>
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='location'>Location</Label>
            <Input
              id='location'
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder='e.g., Room 305, Student Center'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='meeting_url'>Meeting URL</Label>
            <Input
              id='meeting_url'
              type='url'
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder='https://zoom.us/...'
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='visibility'>Visibility</Label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger id='visibility'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='private'>
                Private (Only you can see)
              </SelectItem>
              <SelectItem value='shared'>
                Shared (Visible to student)
              </SelectItem>
              <SelectItem value='team'>
                Team (Visible to all advisors)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='notes'>Session Notes</Label>
          <Textarea
            id='notes'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder='Add notes about the session...'
            rows={6}
          />
        </div>
      </div>

      <div className='flex items-center justify-between pt-4 border-t'>
        <div className='text-xs text-muted-foreground'>
          Version: {currentVersion} • Autosave enabled
        </div>
        <Badge variant='secondary'>
          {hasUnsavedChanges ? 'Editing' : 'Up to date'}
        </Badge>
      </div>
    </div>
  );
}
