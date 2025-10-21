import { createMutationBroker } from "@/features/resume/editor/integration/MutationBroker";

test("broker success and error handlers fire", async () => {
  const okBroker = createMutationBroker({
    convex: {
      createBlock: async () => ({}),
      updateBlock: async (p: any) => p,
      deleteBlock: async () => ({}),
      reorderBlock: async () => ({}),
      updateResumeMeta: async () => ({}),
    },
  });
  let ok = false;
  okBroker.onSuccess(() => { ok = true; });
  const res = await okBroker.runNow({ kind: "block.update", payload: { id: "x", props: {} } });
  expect(res.ok).toBe(true);
  expect(ok).toBe(true);

  const errBroker = createMutationBroker({
    convex: {
      createBlock: async () => ({}),
      updateBlock: async () => { throw new Error("boom"); },
      deleteBlock: async () => ({}),
      reorderBlock: async () => ({}),
      updateResumeMeta: async () => ({}),
    },
  });
  let erred = false;
  errBroker.onError(() => { erred = true; });
  const res2 = await errBroker.runNow({ kind: "block.update", payload: {} });
  expect(res2.ok).toBe(false);
  expect(erred).toBe(true);
});
