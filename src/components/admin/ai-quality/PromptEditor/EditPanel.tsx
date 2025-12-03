'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface EditPanelProps {
  promptText: string;
  onPromptTextChange: (text: string) => void;
  kind: 'system' | 'rubric';
  onKindChange: (kind: 'system' | 'rubric') => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  maxTokens: number;
  onMaxTokensChange: (tokens: number) => void;
}

export function EditPanel({
  promptText,
  onPromptTextChange,
  kind,
  onKindChange,
  notes,
  onNotesChange,
  model,
  onModelChange,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
}: EditPanelProps) {
  const charCount = promptText.length;
  const wordCount = promptText.split(/\s+/).filter(Boolean).length;

  return (
    <div className="h-full flex flex-col">
      {/* Top Form Fields */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Kind */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Kind</Label>
            <Select value={kind} onValueChange={(v) => onKindChange(v as 'system' | 'rubric')}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="rubric">Rubric</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Model</Label>
            <Select value={model} onValueChange={onModelChange}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Temperature</Label>
            <Input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => onTemperatureChange(parseFloat(e.target.value) || 0)}
              className="h-9 text-sm"
            />
          </div>

          {/* Max Tokens */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Max Tokens</Label>
            <Input
              type="number"
              min="1"
              max="128000"
              step="256"
              value={maxTokens}
              onChange={(e) => onMaxTokensChange(parseInt(e.target.value) || 2048)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4 space-y-1.5">
          <Label className="text-xs text-slate-500">Version Notes</Label>
          <Input
            placeholder="Describe what changed in this version..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <Label className="text-xs text-slate-500 mb-2">Prompt Text</Label>
        <div className="flex-1 relative">
          <Textarea
            value={promptText}
            onChange={(e) => onPromptTextChange(e.target.value)}
            placeholder="Enter your prompt text here..."
            className="absolute inset-0 resize-none font-mono text-sm leading-relaxed p-4 border-slate-200 focus:border-primary-300 focus:ring-primary-200"
          />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="px-6 py-2 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>{charCount.toLocaleString()} characters</span>
          <span>{wordCount.toLocaleString()} words</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-300">|</span>
          <span>Markdown supported</span>
        </div>
      </div>
    </div>
  );
}

export default EditPanel;
