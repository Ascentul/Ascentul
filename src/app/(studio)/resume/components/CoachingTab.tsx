'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Lightbulb,
  Eye,
  Check,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react';
import { useEditorStore } from '@/features/resume/editor/state/editorStore';
import type { MutationBroker } from '@/features/resume/editor/integration/MutationBroker';
import { getSuggestions, type CoachSuggestion } from '@/features/resume/coach/suggestions';
import { applySuggestion } from '@/features/resume/coach/applySuggestion';
import { logEvent } from '@/lib/telemetry';

interface CoachingTabProps {
  broker: MutationBroker;
  className?: string;
}

interface PreviewModalState {
  isOpen: boolean;
  suggestion: CoachSuggestion | null;
  currentValue: string;
}

/**
 * CoachingTab - Phase 6 inline coaching with actionable suggestions
 *
 * Features:
 * - Analyzes document and surfaces 3+ actionable suggestions
 * - Preview diff before applying
 * - One-click apply with store-first updates
 * - Single history entry per apply
 * - Non-blocking error toasts
 *
 * Gates behind NEXT_PUBLIC_RESUME_V2_STORE flag
 */
export function CoachingTab({ broker, className }: CoachingTabProps) {
  const store = useEditorStore();
  const snapshot = store.getState();
  const { toast } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<PreviewModalState>({
    isOpen: false,
    suggestion: null,
    currentValue: '',
  });
  const [suggestions, setSuggestions] = useState<CoachSuggestion[]>([]);

  useEffect(() => {
    setIsAnalyzing(true);
    const startTime = performance.now();

    const result = getSuggestions(snapshot);

    const duration = performance.now() - startTime;
    logEvent('coach_analyzed', {
      suggestionCount: result.length,
      duration_ms: Math.round(duration),
    });

    setSuggestions(result);
    setIsAnalyzing(false);
  }, [snapshot]);

  const handlePreview = useCallback((suggestion: CoachSuggestion) => {
    const block = snapshot.blocksById[suggestion.blockId];
    if (!block) return;

    // Get current value from block using targetPath
    const parts = suggestion.targetPath.split('.');
    let current: unknown = block;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        console.warn(`Invalid path: ${suggestion.targetPath} for block ${suggestion.blockId}`);
        return;
      }
    }

    setPreviewState({
      isOpen: true,
      suggestion,
      currentValue: typeof current === 'string' ? current : '',
    });
  }, [snapshot]);

  const closePreview = useCallback(() => {
    setPreviewState({
      isOpen: false,
      suggestion: null,
      currentValue: '',
    });
  }, []);

  const handleApply = useCallback(async (suggestion: CoachSuggestion) => {
    setApplyingId(suggestion.id);
    let handledError = false;

    try {
      await applySuggestion(suggestion, store, broker, {
        onSuccess: () => {
          logEvent('coach_suggestion_applied', {
            actionType: suggestion.actionType,
            blockId: suggestion.blockId,
          });

          toast({
            title: 'Suggestion applied',
            description: suggestion.title,
            duration: 3000,
          });

          closePreview();
        },
        onError: (error) => {
          handledError = true;
          toast({
            title: 'Failed to apply suggestion',
            description: error.message,
            variant: 'destructive',
            duration: 5000,
          });
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (!handledError) {
        toast({
          title: 'Failed to apply suggestion',
          description: err.message,
          variant: 'destructive',
          duration: 5000,
        });
      }
      console.error('[CoachingTab] applySuggestion threw synchronously:', err);
      throw err;
    } finally {
      setApplyingId(null);
    }
  }, [store, broker, toast, closePreview]);

  const severityConfig = {
    high: {
      icon: <AlertCircle className="h-4 w-4 text-red-600" />,
      color: 'bg-red-100 text-red-800 border-red-200',
    },
    medium: {
      icon: <Info className="h-4 w-4 text-amber-600" />,
      color: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    low: {
      icon: <Lightbulb className="h-4 w-4 text-blue-600" />,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
  } as const;

  if (isAnalyzing) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Coaching
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing your resume...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Coaching
          </CardTitle>
          <CardDescription>
            No suggestions at this time. Great work!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const activeSuggestion = previewState.suggestion;

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Coaching
          </CardTitle>
          <CardDescription>
            {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} to improve your resume
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="flex flex-col gap-2 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-2">
                {severityConfig[suggestion.severity].icon}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{suggestion.title}</p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${severityConfig[suggestion.severity].color}`}
                    >
                      {suggestion.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {suggestion.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(suggestion)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApply(suggestion)}
                  disabled={applyingId === suggestion.id}
                  className="flex-1"
                >
                  {applyingId === suggestion.id ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Apply
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewState.isOpen && activeSuggestion ? (
        <PreviewDiffModal
          suggestion={activeSuggestion}
          currentValue={previewState.currentValue}
          onClose={closePreview}
          onApply={() => handleApply(activeSuggestion)}
          isApplying={applyingId === activeSuggestion.id}
        />
      ) : null}
    </>
  );
}

/**
 * Simple inline diff preview modal
 */
function PreviewDiffModal({
  suggestion,
  currentValue,
  onClose,
  onApply,
  isApplying,
}: {
  suggestion: CoachSuggestion;
  currentValue: string;
  onClose: () => void;
  onApply: () => void;
  isApplying: boolean;
}) {
  const diff = suggestion.preview(currentValue);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isApplying) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isApplying]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b">
          <h3 id="modal-title" className="text-lg font-semibold">{suggestion.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Before</div>
            <div className="bg-gray-50 rounded border border-gray-200 p-3 text-sm font-mono whitespace-pre-wrap">
              {diff.before}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-green-600 uppercase mb-2">After</div>
            <div className="bg-green-50 rounded border border-green-200 p-3 text-sm font-mono whitespace-pre-wrap">
              <DiffHighlight changes={diff.changes} />
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isApplying}>
            Cancel
          </Button>
          <Button onClick={onApply} disabled={isApplying}>
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Apply Change
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Render diff with highlighting
 */
function DiffHighlight({ changes }: { changes: Array<{ type: 'add' | 'remove' | 'unchanged'; text: string }> }) {
  return (
    <>
      {changes.map((change, idx) => {
        if (change.type === 'add') {
          return (
            <span key={`${idx}-${change.type}-${change.text.slice(0, 10)}`} className="bg-green-200 text-green-900">
              {change.text}
            </span>
          );
        } else if (change.type === 'remove') {
          return null; // Don't show removals in "after" view
        } else {
          return <span key={`${idx}-${change.type}-${change.text.slice(0, 10)}`}>{change.text}</span>;
        }
      })}
    </>
  );
}
