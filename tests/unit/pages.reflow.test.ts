import { inchesToPixels, PAGE_CONFIGS } from '@/lib/resume-layout';
import type { LayoutConfig } from '@/lib/resume-layout';
import type { Block } from '@/lib/resume-types';
import type { Page } from '@/types/resume';
import { reflowPages } from '@/app/(studio)/resume/actions/pages/reflow';

const layoutConfig: LayoutConfig = {
  ...PAGE_CONFIGS.Letter,
  baseline: 4,
  isCompact: false,
};

const createBlock = (id: string, order: number, type: Block['type'] = 'summary'): Block => {
  const baseBlock = {
    _id: id as Block['_id'],
    resumeId: 'resume-1' as Block['resumeId'],
    order,
    locked: false,
  };

  return {
    ...baseBlock,
    type,
    data: type === 'summary'
      ? { paragraph: `Block ${id}` }
      : { heading: 'Heading', bullets: [] },
  } as Block;
};

describe('reflowPages', () => {
  it('creates a new page when content overflows', () => {
    const blockA = createBlock('block-a', 0);
    const blockB = createBlock('block-b', 1);

    const result = reflowPages({
      blocksWithHeights: [
        { block: blockA, height: inchesToPixels(6), index: 0 },
        { block: blockB, height: inchesToPixels(6), index: 1 },
      ],
      pages: {},
      pageOrder: [],
      blocks: {
        [blockA._id]: blockA,
        [blockB._id]: blockB,
      },
      layout: layoutConfig,
      pageSize: 'Letter',
    });

    expect(result.changed).toBe(true);
    expect(result.pageOrder).toHaveLength(2);
    const [firstPageId, secondPageId] = result.pageOrder;
    expect(result.pages[firstPageId].blocks).toEqual([blockA._id]);
    expect(result.pages[secondPageId].blocks).toEqual([blockB._id]);
    expect(result.blocks[blockA._id].frame?.pageId).toBe(firstPageId);
    expect(result.blocks[blockB._id].frame?.pageId).toBe(secondPageId);
    expect(result.log.length).toBeGreaterThan(0);
  });

  it('removes trailing empty pages when content shrinks', () => {
    const blockA = createBlock('block-a', 0);

    const page1: Page = {
      id: 'page-1',
      size: 'Letter',
      margins: { ...layoutConfig.margins },
      blocks: [blockA._id],
    };
    const page2: Page = {
      id: 'page-2',
      size: 'Letter',
      margins: { ...layoutConfig.margins },
      blocks: [],
    };

    const result = reflowPages({
      blocksWithHeights: [{ block: blockA, height: inchesToPixels(4), index: 0 }],
      pages: {
        [page1.id]: page1,
        [page2.id]: page2,
      },
      pageOrder: [page1.id, page2.id],
      blocks: {
        [blockA._id]: blockA,
      },
      layout: layoutConfig,
      pageSize: 'Letter',
    });

    expect(result.changed).toBe(true);
    expect(result.pageOrder).toHaveLength(1);
    expect(result.pageOrder[0]).toBe(page1.id);
    expect(result.pages[page1.id].blocks).toEqual([blockA._id]);
    expect(result.log.length).toBeGreaterThan(0);
    expect(result.log.some(entry => entry.toLowerCase().includes('reflow'))).toBe(true);
  });
});
