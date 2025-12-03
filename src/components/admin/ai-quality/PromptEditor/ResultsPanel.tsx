'use client';

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  ChevronRight,
  Lightbulb,
  Loader2,
  Play,
  Sparkles,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import type { EvalResult, Suggestion } from './index';

interface ResultsPanelProps {
  currentEvalResult: EvalResult | null;
  newEvalResult: EvalResult | null;
  suggestions: Suggestion[] | null;
  isRunningEval: boolean;
  isLoadingSuggestions: boolean;
  onRunEval: () => void;
  onGetSuggestions: () => void;
  onApplySuggestion: (suggestion: Suggestion) => void;
  onCollapse: () => void;
}

function ScoreCircle({
  score,
  label,
  size = 'md',
}: {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const percentage = Math.round(score * 100);
  const color =
    percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-amber-500' : 'text-red-500';
  const bgColor = percentage >= 80 ? 'bg-green-50' : percentage >= 60 ? 'bg-amber-50' : 'bg-red-50';

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-20 h-20 text-xl',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center font-semibold ${color}`}
      >
        {percentage}%
      </div>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function DimensionBar({ label, score, delta }: { label: string; score: number; delta?: number }) {
  const percentage = Math.round(score * 100);
  const color =
    percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 capitalize">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">{percentage}%</span>
          {delta !== undefined && delta !== 0 && (
            <span
              className={`flex items-center text-[10px] ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}
            >
              {delta > 0 ? (
                <ArrowUp className="h-2.5 w-2.5" />
              ) : (
                <ArrowDown className="h-2.5 w-2.5" />
              )}
              {Math.abs(Math.round(delta * 100))}
            </span>
          )}
        </div>
      </div>
      <Progress value={percentage} className={`h-2 ${color}`} />
    </div>
  );
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded border ${colors[priority]} uppercase font-medium`}
    >
      {priority}
    </span>
  );
}

export function ResultsPanel({
  currentEvalResult,
  newEvalResult,
  suggestions,
  isRunningEval,
  isLoadingSuggestions,
  onRunEval,
  onGetSuggestions,
  onApplySuggestion,
  onCollapse,
}: ResultsPanelProps) {
  const scoreDelta =
    newEvalResult && currentEvalResult ? newEvalResult.score - currentEvalResult.score : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-medium text-slate-700">Evaluation Results</h3>
        <button
          onClick={onCollapse}
          className="p-1 hover:bg-slate-200 rounded transition-colors"
          title="Collapse panel"
        >
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Score Comparison */}
        <div className="p-4 border-b border-slate-200">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Score Comparison
          </h4>

          {!newEvalResult ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Play className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 mb-3">Run an evaluation to see scores</p>
              <Button size="sm" onClick={onRunEval} disabled={isRunningEval}>
                {isRunningEval ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Eval
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Score Cards */}
              <div className="flex items-center justify-center gap-6">
                {currentEvalResult && (
                  <ScoreCircle score={currentEvalResult.score} label="Current" size="sm" />
                )}
                <ScoreCircle score={newEvalResult.score} label="New" size="lg" />
              </div>

              {/* Delta Indicator */}
              {scoreDelta !== null && scoreDelta !== 0 && (
                <div className="flex items-center justify-center">
                  <span
                    className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${
                      scoreDelta > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {scoreDelta > 0 ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                    {scoreDelta > 0 ? '+' : ''}
                    {Math.round(scoreDelta * 100)}%
                  </span>
                </div>
              )}

              {/* Pass/Fail Status */}
              <div className="flex items-center justify-center gap-2">
                {newEvalResult.passed ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Passed
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dimension Scores */}
        {newEvalResult && (
          <div className="p-4 border-b border-slate-200">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Dimensions
            </h4>
            <div className="space-y-3">
              <DimensionBar
                label="Relevance"
                score={newEvalResult.dimensions.relevance}
                delta={
                  currentEvalResult
                    ? newEvalResult.dimensions.relevance - currentEvalResult.dimensions.relevance
                    : undefined
                }
              />
              <DimensionBar
                label="Quality"
                score={newEvalResult.dimensions.quality}
                delta={
                  currentEvalResult
                    ? newEvalResult.dimensions.quality - currentEvalResult.dimensions.quality
                    : undefined
                }
              />
              <DimensionBar
                label="Accuracy"
                score={newEvalResult.dimensions.accuracy}
                delta={
                  currentEvalResult
                    ? newEvalResult.dimensions.accuracy - currentEvalResult.dimensions.accuracy
                    : undefined
                }
              />
              <DimensionBar
                label="Safety"
                score={newEvalResult.dimensions.safety}
                delta={
                  currentEvalResult
                    ? newEvalResult.dimensions.safety - currentEvalResult.dimensions.safety
                    : undefined
                }
              />
            </div>
          </div>
        )}

        {/* Risk Flags */}
        {newEvalResult && newEvalResult.riskFlags.length > 0 && (
          <div className="p-4 border-b border-slate-200">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Risk Flags
            </h4>
            <div className="flex flex-wrap gap-2">
              {newEvalResult.riskFlags.map((flag) => (
                <Badge
                  key={flag}
                  variant="outline"
                  className="text-amber-600 border-amber-300 bg-amber-50"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {flag.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              AI Suggestions
            </h4>
            {newEvalResult && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onGetSuggestions}
                disabled={isLoadingSuggestions}
                className="h-7 text-xs"
              >
                {isLoadingSuggestions ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                {suggestions ? 'Refresh' : 'Get Suggestions'}
              </Button>
            )}
          </div>

          {!newEvalResult ? (
            <div className="text-center py-4 text-sm text-slate-400">
              Run an evaluation first to get AI suggestions
            </div>
          ) : isLoadingSuggestions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : !suggestions || suggestions.length === 0 ? (
            <div className="text-center py-4">
              <Lightbulb className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                Click "Get Suggestions" for AI-powered improvements
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 bg-white space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={suggestion.priority} />
                      <span className="text-xs text-slate-500 capitalize">
                        {suggestion.dimension}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{suggestion.issue}</p>
                  <p className="text-xs text-slate-700 font-medium">{suggestion.suggestion}</p>
                  {suggestion.example && (
                    <div className="mt-2">
                      <pre className="text-[10px] bg-slate-100 p-2 rounded text-slate-600 overflow-x-auto">
                        {suggestion.example}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApplySuggestion(suggestion)}
                        className="h-6 text-xs mt-1"
                      >
                        Apply Example
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <Button className="w-full" onClick={onRunEval} disabled={isRunningEval}>
          {isRunningEval ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {newEvalResult ? 'Re-run Evaluation' : 'Run Evaluation'}
        </Button>
        {newEvalResult && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onGetSuggestions}
            disabled={isLoadingSuggestions}
          >
            {isLoadingSuggestions ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Get AI Suggestions
          </Button>
        )}
      </div>
    </div>
  );
}

export default ResultsPanel;
