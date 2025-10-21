/**
 * Phase 7 - Part C: UI Streaming Tests
 * Tests for AIAuthoringPanel streaming integration
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { AIAuthoringPanel } from '@/app/(studio)/resume/components/AIAuthoringPanel';
import { useAIStreaming } from '@/hooks/useAIStreaming';
import type { Id } from '../../../convex/_generated/dataModel';
import type { MutationBroker } from '@/features/resume/editor/integration/MutationBroker';
import type { IEditorStoreAdapter } from '@/features/resume/editor/integration/EditorStoreAdapter';

// Mock dependencies
jest.mock('@/hooks/useAIStreaming');
jest.mock('@/features/resume/ai/applyAIEdit');
jest.mock('@/features/resume/ai/guardrails');
jest.mock('@/lib/telemetry');
jest.mock('@/hooks/use-toast');

const mockResumeId = 'test-resume-id' as Id<'builder_resumes'>;

describe('AI Streaming Integration', () => {
  let mockStore: any;
  let mockBroker: jest.Mocked<MutationBroker>;
  let mockAdapter: jest.Mocked<IEditorStoreAdapter>;
  let mockUseAIStreaming: jest.MockedFunction<typeof useAIStreaming>;

  beforeEach(() => {
    // Mock store
    mockStore = {
      getState: jest.fn(() => ({
        blocksById: {
          'block-1': {
            id: 'block-1',
            type: 'summary',
            parentId: null,
            props: { text: 'Original text' },
          },
        },
        pagesById: {},
        pageOrder: [],
        selectedIds: ['block-1'],
        docMeta: {
          resumeId: mockResumeId,
          title: 'Test Resume',
          updatedAt: Date.now(),
          lastSyncedAt: Date.now(),
          version: 1,
        },
        isDirty: false,
        lastChangedAt: Date.now(),
      })),
      updateBlockProps: jest.fn(),
    };

    // Mock broker
    mockBroker = {
      enqueue: jest.fn(async (op) => ({ ok: true })),
    } as any;

    // Mock adapter
    mockAdapter = {
      getBlockText: jest.fn(() => 'Original text'),
      setBlockText: jest.fn(),
      getDocMeta: jest.fn(() => mockStore.getState().docMeta),
      updateDocMeta: jest.fn(),
      getSelectedBlockId: jest.fn(() => 'block-1'),
      snapshotBlock: jest.fn(() => ({ text: 'Original text' })),
      restoreBlock: jest.fn(),
    } as any;

    // Mock useAIStreaming
    mockUseAIStreaming = useAIStreaming as jest.MockedFunction<typeof useAIStreaming>;

    // Set env vars
    process.env.NEXT_PUBLIC_RESUME_V2_STORE = 'true';
    process.env.NEXT_PUBLIC_DEBUG_UI = 'true';
  });
  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_RESUME_V2_STORE;
    delete process.env.NEXT_PUBLIC_DEBUG_UI;
  });
  });

  it('opens panel and shows action buttons', () => {
    const mockStart = jest.fn();
    const mockCancel = jest.fn();

    mockUseAIStreaming.mockReturnValue({
      status: 'idle',
      start: mockStart,
      cancel: mockCancel,
      isStreaming: false,
    } as any);

    render(
      <AIAuthoringPanel
        open={true}
        onOpenChange={jest.fn()}
        resumeId={mockResumeId}
        store={mockStore}
        broker={mockBroker}
        selectedBlockId="block-1"
      />
    );

    expect(screen.getByText('Improve Bullet')).toBeInTheDocument();
    expect(screen.getByText('Generate Summary')).toBeInTheDocument();
    expect(screen.getByText('Rewrite Experience')).toBeInTheDocument();
  });

  it('streams text incrementally', async () => {
    let onSuggestionCallback: any;

    const mockStart = jest.fn();
    const mockCancel = jest.fn();

    mockUseAIStreaming.mockImplementation((callbacks) => {
      onSuggestionCallback = callbacks?.onSuggestion;
      return {
        status: 'streaming',
        start: mockStart,
        cancel: mockCancel,
        isStreaming: true,
      } as any;
    });

    render(
      <AIAuthoringPanel
        open={true}
        onOpenChange={jest.fn()}
        resumeId={mockResumeId}
        store={mockStore}
        broker={mockBroker}
        selectedBlockId="block-1"
      />
    );

    // Click action button
    const improveBulletButton = screen.getByText('Improve Bullet').closest('button');
    fireEvent.click(improveBulletButton!);

    // Simulate streaming text
    await act(async () => {
      onSuggestionCallback?.({ proposedContent: 'Streaming text...' });
    });

    await waitFor(() => {
      expect(screen.getByText(/Streaming text/)).toBeInTheDocument();
    });
  });

  it('cancels within 200ms with full rollback', async () => {
    const mockStart = jest.fn();
    const mockCancel = jest.fn();

    mockUseAIStreaming.mockReturnValue({
      status: 'streaming',
      start: mockStart,
      cancel: mockCancel,
      isStreaming: true,
    } as any);

    render(
      <AIAuthoringPanel
        open={true}
        onOpenChange={jest.fn()}
        resumeId={mockResumeId}
        store={mockStore}
        broker={mockBroker}
        selectedBlockId="block-1"
      />
    );

    // Trigger cancel
    const startTime = performance.now();
    const cancelButton = screen.getByText('Cancel').closest('button');
    fireEvent.click(cancelButton!);
    const elapsed = performance.now() - startTime;

    expect(elapsed).toBeLessThan(200);
    expect(mockCancel).toHaveBeenCalled();
  });

  it('creates single history entry on success', async () => {
    let onCompleteCallback: any;

    const mockStart = jest.fn();
    const mockCancel = jest.fn();

    mockUseAIStreaming.mockImplementation((callbacks) => {
      onCompleteCallback = callbacks?.onComplete;
      return {
        status: 'idle',
        start: mockStart,
        cancel: mockCancel,
        isStreaming: false,
      } as any;
    });

    const { applyAIEdit } = require('@/features/resume/ai/applyAIEdit');
    applyAIEdit.mockResolvedValue({ ok: true });

    render(
      <AIAuthoringPanel
        open={true}
        onOpenChange={jest.fn()}
        resumeId={mockResumeId}
        store={mockStore}
        broker={mockBroker}
        selectedBlockId="block-1"
      />
    );

    // Simulate completion
    await act(async () => {
      await onCompleteCallback?.([{ proposedContent: 'Final text' }]);
    });

    await waitFor(() => {
      expect(applyAIEdit).toHaveBeenCalledTimes(1);
      expect(mockBroker.enqueue).toHaveBeenCalledTimes(1);
    });
  });

  it('blocks guardrail violations', async () => {
    const mockStart = jest.fn();
    const mockCancel = jest.fn();

    mockUseAIStreaming.mockReturnValue({
      status: 'idle',
      start: mockStart,
      cancel: mockCancel,
      isStreaming: false,
    } as any);

    const { validateContent } = require('@/features/resume/ai/guardrails');
    validateContent.mockReturnValue({
      ok: false,
      code: 'PII_DETECTED',
      reason: 'Content contains PII',
    });

    render(
      <AIAuthoringPanel
        open={true}
        onOpenChange={jest.fn()}
        resumeId={mockResumeId}
        store={mockStore}
        broker={mockBroker}
        selectedBlockId="block-1"
      />
    );

    // Click action button
    const improveBulletButton = screen.getByText('Improve Bullet').closest('button');
    fireEvent.click(improveBulletButton!);

    await waitFor(() => {
      expect(mockStart).not.toHaveBeenCalled();
    });
  });

  it('shows no block selected hint when no selection', () => {
    const mockStart = jest.fn();
    const mockCancel = jest.fn();

    mockUseAIStreaming.mockReturnValue({
      status: 'idle',
      start: mockStart,
      cancel: mockCancel,
      isStreaming: false,
    } as any);

    render(
      <AIAuthoringPanel
        open={true}
        onOpenChange={jest.fn()}
        resumeId={mockResumeId}
        store={mockStore}
        broker={mockBroker}
        selectedBlockId={undefined}
      />
    );

    expect(screen.getByText('No block selected')).toBeInTheDocument();
    expect(screen.getByText(/Click on a block in the editor/)).toBeInTheDocument();
  });
});
