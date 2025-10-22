import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  EditorStoreProvider,
  hydrateFromServer,
  useEditorStore,
  useEditorActions,
  useEditorSelector,
} from '@/features/resume/editor/state/editorStore';
import { useBlockData } from '@/features/resume/editor/state/selectors';
import type { HeaderData, SummaryData } from '@/lib/resume-types';
import type { Id } from '../../convex/_generated/dataModel';

describe('Inspector Binding - Phase 4', () => {
  beforeAll(() => {
    // Enable V2 store for these tests
    process.env.NEXT_PUBLIC_RESUME_V2_STORE = 'true';
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_RESUME_V2_STORE;
  });

  const mockResumeData = {
    resume: {
      _id: 'resume123' as Id<'builder_resumes'>,
      title: 'Test Resume',
      templateSlug: 'modern',
      themeId: 'theme1' as Id<'builder_resume_themes'>,
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
        _id: 'block1' as Id<'resume_blocks'>,
        resumeId: 'resume123' as Id<'builder_resumes'>,
        type: 'header' as const,
        data: { fullName: 'John Doe', title: 'Software Engineer' } as HeaderData,
        order: 0,
        locked: false,
      },
      {
        _id: 'block2' as Id<'resume_blocks'>,
        resumeId: 'resume123' as Id<'builder_resumes'>,
        type: 'summary' as const,
        data: { paragraph: 'Original summary text' } as SummaryData,
        order: 1,
        locked: false,
      },
    ],
  };

  function TestComponent({ blockId }: { blockId: string }) {
    const actions = useEditorActions();
    const blockData = useBlockData<HeaderData>(blockId);
    const canUndo = useEditorSelector((state) => state.canUndo);
    const canRedo = useEditorSelector((state) => state.canRedo);

    const startRef = React.useRef<number | null>(null);
    const [latency, setLatency] = React.useState<number | null>(null);

    React.useEffect(() => {
      if (startRef.current !== null && blockData && 'fullName' in blockData && blockData.fullName === 'Jane Smith') {
        setLatency(performance.now() - startRef.current);
        startRef.current = null;
      }
    }, [blockData]);

    return (
      <div>
        <div data-testid="block-data">{JSON.stringify(blockData)}</div>
        <div data-testid="latency">{latency ?? ''}</div>
        <div data-testid="can-undo">{canUndo ? 'true' : 'false'}</div>
        <div data-testid="can-redo">{canRedo ? 'true' : 'false'}</div>
        <button
          data-testid="update-btn"
          onClick={() => {
            if (blockData && 'fullName' in blockData) {
              startRef.current = performance.now();
              actions.updateBlockProps(blockId, {
                ...blockData,
                fullName: 'Jane Smith',
              });
            }
          }}
        >
          Update
        </button>
        <button
          data-testid="undo-btn"
          onClick={() => actions.undo()}
          disabled={!canUndo}
        >
          Undo
        </button>
        <button
          data-testid="redo-btn"
          onClick={() => actions.redo()}
          disabled={!canRedo}
        >
          Redo
        </button>
      </div>
    );
  }

  describe('Round-trip: Inspector edit → Canvas reflects instantly', () => {
    it('should update canvas immediately when inspector changes block data', async () => {
      const initialSnapshot = hydrateFromServer(mockResumeData);

      render(
        <EditorStoreProvider initialSnapshot={initialSnapshot}>
          <TestComponent blockId="block1" />
        </EditorStoreProvider>
      );

      // Initial state
      const blockDataElement = screen.getByTestId('block-data');
      const initialData = JSON.parse(blockDataElement.textContent || '{}');
      expect(initialData.fullName).toBe('John Doe');

      // Simulate inspector edit
      const updateBtn = screen.getByTestId('update-btn');
      updateBtn.click();

      // Canvas should reflect change instantly (no debounce delay)
      await waitFor(
        () => {
          const updatedData = JSON.parse(blockDataElement.textContent || '{}');
          expect(updatedData.fullName).toBe('Jane Smith');
        },
        { timeout: 50 } // Should be instant, well under 50ms
      );
    });

    it('should update with <8ms latency for instant feel', async () => {
      const initialSnapshot = hydrateFromServer(mockResumeData);

      render(
        <EditorStoreProvider initialSnapshot={initialSnapshot}>
          <TestComponent blockId="block1" />
        </EditorStoreProvider>
      );

      const updateBtn = screen.getByTestId('update-btn');
      const latencyElement = screen.getByTestId('latency');

      updateBtn.click();

      await waitFor(() => {
        expect(latencyElement.textContent).not.toBe('');
      });

      const latency = parseFloat(latencyElement.textContent || '0');
      expect(latency).toBeLessThan(8);
    });
  });

  describe('Undo/Redo: Inspector changes are reversible', () => {
    it('should undo inspector edit and restore previous value', async () => {
      const initialSnapshot = hydrateFromServer(mockResumeData);

      render(
        <EditorStoreProvider initialSnapshot={initialSnapshot}>
          <TestComponent blockId="block1" />
        </EditorStoreProvider>
      );

      const blockDataElement = screen.getByTestId('block-data');
      const updateBtn = screen.getByTestId('update-btn');
      const undoBtn = screen.getByTestId('undo-btn');

      // Make change
      updateBtn.click();
      await waitFor(() => {
        const data = JSON.parse(blockDataElement.textContent || '{}');
        expect(data.fullName).toBe('Jane Smith');
      });

      // Undo
      expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
      undoBtn.click();

      await waitFor(() => {
        const data = JSON.parse(blockDataElement.textContent || '{}');
        expect(data.fullName).toBe('John Doe');
      });

      expect(screen.getByTestId('can-undo')).toHaveTextContent('false');
      expect(screen.getByTestId('can-redo')).toHaveTextContent('true');
    });

    it('should redo inspector edit after undo', async () => {
      const initialSnapshot = hydrateFromServer(mockResumeData);

      render(
        <EditorStoreProvider initialSnapshot={initialSnapshot}>
          <TestComponent blockId="block1" />
        </EditorStoreProvider>
      );

      const blockDataElement = screen.getByTestId('block-data');
      const updateBtn = screen.getByTestId('update-btn');
      const undoBtn = screen.getByTestId('undo-btn');
      const redoBtn = screen.getByTestId('redo-btn');

      // Make change
      updateBtn.click();
      await waitFor(() => {
        const data = JSON.parse(blockDataElement.textContent || '{}');
        expect(data.fullName).toBe('Jane Smith');
      });

      // Undo
      undoBtn.click();
      await waitFor(() => {
        expect(screen.getByTestId('can-redo')).toHaveTextContent('true');
      });

      // Redo
      redoBtn.click();
      await waitFor(() => {
        const data = JSON.parse(blockDataElement.textContent || '{}');
        expect(data.fullName).toBe('Jane Smith');
      });

      expect(screen.getByTestId('can-redo')).toHaveTextContent('false');
    });
  });

  describe('Batch updates: Multi-field edits create single history entry', () => {
    function BatchTestComponent() {
      const actions = useEditorActions();
      const blockData = useBlockData<HeaderData>('block1');
      const canUndo = useEditorSelector((state) => state.canUndo);

      return (
        <div>
          <div data-testid="full-name">{blockData?.fullName}</div>
          <div data-testid="title">{blockData?.title}</div>
          <div data-testid="can-undo">{canUndo ? 'true' : 'false'}</div>
          <div data-testid="history-length">{canUndo ? 'has-history' : 'no-history'}</div>
          <button
            data-testid="batch-update-btn"
            onClick={() => {
              actions.updateBlockPropsBatch([
                {
                  blockId: 'block1',
                  changes: {
                    fullName: 'Alice Johnson',
                    title: 'Senior Engineer',
                  },
                },
              ]);
            }}
          >
            Batch Update
          </button>
          <button
            data-testid="undo-btn"
            onClick={() => actions.undo()}
            disabled={!canUndo}
          >
            Undo
          </button>
        </div>
      );
    }

    it('should create single history entry for batch update', async () => {
      const initialSnapshot = hydrateFromServer(mockResumeData);

      render(
        <EditorStoreProvider initialSnapshot={initialSnapshot}>
          <BatchTestComponent />
        </EditorStoreProvider>
      );

      const batchUpdateBtn = screen.getByTestId('batch-update-btn');
      const undoBtn = screen.getByTestId('undo-btn');

      // Initial state
      expect(screen.getByTestId('full-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('title')).toHaveTextContent('Software Engineer');
      expect(screen.getByTestId('can-undo')).toHaveTextContent('false');

      // Batch update
      batchUpdateBtn.click();

      // Both fields updated
      await waitFor(() => {
        expect(screen.getByTestId('full-name')).toHaveTextContent('Alice Johnson');
        expect(screen.getByTestId('title')).toHaveTextContent('Senior Engineer');
      });

      expect(screen.getByTestId('can-undo')).toHaveTextContent('true');

      // Single undo should revert both changes
      undoBtn.click();

      await waitFor(() => {
        expect(screen.getByTestId('full-name')).toHaveTextContent('John Doe');
        expect(screen.getByTestId('title')).toHaveTextContent('Software Engineer');
      });

      expect(screen.getByTestId('can-undo')).toHaveTextContent('false');
    });
  });

  describe('History coalescing: Rapid text edits within 250ms window', () => {
    function TextEditComponent() {
      const actions = useEditorActions();
      const blockData = useBlockData<SummaryData>('block2');
      const canUndo = useEditorSelector((state) => state.canUndo);

      return (
        <div>
          <div data-testid="paragraph">{blockData?.paragraph}</div>
          <div data-testid="can-undo">{canUndo ? 'true' : 'false'}</div>
          <button
            data-testid="type-char"
            onClick={() => {
              const current = blockData?.paragraph || '';
              actions.updateBlockProps('block2', {
                paragraph: current + 'x',
              });
            }}
          >
            Type Char
          </button>
          <button
            data-testid="undo-btn"
            onClick={() => actions.undo()}
            disabled={!canUndo}
          >
            Undo
          </button>
        </div>
      );
    }

    it('should coalesce rapid text edits into single history entry', async () => {
      const initialSnapshot = hydrateFromServer(mockResumeData);

      render(
        <EditorStoreProvider initialSnapshot={initialSnapshot}>
          <TextEditComponent />
        </EditorStoreProvider>
      );

      const typeCharBtn = screen.getByTestId('type-char');
      const undoBtn = screen.getByTestId('undo-btn');

      // Initial text
      expect(screen.getByTestId('paragraph')).toHaveTextContent('Original summary text');

      // Type 3 characters rapidly (within 250ms window)
      act(() => {
        typeCharBtn.click();
      });
      act(() => {
        typeCharBtn.click();
      });
      act(() => {
        typeCharBtn.click();
      });

      // All edits should be applied
      await waitFor(() => {
        expect(screen.getByTestId('paragraph')).toHaveTextContent('Original summary textxxx');
      });

      // Wait for coalescing window to close (250ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Single undo should revert all coalesced edits
      expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
      undoBtn.click();

      await waitFor(() => {
        expect(screen.getByTestId('paragraph')).toHaveTextContent('Original summary text');
      });
    });
  });

  describe('Selector granularity: Minimal re-renders', () => {
    function OptimizedComponent({ blockId, onRender }: { blockId: string; onRender: () => void }) {
      const renderCountRef = React.useRef(0);
      renderCountRef.current++;

      React.useEffect(() => {
        onRender();
      });

      const blockData = useBlockData(blockId);

      return (
        <div>
          <div data-testid="render-count">{renderCountRef.current}</div>
          <div data-testid="block-data">{JSON.stringify(blockData)}</div>
        </div>
      );
    }

    function UpdaterComponent() {
      const actions = useEditorActions();

      return (
        <button
          data-testid="update-other-block"
          onClick={() => {
            actions.updateBlockProps('block2', {
              paragraph: 'Updated summary',
            });
          }}
        >
          Update Other Block
        </button>
      );
    }

    it('should not re-render when unrelated block updates', async () => {
      let renderCount = 0;
      const initialSnapshot = hydrateFromServer(mockResumeData);

      render(
        <EditorStoreProvider initialSnapshot={initialSnapshot}>
          <OptimizedComponent blockId="block1" onRender={() => renderCount++} />
          <UpdaterComponent />
        </EditorStoreProvider>
      );

      // Initial render (1 or 2 for React 18 strict mode)
      await waitFor(() => {
        expect(renderCount).toBeGreaterThanOrEqual(1);
      });
      const initialRenderCount = renderCount;

      // Update different block
      const updateBtn = screen.getByTestId('update-other-block');
      updateBtn.click();

      // Wait a bit to ensure no additional re-render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not have additional re-renders beyond initial mount
      expect(renderCount).toBe(initialRenderCount);
    });
  });
});
