/**
 * Phase 7 - Part C: Unit Tests for applyAIEdit
 * Tests for store-first pattern with rollback and audit log
 */

import { applyAIEdit, rollbackAIEdit } from '@/features/resume/ai/applyAIEdit';
import type { IEditorStoreAdapter } from '@/features/resume/editor/integration/EditorStoreAdapter';
import type { MutationBroker } from '@/features/resume/editor/integration/MutationBroker';
import type { Id } from '../../../convex/_generated/dataModel';
import type { DocMeta } from '@/features/resume/editor/types/editorTypes';

// Mock telemetry
jest.mock('@/lib/telemetry');

const mockResumeId = 'test-resume-id' as Id<'builder_resumes'>;

describe('applyAIEdit (Production)', () => {
  let mockAdapter: jest.Mocked<IEditorStoreAdapter>;
  let mockBroker: jest.Mocked<MutationBroker>;
  let mockDocMeta: DocMeta;

  beforeEach(() => {
    // Mock DocMeta
    mockDocMeta = {
      resumeId: mockResumeId,
      title: 'Test Resume',
      updatedAt: Date.now(),
      lastSyncedAt: Date.now(),
      version: 1,
      aiEdits: [],
    };

    // Mock adapter
    mockAdapter = {
      getBlockText: jest.fn(() => 'Updated text'),
      setBlockText: jest.fn(),
      getDocMeta: jest.fn(() => mockDocMeta),
      updateDocMeta: jest.fn((meta: DocMeta) => {
        mockDocMeta = meta;
      }),
      setDocMeta: jest.fn((meta: DocMeta) => {
        mockDocMeta = meta;
      }),
      getSelectedBlockId: jest.fn(() => 'block-1'),
      snapshotBlock: jest.fn(() => ({ text: 'Original text' })),
      restoreBlock: jest.fn(),
    } as any;

    // Mock broker
    mockBroker = {
      enqueue: jest.fn(async (op) => ({ ok: true })),
    } as any;

    // Set env vars
    process.env.NEXT_PUBLIC_DEBUG_UI = 'true';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_DEBUG_UI;
  });

  it('success: one broker call, audit appended, max 5 entries', async () => {
    const result = await applyAIEdit({
      resumeId: mockResumeId,
      blockId: 'block-1',
      action: 'improveBullet',
      proposedContent: 'Improved bullet point text',
      adapter: mockAdapter,
      broker: mockBroker,
    });

    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();

    // Verify adapter methods called
    expect(mockAdapter.snapshotBlock).toHaveBeenCalledWith('block-1');
    expect(mockAdapter.setBlockText).toHaveBeenCalledWith('block-1', 'Improved bullet point text');
    expect(mockAdapter.getBlockText).toHaveBeenCalledWith('block-1');

    // Verify broker called once
    expect(mockBroker.enqueue).toHaveBeenCalledTimes(1);
    expect(mockBroker.enqueue).toHaveBeenCalledWith({
      kind: 'block.update',
      payload: {
        id: 'block-1',
        text: 'Updated text',
      },
    });

    // Verify audit log access
    expect(mockAdapter.getDocMeta).toHaveBeenCalled();
  });

  it('audit log trimmed to 5 entries', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(6);

    // Pre-populate with 5 entries
    mockDocMeta.aiEdits = [
      { ts: 1, action: 'improveBullet', target: 'block-1', diffPreview: 'preview-0' },
      { ts: 2, action: 'improveBullet', target: 'block-1', diffPreview: 'preview-1' },
      { ts: 3, action: 'improveBullet', target: 'block-1', diffPreview: 'preview-2' },
      { ts: 4, action: 'improveBullet', target: 'block-1', diffPreview: 'preview-3' },
      { ts: 5, action: 'improveBullet', target: 'block-1', diffPreview: 'preview-4' },
    ];

    // Add 6th entry
    const result = await applyAIEdit({
      resumeId: mockResumeId,
      blockId: 'block-1',
      action: 'improveBullet',
      proposedContent: 'New content',
      adapter: mockAdapter,
      broker: mockBroker,
    });

    expect(result.ok).toBe(true);

    expect(mockAdapter.updateDocMeta).toHaveBeenCalledTimes(1);
    expect(mockDocMeta.aiEdits).toHaveLength(5);
    expect(mockDocMeta.aiEdits?.[0]?.ts).toBe(2);
    expect(mockDocMeta.aiEdits?.[4]).toMatchObject({
      ts: 6,
      action: 'improveBullet',
      target: 'block-1',
      diffPreview: 'New content',
    });

    nowSpy.mockRestore();
  });

  it('error: full rollback, no broker call, returns error', async () => {
    // Mock adapter to throw error
    mockAdapter.setBlockText.mockImplementationOnce(() => {
      throw new Error('Update failed');
    });

    const result = await applyAIEdit({
      resumeId: mockResumeId,
      blockId: 'block-1',
      action: 'improveBullet',
      proposedContent: 'New text',
      adapter: mockAdapter,
      broker: mockBroker,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Update failed');

    // Verify rollback called
    expect(mockAdapter.restoreBlock).toHaveBeenCalledWith('block-1', { text: 'Original text' });

    // Verify broker not called
    expect(mockBroker.enqueue).not.toHaveBeenCalled();
  });

  it('error when block not found', async () => {
    mockAdapter.snapshotBlock.mockReturnValueOnce(null);

    const result = await applyAIEdit({
      resumeId: mockResumeId,
      blockId: 'nonexistent-block',
      action: 'improveBullet',
      proposedContent: 'New text',
      adapter: mockAdapter,
      broker: mockBroker,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Block nonexistent-block not found');

    // Verify no updates attempted
    expect(mockAdapter.setBlockText).not.toHaveBeenCalled();
    expect(mockBroker.enqueue).not.toHaveBeenCalled();
  });

  it('error when broker enqueue fails', async () => {
    mockBroker.enqueue.mockResolvedValueOnce({ ok: false, error: new Error('Network error') });

    const result = await applyAIEdit({
      resumeId: mockResumeId,
      blockId: 'block-1',
      action: 'improveBullet',
      proposedContent: 'New text',
      adapter: mockAdapter,
      broker: mockBroker,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Network error');

    // Verify rollback called
    expect(mockAdapter.restoreBlock).toHaveBeenCalledWith('block-1', { text: 'Original text' });
  });

  it('uses editedContent when provided', async () => {
    const result = await applyAIEdit({
      resumeId: mockResumeId,
      blockId: 'block-1',
      action: 'improveBullet',
      proposedContent: 'AI suggested text',
      editedContent: 'User edited text',
      adapter: mockAdapter,
      broker: mockBroker,
    });

    expect(result.ok).toBe(true);

    // Verify edited content used
    expect(mockAdapter.setBlockText).toHaveBeenCalledWith('block-1', 'User edited text');
  });

  it('cancel: full rollback via rollbackAIEdit', () => {
    const originalProps = { text: 'original', foo: 'bar' };

    rollbackAIEdit(mockAdapter, 'block-1', originalProps);

    expect(mockAdapter.restoreBlock).toHaveBeenCalledWith('block-1', originalProps);
  });

  it('rollbackAIEdit handles errors gracefully', () => {
    mockAdapter.restoreBlock.mockImplementationOnce(() => {
      throw new Error('Restore failed');
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Should not throw
    expect(() => {
      rollbackAIEdit(mockAdapter, 'block-1', { text: 'original' });
    }).not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to rollback AI edit:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('handles rollback failure during error flow', async () => {
    mockAdapter.setBlockText.mockImplementationOnce(() => {
      throw new Error('Update failed');
    });

    mockAdapter.restoreBlock.mockImplementationOnce(() => {
      throw new Error('Rollback failed');
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await applyAIEdit({
      resumeId: mockResumeId,
      blockId: 'block-1',
      action: 'improveBullet',
      proposedContent: 'New text',
      adapter: mockAdapter,
      broker: mockBroker,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Update failed');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to rollback after error:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('truncates diffPreview to 50 characters', async () => {
    const longContent = 'A'.repeat(100);

    const capturedDiffs: string[] = [];
    mockAdapter.setDocMeta.mockImplementation((meta: DocMeta) => {
      const last = meta.aiEdits?.[meta.aiEdits.length - 1];
      if (last) {
        capturedDiffs.push(last.diffPreview);
      }
      mockDocMeta = meta;
    });

    const result = await applyAIEdit({
      resumeId: mockResumeId,
      blockId: 'block-1',
      action: 'improveBullet',
      proposedContent: longContent,
      adapter: mockAdapter,
      broker: mockBroker,
    });

    expect(result.ok).toBe(true);

    expect(capturedDiffs).toHaveLength(1);
    expect(capturedDiffs[0]).toBe('A'.repeat(50) + '...');
  });

  it('logs telemetry events when debug enabled', async () => {
    const { logEvent } = require('@/lib/telemetry');

    await applyAIEdit({
      resumeId: mockResumeId,
      blockId: 'block-1',
      action: 'improveBullet',
      proposedContent: 'New text',
      adapter: mockAdapter,
      broker: mockBroker,
    });

    expect(logEvent).toHaveBeenCalledWith('ai_action_started', expect.any(Object));
    expect(logEvent).toHaveBeenCalledWith('ai_action_completed', expect.any(Object));
    expect(logEvent).toHaveBeenCalledWith('ai_audit_added', expect.any(Object));
  });

  it('logs telemetry on failure when debug enabled', async () => {
    const { logEvent } = require('@/lib/telemetry');

    mockAdapter.setBlockText.mockImplementationOnce(() => {
      throw new Error('Update failed');
    });

    await applyAIEdit({
      resumeId: mockResumeId,
      blockId: 'block-1',
      action: 'improveBullet',
      proposedContent: 'New text',
      adapter: mockAdapter,
      broker: mockBroker,
    });

    expect(logEvent).toHaveBeenCalledWith('ai_action_started', expect.any(Object));
    expect(logEvent).toHaveBeenCalledWith('ai_action_failed', expect.objectContaining({
      error: 'Update failed',
    }));
  });
});
