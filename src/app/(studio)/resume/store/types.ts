import type { Page } from '@/types/resume';
import type { Block } from '@/lib/resume-types';

export interface ResumeEditorState {
  pages: Record<string, Page>;
  pageOrder: string[];
  blocks: Record<string, Block>;
  selectedPageId: string | null;
}

export type ResumeEditorSelector<T> = (state: ResumeEditorState) => T;
