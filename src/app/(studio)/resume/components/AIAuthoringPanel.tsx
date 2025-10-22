/**
 * Phase 7 - Part C: AI Authoring Panel (Production)
 * Panel for running AI authoring actions with real streaming and cancel support
 */

'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Wand2, FileEdit, Zap, Languages, Clock, Sparkles, Loader2, X, AlertCircle } from 'lucide-react';
import type { Id } from '../../../../../convex/_generated/dataModel';
import type { AIAction } from '@/features/resume/ai/actions';
import type { MutationBroker } from '@/features/resume/editor/integration/MutationBroker';
import { useEditorStore } from '@/features/resume/editor/state/editorStore';
import { createEditorStoreAdapter, type IEditorStoreAdapter } from '@/features/resume/editor/integration/EditorStoreAdapter';

type EditorStore = ReturnType<typeof useEditorStore>;
import { getActionPrompt } from '@/features/resume/ai/actions';
import { validateContent, sanitize } from '@/features/resume/ai/guardrails';
import { useAIStreaming } from '@/hooks/useAIStreaming';
import { applyAIEdit } from '@/features/resume/ai/applyAIEdit';
import { logEvent } from '@/lib/telemetry';

interface AIAuthoringPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: Id<'builder_resumes'>;
  store: EditorStore;
  broker: MutationBroker;
  selectedBlockId?: string; // Production: selection drives targeting
}

interface ActionDefinition {
  id: AIAction;
  label: string;
  description: string;
  icon: typeof Wand2;
}

const ACTIONS: ActionDefinition[] = [
  {
    id: 'generateSummary',
    label: 'Generate Summary',
    description: 'Create professional summary from experience',
    icon: Sparkles,
  },
  {
    id: 'rewriteExperience',
    label: 'Rewrite Experience',
    description: 'Strengthen action verbs and impact',
    icon: FileEdit,
  },
  {
    id: 'tailorToJob',
    label: 'Tailor to Job',
    description: 'Customize content for target role',
    icon: Zap,
  },
  {
    id: 'improveBullet',
    label: 'Improve Bullet',
    description: 'Enhance clarity and metrics',
    icon: Wand2,
  },
  {
    id: 'fixTense',
    label: 'Fix Tense',
    description: 'Ensure consistent verb tense',
    icon: Clock,
  },
  {
    id: 'translate',
    label: 'Translate',
    description: 'Translate to target language',
    icon: Languages,
  },
];

/**
 * AI Authoring Panel with real streaming and cancel support
 * Gates behind NEXT_PUBLIC_RESUME_V2_STORE flag
 */
