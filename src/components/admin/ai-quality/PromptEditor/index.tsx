'use client';

import type { Doc } from 'convex/_generated/dataModel';
import { ChevronLeft, ChevronRight, Loader2, Play, Save, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AI_TOOL_REGISTRY, type AIToolId } from '@/lib/ai-quality/types';

import { CurrentPanel } from './CurrentPanel';
import { EditPanel } from './EditPanel';
import { ResultsPanel } from './ResultsPanel';

// Types
export interface EvalResult {
  passed: boolean;
  score: number;
  dimensions: {
    relevance: number;
    quality: number;
    accuracy: number;
    safety: number;
  };
  riskFlags: string[];
  explanation?: string;
}

export interface Suggestion {
  priority: 'high' | 'medium' | 'low';
  dimension: string;
  issue: string;
  suggestion: string;
  example?: string;
}

export interface NewVersionData {
  promptText: string;
  kind: 'system' | 'rubric';
  notes: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface PromptEditorProps {
  toolId: AIToolId;
  currentVersion?: Doc<'prompt_versions'> | null;
  inlinePrompt?: { kind: string; prompt_text: string; notes: string };
  onClose: () => void;
  onSave: (data: NewVersionData) => Promise<void>;
}

export function PromptEditor({
  toolId,
  currentVersion,
  inlinePrompt,
  onClose,
  onSave,
}: PromptEditorProps) {
  const { toast } = useToast();
  const toolConfig = AI_TOOL_REGISTRY[toolId];

  // Panel visibility
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Form state
  const [promptText, setPromptText] = useState(
    currentVersion?.prompt_text || inlinePrompt?.prompt_text || '',
  );
  const [kind, setKind] = useState<'system' | 'rubric'>(
    (currentVersion?.kind as 'system' | 'rubric') ||
      (inlinePrompt?.kind as 'system' | 'rubric') ||
      'system',
  );
  const [notes, setNotes] = useState(currentVersion?.notes || inlinePrompt?.notes || '');
  const [model, setModel] = useState(currentVersion?.model || toolConfig?.defaultModel || 'gpt-4o');
  const [temperature, setTemperature] = useState(currentVersion?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(currentVersion?.max_tokens ?? 2048);

  // Eval state
  const [currentEvalResult, setCurrentEvalResult] = useState<EvalResult | null>(null);
  const [newEvalResult, setNewEvalResult] = useState<EvalResult | null>(null);
  const [isRunningEval, setIsRunningEval] = useState(false);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Track if form is dirty
  const originalText = currentVersion?.prompt_text || inlinePrompt?.prompt_text || '';
  const isDirty = promptText !== originalText;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape') {
        if (isDirty) {
          if (confirm('You have unsaved changes. Are you sure you want to close?')) {
            onClose();
          }
        } else {
          onClose();
        }
        return;
      }

      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Cmd/Ctrl + E to run eval
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        handleRunEval();
        return;
      }

