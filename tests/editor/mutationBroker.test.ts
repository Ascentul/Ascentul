import { createMutationBroker, type BlockUpdatePayload } from "@/features/resume/editor/integration/MutationBroker";

test('broker fires onSuccess handler', async () => {
  const broker = createMutationBroker({
    convex: {
      createBlock: async () => ({}),
      updateBlock: async (payload: BlockUpdatePayload) => payload,
      deleteBlock: async () => ({}),
      reorderBlock: async () => ({}),
      updateResumeMeta: async () => ({}),
    },
  });
  let ok = false;
  broker.onSuccess(() => {
    ok = true;
  });
  const res = await broker.runNow({ kind: 'block.update', payload: { id: 'x', props: {} } });
  expect(res.ok).toBe(true);
  expect(ok).toBe(true);
});

test('broker fires onError handler', async () => {
  const broker = createMutationBroker({
    convex: {
      createBlock: async () => ({}),
      updateBlock: async (_payload: BlockUpdatePayload) => {
        throw new Error('boom');
      },
      deleteBlock: async () => ({}),
      reorderBlock: async () => ({}),
      updateResumeMeta: async () => ({}),
    },
  });
  let erred = false;
  broker.onError(() => {
    erred = true;
  });
  const res = await broker.runNow({ kind: 'block.update', payload: { id: 'x', props: {} } });
  expect(res.ok).toBe(false);
  expect(erred).toBe(true);
});
