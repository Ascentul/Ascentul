import { createInspectorFacade } from "@/features/resume/editor/integration/InspectorFacade";
import { createMutationBroker } from "@/features/resume/editor/integration/MutationBroker";

test("applyEdit forwards to broker and emits applied", async () => {
  const calls: any[] = [];
  const broker = createMutationBroker({
    convex: {
      createBlock: async () => ({}),
      updateBlock: async (p: any) => { calls.push(p); return { ok: true }; },
      deleteBlock: async () => ({}),
      reorderBlock: async () => ({}),
      updateResumeMeta: async () => ({}),
    },
  });
  const facade = createInspectorFacade(broker);
  let seen = false;
  facade.onEvent(e => { if (e.type === "applied") seen = true; });
  await facade.applyEdit({ id: "b1", props: { text: "hi" } }, "b1");
  expect(calls[0]).toEqual({ id: "b1", props: { text: "hi" } });
  expect(seen).toBe(true);
});
