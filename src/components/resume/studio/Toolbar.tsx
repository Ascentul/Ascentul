'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Wand2,
  Undo,
  Redo,
  Loader2,
  Target,
} from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';
import { TailorToJobDialog } from '@/app/(studio)/resume/components/TailorToJobDialog';
import { ExportButton } from '@/components/resume/ExportButton';
import { DiffPreviewDialog } from '@/components/resume/DiffPreviewDialog';
import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';

interface ToolbarProps {
  resumeId: Id<'builder_resumes'>;
  blocks: any[];
  onBlocksUpdate: (blocks: any[]) => void;
}

export function Toolbar({ resumeId, blocks, onBlocksUpdate }: ToolbarProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const generateBlocksAction = useAction(api.ai_resume_builder.generateBlocks);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isTidying, setIsTidying] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showTailorDialog, setShowTailorDialog] = useState(false);
  const [showDiffDialog, setShowDiffDialog] = useState(false);

  const [jobDescription, setJobDescription] = useState('');
  const [diffData, setDiffData] = useState<{original: any[], improved: any[]} | null>(null);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);

  const handleGenerateWithAI = async () => {
    if (!jobDescription.trim() || !user?.id) return;

    setIsGenerating(true);
    try {
      const result = await generateBlocksAction({
        clerkId: user.id,
        resumeId,
        jobDescription: jobDescription.trim(),
        clearExisting: true,
      });

      if (result.success) {
        toast({
          title: 'Resume generated!',
          description: `Created ${result.blocksCreated} blocks using AI.`,
          variant: 'default',
        });
        setShowGenerateDialog(false);
        setJobDescription(''); // Reset form
        // Note: onBlocksUpdate not needed - Convex subscription will auto-update
      } else {
        toast({
          title: 'Generation failed',
          description: result.error || 'An error occurred during generation.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Failed to generate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate resume blocks.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoTidy = async () => {
    setIsTidying(true);
    try {
      const response = await fetch('/api/resume/auto-tidy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Tidy failed');
      }

      const data = await response.json();

      if (data.success && data.improvedBlocks) {
        // Show diff preview instead of auto-applying
        setDiffData({
          original: data.originalBlocks || blocks,
          improved: data.improvedBlocks,
        });
        setShowDiffDialog(true);
      }
    } catch (error) {
      console.error('Failed to tidy:', error);
      // TODO: Show error toast/notification to user
    } finally {
      setIsTidying(false);
    }
  };

  const handleApplyChanges = () => {
    if (!diffData) return;

    setIsApplyingChanges(true);
    // Apply the improved blocks
    onBlocksUpdate(diffData.improved);
    setShowDiffDialog(false);
    setDiffData(null);
    setIsApplyingChanges(false);
  };

  const handleCancelChanges = () => {
    setShowDiffDialog(false);
    setDiffData(null);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Generate with AI */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Resume with AI</DialogTitle>
            <DialogDescription>
              Paste a job description and AI will create tailored resume blocks for you
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description *</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the full job description here... Include required skills, responsibilities, and qualifications."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={10}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                AI will analyze the job description and generate resume blocks from your profile data
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateWithAI}
              disabled={!jobDescription.trim() || isGenerating || !user?.id}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Resume'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tailor to Job */}
      <TailorToJobDialog
        open={showTailorDialog}
        onOpenChange={setShowTailorDialog}
        resumeId={resumeId}
        currentBlocks={blocks}
        onAccept={onBlocksUpdate}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowTailorDialog(true)}
        className="gap-2"
      >
        <Target className="w-4 h-4" />
        Tailor to Job
      </Button>

      {/* Auto Tidy */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAutoTidy}
        disabled={isTidying}
        className="gap-2"
      >
        {isTidying ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        Auto Tidy
      </Button>

      {/* Export */}
      <ExportButton resumeId={resumeId} variant="outline" size="sm" />

      {/* Undo/Redo (placeholder - would need state management) */}
      <div className="flex border rounded-md">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none">
          <Undo className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none border-l">
          <Redo className="w-3 h-3" />
        </Button>
      </div>

      {/* Diff Preview Dialog */}
      {diffData && (
        <DiffPreviewDialog
          open={showDiffDialog}
          onOpenChange={setShowDiffDialog}
          originalBlocks={diffData.original}
          improvedBlocks={diffData.improved}
          onApply={handleApplyChanges}
          onCancel={handleCancelChanges}
          isApplying={isApplyingChanges}
        />
      )}
    </div>
  );
}
