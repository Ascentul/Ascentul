import { createPage } from '@/app/(studio)/resume/actions/pages/createPage';
import { duplicatePage } from '@/app/(studio)/resume/actions/pages/duplicatePage';
import type { Page } from '@/types/resume';
import type { Block } from '@/lib/resume-types';

describe('page actions', () => {
  it('creates a blank page with new id', () => {
    const pages: Record<string, Page> = {};
    const pageOrder: string[] = [];

    const result = createPage({
      pages,
      pageOrder,
      size: 'Letter',
      margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
    });

    expect(result.pageOrder).toHaveLength(1);
    expect(result.pageId).toBe(result.pageOrder[0]);
    expect(result.pages[result.pageId]).toBeDefined();
    expect(result.pages[result.pageId].blocks).toEqual([]);
  });

  it('duplicates a page with new ids and identical content', () => {
    const blockId = 'block-original';
    const pageId = 'page-original';

    const pages: Record<string, Page> = {
      [pageId]: {
        id: pageId,
        size: 'Letter',
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        blocks: [blockId],
      },
    };
    const pageOrder = [pageId];

    const blocks: Record<string, Block> = {
      [blockId]: {
        _id: blockId as Block['_id'],
        resumeId: 'resume-1' as Block['resumeId'],
        type: 'summary',
        data: { paragraph: 'Summary' },
        order: 1,
        locked: false,
        frame: { x: 0, y: 0, w: 1, h: 1, pageId },
      },
    };

    const result = duplicatePage({
      pageId,
      pages,
      pageOrder,
      blocks,
    });

    expect(result.pageOrder).toHaveLength(2);
    expect(result.pageOrder[0]).toBe(pageId);
    expect(result.pageOrder[1]).toBe(result.pageId);
    expect(result.pageId).not.toBe(pageId);

    expect(result.pages[pageId]).toBeDefined();
    expect(result.pages[pageId].blocks).toEqual([blockId]);

    const clonedPage = result.pages[result.pageId];
    expect(clonedPage.blocks).toHaveLength(1);
    expect(clonedPage.blocks[0]).not.toBe(blockId);

    // Verify cloned page inherits size and margins from original
    expect(clonedPage.size).toBe(pages[pageId].size);
    expect(clonedPage.margins).toEqual(pages[pageId].margins);
    // Verify margins object is a deep copy (not a reference)
    expect(clonedPage.margins).not.toBe(pages[pageId].margins);

    expect(result.blocks[blockId]).toBeDefined();
    expect(result.blocks[blockId]).toEqual(blocks[blockId]);

    const clonedBlock = result.blocks[clonedPage.blocks[0]];
    expect(clonedBlock).toBeDefined();
    expect(clonedBlock.type).toBe('summary');
    expect(clonedBlock.data).toEqual(blocks[blockId].data);
    expect(clonedBlock._id).toBe(clonedPage.blocks[0]);
    expect(clonedBlock.frame?.pageId).toBe(result.pageId);
  });

  it('throws error when duplicating non-existent page', () => {
    const pages: Record<string, Page> = {};
    const pageOrder: string[] = [];
    const blocks: Record<string, Block> = {};

    expect(() => {
      duplicatePage({
        pageId: 'non-existent-page',
        pages,
        pageOrder,
        blocks,
      });
    }).toThrow('Cannot duplicate page: page with id "non-existent-page" not found');
  });
});
