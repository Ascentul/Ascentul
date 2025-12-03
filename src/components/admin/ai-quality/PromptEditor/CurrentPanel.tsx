'use client';

import type { Doc } from 'convex/_generated/dataModel';
import { ChevronLeft, Copy, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface CurrentPanelProps {
  currentVersion?: Doc<'prompt_versions'> | null;
  inlinePrompt?: { kind: string; prompt_text: string; notes: string };
  onCopyToEditor: () => void;
  onCollapse: () => void;
}

export function CurrentPanel({
  currentVersion,
  inlinePrompt,
  onCopyToEditor,
  onCollapse,
}: CurrentPanelProps) {
  const promptText = currentVersion?.prompt_text || inlinePrompt?.prompt_text || '';
  const kind = currentVersion?.kind || inlinePrompt?.kind || 'system';
  const notes = currentVersion?.notes || inlinePrompt?.notes || '';
  const versionString = currentVersion?.version_string || 'inline';
  const model = currentVersion?.model || 'gpt-4o';
  const temperature = currentVersion?.temperature ?? 0.7;
  const maxTokens = currentVersion?.max_tokens ?? 2048;

  if (!promptText) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <FileText className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 font-medium">No current version</p>
        <p className="text-xs text-slate-400 mt-1">This will be the first version</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-slate-700">Current Version</h3>
          <span className="text-xs font-mono bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
            {versionString}
          </span>
        </div>
        <button
          onClick={onCollapse}
          className="p-1 hover:bg-slate-200 rounded transition-colors"
          title="Collapse panel"
        >
          <ChevronLeft className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Metadata */}
      <div className="px-4 py-3 border-b border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Kind</span>
          <span className="font-medium text-slate-700 capitalize">{kind}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Model</span>
          <span className="font-medium text-slate-700">{model}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Temperature</span>
          <span className="font-medium text-slate-700">{temperature}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Max Tokens</span>
          <span className="font-medium text-slate-700">{maxTokens}</span>
        </div>
        {notes && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">Notes</span>
            <p className="text-xs text-slate-600 mt-1">{notes}</p>
          </div>
        )}
      </div>

      {/* Copy Button */}
      <div className="px-4 py-3 border-b border-slate-200">
        <Button variant="outline" size="sm" onClick={onCopyToEditor} className="w-full text-xs">
          <Copy className="h-3 w-3 mr-2" />
          Copy to Editor
        </Button>
      </div>

      {/* Prompt Text */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-slate-900 rounded-lg p-4 h-full overflow-auto">
          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
            {promptText}
          </pre>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-2 border-t border-slate-200 text-xs text-slate-400 flex items-center justify-between">
        <span>{promptText.length.toLocaleString()} chars</span>
        <span>{promptText.split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
      </div>
    </div>
  );
}

export default CurrentPanel;
