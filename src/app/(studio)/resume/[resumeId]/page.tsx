'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { useUser } from '@clerk/nextjs';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ResumeCanvas } from '@/components/resume/studio/ResumeCanvas';
import { Toolbar } from '@/components/resume/studio/Toolbar';
import { LeftSidebar } from '@/components/resume/studio/LeftSidebar';
import { RightInspector } from '@/components/resume/studio/RightInspector';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, Save, Loader2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PageSize } from '@/lib/resume-layout';

export default function ResumeStudioPage() {
  const params = useParams();
  const resumeId = params.resumeId as string;
  const { toast } = useToast();
  const { user } = useUser();

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightInspectorOpen, setIsRightInspectorOpen] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Layout settings
  const [isCompact, setIsCompact] = useState(false);
  const [pageSize, setPageSize] = useState<PageSize>('Letter');
  const [baseline, setBaseline] = useState<4 | 6>(4);

  // Fetch resume data
  const resumeData = useQuery(
    api.builder_resumes.getResume,
    resumeId && user?.id
      ? { id: resumeId as Id<"builder_resumes">, clerkId: user.id }
      : "skip"
  );

  // Local state for blocks (for real-time editing before saving)
  const [localBlocks, setLocalBlocks] = useState<any[]>([]);

  useEffect(() => {
    if (resumeData?.blocks) {
      setLocalBlocks(resumeData.blocks);
    }
  }, [resumeData?.blocks]);

  const handleBlockUpdate = (blockId: string, updates: any) => {
    setLocalBlocks((prev) =>
      prev.map((block) =>
        block._id === blockId ? { ...block, ...updates } : block
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleBlockReorder = (newBlocks: any[]) => {
    setLocalBlocks(newBlocks);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save blocks via API
      const response = await fetch('/api/resume/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          blocks: localBlocks.map((block, index) => ({
            id: block._id,
            type: block.type,
            data: block.data,
            order: index,
            locked: block.locked,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      setHasUnsavedChanges(false);
      toast({
        title: 'Saved',
        description: 'Your resume has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectBlock = (blockId: string | null) => {
    setSelectedBlockId(blockId);
    if (blockId && !isRightInspectorOpen) {
      setIsRightInspectorOpen(true);
    }
  };

  const selectedBlock = localBlocks.find((b) => b._id === selectedBlockId);

  if (!resumeData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-muted/20">
      {/* Toolbar */}
      <div className="border-b bg-background">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{resumeData.resume.title}</h1>
            {hasUnsavedChanges && (
              <span className="text-xs text-muted-foreground">(unsaved)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Layout Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Layout
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-3 space-y-4">
                  {/* Compact Mode */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compact-mode" className="text-sm">
                      Compact Mode
                    </Label>
                    <Switch
                      id="compact-mode"
                      checked={isCompact}
                      onCheckedChange={setIsCompact}
                    />
                  </div>

                  {/* Page Size */}
                  <div className="space-y-2">
                    <Label className="text-sm">Page Size</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={pageSize === 'Letter' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPageSize('Letter')}
                        className="flex-1"
                      >
                        Letter
                      </Button>
                      <Button
                        variant={pageSize === 'A4' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPageSize('A4')}
                        className="flex-1"
                      >
                        A4
                      </Button>
                    </div>
                  </div>

                  {/* Baseline Grid */}
                  <div className="space-y-2">
                    <Label className="text-sm">Baseline Grid</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={baseline === 4 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBaseline(4)}
                        className="flex-1"
                      >
                        4px
                      </Button>
                      <Button
                        variant={baseline === 6 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBaseline(6)}
                        className="flex-1"
                      >
                        6px
                      </Button>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Toolbar
              resumeId={resumeId as any}
              blocks={localBlocks}
              onBlocksUpdate={setLocalBlocks}
            />
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div
          className={`border-r bg-background transition-all duration-300 ${
            isLeftSidebarOpen ? 'w-80' : 'w-0'
          } overflow-hidden`}
        >
          {isLeftSidebarOpen && (
            <LeftSidebar
              resume={resumeData.resume}
              blocks={localBlocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={handleSelectBlock}
              onBlocksReorder={handleBlockReorder}
            />
          )}
        </div>

        {/* Toggle Left Sidebar */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-l-none"
          onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        >
          {isLeftSidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col overflow-auto bg-muted/20">
          <div className="flex-1 p-8">
            <ResumeCanvas
              blocks={localBlocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={handleSelectBlock}
              onBlockUpdate={handleBlockUpdate}
              onBlocksReorder={handleBlockReorder}
              template={resumeData.resume.templateSlug}
              isCompact={isCompact}
              pageSize={pageSize}
              baseline={baseline}
            />
          </div>
        </div>

        {/* Toggle Right Inspector */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-r-none"
          onClick={() => setIsRightInspectorOpen(!isRightInspectorOpen)}
        >
          {isRightInspectorOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>

        {/* Right Inspector */}
        <div
          className={`border-l bg-background transition-all duration-300 ${
            isRightInspectorOpen ? 'w-80' : 'w-0'
          } overflow-hidden`}
        >
          {isRightInspectorOpen && (
            <RightInspector
              block={selectedBlock}
              onBlockUpdate={(updates) =>
                selectedBlockId && handleBlockUpdate(selectedBlockId, updates)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
