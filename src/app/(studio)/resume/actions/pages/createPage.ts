import { v4 as uuidv4 } from 'uuid';
import type { Page, PageMargins } from '@/types/resume';
import type { PageSize } from '@/lib/resume-layout';

export interface CreatePageParams {
  pages: Record<string, Page>;
  pageOrder: string[];
  size: PageSize;
  margins: PageMargins;
}

export interface CreatePageResult {
  pages: Record<string, Page>;
  pageOrder: string[];
  pageId: string;
}

export function createPage({
  pages,
  pageOrder,
  size,
  margins,
}: CreatePageParams): CreatePageResult {
  if (!pages || !pageOrder) {
    throw new Error('Invalid input: pages and pageOrder are required');
  }

  const pageId = uuidv4();
  const newPage: Page = {
    id: pageId,
    size,
    margins,
    blocks: [],
  };

  return {
    pages: {
      ...pages,
      [pageId]: newPage,
    },
    pageOrder: [...pageOrder, pageId],
    pageId,
  };
}
