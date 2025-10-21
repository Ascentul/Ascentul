import React, { useEffect, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  EditorStoreProvider,
  hydrateFromServer,
  type ResumeHydrationInput,
} from '@/features/resume/editor/state/editorStore';
import { useStoreDataSource } from '@/features/resume/editor/integration/StoreDataSource';
import type {
  CanvasDataSource,
  Block as CanvasBlock,
} from '@/features/resume/editor/integration/CanvasDataSource';
import type { Id } from '../../convex/_generated/dataModel';

type CanvasBlockType = CanvasBlock['type'];

interface TestResumeHydrationInput {
  resume: NonNullable<ResumeHydrationInput['resume']>;
  blocks: Array<{
    _id: Id<'resume_blocks'>;
    resumeId: Id<'builder_resumes'>;
    type: CanvasBlockType;
    order: number;
    locked?: boolean;
    data?: Record<string, unknown>;
  }>;
}

const toHydrationInput = (input: TestResumeHydrationInput): ResumeHydrationInput => ({
  resume: input.resume,
  blocks: input.blocks.map((block) => ({
    _id: block._id,
    resumeId: block.resumeId,
    type: block.type as unknown as ResumeHydrationInput['blocks'][number]['type'],
    order: block.order,
    locked: block.locked,
    data: block.data,
  })) as ResumeHydrationInput['blocks'],
});

describe('Canvas Render Integration', () => {
  const resumeId = 'resume123' as Id<'builder_resumes'>;
  const themeId = 'theme1' as Id<'builder_resume_themes'>;

  const mockResumeData: TestResumeHydrationInput = {
    resume: {
      _id: resumeId,
      title: 'Test Resume',
      templateSlug: 'modern',
      themeId,
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
        resumeId,
        type: 'heading' as const,
        data: { text: 'Test Heading' },
        order: 0,
        locked: false,
      },
      {
        _id: 'block2' as Id<'resume_blocks'>,
        resumeId,
        type: 'text' as const,
        data: { content: 'Test content' },
        order: 1,
        locked: false,
      },
    ],
  };

  const createInitialSnapshot = () => hydrateFromServer(toHydrationInput(mockResumeData));

  // Simple test component that uses the data source
  function TestCanvas() {
    const dataSource = useStoreDataSource();
    const [blocks, setBlocks] = useState(dataSource.getBlocks());
    const [updateCount, setUpdateCount] = useState(0);

    useEffect(() => {
      const unsubscribe = dataSource.onChange(() => {
        setBlocks(dataSource.getBlocks());
        setUpdateCount((c) => c + 1);
      });
      return unsubscribe;
    }, [dataSource]);

    const blockList = Object.values(blocks);

    return (
      <div>
        <div data-testid="block-count">{blockList.length}</div>
        <div data-testid="update-count">{updateCount}</div>
        {blockList.map((block) => (
          <div key={block.id} data-testid={`block-${block.id}`}>
            {block.type}
          </div>
        ))}
      </div>
    );
  }

  it('should render blocks from store', () => {
    const initialSnapshot = createInitialSnapshot();

    render(
      <EditorStoreProvider initialSnapshot={initialSnapshot}>
        <TestCanvas />
      </EditorStoreProvider>
    );

    expect(screen.getByTestId('block-count')).toHaveTextContent('2');
    expect(screen.getByTestId('block-block1')).toHaveTextContent('heading');
    expect(screen.getByTestId('block-block2')).toHaveTextContent('text');
  });

  it('should return correct page data', () => {
    const initialSnapshot = createInitialSnapshot();

    function TestPageReader() {
      const dataSource = useStoreDataSource();
      const page = dataSource.getPage('page1');

      return (
        <div>
          <div data-testid="page-id">{page?.id}</div>
          <div data-testid="page-block-count">{page?.blockIds.length}</div>
        </div>
      );
    }

    render(
      <EditorStoreProvider initialSnapshot={initialSnapshot}>
        <TestPageReader />
      </EditorStoreProvider>
    );

    expect(screen.getByTestId('page-id')).toHaveTextContent('page1');
    expect(screen.getByTestId('page-block-count')).toHaveTextContent('2');
  });

  it('should return page order', () => {
    const initialSnapshot = createInitialSnapshot();

    function TestPageOrder() {
      const dataSource = useStoreDataSource();
      const pageOrder = dataSource.getPageOrder();

      return <div data-testid="page-order">{pageOrder.join(',')}</div>;
    }

    render(
      <EditorStoreProvider initialSnapshot={initialSnapshot}>
        <TestPageOrder />
      </EditorStoreProvider>
    );

    expect(screen.getByTestId('page-order')).toHaveTextContent('page1');
  });

  it('should return selection state', () => {
    const initialSnapshot = createInitialSnapshot();

    function TestSelection() {
      const dataSource = useStoreDataSource();
      const selection = dataSource.getSelection();

      return (
        <div>
          <div data-testid="selection-count">{selection.ids.length}</div>
        </div>
      );
    }

    render(
      <EditorStoreProvider initialSnapshot={initialSnapshot}>
        <TestSelection />
      </EditorStoreProvider>
    );

    expect(screen.getByTestId('selection-count')).toHaveTextContent('0');
  });

  it('should propagate selection changes', async () => {
    const initialSnapshot = createInitialSnapshot();

    function TestSelectionPropagation() {
      const dataSource = useStoreDataSource();
      const [selection, setSelection] = useState(dataSource.getSelection());

      useEffect(() => {
        const unsubscribe = dataSource.onChange(() => {
          setSelection(dataSource.getSelection());
        });
        return unsubscribe;
      }, [dataSource]);

      const handleSelect = () => {
        dataSource.select(['block1']);
      };

      return (
        <div>
          <div data-testid="selected-ids">{selection.ids.join(',')}</div>
          <button onClick={handleSelect}>Select</button>
        </div>
      );
    }

    render(
      <EditorStoreProvider initialSnapshot={initialSnapshot}>
        <TestSelectionPropagation />
      </EditorStoreProvider>
    );

    const button = screen.getByText('Select');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('selected-ids')).toHaveTextContent('block1');
    });
  });

  it('should notify subscribers on data changes', async () => {
    const initialSnapshot = createInitialSnapshot();

    function TestSubscription() {
      const dataSource = useStoreDataSource();
      const [notifyCount, setNotifyCount] = useState(0);

      useEffect(() => {
        const unsubscribe = dataSource.onChange(() => {
          setNotifyCount((c) => c + 1);
        });
        return unsubscribe;
      }, [dataSource]);

      const handleChange = () => {
        dataSource.select(['block1']);
      };

      return (
        <div>
          <div data-testid="notify-count">{notifyCount}</div>
          <button onClick={handleChange}>Change</button>
        </div>
      );
    }

    render(
      <EditorStoreProvider initialSnapshot={initialSnapshot}>
        <TestSubscription />
      </EditorStoreProvider>
    );

    expect(screen.getByTestId('notify-count')).toHaveTextContent('0');

    const button = screen.getByText('Change');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('notify-count')).toHaveTextContent('1');
    });
  });
});
