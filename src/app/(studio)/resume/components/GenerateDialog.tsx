'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import type { Id } from '../../../../../convex/_generated/dataModel';
import type { ResumeBlock } from '@/lib/validators/resume';

interface GenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: Id<'builder_resumes'>;
  onAccept: (generatedBlocks: ResumeBlock[]) => void;
}

export function GenerateDialog({
  open,
  onOpenChange,
  resumeId,
  onAccept,
}: GenerateDialogProps) {
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: abort pending requests on component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const abortPendingRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleClose = () => {
    abortPendingRequest();
    setTargetRole('');
    setTargetCompany('');
    setError(null);
    setConfirmed(false);
    setLoading(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    abortPendingRequest();
    setLoading(false);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!targetRole.trim()) return;

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          targetRole: targetRole.trim(),
          targetCompany: targetCompany.trim() || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate resume';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response body is not JSON, use default message
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (!result.blocks || !Array.isArray(result.blocks)) {
        throw new Error('Invalid response format from server');
      }
      onAccept(result.blocks);
      handleClose();
    } catch (err) {
      // Don't show error if user cancelled the request
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate resume'
      );
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Resume Content</DialogTitle>
          <DialogDescription>
            AI will generate resume content from your profile based on the target role
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-role">
              Target Role <span className="text-red-500">*</span>
            </Label>
            <Input
              id="target-role"
              placeholder="e.g., Senior Software Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-company">
              Target Company <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="target-company"
              placeholder="e.g., Google"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            <strong>Warning:</strong> This will replace all current resume content with AI-generated content based on your career profile. This action cannot be undone. Consider exporting your current resume before proceeding.
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="confirm-replace"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              disabled={loading}
            />
            <label
              htmlFor="confirm-replace"
              className="text-sm leading-relaxed cursor-pointer select-none"
            >
              I understand this will replace my current resume content
            </label>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          {loading ? (
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Cancel Request
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Close
            </Button>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading || !targetRole.trim() || !confirmed}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Resume'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
