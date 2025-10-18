import { selectBlockById, selectBlocksByPageId, selectPageById } from '@/app/(studio)/resume/store';
import type { ResumeEditorState } from '@/app/(studio)/resume/store';
import type { Block } from '@/lib/resume-types';

/**
 * Creates a mock ResumeEditorState for testing with proper type safety.
 * Fills in required Block fields that aren't relevant to selector tests.
 * Validates that all block IDs referenced in pages exist to catch test setup errors early.
 */
function createMockState(overrides: {
  blocks: Record<string, Partial<Block>>;
  pages: ResumeEditorState['pages'];
  pageOrder: string[];
  selectedPageId: string;
}): ResumeEditorState {
  const blocks: Record<string, Block> = {};

  for (const [blockId, partialBlock] of Object.entries(overrides.blocks)) {
    blocks[blockId] = {
      _id: partialBlock._id ?? (blockId as Block['_id']),
      resumeId: partialBlock.resumeId ?? ('test-resume' as Block['resumeId']),
      type: partialBlock.type ?? 'custom',
      data: partialBlock.data ?? {},
      order: partialBlock.order ?? 0,
      locked: partialBlock.locked ?? false,
      frame: partialBlock.frame,
    } as Block;
  }

  // Validate that all block IDs referenced in pages exist
  for (const page of Object.values(overrides.pages)) {
    for (const blockId of page.blocks) {
      if (!blocks[blockId]) {
        throw new Error(
          `Test setup error: Page "${page.id}" references non-existent block "${blockId}". ` +
          `Available blocks: [${Object.keys(blocks).join(', ')}]`
        );
      }
    }
  }

  return {
    pages: overrides.pages,
    pageOrder: overrides.pageOrder,
    blocks,
    selectedPageId: overrides.selectedPageId,
  } as ResumeEditorState;
}

describe('resume editor selectors', () => {
  const blockId = 'block-1';
  const blockIdB = 'block-2';
  const pageId = 'page-1';
  const pageIdB = 'page-2';

  const state = createMockState({
    pages: {
      [pageId]: {
        id: pageId,
        size: 'Letter',
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        blocks: [blockId],
      },
      [pageIdB]: {
        id: pageIdB,
        size: 'Letter',
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        blocks: [blockIdB],
      },
    },
    pageOrder: [pageId, pageIdB],
    blocks: {
      [blockId]: {
        type: 'header',
        order: 0,
        data: {
          fullName: 'Test User',
          contact: {},
        },
      },
      [blockIdB]: {
        type: 'summary',
        order: 1,
        data: {
          paragraph: 'Summary',
        },
      },
    },
    selectedPageId: pageId,
  });

  it('selects page by id', () => {
    const page = selectPageById(state, pageId);
    expect(page?.id).toBe(pageId);
    expect(page?.size).toBe('Letter');
    expect(page?.blocks).toEqual([blockId]);
    expect(selectPageById(state, 'missing')).toBeUndefined();
  });

  it('selects blocks for page id', () => {
    const blocks = selectBlocksByPageId(state, pageId);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('header');
    expect(selectBlocksByPageId(state, 'missing')).toEqual([]);
  });

  it('selects multiple blocks for page id', () => {
    const stateWithMultipleBlocks = {
      ...state,
      pages: {
        ...state.pages,
        [pageId]: {
          ...state.pages[pageId],
          blocks: [blockId, blockIdB],
        },
      },
    };
    const blocks = selectBlocksByPageId(stateWithMultipleBlocks, pageId);
    expect(blocks).toHaveLength(2);
    expect(blocks.map(b => b.type)).toEqual(['header', 'summary']);
  });

  it('selects block by id', () => {
    expect(selectBlockById(state, blockId)?.type).toBe('header');
    expect(selectBlockById(state, 'missing')).toBeUndefined();
  });

  describe('edge cases', () => {
    it('handles page with empty blocks array', () => {
      const emptyState = createMockState({
        pages: {
          'empty-page': {
            id: 'empty-page',
            size: 'Letter',
            margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
            blocks: [],
          },
        },
        pageOrder: ['empty-page'],
        blocks: {},
        selectedPageId: 'empty-page',
      });
      expect(selectBlocksByPageId(emptyState, 'empty-page')).toEqual([]);
    });

    it('handles state with no blocks', () => {
      const noBlocksState = createMockState({
        pages: {
          'page-1': {
            id: 'page-1',
            size: 'Letter',
            margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
            blocks: [],
          },
        },
        pageOrder: ['page-1'],
        blocks: {},
        selectedPageId: 'page-1',
      });
      expect(selectBlockById(noBlocksState, 'any-id')).toBeUndefined();
      expect(selectBlocksByPageId(noBlocksState, 'page-1')).toEqual([]);
    });

    it('handles empty state', () => {
      const emptyState = createMockState({
        pages: {},
        pageOrder: [],
        blocks: {},
        selectedPageId: '',
      });
      expect(selectPageById(emptyState, 'any-id')).toBeUndefined();
      expect(selectBlockById(emptyState, 'any-id')).toBeUndefined();
      expect(selectBlocksByPageId(emptyState, 'any-id')).toEqual([]);
    });
  });
});
