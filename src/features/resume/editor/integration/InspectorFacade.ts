import type { MutationBroker } from "./MutationBroker";

/**
 * Options for edit operations
 * @property source - Source of the edit (for telemetry/debugging)
 * @property coalesceKey - Reserved for future debouncing logic (not yet implemented)
 */
export type EditOptions = {
  /** Source of the edit - used for telemetry and debugging */
  source?: "inspector" | "canvas";
  /** Reserved for future debouncing of rapid edits (not yet implemented) */
  coalesceKey?: string;
};

export type EditPartial = { id: string; props: Record<string, unknown> };

export type InspectorFacade = {
  /**
   * Apply an edit to a block
   * @param partial - Block ID and props to update
   * @param options - Optional metadata for telemetry/debugging
   */
  applyEdit(partial: EditPartial, options?: EditOptions): Promise<void>;
  commit(): Promise<void>;
  revert(): Promise<void>;
  onEvent(cb: (e: { type: "applied" | "committed" | "reverted"; payload?: unknown }) => void): () => void;
};

type EditorStoreInterface = {
  updateBlockProps(blockId: string, changes: Record<string, unknown>): void;
};

export function createInspectorFacade(
  broker: MutationBroker,
  store?: EditorStoreInterface
): InspectorFacade {
  const listeners = new Set<(e: { type: "applied" | "committed" | "reverted"; payload?: unknown }) => void>();

  function emit(e: { type: "applied" | "committed" | "reverted"; payload?: unknown }) {
    listeners.forEach(l => l(e));
  }

  return {
    async applyEdit(partial: EditPartial, options?: EditOptions) {
      // Log source for debugging/telemetry if provided
      if (options?.source && process.env.NEXT_PUBLIC_DEBUG_UI === 'true') {
        console.debug(`[InspectorFacade] applyEdit from ${options.source}:`, {
          blockId: partial.id,
          propsKeys: Object.keys(partial.props),
        });
      }

      // Wait for persistence first
      const res = await broker.enqueue({ kind: "block.update", payload: partial });
      if (!res.ok) {
        throw res.error;
      }

      if (store) {
        try {
          store.updateBlockProps(partial.id, partial.props);
        } catch (err) {
          // Log but don't throw - persistence already succeeded
          console.error("Store update failed after successful persistence:", err);
        }
      }
      emit({ type: "applied", payload: partial });
    },
    async commit() { emit({ type: "committed" }); },
    async revert() { emit({ type: "reverted" }); },
    onEvent(cb) { listeners.add(cb); return () => listeners.delete(cb); },
  };
}
