"use client";

import { createLegacyDataSource } from "@/features/resume/editor/integration/LegacyDataSource";
import { useStoreDataSource } from "@/features/resume/editor/integration/StoreDataSource";
import type { CanvasDataSource } from "@/features/resume/editor/integration/CanvasDataSource";
import { EditorStoreProvider, hydrateFromServer, type ResumeHydrationInput } from "@/features/resume/editor/state/editorStore";
import React, { createContext, useContext } from "react";

const Ctx = createContext<CanvasDataSource | null>(null);
export function useCanvasDataSource() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("CanvasDataSource not provided");
  return ctx;
}

type Props = {
  children: React.ReactNode;
  legacyDeps: Parameters<typeof createLegacyDataSource>[0];
  /**
   * Server-side resume data for hydration
   * Type matches ResumeHydrationInput to avoid unsafe type assertions
   */
  resumeData?: ResumeHydrationInput;
};

// Inner component that uses the store
function StoreBasedProvider({ children }: { children: React.ReactNode }) {
  const ds = useStoreDataSource();
  return <Ctx.Provider value={ds}>{children}</Ctx.Provider>;
}

export default function EditorProvider({ children, legacyDeps, resumeData }: Props) {
  const useStore = !!process.env.NEXT_PUBLIC_RESUME_V2_STORE;

  if (useStore && resumeData) {
    // No type assertion needed - resumeData is already typed as ResumeHydrationInput
    const initialSnapshot = hydrateFromServer(resumeData);
    return (
      <EditorStoreProvider initialSnapshot={initialSnapshot}>
        <StoreBasedProvider>{children}</StoreBasedProvider>
      </EditorStoreProvider>
    );
  }

  // Legacy path
  const ds = createLegacyDataSource(legacyDeps);
  return <Ctx.Provider value={ds}>{children}</Ctx.Provider>;
}
