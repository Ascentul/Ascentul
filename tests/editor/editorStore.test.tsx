import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { EditorStoreProvider, hydrateFromServer, useEditorStore, useEditorActions } from '@/features/resume/editor/state/editorStore';
import type { EditorBlockNode } from '@/features/resume/editor/types/editorTypes';

describe('EditorStore', () => {
  const mockResumeData = {
    resume: {
      _id: 'resume123' as any,
      title: 'Test Resume',
      templateSlug: 'modern',
      themeId: 'theme1' as any,
      updatedAt: Date.now(),
      version: 1,
      pages: [
        {
          id: 'page1',
          size: 'Letter' as const,
          margins: { top: 72, right: 72, bottom: 72, left: 72 },
          blocks: ['block1', 'block2'],
        },
      ],
    },
    blocks: [
      {
        _id: 'block1',
        type: 'heading' as const,
        data: { text: 'Hello' },
        order: 0,
      },
      {
        _id: 'block2',
        type: 'text' as const,
        data: { content: 'World' },
        order: 1,
      },
    ] as any[],
  };

  function createTestStoreWrapper() {
    const snapshot = hydrateFromServer(mockResumeData);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <EditorStoreProvider initialSnapshot={snapshot}>{children}</EditorStoreProvider>
    );
    const { result } = renderHook(() => ({
      store: useEditorStore(),
      actions: useEditorActions(),
    }), { wrapper });
    return result.current;
  }

  // Helper function to create a test store directly
  function createTestStore() {
    const snapshot = hydrateFromServer(mockResumeData);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <EditorStoreProvider initialSnapshot={snapshot}>{children}</EditorStoreProvider>
    );
    const { result } = renderHook(() => useEditorStore(), { wrapper });
    return result.current;
  }

  describe('createBlock', () => {
    it('should add a new block to the page', () => {
      const { store, actions } = createTestStoreWrapper();
      const initialState = store.getState();

      const newBlock: EditorBlockNode = {
        id: 'block3',
        type: 'text' as any,
        parentId: null,
        props: { content: 'New block' },
      };

      act(() => {
        actions.createBlock(newBlock, 'page1');
      });

      const nextState = store.getState();
      expect(nextState.blocksById['block3']).toEqual({
        ...newBlock,
        parentId: 'page1',
      });
      expect(nextState.pagesById['page1'].blockIds).toContain('block3');
      expect(nextState.selectedIds).toEqual(['block3']);
      expect(nextState.isDirty).toBe(true);
    });

    it('should insert block at specified index', () => {
      const store = createTestStore();

      const newBlock: EditorBlockNode = {
        id: 'block3',
        type: 'text' as any,
        parentId: null,
        props: { content: 'Inserted' },
      };

      store.createBlock(newBlock, 'page1', 1); // Insert at index 1

      const state = store.getState();
      expect(state.pagesById['page1'].blockIds).toEqual(['block1', 'block3', 'block2']);
    });
  });

  describe('updateBlockProps', () => {
    it('should update block properties', () => {
      const store = createTestStore();

      store.updateBlockProps('block1', { text: 'Updated' });

      const state = store.getState();
      expect(state.blocksById['block1'].props.text).toBe('Updated');
      expect(state.isDirty).toBe(true);
    });

    it('should not update if props are identical', () => {
      const store = createTestStore();
      const initialState = store.getState();
      const initialTimestamp = initialState.lastChangedAt;

      store.updateBlockProps('block1', { text: 'Hello' }); // Same value

      const nextState = store.getState();
      // Should not trigger update if value is the same
      expect(nextState.lastChangedAt).toBe(initialTimestamp);
    });
  });

  describe('deleteBlock', () => {
    it('should remove block from store and page', () => {
      const store = createTestStore();

      store.deleteBlock('block1');

      const state = store.getState();
      expect(state.blocksById['block1']).toBeUndefined();
      expect(state.pagesById['page1'].blockIds).not.toContain('block1');
      expect(state.isDirty).toBe(true);
    });

    it('should remove block from selection if deleted', () => {
      const store = createTestStore();
      store.select(['block1', 'block2']);

      store.deleteBlock('block1');

      const state = store.getState();
      expect(state.selectedIds).toEqual(['block2']);
    });
  });

  describe('reorderBlock', () => {
    it('should move block within page', () => {
      const store = createTestStore();

      store.reorderBlock('page1', 0, 1); // Move block1 from index 0 to 1

      const state = store.getState();
      expect(state.pagesById['page1'].blockIds).toEqual(['block2', 'block1']);
      expect(state.isDirty).toBe(true);
    });

    it('should not update if indices are the same', () => {
      const store = createTestStore();
      const initialState = store.getState();

      store.reorderBlock('page1', 0, 0);

      const nextState = store.getState();
      expect(nextState).toBe(initialState);
    });
  });

  describe('undo/redo', () => {
    it('should undo block creation', () => {
      const store = createTestStore();
      const initialState = store.getState();

      const newBlock: EditorBlockNode = {
        id: 'block3',
        type: 'text' as any,
        parentId: null,
        props: { content: 'Temp' },
      };

      store.createBlock(newBlock, 'page1');
      expect(store.getState().blocksById['block3']).toBeDefined();

      store.undo();
      const undoneState = store.getState();
      expect(undoneState.blocksById['block3']).toBeUndefined();
      expect(undoneState.canRedo).toBe(true);
    });

    it('should redo undone action', () => {
      const store = createTestStore();

      const newBlock: EditorBlockNode = {
        id: 'block3',
        type: 'text' as any,
        parentId: null,
        props: { content: 'Temp' },
      };

      store.createBlock(newBlock, 'page1');
      store.undo();
      store.redo();

      const state = store.getState();
      expect(state.blocksById['block3']).toBeDefined();
      expect(state.canRedo).toBe(false);
    });

    it('should support multiple undo/redo cycles', () => {
      const store = createTestStore();

      store.updateBlockProps('block1', { text: 'V1' });
      store.updateBlockProps('block1', { text: 'V2' });
      store.updateBlockProps('block1', { text: 'V3' });

      store.undo();
      expect(store.getState().blocksById['block1'].props.text).toBe('V2');

      store.undo();
      expect(store.getState().blocksById['block1'].props.text).toBe('V1');

      store.redo();
      expect(store.getState().blocksById['block1'].props.text).toBe('V2');
    });
  });

  describe('markSaved', () => {
    it('should clear dirty flag and update timestamps', () => {
      const store = createTestStore();

      store.updateBlockProps('block1', { text: 'Modified' });
      expect(store.getState().isDirty).toBe(true);

      const now = Date.now();
      store.markSaved('resume123' as any, now);

      const state = store.getState();
      expect(state.isDirty).toBe(false);
      expect(state.docMeta.updatedAt).toBe(now);
      expect(state.docMeta.lastSyncedAt).toBe(now);
    });
  });

  describe('selection', () => {
    it('should select blocks', () => {
      const store = createTestStore();

      store.select(['block1']);

      const state = store.getState();
      expect(state.selectedIds).toEqual(['block1']);
    });

    it('should clear selection', () => {
      const store = createTestStore();
      store.select(['block1', 'block2']);

      store.clearSelection();

      const state = store.getState();
      expect(state.selectedIds).toEqual([]);
    });

    it('should not update if selection is identical', () => {
      const store = createTestStore();
      store.select(['block1']);
      const timestamp1 = store.getState().lastChangedAt;

      store.select(['block1']); // Same selection
      const timestamp2 = store.getState().lastChangedAt;

      expect(timestamp1).toBe(timestamp2);
    });
  });
});
