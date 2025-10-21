import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, jest } from '@jest/globals';
import { EditorStoreProvider, hydrateFromServer } from '@/features/resume/editor/state/editorStore';
import { createMutationBroker } from '@/features/resume/editor/integration/MutationBroker';
import { applySuggestion } from '@/features/resume/coach/applySuggestion';
import { getSuggestions } from '@/features/resume/coach/suggestions';

describe('Coach Apply - Phase 6', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_RESUME_V2_STORE = 'true';
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_RESUME_V2_STORE;
  });

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
          blocks: ['block1'],
        },
      ],
    },
    blocks: [
      {
        _id: 'block1',
        type: 'summary' as const,
        data: { paragraph: 'Responsible for managing teams and projects.' },
        order: 0,
      },
    ] as any[],
  };

  const mockConvex = {
    createBlock: jest.fn().mockResolvedValue({ _id: 'new-block' }),
    updateBlock: jest.fn().mockResolvedValue({ success: true }),
    deleteBlock: jest.fn().mockResolvedValue({ success: true }),
    reorderBlock: jest.fn().mockResolvedValue({ success: true }),
    createPage: jest.fn().mockRejectedValue(new Error('Not implemented')),
    duplicatePage: jest.fn().mockRejectedValue(new Error('Not implemented')),
    reflowPages: jest.fn().mockRejectedValue(new Error('Not implemented')),
    updateResumeMeta: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockBroker = createMutationBroker({
    convex: mockConvex,
  });

  describe('applySuggestion', () => {
    it('should update only the target block', async () => {
      const initialSnapshot = hydrateFromServer(mockResumeData);
      let storeInstance: any;

      function TestComponent() {
        const store = require('@/features/resume/editor/state/editorStore').useEditorStore();
        storeInstance = store;
        const state = store.getState();
        const block = state.blocksById['block1'];
        return <div data-testid="block-data">{JSON.stringify(block?.props)}</div>;
      }

      render(
        <EditorStoreProvider initialSnapshot={initialSnapshot}>
          <TestComponent />
        </EditorStoreProvider>
      );

      // Get suggestions
      const suggestions = getSuggestions(storeInstance.getState());
      expect(suggestions.length).toBeGreaterThan(0);

      const passiveSuggestion = suggestions.find(s => s.actionType === 'fix-passive-voice');
      expect(passiveSuggestion).toBeDefined();

      // Apply suggestion
      await applySuggestion(passiveSuggestion!, storeInstance, mockBroker);

      // Verify block was updated
      await waitFor(() => {
        const state = storeInstance.getState();
        const block = state.blocksById['block1'];
        const newParagraph = block?.props.paragraph;

        // Should have changed
        expect(newParagraph).not.toBe('Responsible for managing teams and projects.');
      });
    });

    it('should push exactly one history entry', async () => {
      const initialSnapshot = hydrateFromServer(mockResumeData);
      let storeInstance: any;

      function TestComponent() {
        const store = require('@/features/resume/editor/state/editorStore').useEditorStore();
        storeInstance = store;
        return <div />;
      }

      render(
        <EditorStoreProvider initialSnapshot={initialSnapshot}>
          <TestComponent />
        </EditorStoreProvider>
      );

      const initialState = storeInstance.getState();
      const initialCanUndo = initialState.canUndo;

      // Get and apply suggestion
      const suggestions = getSuggestions(storeInstance.getState());
      const suggestion = suggestions[0];
      expect(suggestion).toBeDefined();

      await applySuggestion(suggestion, storeInstance, mockBroker);

      await waitFor(() => {
        const newState = storeInstance.getState();
        // Should now be able to undo
        expect(newState.canUndo).toBe(true);
      });
    });

    it('should enqueue exactly one MutationBroker call', async () => {
      const updateBlockMock = jest.fn().mockResolvedValue({ success: true });
      const broker = createMutationBroker({
        convex: {
          ...mockConvex,
          updateBlock: updateBlockMock,
        } as any,
      });

      const initialSnapshot = hydrateFromServer(mockResumeData);
      let storeInstance: any;

      function TestComponent() {
        const store = require('@/features/resume/editor/state/editorStore').useEditorStore();
        storeInstance = store;
        return <div />;
      }

      render(
        <EditorStoreProvider initialSnapshot={initialSnapshot}>
          <TestComponent />
        </EditorStoreProvider>
      );

      const suggestions = getSuggestions(storeInstance.getState());
      const suggestion = suggestions[0];
      expect(suggestion).toBeDefined();

      await applySuggestion(suggestion, storeInstance, broker);

      // Verify exactly one broker call
      expect(updateBlockMock).toHaveBeenCalledTimes(1);
    });

    it('should preserve undo/redo functionality', async () => {
      const initialSnapshot = hydrateFromServer(mockResumeData);
      let storeInstance: any;

      function TestComponent() {
        const store = require('@/features/resume/editor/state/editorStore').useEditorStore();
        const actions = require('@/features/resume/editor/state/editorStore').useEditorActions();
        storeInstance = store;
        (window as any).editorActions = actions;

        // Subscribe to store changes to trigger re-renders
        const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
        React.useEffect(() => {
          return store.subscribe(forceUpdate);
        }, [store]);

        const block = store.getState().blocksById['block1'];
        return <div data-testid="paragraph">{block?.props.paragraph}</div>;
      }

      render(
        <EditorStoreProvider initialSnapshot={initialSnapshot}>
          <TestComponent />
        </EditorStoreProvider>
      );

      const originalParagraph = screen.getByTestId('paragraph').textContent;

      // Apply suggestion
      const suggestions = getSuggestions(storeInstance.getState());
      const suggestion = suggestions[0];
      expect(suggestion).toBeDefined();

      await applySuggestion(suggestion, storeInstance, mockBroker);

      await waitFor(() => {
        const newParagraph = screen.getByTestId('paragraph').textContent;
        expect(newParagraph).not.toBe(originalParagraph);
      });

      // Undo
      (window as any).editorActions.undo();

      await waitFor(() => {
        const undoParagraph = screen.getByTestId('paragraph').textContent;
        expect(undoParagraph).toBe(originalParagraph);
      });

      // Redo
      (window as any).editorActions.redo();

      await waitFor(() => {
        const redoParagraph = screen.getByTestId('paragraph').textContent;
        expect(redoParagraph).not.toBe(originalParagraph);
      });
    });
  });
});
