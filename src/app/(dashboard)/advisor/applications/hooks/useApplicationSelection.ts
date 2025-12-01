/**
 * Hook for managing multi-select state in table/kanban views
 *
 * Supports:
 * - Individual selection/deselection
 * - Select all (with filter awareness)
 * - Range selection (Shift+Click)
 * - Keyboard shortcuts
 */

import { Id } from 'convex/_generated/dataModel';
import { useCallback, useState } from 'react';

import { ApplicationSelection, EMPTY_SELECTION } from '../types';

export interface UseApplicationSelectionResult {
  // State
  selection: ApplicationSelection;
  selectedCount: number;
  isSelected: (id: Id<'applications'>) => boolean;
  isAllSelected: boolean;

  // Actions
  toggleSelection: (id: Id<'applications'>) => void;
  toggleAll: (allIds: Id<'applications'>[]) => void;
  selectRange: (
    startId: Id<'applications'>,
    endId: Id<'applications'>,
    allIds: Id<'applications'>[],
  ) => void;
  clearSelection: () => void;
  selectOnly: (id: Id<'applications'>) => void;

  // Utilities
  getSelectedIds: () => Id<'applications'>[];
}

/**
 * Hook for managing application selection state
 */
export function useApplicationSelection(): UseApplicationSelectionResult {
  const [selection, setSelection] = useState<ApplicationSelection>(EMPTY_SELECTION);

  /**
   * Check if an application is selected
   */
  const isSelected = useCallback(
    (id: Id<'applications'>): boolean => {
      const idStr = id.toString();

      if (selection.selectAll) {
        // When select all is active, selected unless explicitly excluded
        return !selection.excludedIds.has(idStr);
      }

      // Normal mode: selected if in the set
      return selection.selectedIds.has(idStr);
    },
    [selection],
  );

  /**
   * Toggle selection of a single application
   */
  const toggleSelection = useCallback((id: Id<'applications'>) => {
    setSelection((prev) => {
      const idStr = id.toString();

      if (prev.selectAll) {
        // In select-all mode, toggle by adding/removing from excluded set
        const newExcludedIds = new Set(prev.excludedIds);
        if (newExcludedIds.has(idStr)) {
          newExcludedIds.delete(idStr);
        } else {
          newExcludedIds.add(idStr);
        }

        return {
          ...prev,
          excludedIds: newExcludedIds,
        };
      }

      // Normal mode: toggle in selected set
      const newSelectedIds = new Set(prev.selectedIds);
      if (newSelectedIds.has(idStr)) {
        newSelectedIds.delete(idStr);
      } else {
        newSelectedIds.add(idStr);
      }

      return {
        ...prev,
        selectedIds: newSelectedIds,
      };
    });
  }, []);

  /**
   * Toggle select all (respects current filters)
   */
  const toggleAll = useCallback((allIds: Id<'applications'>[]) => {
    setSelection((prev) => {
      // If no items to select, just clear selection
      if (allIds.length === 0) {
        return EMPTY_SELECTION;
      }

      // If currently in select-all mode or all are selected, deselect all
      const allIdsSelected = allIds.every((id) => prev.selectedIds.has(id.toString()));
      const currentlyAllSelected =
        (prev.selectAll && prev.excludedIds.size === 0) || allIdsSelected;

      if (currentlyAllSelected) {
        return EMPTY_SELECTION;
      }

      // Enter select-all mode
      // Note: selectedIds holds the current page's IDs for materialization (getSelectedIds),
      // while selection checks rely on excludedIds in select-all mode.
      return {
        selectAll: true,
        selectedIds: new Set(allIds.map((id) => id.toString())),
        excludedIds: new Set(),
      };
    });
  }, []);

  /**
   * Select a range of applications (for Shift+Click)
   */
  const selectRange = useCallback(
    (startId: Id<'applications'>, endId: Id<'applications'>, allIds: Id<'applications'>[]) => {
      // Compare by string value to avoid object reference mismatch issues
      const startIdStr = startId.toString();
      const endIdStr = endId.toString();
      const startIdx = allIds.findIndex((id) => id.toString() === startIdStr);
      const endIdx = allIds.findIndex((id) => id.toString() === endIdStr);

      if (startIdx === -1 || endIdx === -1) return;

      const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      const rangeIds = allIds.slice(from, to + 1);

      setSelection((prev) => {
        const newSelectedIds = new Set(prev.selectedIds);
        rangeIds.forEach((id) => newSelectedIds.add(id.toString()));

        return {
          selectAll: false,
          selectedIds: newSelectedIds,
          excludedIds: new Set(),
        };
      });
    },
    [],
  );

  /**
   * Clear all selection
   */
  const clearSelection = useCallback(() => {
    setSelection(EMPTY_SELECTION);
  }, []);

  /**
   * Select only a single application (deselect all others)
   */
  const selectOnly = useCallback((id: Id<'applications'>) => {
    setSelection({
      selectAll: false,
      selectedIds: new Set([id.toString()]),
      excludedIds: new Set(),
    });
  }, []);

  /**
   * Get array of selected application IDs
   * In select-all mode, filters out excluded IDs
   *
   * Note: IDs are stored as strings internally (via .toString()) but cast back to
   * Id<'applications'>[] for type compatibility with Convex mutations. This is safe
   * because Convex Id types are branded strings - the underlying value is the same.
   * The mutations validate IDs server-side regardless.
   */
  const getSelectedIds = useCallback((): Id<'applications'>[] => {
    if (selection.selectAll) {
      // In select-all mode, return all IDs except excluded ones
      return Array.from(selection.selectedIds).filter(
        (id) => !selection.excludedIds.has(id),
      ) as Id<'applications'>[];
    }
    // Normal mode: return all selected IDs
    return Array.from(selection.selectedIds) as Id<'applications'>[];
  }, [selection.selectedIds, selection.excludedIds, selection.selectAll]);

  /**
   * Compute selected count
   */
  const selectedCount = selection.selectAll
    ? Math.max(0, selection.selectedIds.size - selection.excludedIds.size)
    : selection.selectedIds.size;

  /**
   * Check if all are selected
   */
  const isAllSelected = selection.selectAll && selection.excludedIds.size === 0;

  return {
    selection,
    selectedCount,
    isSelected,
    isAllSelected,
    toggleSelection,
    toggleAll,
    selectRange,
    clearSelection,
    selectOnly,
    getSelectedIds,
  };
}

/**
 * Hook for keyboard shortcuts in selection context
 */
export function useSelectionKeyboardShortcuts(
  selection: UseApplicationSelectionResult,
  allIds: Id<'applications'>[],
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Cmd/Ctrl + A: Select all (but allow default in text inputs)
      if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
        if (isInputFocused) return; // Allow default text selection in inputs
        event.preventDefault();
        selection.toggleAll(allIds);
      }

      // Escape: Clear selection
      if (event.key === 'Escape' && selection.selectedCount > 0) {
        event.preventDefault();
        selection.clearSelection();
      }
    },
    [selection, allIds],
  );

  return { handleKeyDown };
}
