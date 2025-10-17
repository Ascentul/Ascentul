'use client';

/**
 * BlockSuggestions Component
 *
 * Displays AI-generated content improvement suggestions for resume blocks.
 * Supports dismissal with localStorage persistence across browser sessions.
 *
 * PERSISTENCE ARCHITECTURE:
 * - Uses localStorage for client-side persistence (no backend required)
 * - Syncs dismissals across tabs via storage events
 * - Read-merge-write pattern reduces (but doesn't eliminate) race conditions
 *
 * KNOWN LIMITATION:
 * localStorage lacks atomic operations, creating a potential race condition when
 * multiple tabs dismiss different suggestions simultaneously. This is acceptable
 * for resume editing because:
 * 1. Concurrent multi-tab editing is rare
 * 2. Worst case: dismissed suggestion reappears after reload
 * 3. In-memory state stays correct during active session
 * 4. Non-critical data (UX preference, not user content)
 *
 * For stricter consistency requirements, migrate to IndexedDB transactions or
 * backend persistence. See inline documentation in handleDismiss() for details.
 */

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
        if (parsed[blockId] && Array.isArray(parsed[blockId])) {
          setDismissed(new Set(parsed[blockId]));
        }
      }
    } catch (error) {
      console.error('Failed to load dismissed suggestions:', error);
    }

    // Listen for storage events from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed[blockId] && Array.isArray(parsed[blockId])) {
            // Merge remote changes with local state
            setDismissed((current) => {
              const merged = new Set(current);
              parsed[blockId].forEach((id: string) => merged.add(id));
              return merged;
            });
          }
        } catch (error) {
          console.error('Failed to sync dismissed suggestions:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [blockId]);

  const handleDismiss = (suggestionId: string) => {
    setDismissed((current) => {
      const newDismissed = new Set(current);
      newDismissed.add(suggestionId);

      // Save to localStorage with merge logic
      try {
        // Re-read from storage to merge any concurrent updates
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : {};

        // Merge existing dismissed IDs with new one
        const existingIds = Array.isArray(parsed[blockId]) ? parsed[blockId] : [];
        const mergedIds = Array.from(new Set([...existingIds, suggestionId]));

        parsed[blockId] = mergedIds;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

        /**
         * KNOWN LIMITATION: localStorage race condition
         *
         * If two tabs dismiss different suggestions simultaneously:
         * 1. Both read localStorage before either writes
         * 2. Second write overwrites first, losing one dismissal
         * 3. In-memory state stays correct via storage events
         * 4. Lost dismissal only affects post-reload state
         *
         * Trade-off: Acceptable for this use case because:
         * - Concurrent multi-tab resume editing is rare
         * - Worst case: dismissed suggestion reappears on reload
         * - User can simply dismiss again (non-critical data)
         * - In-memory state remains correct during session
         *
         * Future migration options if stricter consistency needed:
         * - IndexedDB with transactions (atomic operations)
         * - Backend persistence layer (Convex user preferences)
         * - Browser locks API (experimental, limited support)
         *
         * References:
         * - localStorage is not atomic: https://html.spec.whatwg.org/multipage/webstorage.html
         * - IndexedDB transactions: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
         */
      } catch (error) {
        console.error('Failed to save dismissed suggestions:', error);
      }

      return newDismissed;
    });

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
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (compact) {
    // Compact mode: Show count badge with tooltip
    // Determine badge color based on highest priority suggestion
    const hasHighPriority = visibleSuggestions.some(s => s.priority === 'high');
    const hasMediumPriority = visibleSuggestions.some(s => s.priority === 'medium');

    const highestPriority = hasHighPriority ? 'high' : hasMediumPriority ? 'medium' : 'low';
    const badgeColorClass = getPriorityColorClass(highestPriority, 'badge');

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-help ${badgeColorClass}`}>
              <Lightbulb className="h-3 w-3" />
              <span data-testid="suggestion-count">{visibleSuggestions.length}</span>
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
            ${getPriorityColorClass(suggestion.priority, 'card')}
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
            data-testid="dismiss-button"
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
 * Get color classes based on priority and variant
 */
const getPriorityColorClass = (
  priority: ContentSuggestion['priority'],
  variant: 'badge' | 'card'
) => {
  const colors = {
    high:
      variant === 'badge'
        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
    medium:
      variant === 'badge'
        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900',
    low:
      variant === 'badge'
        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900',
  };
  return colors[priority] ?? colors.low; // Fallback to low priority styling
};

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

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColorClass(priority, 'badge')}`}>
      <Lightbulb className="h-3 w-3" />
      {count}
    </span>
  );
}
