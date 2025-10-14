'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { useUser, useAuth } from '@clerk/nextjs';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import type { Block } from '@/lib/resume-types';
import { Layers } from '../components/Layers';
import { BlockInspector } from '../components/BlockInspector';
import { ThemePanel } from '../components/ThemePanel';
import { TemplatePicker } from '../components/TemplatePicker';
import { Sidebar } from '../components/Sidebar';
import { PageControls } from '../components/PageControls';
import { AIActionsToolbar } from '../components/AIActionsToolbar';
import { HeaderBlock } from '../components/blocks/HeaderBlock';
import { SummaryBlock } from '../components/blocks/SummaryBlock';
import { ExperienceBlock } from '../components/blocks/ExperienceBlock';
import { EducationBlock } from '../components/blocks/EducationBlock';
import { SkillsBlock } from '../components/blocks/SkillsBlock';
import { ProjectsBlock } from '../components/blocks/ProjectsBlock';
import { CustomBlock } from '../components/blocks/CustomBlock';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, Loader2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ResumeBlock } from '@/lib/validators/resume';
import { useClerkReady } from '@/hooks/useClerkReady';

export default function ResumeStudioPage() {
  const params = useParams();
  const resumeId = params.resumeId as string;
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { ready: clerkReady, timedOut: clerkTimedOut, isSignedIn } = useClerkReady();
  const { user } = useUser();
  const canvasScrollRef = useRef<HTMLDivElement>(null);
  const handleAuthReset = useCallback(() => {
    void signOut({ redirectUrl: '/sign-in' });
  }, [signOut]);

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightInspectorOpen, setIsRightInspectorOpen] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'layers' | 'themes' | 'templates'>('layers');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [isUpdatingMeta, setIsUpdatingMeta] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Layout settings
  const [isCompact, setIsCompact] = useState(false);
  const [pageSize, setPageSize] = useState<'Letter' | 'A4'>('Letter');
  const [baseline, setBaseline] = useState<4 | 6>(4);

  // Local state for template and theme
  const [localTemplateSlug, setLocalTemplateSlug] = useState<string | undefined>();
  const [localThemeId, setLocalThemeId] = useState<Id<"builder_resume_themes"> | undefined>();
  const [localUpdatedAt, setLocalUpdatedAt] = useState<number>(0);

  const canLoadData = clerkReady && !!user?.id && !!resumeId;

  // Fetch resume data
  const resumeData = useQuery(
    api.builder_resumes_v2.get,
    canLoadData
      ? { id: resumeId as Id<"builder_resumes">, clerkId: user.id }
      : "skip"
  );

  // Mutation for updating resume metadata
  const updateResumeMeta = useMutation(api.resumes.updateResumeMeta);

  // Mutation for inserting blocks
  const createBlock = useMutation(api.builder_blocks.create);

  // Mutation for reordering blocks
  const reorderBlocks = useMutation(api.builder_blocks.reorder);

  // Local state for blocks
  const [localBlocks, setLocalBlocks] = useState<Block[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Type guard for Convex error responses
  const isConvexError = (value: unknown): value is { error: { status?: number } } => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'error' in value &&
      typeof (value as { error: unknown }).error === 'object' &&
      (value as { error: unknown }).error !== null &&
      ('status' in (value as { error: unknown }).error === false ||
       typeof (value as { error: { status: unknown } }).error.status === 'number')
    );
  };

  // Sync local state when resume data loads
  useEffect(() => {
    if (!canLoadData) {
      setLoadError(null);
      return;
    }

    if (resumeData === undefined) {
      return;
    }

    // Check for Convex error responses with proper type checking
    if (isConvexError(resumeData)) {
      const status = resumeData.error.status;
      if (status === 401 || status === 403) {
        setLoadError('You do not have permission to view this resume. Please sign in again.');
        return;
      }
    }

    if (resumeData === null) {
      setLoadError('This resume could not be found or you no longer have access.');
      return;
    }

    setLoadError(null);
  }, [canLoadData, resumeData]);

  // Sync local state when resume data loads
  useEffect(() => {
    if (!canLoadData || !resumeData || loadError) return;

    if (resumeData?.resume) {
      setLocalTemplateSlug(resumeData.resume.templateSlug);
      setLocalThemeId(resumeData.resume.themeId);
      setLocalUpdatedAt(resumeData.resume.updatedAt);
    }
    if (resumeData?.blocks) {
      setLocalBlocks(resumeData.blocks as Block[]);
    }
  }, [canLoadData, resumeData, loadError]);

  if (!clerkReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center text-muted-foreground">
        {clerkTimedOut ? (
          <>
            <p className="text-sm text-foreground">Auth is taking longer than expected.</p>
            <p className="text-xs">
              Please try signing out and back in to refresh your session.
            </p>
            <Button variant="outline" onClick={handleAuthReset}>
              Sign out
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Preparing your editor…</p>
          </>
        )}
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center text-muted-foreground">
        <p className="text-sm text-foreground">You must be signed in to access this page.</p>
        <Button variant="outline" onClick={handleAuthReset}>
          Sign in
        </Button>
      </div>
    );
  }

  if (!canLoadData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Connecting to your workspace…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="space-y-3">
          <p className="text-base font-semibold text-foreground">{loadError}</p>
          <p className="text-sm text-muted-foreground">
            If this is unexpected, try signing out and back in.
          </p>
        </div>
        <Button variant="outline" onClick={handleAuthReset}>
          Sign out
        </Button>
      </div>
    );
  }

  const isFetching = canLoadData && resumeData === undefined;

  if (isFetching) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Loading your resume…</p>
      </div>
    );
  }

  // Scroll canvas to top when resumeId, template, or theme changes
  useEffect(() => {
    if (canvasScrollRef.current) {
      canvasScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [resumeId, localTemplateSlug, localThemeId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === 't') {
        e.preventDefault();
        setActiveTab('templates');
      } else if (isMod && e.key === 'h') {
        e.preventDefault();
        setActiveTab('themes');
      } else if (isMod && e.key === 'l') {
        e.preventDefault();
        setActiveTab('layers');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedBlockId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectBlock = (blockId: string | null) => {
    setSelectedBlockId(blockId);
    if (blockId && !isRightInspectorOpen) {
      setIsRightInspectorOpen(true);
    }
  };

  const renderBlockContent = (block: Block): ReactNode => {
    const isSelected = selectedBlockId === block._id;
    const commonProps = {
      data: block.data,
      isSelected,
      blockId: block._id,
    };

    switch (block.type) {
      case 'header':
        return <HeaderBlock {...commonProps} />;
      case 'summary':
        return <SummaryBlock {...commonProps} />;
      case 'experience':
        return <ExperienceBlock {...commonProps} />;
      case 'education':
        return <EducationBlock {...commonProps} />;
      case 'skills':
        return <SkillsBlock {...commonProps} />;
      case 'projects':
        return <ProjectsBlock {...commonProps} />;
      case 'custom':
        return <CustomBlock {...commonProps} />;
      default:
        // Exhaustiveness check: will cause compile error if new block type is added but not handled
        const _exhaustiveCheck: never = block.type;
        console.warn(`Unknown block type: ${block.type}`);
        return null;
    }
  };

  const handleBlockReorder = useCallback(async (newBlocks: Block[]) => {
    if (!user?.id) return;

    // Store previous state for rollback
    const previousBlocks = localBlocks;

    // Update local state immediately
    setLocalBlocks(newBlocks);

    // Save to server
    try {
      const orders = newBlocks.map((block, index) => ({
        id: block._id,
        order: index,
      }));

      await reorderBlocks({
        resumeId: resumeId as Id<"builder_resumes">,
        clerkId: user.id,
        orders,
        expectedResumeUpdatedAt: localUpdatedAt,
      });
    } catch (error) {
      console.error('Failed to save block order:', error);
      // Rollback to previous state
      setLocalBlocks(previousBlocks);
      toast({
        title: 'Error',
        description: 'Failed to save block order. Changes have been reverted.',
        variant: 'destructive',
      });
    }
  }, [user?.id, resumeId, localUpdatedAt, localBlocks, reorderBlocks, toast]);

  const handleResumeUpdatedAtChange = (newUpdatedAt: number) => {
    setLocalUpdatedAt(newUpdatedAt);
  };

  // Handle AI-generated blocks update
  const handleAIBlocksUpdate = useCallback(async (newBlocks: ResumeBlock[]) => {
    if (!user?.id) return;

    // Store previous state for rollback
    const previousBlocks = localBlocks;

    // Update local state immediately (optimistic update)
    setLocalBlocks(newBlocks as Block[]);

    // TODO: Save to server by updating all blocks
    // For now, we just update local state
    // In production, you'd want to batch update all blocks via a mutation

    toast({
      title: 'Success',
      description: 'Resume updated successfully',
    });
  }, [user?.id, localBlocks, toast]);

  // Handler for theme change
  const handleChangeTheme = useCallback(async (themeId: Id<"builder_resume_themes">) => {
    if (!user?.id || !resumeId) return;
    setIsUpdatingMeta(true);
    try {
      const result = await updateResumeMeta({
        clerkId: user.id,
        id: resumeId as Id<"builder_resumes">,
        themeId,
        expectedUpdatedAt: localUpdatedAt,
      });

      setLocalThemeId(result.themeId);
      setLocalUpdatedAt(result.updatedAt);

      toast({
        title: 'Theme updated',
        description: 'Your resume theme has been changed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update theme.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingMeta(false);
    }
  }, [user?.id, resumeId, localUpdatedAt, updateResumeMeta, toast]);

  // Handler for template change
  const handleChangeTemplate = useCallback(async (slug: string) => {
    if (!user?.id || !resumeId) return;
    setIsUpdatingMeta(true);
    try {
      const result = await updateResumeMeta({
        clerkId: user.id,
        id: resumeId as Id<"builder_resumes">,
        templateSlug: slug,
        expectedUpdatedAt: localUpdatedAt,
      });

      setLocalTemplateSlug(result.templateSlug);
      setLocalUpdatedAt(result.updatedAt);

      toast({
        title: 'Template updated',
        description: 'Your resume template has been changed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update template.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingMeta(false);
    }
  }, [user?.id, resumeId, localUpdatedAt, updateResumeMeta, toast]);

  // Handler for inserting a starter section
  const handleInsertStarterSection = useCallback(async () => {
    if (!user?.id) return;
    setIsInserting(true);
    try {
      await createBlock({
        clerkId: user.id,
        resumeId: resumeId as Id<"builder_resumes">,
        type: "summary",
        data: { paragraph: "Add a short professional summary here." },
        order: 0,
        locked: false,
      });
      toast({
        title: 'Success',
        description: 'Starter section added to your resume.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add starter section.',
        variant: 'destructive',
      });
    } finally {
      setIsInserting(false);
    }
  }, [user?.id, createBlock, resumeId, toast]);

  // Handler for AI generation
  const handleGenerateWithAI = useCallback(async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: resumeId as Id<"builder_resumes">,
          targetRole: 'Professional',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate resume');
      }

      toast({
        title: 'Success',
        description: `Generated ${result.blocksGenerated || 'starter'} sections`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate resume',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [resumeId, toast]);

  // Page control handlers
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const handleDuplicatePage = useCallback(async () => {
    if (!user?.id) return;

    // NOTE: This is a simplified approximation that divides blocks evenly across pages.
    // In reality, page breaks depend on actual content height and layout rendering.
    // TODO: Implement proper page break detection based on rendered content.
    const blocksPerPage = Math.ceil(localBlocks.length / totalPages);
    const startIndex = (currentPage - 1) * blocksPerPage;
    const endIndex = Math.min(startIndex + blocksPerPage, localBlocks.length);
    const pageBlocks = localBlocks.slice(startIndex, endIndex);

    if (pageBlocks.length === 0) return;

    try {
      // Insert duplicates after the current page blocks concurrently
      await Promise.all(
        pageBlocks.map((block, i) =>
          createBlock({
            clerkId: user.id,
            resumeId: resumeId as Id<"builder_resumes">,
            type: block.type as Block['type'],
            data: block.data,
            order: endIndex + i,
            locked: false,
          })
        )
      );

      toast({
        title: 'Success',
        description: `Duplicated ${pageBlocks.length} blocks`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate page',
        variant: 'destructive',
      });
    }
  }, [user?.id, resumeId, currentPage, totalPages, localBlocks, createBlock, toast]);

  const handleAddSection = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Add a custom section block at the end
      const maxOrder = localBlocks.length > 0
        ? Math.max(...localBlocks.map(b => b.order || 0))
        : 0;

      await createBlock({
        clerkId: user.id,
        resumeId: resumeId as Id<"builder_resumes">,
        type: 'custom',
        data: { heading: 'New Section', items: [] },
        order: maxOrder + 1,
        locked: false,
      });

      toast({
        title: 'Success',
        description: 'Added new section',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add section',
        variant: 'destructive',
      });
    }
  }, [user?.id, resumeId, localBlocks, createBlock, toast]);

  const selectedBlock = localBlocks.find((b) => b._id === selectedBlockId) || null;

  // Loading state
  if (!resumeData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state - no sections yet
  if (localBlocks.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-muted/20">
        <div className="p-8 space-y-4 text-center max-w-md">
          <p className="text-base text-muted-foreground">
            This resume has no sections yet.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleInsertStarterSection}
              disabled={isInserting}
              variant="outline"
              className="gap-2"
            >
              {isInserting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Inserting...</span>
                </>
              ) : (
                <span>Insert starter section</span>
              )}
            </Button>
            <Button
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <span>Generate with AI</span>
              )}
            </Button>
          </div>
        </div>
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
            {isUpdatingMeta && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* AI Actions */}
            <AIActionsToolbar
              resumeId={resumeId as Id<"builder_resumes">}
              currentBlocks={localBlocks as ResumeBlock[]}
              onBlocksUpdate={handleAIBlocksUpdate}
              disabled={isUpdatingMeta}
              onError={(error) => {
                toast({
                  title: 'Error',
                  description: error,
                  variant: 'destructive',
                });
              }}
              onSuccess={(message) => {
                toast({
                  title: 'Success',
                  description: message,
                });
              }}
            />

            {/* Layout Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-0 gap-2">
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Layout</span>
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
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div
          className={`transition-all duration-300 ${
            isLeftSidebarOpen ? 'w-80' : 'w-0'
          } overflow-hidden`}
        >
          {isLeftSidebarOpen && (
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab}>
              {activeTab === 'layers' && (
                <Layers
                  blocks={localBlocks}
                  selectedBlockId={selectedBlockId}
                  onSelect={handleSelectBlock}
                  onReorder={handleBlockReorder}
                />
              )}
              {activeTab === 'themes' && (
                <ThemePanel
                  currentThemeId={localThemeId}
                  onChangeTheme={handleChangeTheme}
                  disabled={isUpdatingMeta}
                />
              )}
              {activeTab === 'templates' && (
                <TemplatePicker
                  currentTemplateSlug={localTemplateSlug}
                  onChangeTemplate={handleChangeTemplate}
                  disabled={isUpdatingMeta}
                />
              )}
            </Sidebar>
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
        <div
          ref={canvasScrollRef}
          className="flex-1 h-[calc(100vh-64px)] overflow-auto bg-muted/20 px-8 pt-8 relative"
        >
          {/* Loading Overlay */}
          {isUpdatingMeta && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm font-medium">Applying changes...</p>
              </div>
            </div>
          )}

          <div className="relative mx-auto my-8 shadow-xl bg-white transition-opacity duration-200" style={{ width: '8.5in', minHeight: '11in', opacity: isUpdatingMeta ? 0.5 : 1 }}>
            {/* Render blocks with click-to-select */}
            <div className="p-12 space-y-6">
              {(() => {
                // Filter blocks for current page
                const blocksPerPage = Math.ceil(localBlocks.length / totalPages);
                const startIndex = (currentPage - 1) * blocksPerPage;
                const endIndex = Math.min(startIndex + blocksPerPage, localBlocks.length);
                const currentPageBlocks = localBlocks.slice(startIndex, endIndex);

                return currentPageBlocks.map((block) => (
                    <button
                      key={block._id}
                      onClick={() => handleSelectBlock(block._id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedBlockId === block._id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 shadow-md scale-[1.01]'
                          : 'border-transparent hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                      } focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                      aria-selected={selectedBlockId === block._id}
                    >
                      <div className="text-sm font-medium text-gray-500 mb-2">
                        {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
                      </div>
                      <div className="space-y-2">
                        {renderBlockContent(block)}
                      </div>
                    </button>
                ));
              })()}
            </div>
          </div>

          {/* Page Controls */}
          <PageControls
            page={currentPage}
            total={totalPages}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
            onDuplicate={handleDuplicatePage}
            onAddSection={handleAddSection}
          />
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
          {isRightInspectorOpen && user?.id && (
            <BlockInspector
              block={selectedBlock}
              clerkId={user.id}
              resumeUpdatedAt={localUpdatedAt}
              onUpdate={handleResumeUpdatedAtChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
