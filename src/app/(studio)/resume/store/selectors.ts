import type { Page } from '@/types/resume';
import type { Block } from '@/lib/resume-types';
import type { ResumeEditorState } from './types';

export const selectPageById = (
  state: ResumeEditorState,
  pageId: string,
): Page | undefined => state.pages[pageId];

export const selectBlocksByPageId = (
  state: ResumeEditorState,
  pageId: string,
): Block[] => {
  const page = state.pages[pageId];
  if (!page) {
    return [];
  }

  return page.blocks
    .map((blockId) => state.blocks[blockId])
    .filter((block): block is Block => Boolean(block));
};

export const selectBlockById = (
  state: ResumeEditorState,
  blockId: string,
): Block | undefined => state.blocks[blockId];