      // Cmd/Ctrl + I to get suggestions
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        handleGetSuggestions();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, promptText, newEvalResult]);

  // Handlers
  const handleSave = useCallback(async () => {
    if (!promptText.trim()) {
      toast({
        title: 'Error',
        description: 'Prompt text cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        promptText,
        kind,
        notes,
        model,
        temperature,
        maxTokens,
      });
      toast({
        title: 'Saved',
        description: 'New version created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save version',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [promptText, kind, notes, model, temperature, maxTokens, onSave, toast]);

  const handleRunEval = useCallback(async () => {
    if (!promptText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter prompt text first',
        variant: 'destructive',
      });
      return;
    }

    setIsRunningEval(true);
    try {
      const response = await fetch('/api/admin/ai-quality/run-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          mode: 'sample',
          customPrompt: promptText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to run evaluation');
      }

      const data = await response.json();

      // Transform API response to our EvalResult format
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        setNewEvalResult({
          passed: result.passed ?? false,
          score: result.score ?? 0,
          dimensions: {
            relevance: result.dimensionScores?.relevance ?? 0,
            quality: result.dimensionScores?.quality ?? 0,
            accuracy: result.dimensionScores?.accuracy ?? 0,
            safety: result.dimensionScores?.safety ?? 0,
          },
          riskFlags: result.riskFlags ?? [],
          explanation: result.explanation,
        });
      }

      toast({
        title: 'Evaluation Complete',
        description: `Score: ${(data.summary?.avgScore * 100).toFixed(0)}%`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run evaluation',
        variant: 'destructive',
      });
    } finally {
      setIsRunningEval(false);
    }
  }, [toolId, promptText, toast]);

  const handleGetSuggestions = useCallback(async () => {
    if (!newEvalResult) {
      toast({
        title: 'Run Evaluation First',
        description: 'Please run an evaluation before getting suggestions',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/admin/ai-quality/suggest-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evalResult: {
            toolId,
            passed: newEvalResult.passed,
            score: newEvalResult.score,
            dimensionScores: newEvalResult.dimensions,
            riskFlags: newEvalResult.riskFlags,
            explanation: newEvalResult.explanation,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get suggestions',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [toolId, newEvalResult, toast]);

  const handleApplySuggestion = useCallback(
    (suggestion: Suggestion) => {
      if (suggestion.example) {
        // If there's an example, append it to the prompt
        setPromptText((prev) => prev + '\n\n' + suggestion.example);
      }
      toast({
        title: 'Suggestion Applied',
        description: 'The suggestion has been added to your prompt',
      });
    },
    [toast],
  );

  const handleCopyFromCurrent = useCallback(() => {
    const text = currentVersion?.prompt_text || inlinePrompt?.prompt_text || '';
    setPromptText(text);
    toast({
      title: 'Copied',
      description: 'Current prompt copied to editor',
    });
  }, [currentVersion, inlinePrompt, toast]);

  // Portal content
  const editorContent = (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-slate-900">
            {toolConfig?.displayName || toolId}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-mono">
              {currentVersion ? `v${currentVersion.version_string}` : 'inline'}
            </span>
            <span className="text-slate-300">→</span>
            <span className="font-mono text-primary-600">new version</span>
          </div>
          {isDirty && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunEval}
            disabled={isRunningEval || !promptText.trim()}
          >
            {isRunningEval ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Eval
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGetSuggestions}
            disabled={isLoadingSuggestions || !newEvalResult}
          >
            {isLoadingSuggestions ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Suggestions
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || !isDirty}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Current Prompt */}
        <div
          className={`border-r border-slate-200 bg-slate-50 transition-all duration-300 ${
            leftPanelCollapsed ? 'w-10' : 'w-1/4 min-w-[280px]'
          }`}
        >
          {leftPanelCollapsed ? (
            <button
              onClick={() => setLeftPanelCollapsed(false)}
              className="w-full h-full flex items-center justify-center hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          ) : (
            <CurrentPanel
              currentVersion={currentVersion}
              inlinePrompt={inlinePrompt}
              onCopyToEditor={handleCopyFromCurrent}
              onCollapse={() => setLeftPanelCollapsed(true)}
            />
          )}
        </div>

        {/* Center Panel - Editor */}
        <div className="flex-1 min-w-[400px] bg-white">
          <EditPanel
            promptText={promptText}
            onPromptTextChange={setPromptText}
            kind={kind}
            onKindChange={setKind}
            notes={notes}
            onNotesChange={setNotes}
            model={model}
            onModelChange={setModel}
            temperature={temperature}
            onTemperatureChange={setTemperature}
            maxTokens={maxTokens}
            onMaxTokensChange={setMaxTokens}
          />
        </div>

        {/* Right Panel - Results */}
        <div
          className={`border-l border-slate-200 bg-slate-50 transition-all duration-300 ${
            rightPanelCollapsed ? 'w-10' : 'w-[30%] min-w-[320px]'
          }`}
        >
          {rightPanelCollapsed ? (
            <button
              onClick={() => setRightPanelCollapsed(false)}
              className="w-full h-full flex items-center justify-center hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4 text-slate-400" />
            </button>
          ) : (
            <ResultsPanel
              currentEvalResult={currentEvalResult}
              newEvalResult={newEvalResult}
              suggestions={suggestions}
              isRunningEval={isRunningEval}
              isLoadingSuggestions={isLoadingSuggestions}
              onRunEval={handleRunEval}
              onGetSuggestions={handleGetSuggestions}
              onApplySuggestion={handleApplySuggestion}
              onCollapse={() => setRightPanelCollapsed(true)}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Status: Draft</span>
          {newEvalResult && (
            <>
              <span className="text-slate-300">|</span>
              <span>
                Last eval: {newEvalResult.passed ? 'Passed' : 'Failed'} (
                {(newEvalResult.score * 100).toFixed(0)}%)
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>Esc to close</span>
          <span>Cmd+S to save</span>
          <span>Cmd+E to eval</span>
          <span>Cmd+I for suggestions</span>
        </div>
      </footer>
    </div>
  );

  // Use portal to render at document root
  if (typeof window === 'undefined') return null;

  return createPortal(editorContent, document.body);
}

export default PromptEditor;
