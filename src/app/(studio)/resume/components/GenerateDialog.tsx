'use client';

import { useState } from 'react';
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

  const handleClose = () => {
    setTargetRole('');
    setTargetCompany('');
    setError(null);
    setLoading(false);
    onOpenChange(false);
  };

  const handleGenerate = async () => {
    if (!targetRole.trim()) return;

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
      onAccept(result.blocks);
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate resume'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
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

          <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-900 text-sm">
            <strong>Note:</strong> This will replace all current content with AI-generated content based on your career profile.
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={loading || !targetRole.trim()}
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
