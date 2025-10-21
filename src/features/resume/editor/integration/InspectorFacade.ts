import type { MutationBroker } from "./MutationBroker";

export type EditOptions = { coalesceKey?: string; source?: "inspector" | "canvas" };
export type EditPartial = { id: string; props: Record<string, unknown> };

export type InspectorFacade = {
  applyEdit(partial: EditPartial, targetId: string, options?: EditOptions): Promise<void>;
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
    async applyEdit(partial: EditPartial, _targetId: string, _options?: EditOptions) {
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
