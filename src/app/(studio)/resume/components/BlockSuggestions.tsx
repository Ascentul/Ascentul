'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { X, Lightbulb, AlertCircle, Info } from 'lucide-react';
import type { ContentSuggestion } from '@/lib/ai/suggestions';
import { getSuggestionColor } from '@/lib/ai/suggestions';

interface BlockSuggestionsProps {
  blockId: string;
  suggestions: ContentSuggestion[];
  onDismiss?: (suggestionId: string) => void;
  compact?: boolean;
}

const STORAGE_KEY = 'resume-dismissed-suggestions';

export function BlockSuggestions({
  blockId,
  suggestions,
  onDismiss,
  compact = false,
}: BlockSuggestionsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Load dismissed suggestions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[blockId]) {
          setDismissed(new Set(parsed[blockId]));
        }
      }
    } catch (error) {
      console.error('Failed to load dismissed suggestions:', error);
    }
  }, [blockId]);

  const handleDismiss = (suggestionId: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(suggestionId);
    setDismissed(newDismissed);

    // Save to localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      parsed[blockId] = Array.from(newDismissed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (error) {
      console.error('Failed to save dismissed suggestions:', error);
    }

    onDismiss?.(suggestionId);
  };

  // Filter out dismissed suggestions
  const visibleSuggestions = suggestions.filter(s => !dismissed.has(s.id));

  if (visibleSuggestions.length === 0) {
    return null;
  }

  // Get icon based on priority
  const getIcon = (priority: ContentSuggestion['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      case 'medium':
        return <Info className="h-4 w-4" />;
      case 'low':
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (compact) {
    // Compact mode: Show count badge with tooltip
    // Determine badge color based on highest priority suggestion
    const hasHighPriority = visibleSuggestions.some(s => s.priority === 'high');
    const hasMediumPriority = visibleSuggestions.some(s => s.priority === 'medium');

    const badgeColorClass = hasHighPriority
      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      : hasMediumPriority
      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-help ${badgeColorClass}`}>
              <Lightbulb className="h-3 w-3" />
              <span>{visibleSuggestions.length}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold text-sm">Improvement Tips:</p>
              {visibleSuggestions.slice(0, 3).map((suggestion) => (
                <p key={suggestion.id} className="text-xs">
                  • {suggestion.message}
                </p>
              ))}
              {visibleSuggestions.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{visibleSuggestions.length - 3} more...
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full mode: Show all suggestions as cards
  return (
    <div className="space-y-2 mt-3">
      {visibleSuggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className={`
            flex items-start gap-2 p-3 rounded-lg border
            ${suggestion.priority === 'high'
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
              : suggestion.priority === 'medium'
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
              : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
            }
          `}
        >
          <div className={getSuggestionColor(suggestion.priority)}>
            {getIcon(suggestion.priority)}
          </div>

          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-foreground">
              {suggestion.message}
            </p>
            {suggestion.detail && (
              <p className="text-xs text-muted-foreground">
                {suggestion.detail}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleDismiss(suggestion.id)}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      ))}
    </div>
  );
}

/**
 * Inline suggestion badge (for hover/focus states)
 */
export function InlineSuggestionBadge({
  count,
  priority = 'medium'
}: {
  count: number;
  priority?: ContentSuggestion['priority']
}) {
  if (count === 0) return null;

  const colorClass = priority === 'high'
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    : priority === 'medium'
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      <Lightbulb className="h-3 w-3" />
      {count}
    </span>
  );
}
