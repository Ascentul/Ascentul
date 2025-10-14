'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Sparkles, Loader2, Wand2, FileEdit, Zap } from 'lucide-react';
import type { Id } from '../../../../../convex/_generated/dataModel';
import type { ResumeBlock } from '@/lib/validators/resume';
import { TailorToJobDialog } from './TailorToJobDialog';
import { GenerateDialog } from './GenerateDialog';

// Timeout for AI operations (30 seconds)
const TIDY_REQUEST_TIMEOUT_MS = 30000;

interface AIActionsToolbarProps {
  resumeId: Id<'builder_resumes'>;
  currentBlocks: ResumeBlock[];
  onBlocksUpdate: (blocks: ResumeBlock[]) => void;
  disabled?: boolean;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

type AIAction = 'generate' | 'tailor' | 'tidy';

export function AIActionsToolbar({
  resumeId,
  currentBlocks,
  onBlocksUpdate,
  disabled = false,
  onError,
  onSuccess,
}: AIActionsToolbarProps) {
  const [loading, setLoading] = useState<AIAction | null>(null);
  const [showTailorDialog, setShowTailorDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  const handleGenerate = () => {
    setShowGenerateDialog(true);
  };

  const handleTailor = () => {
    setShowTailorDialog(true);
  };

  const handleTidy = async () => {
    if (!currentBlocks || currentBlocks.length === 0) {
      onError?.('No blocks to tidy. Add some content first.');
      return;
    }

    setLoading('tidy');
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), TIDY_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch('/api/resume/tidy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          currentBlocks,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to tidy resume');
      }

      const result = await response.json();
      clearTimeout(timeoutId);

      // Validate response structure
      if (!result.blocks || !Array.isArray(result.blocks)) {
        throw new Error('Invalid response format from server');
      }

      // Update blocks with tidied content
      onBlocksUpdate(result.blocks);
      const count = result.count ?? result.blocks.length;
      onSuccess?.(`Tidied ${count} ${count === 1 ? 'block' : 'blocks'} successfully!`);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        onError?.('Request timed out. Please try again.');
        return;
      }
      console.error('Tidy error:', error);
      onError?.(error.message || 'Failed to tidy resume. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;
  const isDisabled = disabled || isLoading;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* AI Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isDisabled}
              className="gap-2 transition-all hover:shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="capitalize">{loading}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>AI Actions</span>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={handleGenerate}
              disabled={isDisabled}
              className="gap-2 cursor-pointer"
            >
              <Wand2 className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Generate Content</span>
                <span className="text-xs text-muted-foreground">
                  Create resume from profile
                </span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleTailor}
              disabled={isDisabled || currentBlocks.length === 0}
              className="gap-2 cursor-pointer"
            >
              <FileEdit className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Tailor to Job</span>
                <span className="text-xs text-muted-foreground">
                  Customize for job posting
                </span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleTidy}
              disabled={isDisabled || currentBlocks.length === 0}
              className="gap-2 cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Tidy & Improve</span>
                <span className="text-xs text-muted-foreground">
                  Enhance clarity and impact
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Tidy Button (Alternative - always visible) */}
        {/* <Button
          variant="outline"
          size="sm"
          onClick={handleTidy}
          disabled={isDisabled || currentBlocks.length === 0}
          className="gap-2"
        >
          {loading === 'tidy' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Tidying...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              <span>Tidy</span>
            </>
          )}
        </Button> */}
      </div>

      {/* Generate Dialog */}
      <GenerateDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        resumeId={resumeId}
        onAccept={(generatedBlocks) => {
          onBlocksUpdate(generatedBlocks);
          onSuccess?.('Resume generated successfully!');
        }}
      />

      {/* Tailor to Job Dialog */}
      <TailorToJobDialog
        open={showTailorDialog}
        onOpenChange={setShowTailorDialog}
        resumeId={resumeId}
        currentBlocks={currentBlocks}
        onAccept={(tailoredBlocks) => {
          onBlocksUpdate(tailoredBlocks);
          onSuccess?.('Resume tailored successfully!');
        }}
      />
    </>
  );
}
