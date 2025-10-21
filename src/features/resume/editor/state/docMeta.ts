/**
 * Phase 7 - Part C: AI Edit Audit Entry
 */
export type AIEditEntry = {
  ts: number;           // Timestamp
  action: string;       // Action type (e.g., 'rewriteExperience', 'improveBullet')
  target: string;       // Target block ID
  diffPreview: string;  // Brief preview of the change
};

export type DocMeta = {
  resumeId: string;            // Convex _id
  title: string;
  templateSlug?: string;
  themeId?: string;
  updatedAt: number;
  lastSyncedAt: number;
  version: number;
  aiEdits?: AIEditEntry[];     // Phase 7 - Part C: AI edit audit log (max 5 entries)
};

export function normalizeDocMeta(input: any): DocMeta {
  return {
    resumeId: String(input?._id ?? input?.resumeId ?? ""),
    title: String(input?.title ?? "Untitled"),
    templateSlug: input?.templateSlug ?? undefined,
    themeId: input?.themeId ?? undefined,
    updatedAt: Number(input?.updatedAt ?? Date.now()),
    lastSyncedAt: Date.now(),
    version: Number(input?.version ?? 0),
    aiEdits: Array.isArray(input?.aiEdits) ? input.aiEdits.slice(-5) : undefined,
  };
}

/**
 * Phase 7 - Part C: Add AI edit entry to audit log
 * Trims to last 5 entries
 */
export function addAIEdit(
  meta: DocMeta,
  entry: { ts: number; action: string; target: string; diffPreview: string }
): DocMeta {
  const current = meta.aiEdits ?? [];
  const updated = [...current, entry].slice(-5); // Keep only last 5

  return {
    ...meta,
    aiEdits: updated,
  };
}
