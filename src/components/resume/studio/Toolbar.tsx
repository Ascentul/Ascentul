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
import { Input } from '@/components/ui/input';
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

interface ToolbarProps {
  resumeId: Id<'builder_resumes'>;
  blocks: any[];
  onBlocksUpdate: (blocks: any[]) => void;
}

export function Toolbar({ resumeId, blocks, onBlocksUpdate }: ToolbarProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTidying, setIsTidying] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showTailorDialog, setShowTailorDialog] = useState(false);
  const [showDiffDialog, setShowDiffDialog] = useState(false);

  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [diffData, setDiffData] = useState<{original: any[], improved: any[]} | null>(null);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);

  const handleGenerateWithAI = async () => {
    if (!targetRole) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          targetRole,
          targetCompany,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      onBlocksUpdate(data.blocks);
      setShowGenerateDialog(false);
    } catch (error) {
      console.error('Failed to generate:', error);
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
              Let AI help you create a tailored resume for your target role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Target Role *</Label>
              <Input
                id="role"
                placeholder="e.g., Senior Software Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Target Company (Optional)</Label>
              <Input
                id="company"
                placeholder="e.g., Google"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
              />
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
              disabled={!targetRole || isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate
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
