import React from "react";
import { render } from "@testing-library/react";
import EditorProvider from "@/app/(studio)/resume/[resumeId]/EditorProvider";

test("editor mounts with legacy data source", () => {
  const legacyDeps = {
    getBlocksMap: () => ({} as any),
    getPage: () => undefined as any,
    getPageOrder: () => [] as any,
    getSelection: () => ({ ids: [], lastChangedAt: Date.now() }),
    setSelection: () => {},
    subscribe: () => () => {},
  };
  render(<EditorProvider legacyDeps={legacyDeps}><div>Editor</div></EditorProvider>);
  expect(screen.getByText('Editor')).toBeInTheDocument();
});
