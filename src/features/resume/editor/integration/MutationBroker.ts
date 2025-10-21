import type { BlockId } from '../types/editorTypes';

export type BlockCreatePayload = Record<string, unknown>;

export interface BlockUpdatePayload {
  id: BlockId;
  props: Record<string, unknown>;
}

export type BlockDeletePayload = Record<string, unknown>;
export type BlockReorderPayload = Record<string, unknown>;
export type PageCreatePayload = Record<string, unknown>;
export type PageDuplicatePayload = Record<string, unknown>;
export type PageReflowPayload = Record<string, unknown>;
export type ResumeUpdateMetaPayload = Record<string, unknown>;

export type MutationOp =
  | { kind: 'block.create'; payload: BlockCreatePayload }
  | { kind: 'block.update'; payload: BlockUpdatePayload }
  | { kind: 'block.delete'; payload: BlockDeletePayload }
  | { kind: 'block.reorder'; payload: BlockReorderPayload }
  | { kind: 'page.create'; payload: PageCreatePayload }
  | { kind: 'page.duplicate'; payload: PageDuplicatePayload }
  | { kind: 'page.reflow'; payload: PageReflowPayload }
  | { kind: 'resume.updateMeta'; payload: ResumeUpdateMetaPayload };

/**
 * Result type for mutation operations with discriminated union
 *
 * @template T - Type of the successful result (defaults to unknown for flexibility)
 *
 * @example
 * ```ts
 * // Type-safe result handling
 * const result: MutationResult<{ id: string }> = await broker.enqueue(op);
 * if (result.ok) {
 *   console.log(result.result.id); // TypeScript knows result.id exists
 * } else {
 *   console.error(result.error.message); // TypeScript knows error exists
 * }
 * ```
 */
export type MutationResult<T = unknown> = { ok: true; result: T } | { ok: false; error: Error };

/**
 * Mutation broker interface for executing and monitoring mutations
 *
 * **Design Note: Non-Generic Interface**
 * This interface is intentionally non-generic despite `MutationResult<T>` being generic.
 * Rationale:
 * - `MutationOp` is a discriminated union of 8+ different operation types
 * - Each operation type returns a different result type (block ID, page data, void, etc.)
 * - Making the interface generic would require either:
 *   1. Per-operation method overloads (complex, error-prone)
 *   2. Mapping operation kind to result type (maintenance burden)
 * - Current approach: Callers explicitly type the result when needed:
 *   ```ts
 *   const result = await broker.enqueue(op) as MutationResult<{ id: string }>;
 *   ```
 *
 * **Future Consideration:**
 * If type safety becomes critical, consider creating operation-specific methods:
 * ```ts
 * interface MutationBroker {
 *   createBlock(payload: BlockCreatePayload): Promise<MutationResult<BlockId>>;
 *   updateBlock(payload: BlockUpdatePayload): Promise<MutationResult<void>>;
 *   // ... etc
 * }
 * ```
 */
export type MutationBroker = {
  enqueue(op: MutationOp): Promise<MutationResult>;
  runNow(op: MutationOp): Promise<MutationResult>;
  onSuccess(fn: (op: MutationOp, res: unknown) => void): () => void;
  onError(fn: (op: MutationOp, err: Error) => void): () => void;
};

interface MutationBrokerDeps {
  convex: {
    createBlock: (payload: BlockCreatePayload) => Promise<unknown>;
    updateBlock: (payload: BlockUpdatePayload) => Promise<unknown>;
    deleteBlock: (payload: BlockDeletePayload) => Promise<unknown>;
    reorderBlock: (payload: BlockReorderPayload) => Promise<unknown>;
    createPage: (payload: PageCreatePayload) => Promise<unknown>;
    duplicatePage: (payload: PageDuplicatePayload) => Promise<unknown>;
    reflowPages: (payload: PageReflowPayload) => Promise<unknown>;
    updateResumeMeta: (payload: ResumeUpdateMetaPayload) => Promise<unknown>;
  };
}

export function createMutationBroker(deps: MutationBrokerDeps): MutationBroker {
  const successHandlers = new Set<(op: MutationOp, res: unknown) => void>();
  const errorHandlers = new Set<(op: MutationOp, err: Error) => void>();

  async function run(op: MutationOp): Promise<MutationResult> {
    try {
      let res: unknown;
      switch (op.kind) {
        case 'block.create':
          res = await deps.convex.createBlock(op.payload);
          break;
        case 'block.update':
          res = await deps.convex.updateBlock(op.payload);
          break;
        case 'block.delete':
          res = await deps.convex.deleteBlock(op.payload);
          break;
        case 'block.reorder':
          res = await deps.convex.reorderBlock(op.payload);
          break;
        case 'page.create':
          res = await deps.convex.createPage(op.payload);
          break;
        case 'page.duplicate':
          res = await deps.convex.duplicatePage(op.payload);
          break;
        case 'page.reflow':
          res = await deps.convex.reflowPages(op.payload);
          break;
        case 'resume.updateMeta':
          res = await deps.convex.updateResumeMeta(op.payload);
          break;
        default: {
          const _exhaustive: never = op;
          throw new Error(`Unhandled mutation kind: ${(op as MutationOp).kind}`);
        }
      }
      successHandlers.forEach((handler) => handler(op, res));
      return { ok: true, result: res };
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      errorHandlers.forEach((handler) => handler(op, err));
      return { ok: false, error: err };
    }
  }

  return {
    enqueue: run,
    runNow: run,
    onSuccess: (fn) => {
      successHandlers.add(fn);
      return () => successHandlers.delete(fn);
    },
    onError: (fn) => {
      errorHandlers.add(fn);
      return () => errorHandlers.delete(fn);
    },
  };
}