export function AIAuthoringPanel({
  open,
  onOpenChange,
  resumeId,
  store,
  broker,
  selectedBlockId,
}: AIAuthoringPanelProps) {
  const { toast } = useToast();
  const [runningAction, setRunningAction] = useState<AIAction | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const cancelStartTimeRef = useRef<number>(0);

  // Check V2 flag
  const v2Enabled = process.env.NEXT_PUBLIC_RESUME_V2_STORE === 'true';
  const debugEnabled = process.env.NEXT_PUBLIC_DEBUG_UI === 'true';

  // Create adapter from store using useMemo
  const adapter = useMemo(() => {
    return store ? createEditorStoreAdapter(store) : null;
  }, [store]);

  if (!v2Enabled || !adapter) {
    return null;
  }

  // Real streaming hook from Part A
  const { status, start, cancel, isStreaming } = useAIStreaming({
    onSuggestion: (suggestion) => {
      // Accumulate streaming text
      if (suggestion.proposedContent) {
        setStreamingText(suggestion.proposedContent);
      }
    },
    onComplete: async (suggestions) => {
      // On complete: apply edit with store-first pattern
      if (!selectedBlockId || !runningAction || !adapter) return;

      const finalText = suggestions[suggestions.length - 1]?.proposedContent || '';

      try {
        const result = await applyAIEdit({
          resumeId,
          blockId: selectedBlockId,
          action: runningAction,
          proposedContent: finalText,
          adapter,
          broker,
        });

        if (result.ok) {
          toast({
            title: 'Applied successfully',
            description: `${runningAction} completed`,
            duration: 3000,
          });

          setRunningAction(null);
          setStreamingText('');
        } else {
          throw new Error(result.error || 'Failed to apply');
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        toast({
          title: 'Failed to apply',
          description: err.message,
          variant: 'destructive',
          duration: 5000,
        });

        setRunningAction(null);
        setStreamingText('');
      }
    },
    onError: (error) => {
      toast({
        title: 'Streaming failed',
        description: error.message,
        variant: 'destructive',
        duration: 5000,
      });

      setRunningAction(null);
      setStreamingText('');
    },
  });

  const handleCancel = useCallback(() => {
    cancel();

    setRunningAction(null);
    setStreamingText('');

    toast({
      title: 'Cancelled',
      description: 'Action cancelled',
      duration: 2000,
    });
  }, [cancel, toast]);

  const handleRunAction = useCallback(async (action: AIAction) => {
    if (!selectedBlockId || !adapter) {
      toast({
        title: 'No block selected',
        description: 'Please select a block to edit first',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setRunningAction(action);
    setStreamingText('');

    try {
      // Get current block content via adapter
      const currentText = adapter.getBlockText(selectedBlockId);

      if (!currentText) {
        throw new Error('Selected block not found');
      }

      // Get block metadata for context
      const snapshot = store.getState();
      const block = snapshot.blocksById[selectedBlockId];
      
      if (!block) {
        throw new Error('Selected block not found in editor state');
      }

      // Generate prompts using Part B actions
      const context = {
        currentContent: currentText,
        blockType: block.type,
        // Add more context as needed per action type
      };

      const prompts = getActionPrompt(action, context);

      // Validate content with guardrails before streaming
      const validation = validateContent(prompts.userPrompt, {
        isContactInfo: block.type === 'header',
        allowUrls: block.type === 'projects' || block.type === 'header',
      });

      if (!validation.ok) {
        if (debugEnabled) {
          logEvent('ai_guardrail_blocked', {
            action,
            blockId: selectedBlockId,
            code: validation.code,
            reason: validation.reason,
          });
        }

        toast({
          title: 'Content blocked',
          description: validation.reason,
          variant: 'destructive',
          duration: 5000,
        });

        setRunningAction(null);
        return;
      }

      // Sanitize content
      const sanitized = sanitize(prompts.userPrompt);
      const finalPrompt = sanitized.text;

      if (sanitized.redactions > 0 && debugEnabled) {
        logEvent('ai_content_sanitized', {
          action,
          redactions: sanitized.redactions,
          patterns: sanitized.patterns,
        });
      }

      // Start real streaming
      if (debugEnabled) {
        logEvent('ai_action_started', {
          action,
          blockId: selectedBlockId,
          resumeId: String(resumeId),
        });
      }

      await start({
        resumeId: String(resumeId),
        blockIds: [selectedBlockId],
        targetRole: '', // TODO: Add context input fields
        targetCompany: '',
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      toast({
        title: 'Action failed',
        description: err.message,
        variant: 'destructive',
        duration: 5000,
      });

      setRunningAction(null);
      setStreamingText('');
    }
  }, [selectedBlockId, resumeId, store, adapter, broker, start, debugEnabled, toast]);

  // Check if actions should be disabled
  const actionsDisabled = !selectedBlockId || isStreaming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Authoring Actions</DialogTitle>
          <DialogDescription>
            {selectedBlockId
              ? 'Choose an AI action to improve your resume content'
              : 'Select a block in the editor to enable AI actions'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Selection hint */}
          {!selectedBlockId && (
            <Card className="border-amber-500 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  No block selected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click on a block in the editor to select it, then choose an AI action.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Streaming Preview */}
          {runningAction && isStreaming && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running {runningAction}...
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-md font-mono text-sm min-h-[100px] whitespace-pre-wrap">
                  {streamingText}
                  <span className="animate-pulse">|</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-4">
            {ACTIONS.map((actionDef) => {
              const Icon = actionDef.icon;
              const isRunning = runningAction === actionDef.id;
              const isDisabled = actionsDisabled;

              return (
                <Button
                  key={actionDef.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2 text-left"
                  disabled={isDisabled}
                  onClick={() => handleRunAction(actionDef.id)}
                >
                  <Icon className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{actionDef.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {actionDef.description}
                    </div>
                  </div>
                  {isRunning && (
                    <Loader2 className="h-4 w-4 animate-spin self-end" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
