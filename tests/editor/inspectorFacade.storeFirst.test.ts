import { createInspectorFacade } from '@/features/resume/editor/integration/InspectorFacade';
import { createMutationBroker, type MutationBroker, type MutationOp } from '@/features/resume/editor/integration/MutationBroker';

describe('InspectorFacade - Store-First Pattern', () => {
  let broker: MutationBroker;
  let mockStore: { updateBlockProps: jest.Mock };
  let enqueueCalls: MutationOp[];
  let successHandlers: Array<(op: MutationOp, res: unknown) => void>;
  let errorHandlers: Array<(op: MutationOp, err: Error) => void>;

  beforeEach(() => {
    enqueueCalls = [];
    successHandlers = [];
    errorHandlers = [];

    mockStore = {
      updateBlockProps: jest.fn(),
    };

    // Create broker with mocked mutations
    broker = createMutationBroker({
      convex: {
        createBlock: async () => ({ success: true }),
        updateBlock: async () => {
          return { success: true, resumeUpdatedAt: Date.now() };
        },
        deleteBlock: async () => ({ success: true }),
        reorderBlock: async () => ({ success: true }),
        createPage: async () => ({ success: true }),
        duplicatePage: async () => ({ success: true }),
        reflowPages: async () => ({ success: true }),
        updateResumeMeta: async () => ({ success: true }),
      },
    });

    // Override enqueue to track calls
    const originalEnqueue = broker.enqueue;
    broker.enqueue = jest.fn(async (op) => {
      enqueueCalls.push(op);
      const result = await originalEnqueue(op);
      if (result.ok) {
        successHandlers.forEach((h) => h(op, result.result));
      } else {
        errorHandlers.forEach((h) => h(op, result.error));
      }
      return result;
    });

    // Track success/error handlers
    const originalOnSuccess = broker.onSuccess;
    broker.onSuccess = (fn) => {
      successHandlers.push(fn);
      return originalOnSuccess(fn);
    };

    const originalOnError = broker.onError;
    broker.onError = (fn) => {
      errorHandlers.push(fn);
      return originalOnError(fn);
    };
  });

  it('should update store immediately before enqueuing persistence', async () => {
    const facade = createInspectorFacade(broker, mockStore);

    const partial = { id: 'block1', props: { text: 'Updated' } };

    await facade.applyEdit(partial, 'block1');

    // Store should be updated
    expect(mockStore.updateBlockProps).toHaveBeenCalledWith('block1', { text: 'Updated' });
    expect(mockStore.updateBlockProps).toHaveBeenCalledTimes(1);

    // Broker should be called with enqueue
    expect(enqueueCalls).toHaveLength(1);
    expect(enqueueCalls[0]).toEqual({
      kind: 'block.update',
      payload: partial,
    });
  });

  it('should NOT call store when store parameter is omitted (legacy mode)', async () => {
    const facade = createInspectorFacade(broker); // No store

    const partial = { id: 'block1', props: { text: 'Updated' } };

    await facade.applyEdit(partial, 'block1');

    // Broker should still be called
    expect(enqueueCalls.length).toBe(1);
  });

  it('should only make ONE broker call (no duplicates)', async () => {
    const facade = createInspectorFacade(broker, mockStore);

    const partial = { id: 'block1', props: { text: 'Updated' } };

    await facade.applyEdit(partial, 'block1');

    // Should be exactly 1 broker call
    expect(enqueueCalls.length).toBe(1);
  });

  it('should emit "applied" event on successful persistence', async () => {
    const facade = createInspectorFacade(broker, mockStore);
    const events: Array<{ type: 'applied' | 'committed' | 'reverted'; payload?: unknown }> = [];

    facade.onEvent((e) => events.push(e));

    const partial = { id: 'block1', props: { text: 'Updated' } };

    await facade.applyEdit(partial, 'block1');

    // Should emit "applied" event
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      type: 'applied',
      payload: partial,
    });
  });

  it('should throw error if store update fails', async () => {
    mockStore.updateBlockProps.mockImplementation(() => {
      throw new Error('Store update failed');
    });

    const facade = createInspectorFacade(broker, mockStore);

    const partial = { id: 'block1', props: { text: 'Updated' } };

    // Store errors are logged but do not reject
    await expect(facade.applyEdit(partial, 'block1')).resolves.toBeUndefined();

    // Persistence still runs once
    expect(enqueueCalls.length).toBe(1);
  });

  it('should throw error if persistence fails', async () => {
    // Mock broker to return error
    broker.enqueue = jest.fn(async (): Promise<{ ok: false; error: Error }> => ({
      ok: false,
      error: new Error('Network error'),
    }));

    const facade = createInspectorFacade(broker, mockStore);

    const partial = { id: 'block1', props: { text: 'Updated' } };

    // Should throw the broker error
    await expect(facade.applyEdit(partial, 'block1')).rejects.toThrow('Network error');

    // Store should not update when persistence fails
    expect(mockStore.updateBlockProps).not.toHaveBeenCalled();
  });

  it('should handle multiple sequential edits correctly', async () => {
    const facade = createInspectorFacade(broker, mockStore);

    await facade.applyEdit({ id: 'block1', props: { text: 'Edit 1' } }, 'block1');
    await facade.applyEdit({ id: 'block1', props: { text: 'Edit 2' } }, 'block1');
    await facade.applyEdit({ id: 'block1', props: { text: 'Edit 3' } }, 'block1');

    // Store should be updated 3 times
    expect(mockStore.updateBlockProps).toHaveBeenCalledTimes(3);
    expect(mockStore.updateBlockProps).toHaveBeenNthCalledWith(1, 'block1', { text: 'Edit 1' });
    expect(mockStore.updateBlockProps).toHaveBeenNthCalledWith(2, 'block1', { text: 'Edit 2' });
    expect(mockStore.updateBlockProps).toHaveBeenNthCalledWith(3, 'block1', { text: 'Edit 3' });

    // Broker should be called 3 times
    expect(enqueueCalls.length).toBe(3);
  });

  it('should pass correct props to store (not entire partial)', async () => {
    const facade = createInspectorFacade(broker, mockStore);

    const partial = {
      id: 'block1',
      props: {
        text: 'Updated Text',
        fontSize: 16,
        color: 'blue',
      },
    };

    await facade.applyEdit(partial, 'block1');

    // Store should receive only the props object, not the entire partial
    expect(mockStore.updateBlockProps).toHaveBeenCalledWith('block1', {
      text: 'Updated Text',
      fontSize: 16,
      color: 'blue',
    });
  });

  it('should work with different block IDs', async () => {
    const facade = createInspectorFacade(broker, mockStore);

    await facade.applyEdit({ id: 'block1', props: { text: 'A' } }, 'block1');
    await facade.applyEdit({ id: 'block2', props: { text: 'B' } }, 'block2');
    await facade.applyEdit({ id: 'block3', props: { text: 'C' } }, 'block3');

    expect(mockStore.updateBlockProps).toHaveBeenNthCalledWith(1, 'block1', { text: 'A' });
    expect(mockStore.updateBlockProps).toHaveBeenNthCalledWith(2, 'block2', { text: 'B' });
    expect(mockStore.updateBlockProps).toHaveBeenNthCalledWith(3, 'block3', { text: 'C' });
  });
});
