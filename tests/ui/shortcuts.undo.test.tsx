import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditorStoreProvider, hydrateFromServer, useEditorStore, useEditorActions } from '@/features/resume/editor/state/editorStore';
import { useHistoryShortcuts } from '@/features/resume/editor/input/useHistoryShortcuts';

describe('Keyboard Shortcuts - Undo/Redo', () => {
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
        type: 'heading' as const,
        data: { text: 'Original Text' },
        order: 0,
      },
    ] as any[],
  };

  function TestComponent() {
    useHistoryShortcuts();
    const store = useEditorStore();
    const actions = useEditorActions();
    const state = store.getState();
    const block1 = state.blocksById['block1'];

    return (
      <div>
        <div data-testid="block-text">{(block1?.props.text as string) || 'N/A'}</div>
        <div data-testid="can-undo">{state.canUndo ? 'true' : 'false'}</div>
        <div data-testid="can-redo">{state.canRedo ? 'true' : 'false'}</div>
        <button
          data-testid="update-btn"
          onClick={() => actions.updateBlockProps('block1', { text: 'Updated Text' })}
        >
          Update
        </button>
      </div>
    );
  }

  it('should handle Cmd+Z for undo in Canvas (Mac)', async () => {
    const initialSnapshot = hydrateFromServer(mockResumeData);

    // Mock Mac platform
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
      configurable: true,
    });

    render(
      <EditorStoreProvider initialSnapshot={initialSnapshot}>
        <TestComponent />
      </EditorStoreProvider>
    );

    // Initial state
    expect(screen.getByTestId('block-text')).toHaveTextContent('Original Text');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('false');

    // Make a change
    const updateBtn = screen.getByTestId('update-btn');
    updateBtn.click();

    await waitFor(() => {
      expect(screen.getByTestId('block-text')).toHaveTextContent('Updated Text');
      expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
    });

    // Trigger Cmd+Z
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByTestId('block-text')).toHaveTextContent('Original Text');
      expect(screen.getByTestId('can-undo')).toHaveTextContent('false');
      expect(screen.getByTestId('can-redo')).toHaveTextContent('true');
    });
  });

  it('should handle Ctrl+Z for undo in Canvas (Windows)', async () => {
    const initialSnapshot = hydrateFromServer(mockResumeData);

    // Mock Windows platform
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      writable: true,
      configurable: true,
    });

    render(
      <EditorStoreProvider initialSnapshot={initialSnapshot}>
        <TestComponent />
      </EditorStoreProvider>
    );

    // Make a change
    const updateBtn = screen.getByTestId('update-btn');
    updateBtn.click();

    await waitFor(() => {
      expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
    });

    // Trigger Ctrl+Z
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByTestId('block-text')).toHaveTextContent('Original Text');
      expect(screen.getByTestId('can-redo')).toHaveTextContent('true');
    });
  });

  it('should handle Cmd+Shift+Z for redo', async () => {
    const initialSnapshot = hydrateFromServer(mockResumeData);

    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
      configurable: true,
    });

    render(
      <EditorStoreProvider initialSnapshot={initialSnapshot}>
        <TestComponent />
      </EditorStoreProvider>
    );

    // Make a change
    const updateBtn = screen.getByTestId('update-btn');
    updateBtn.click();

    await waitFor(() => {
      expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
    });

    // Undo
    const undoEvent = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(undoEvent);

    await waitFor(() => {
      expect(screen.getByTestId('can-redo')).toHaveTextContent('true');
    });

    // Redo with Shift
    const redoEvent = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(redoEvent);

    await waitFor(() => {
      expect(screen.getByTestId('block-text')).toHaveTextContent('Updated Text');
      expect(screen.getByTestId('can-redo')).toHaveTextContent('false');
    });
  });

  it('should NOT intercept shortcuts in input fields', async () => {
    const initialSnapshot = hydrateFromServer(mockResumeData);

    function TestWithInput() {
      useHistoryShortcuts();
      const store = useEditorStore();
      const actions = useEditorActions();
      const state = store.getState();

      return (
        <div>
          <div data-testid="can-undo">{state.canUndo ? 'true' : 'false'}</div>
          <input
            data-testid="test-input"
            type="text"
            defaultValue="test"
          />
          <button
            data-testid="make-change"
            onClick={() => actions.updateBlockProps('block1', { text: 'Changed' })}
          >
            Change
          </button>
        </div>
      );
    }

    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
      configurable: true,
    });

    render(
      <EditorStoreProvider initialSnapshot={initialSnapshot}>
        <TestWithInput />
      </EditorStoreProvider>
    );

    // Make a change to enable undo
    const changeBtn = screen.getByTestId('make-change');
    changeBtn.click();

    await waitFor(() => {
      expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
    });

    // Focus input
    const input = screen.getByTestId('test-input') as HTMLInputElement;
    input.focus();

    // Trigger Cmd+Z while input is focused - should NOT be intercepted
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: input, writable: false });
    window.dispatchEvent(event);

    // Store undo should NOT have been triggered (canUndo should still be true)
    await waitFor(() => {
      expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
    });
  });
});
