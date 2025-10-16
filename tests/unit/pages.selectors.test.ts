import { selectBlockById, selectBlocksByPageId, selectPageById } from '@/app/(studio)/resume/store';
import type { ResumeEditorState } from '@/app/(studio)/resume/store';
import type { Block } from '@/lib/resume-types';

/**
 * Creates a mock ResumeEditorState for testing with proper type safety.
 * Fills in required Block fields that aren't relevant to selector tests.
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
});
