import {
  createHistoryState,
  pushHistory,
  undoHistory,
  redoHistory,
  canUndo,
  canRedo,
  replacePresent,
} from '@/features/resume/editor/state/history';
import type { EditorSnapshot } from '@/features/resume/editor/types/editorTypes';

describe('History System', () => {
  const createMockSnapshot = (value: string): EditorSnapshot => ({
    blocksById: { [value]: { id: value, type: 'text', parentId: null, props: {} } as any },
    pagesById: {},
    pageOrder: [],
    selectedIds: [],
    docMeta: {
      resumeId: 'test' as any,
      title: 'Test',
      updatedAt: Date.now(),
      lastSyncedAt: Date.now(),
      version: 1,
    },
    isDirty: false,
    lastChangedAt: Date.now(),
  });

  describe('createHistoryState', () => {
    it('should create initial history with empty past and future', () => {
      const snapshot = createMockSnapshot('initial');
      const history = createHistoryState(snapshot, { type: 'doc-meta' });

      expect(history.past).toEqual([]);
      expect(history.future).toEqual([]);
      expect(history.present.snapshot).toBe(snapshot);
      expect(history.present.meta.type).toBe('doc-meta');
    });
  });

  describe('pushHistory', () => {
    it('should add snapshot to history', () => {
      const snapshot1 = createMockSnapshot('s1');
      let history = createHistoryState(snapshot1, { type: 'doc-meta' });

      const snapshot2 = createMockSnapshot('s2');
      history = pushHistory(history, snapshot2, { type: 'create', blockId: 's2' });

      expect(history.past.length).toBe(1);
      expect(history.past[0].snapshot).toBe(snapshot1);
      expect(history.present.snapshot).toBe(snapshot2);
      expect(history.future).toEqual([]);
    });

    it('should clear future when pushing new history', () => {
      const snapshot1 = createMockSnapshot('s1');
      let history = createHistoryState(snapshot1, { type: 'doc-meta' });

      const snapshot2 = createMockSnapshot('s2');
      history = pushHistory(history, snapshot2, { type: 'create', blockId: 's2' });

      // Undo to create future
      const undoResult = undoHistory(history);
      history = undoResult.history;
      expect(history.future.length).toBe(1);

      // Push new change should clear future
      const snapshot3 = createMockSnapshot('s3');
      history = pushHistory(history, snapshot3, { type: 'create', blockId: 's3' });

      expect(history.future).toEqual([]);
    });

    it('should enforce ring buffer limit of 100', () => {
      const snapshot1 = createMockSnapshot('s1');
      let history = createHistoryState(snapshot1, { type: 'doc-meta' });

      // Add 101 more snapshots
      for (let i = 2; i <= 102; i++) {
        const snapshot = createMockSnapshot(`s${i}`);
        history = pushHistory(history, snapshot, { type: 'create', blockId: `s${i}` });
      }

      // Past should be exactly 100 (ring buffer enforces limit)
      expect(history.past.length).toBe(100);
    });
  });

  describe('coalescing', () => {
    it('should coalesce text edits within 250ms window', () => {
      const snapshot1 = createMockSnapshot('s1');
      let history = createHistoryState(snapshot1, { type: 'doc-meta' });

      // First edit
      const snapshot2 = createMockSnapshot('s2');
      history = pushHistory(history, snapshot2, { type: 'block-prop', blockId: 'b1', propKey: 'text' });

      expect(history.past.length).toBe(1);

      // Second edit within 250ms window - should coalesce
      const snapshot3 = createMockSnapshot('s3');
      history = pushHistory(history, snapshot3, { type: 'block-prop', blockId: 'b1', propKey: 'text' });

      // Past should still be 1 because it coalesced
      expect(history.past.length).toBe(1);
      expect(history.present.snapshot).toBe(snapshot3);
    });

    it('should not coalesce text edits outside 250ms window', async () => {
      const snapshot1 = createMockSnapshot('s1');
      let history = createHistoryState(snapshot1, { type: 'doc-meta' });

      // First edit
      const snapshot2 = createMockSnapshot('s2');
      history = pushHistory(history, snapshot2, { type: 'block-prop', blockId: 'b1', propKey: 'text' });

      expect(history.past.length).toBe(1);

      // Wait longer than coalescing window
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Second edit after delay - should not coalesce
      const snapshot3 = createMockSnapshot('s3');
      history = pushHistory(history, snapshot3, { type: 'block-prop', blockId: 'b1', propKey: 'text' });

      expect(history.past.length).toBe(2);
      expect(history.present.snapshot).toBe(snapshot3);
    });

    it('should not coalesce edits to different blocks', () => {
      const snapshot1 = createMockSnapshot('s1');
      let history = createHistoryState(snapshot1, { type: 'doc-meta' });

      const snapshot2 = createMockSnapshot('s2');
      history = pushHistory(history, snapshot2, { type: 'block-prop', blockId: 'b1', propKey: 'text' });

      const snapshot3 = createMockSnapshot('s3');
      history = pushHistory(history, snapshot3, { type: 'block-prop', blockId: 'b2', propKey: 'text' });

      expect(history.past.length).toBe(2); // Should not coalesce different blocks
    });

    it('should not coalesce edits to different properties', () => {
      const snapshot1 = createMockSnapshot('s1');
      let history = createHistoryState(snapshot1, { type: 'doc-meta' });

      const snapshot2 = createMockSnapshot('s2');
      history = pushHistory(history, snapshot2, { type: 'block-prop', blockId: 'b1', propKey: 'text' });

      const snapshot3 = createMockSnapshot('s3');
      history = pushHistory(history, snapshot3, { type: 'block-prop', blockId: 'b1', propKey: 'color' });

      expect(history.past.length).toBe(2); // Should not coalesce different props
    });

    it('should not coalesce structural operations', () => {
      const snapshot1 = createMockSnapshot('s1');
      let history = createHistoryState(snapshot1, { type: 'doc-meta' });

      const snapshot2 = createMockSnapshot('s2');
      history = pushHistory(history, snapshot2, { type: 'create', blockId: 'b1' });

      const snapshot3 = createMockSnapshot('s3');
      history = pushHistory(history, snapshot3, { type: 'delete', blockId: 'b2' });

      expect(history.past.length).toBe(2); // Structural ops never coalesce
    });
  });

  describe('undo/redo', () => {
    it('should undo to previous state', () => {
      const snapshot1 = createMockSnapshot('s1');
      let history = createHistoryState(snapshot1, { type: 'doc-meta' });

      const snapshot2 = createMockSnapshot('s2');
      history = pushHistory(history, snapshot2, { type: 'create', blockId: 's2' });

      const result = undoHistory(history);
      expect(result.snapshot).toBe(snapshot1);
      expect(result.history.present.snapshot).toBe(snapshot1);
      expect(result.history.future.length).toBe(1);
      expect(result.history.future[0].snapshot).toBe(snapshot2);
    });

    it('should redo to next state', () => {
      const snapshot1 = createMockSnapshot('s1');
      let history = createHistoryState(snapshot1, { type: 'doc-meta' });

      const snapshot2 = createMockSnapshot('s2');
      history = pushHistory(history, snapshot2, { type: 'create', blockId: 's2' });

      // Undo
      const undoResult = undoHistory(history);
      history = undoResult.history;

      // Redo
      const redoResult = redoHistory(history);
      expect(redoResult.snapshot).toBe(snapshot2);
      expect(redoResult.history.present.snapshot).toBe(snapshot2);
      expect(redoResult.history.future).toEqual([]);
    });

    it('should not undo when past is empty', () => {
      const snapshot1 = createMockSnapshot('s1');
      const history = createHistoryState(snapshot1, { type: 'doc-meta' });

      const result = undoHistory(history);
      expect(result.snapshot).toBeNull();
      expect(result.history).toBe(history);
    });

    it('should not redo when future is empty', () => {
      const snapshot1 = createMockSnapshot('s1');
      const history = createHistoryState(snapshot1, { type: 'doc-meta' });

      const result = redoHistory(history);
      expect(result.snapshot).toBeNull();
      expect(result.history).toBe(history);
    });
  });

  describe('canUndo/canRedo', () => {
    it('should return false when past is empty', () => {
      const snapshot = createMockSnapshot('s1');
      const history = createHistoryState(snapshot, { type: 'doc-meta' });

      expect(canUndo(history)).toBe(false);
    });

    it('should return true when past has entries', () => {
      const snapshot1 = createMockSnapshot('s1');
      let history = createHistoryState(snapshot1, { type: 'doc-meta' });

      const snapshot2 = createMockSnapshot('s2');
      history = pushHistory(history, snapshot2, { type: 'create', blockId: 's2' });

      expect(canUndo(history)).toBe(true);
    });

    it('should return false when future is empty', () => {
      const snapshot = createMockSnapshot('s1');
      const history = createHistoryState(snapshot, { type: 'doc-meta' });

      expect(canRedo(history)).toBe(false);
    });

    it('should return true when future has entries', () => {
      const snapshot1 = createMockSnapshot('s1');
      let history = createHistoryState(snapshot1, { type: 'doc-meta' });

      const snapshot2 = createMockSnapshot('s2');
      history = pushHistory(history, snapshot2, { type: 'create', blockId: 's2' });

      const undoResult = undoHistory(history);
      history = undoResult.history;

      expect(canRedo(history)).toBe(true);
    });
  });

  describe('replacePresent', () => {
    it('should update present without affecting past or future', () => {
      const snapshot1 = createMockSnapshot('s1');
      let history = createHistoryState(snapshot1, { type: 'doc-meta' });

      const snapshot2 = createMockSnapshot('s2');
      history = pushHistory(history, snapshot2, { type: 'create', blockId: 's2' });

      const snapshot3 = createMockSnapshot('s3');
      history = replacePresent(history, snapshot3);

      expect(history.present.snapshot).toBe(snapshot3);
      expect(history.past.length).toBe(1);
      expect(history.future).toEqual([]);
    });
  });
});
