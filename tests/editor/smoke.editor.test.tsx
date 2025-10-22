import React from "react";
import { render, screen } from "@testing-library/react";
import EditorProvider from "@/app/(studio)/resume/[resumeId]/EditorProvider";
import type { Block, Page, PageId } from "@/features/resume/editor/types/editorTypes";

test("editor mounts with legacy data source", () => {
  const legacyDeps = {
    getBlocksMap: (): Readonly<Record<string, Block>> => ({}),
    getPage: (_id: PageId): Page => ({
      id: 'page1',
      size: 'Letter',
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      blockIds: [],
    }),
    getPageOrder: (): Readonly<PageId[]> => [],
    getSelection: () => ({ ids: [], lastChangedAt: Date.now() }),
    setSelection: () => {},
    subscribe: () => () => {},
  };
  render(<EditorProvider legacyDeps={legacyDeps}><div>Editor</div></EditorProvider>);
  expect(screen.getByText('Editor')).toBeInTheDocument();
});
