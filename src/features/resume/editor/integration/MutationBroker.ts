export type MutationOp =
  | { kind: "block.create"; payload: any }
  | { kind: "block.update"; payload: any }
  | { kind: "block.delete"; payload: any }
  | { kind: "block.reorder"; payload: any }
  | { kind: "page.create"; payload: any }
  | { kind: "page.duplicate"; payload: any }
  | { kind: "page.reflow"; payload: any }
  | { kind: "resume.updateMeta"; payload: any };

export type MutationResult = { ok: true; result: any } | { ok: false; error: Error };

export type MutationBroker = {
  enqueue(op: MutationOp): Promise<MutationResult>;
  runNow(op: MutationOp): Promise<MutationResult>;
  onSuccess(fn: (op: MutationOp, res: any) => void): () => void;
  onError(fn: (op: MutationOp, err: Error) => void): () => void;
};

export function createMutationBroker(deps: {
  convex: {
    createBlock: (p: any) => Promise<any>;
    updateBlock: (p: any) => Promise<any>;
    deleteBlock: (p: any) => Promise<any>;
    reorderBlock: (p: any) => Promise<any>;
    createPage: (p: any) => Promise<any>;
    duplicatePage: (p: any) => Promise<any>;
    reflowPages: (p: any) => Promise<any>;
    updateResumeMeta: (p: any) => Promise<any>;
  };
}): MutationBroker {
  const successHandlers = new Set<(op: MutationOp, res: any) => void>();
  const errorHandlers = new Set<(op: MutationOp, err: Error) => void>();

  async function run(op: MutationOp): Promise<MutationResult> {
    try {
      let res;
      switch (op.kind) {
        case "block.create": res = await deps.convex.createBlock(op.payload); break;
        case "block.update": res = await deps.convex.updateBlock(op.payload); break;
        case "block.delete": res = await deps.convex.deleteBlock(op.payload); break;
        case "block.reorder": res = await deps.convex.reorderBlock(op.payload); break;
        case "page.create": res = await deps.convex.createPage(op.payload); break;
        case "page.duplicate": res = await deps.convex.duplicatePage(op.payload); break;
        case "page.reflow": res = await deps.convex.reflowPages(op.payload); break;
        case "resume.updateMeta": res = await deps.convex.updateResumeMeta(op.payload); break;
        default: {
          const _exhaustive: never = op;
          throw new Error(`Unhandled mutation kind: ${(op as MutationOp).kind}`);
        }
      }
      successHandlers.forEach(h => h(op, res));
      return { ok: true, result: res };
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(String(e));
      errorHandlers.forEach(h => h(op, err));
      return { ok: false, error: err };
    }
  }

  return {
    enqueue: run, // simple for Phase 0
    runNow: run,
    onSuccess: fn => { successHandlers.add(fn); return () => successHandlers.delete(fn); },
    onError: fn => { errorHandlers.add(fn); return () => errorHandlers.delete(fn); },
  };
}
