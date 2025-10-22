import React from 'react';
import { act, renderHook } from '@testing-library/react';
import {
  EditorStoreProvider,
  hydrateFromServer,
  useEditorActions,
  useEditorStore,
} from '@/features/resume/editor/state/editorStore';
import type { EditorBlockNode } from '@/features/resume/editor/types/editorTypes';
import { createEditorStoreAdapter } from '@/features/resume/editor/integration/EditorStoreAdapter';
import { createMutationBroker } from '@/features/resume/editor/integration/MutationBroker';
import { TEMPLATE_DEFINITIONS } from '@/lib/templates';
import { applyAIEdit } from '@/features/resume/ai/applyAIEdit';
import { useResumeExport } from '@/hooks/useResumeExport';
import { mockProfile } from '../fixtures/mockProfile';
import { testWithFeatureFlag } from '../helpers/featureFlagTestHelper';
import type { MutationBroker } from '@/features/resume/editor/integration/MutationBroker';

jest.mock('@/lib/telemetry', () => {
  const actual = jest.requireActual('@/lib/telemetry');
  return {
    ...actual,
    logEvent: jest.fn(),
  };
});

const logEvent = jest.requireMock('@/lib/telemetry').logEvent as jest.Mock;

type StoreBundle = {
  store: ReturnType<typeof useEditorStore>;
  actions: ReturnType<typeof useEditorActions>;
};

function createStoreBundle(): StoreBundle {
  const snapshot = hydrateFromServer({
    resume: {
      _id: 'resume_test' as any,
      title: 'Resume V2',
      templateSlug: 'grid-compact',
      themeId: 'theme_default' as any,
      updatedAt: Date.now(),
      version: 1,
      pages: [
        {
          id: 'page-1',
          size: 'Letter',
          margins: { top: 72, right: 72, bottom: 72, left: 72 },
          blocks: [],
        },
      ],
    },
    blocks: [],
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditorStoreProvider initialSnapshot={snapshot}>{children}</EditorStoreProvider>
  );

  const { result } = renderHook(
    () => ({
      store: useEditorStore(),
      actions: useEditorActions(),
    }),
    { wrapper },
  );

  return result.current;
}

function seedProfile(actions: ReturnType<typeof useEditorActions>, pageId: string) {
  const { contact, summary, experience } = mockProfile;
  const fullName = [contact?.firstName, contact?.lastName].filter(Boolean).join(' ').trim() || 'Test User';

  const headerBlock: EditorBlockNode = {
    id: 'header-block',
    type: 'header',
    parentId: null,
    props: {
      fullName,
      title: experience?.[0]?.role ?? 'Software Engineer',
      contact: {
        email: contact?.email,
        phone: contact?.phone,
        location: contact?.location,
        links: contact?.links ?? [],
      },
    },
  };

  const summaryBlock: EditorBlockNode = {
    id: 'summary-block',
    type: 'summary',
    parentId: null,
    props: {
      text: summary?.bio ?? '',
    },
  };

  const experienceBlock: EditorBlockNode = {
    id: 'experience-block',
    type: 'experience',
    parentId: null,
    props: {
      items: (experience ?? []).map((item, index) => ({
        id: `exp-${index}`,
        role: item.role,
        company: item.company,
        location: item.location,
        start: item.startDate,
        end: item.endDate,
        bullets: item.bullets,
      })),
    },
  };

  actions.createBlock(headerBlock, pageId);
  actions.createBlock(summaryBlock, pageId);
  actions.createBlock(experienceBlock, pageId);
}

function createBroker(): { broker: MutationBroker; convex: Record<string, jest.Mock> } {
  const convex = {
    createBlock: jest.fn(async (_payload) => ({})),
    updateBlock: jest.fn(async (payload) => payload),
    deleteBlock: jest.fn(async (_payload) => ({})),
    reorderBlock: jest.fn(async (_payload) => ({})),
    createPage: jest.fn(async (_payload) => ({})),
    duplicatePage: jest.fn(async (_payload) => ({})),
    reflowPages: jest.fn(async (_payload) => ({})),
    updateResumeMeta: jest.fn(async (payload) => ({
      themeId: payload.themeId ?? 'theme_default',
      updatedAt: Date.now(),
    })),
  };

  return {
    broker: createMutationBroker({ convex: convex as any }),
    convex,
  };
}

describe('Resume Builder V2 end-to-end flow', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = (global as any).fetch;
  });

  afterEach(() => {
    logEvent.mockReset();
    if (originalFetch) {
      (global as any).fetch = originalFetch;
    } else {
      delete (global as any).fetch;
    }
  });

  it('creates resume and seeds profile data', async () => {
    await testWithFeatureFlag(
      {
        NEXT_PUBLIC_RESUME_V2_STORE: 'true',
        NEXT_PUBLIC_DEBUG_UI: 'true',
      },
      async () => {
        const { store, actions } = createStoreBundle();
        const pageId = store.getState().pageOrder[0];
        expect(pageId).toBeDefined();

        act(() => {
          seedProfile(actions, pageId as string);
        });

        const seededState = store.getState();
        expect(seededState.pagesById[pageId!]?.blockIds).toHaveLength(3);
        expect(seededState.blocksById['header-block']).toBeDefined();
        expect(seededState.blocksById['summary-block']).toBeDefined();
        expect(seededState.blocksById['experience-block']).toBeDefined();
      },
    );
  });

  it('switches layout and updates theme', async () => {
    await testWithFeatureFlag(
      {
        NEXT_PUBLIC_RESUME_V2_STORE: 'true',
        NEXT_PUBLIC_DEBUG_UI: 'true',
      },
      async () => {
        const { store, actions } = createStoreBundle();
        const pageId = store.getState().pageOrder[0];

        act(() => {
          seedProfile(actions, pageId as string);
        });

        // Switch layout
        const targetLayout = TEMPLATE_DEFINITIONS[0]?.layouts?.[0];
        expect(targetLayout).toBeDefined();

        act(() => {
          store.switchLayout(targetLayout!);
        });
        expect(store.getState().isDirty).toBe(true);

        // Update theme
        const { broker, convex } = createBroker();
        const themeResult = await broker.runNow({
          kind: 'resume.updateMeta',
          payload: {
            resumeId: store.getState().docMeta.resumeId,
            themeId: 'theme_bold',
          },
        });

        expect(themeResult.ok).toBe(true);
        expect(convex.updateResumeMeta).toHaveBeenCalledWith(
          expect.objectContaining({ themeId: 'theme_bold' }),
        );
      },
    );
  });

  it('edits block content and applies AI improvements', async () => {
    await testWithFeatureFlag(
      {
        NEXT_PUBLIC_RESUME_V2_STORE: 'true',
        NEXT_PUBLIC_DEBUG_UI: 'true',
      },
      async () => {
        const { store, actions } = createStoreBundle();
        const pageId = store.getState().pageOrder[0];

        act(() => {
          seedProfile(actions, pageId as string);
        });

        // Edit content
        act(() => {
          actions.updateBlockProps('summary-block', {
            text: 'Updated summary content for inspector edit.',
          });
        });
        expect(store.getState().blocksById['summary-block'].props.text).toContain('Updated summary');

        // Apply AI improvements
        const { broker, convex } = createBroker();
        const adapter = createEditorStoreAdapter(store);
        const aiResult = await applyAIEdit({
          resumeId: store.getState().docMeta.resumeId,
          blockId: 'summary-block',
          action: 'improveBullet',
          proposedContent: 'Delivered a 20% improvement in resume completion time.',
          adapter,
          broker,
        });

        expect(aiResult.ok).toBe(true);
        expect(convex.updateBlock).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'summary-block',
            text: expect.stringContaining('20% improvement'),
          }),
        );

        const loggedEvents = logEvent.mock.calls.map((call) => call[0]);
        expect(loggedEvents).toContain('ai_action_started');
        expect(loggedEvents).toContain('ai_action_completed');
      },
    );
  });

  it('exports resume as PDF', async () => {
    await testWithFeatureFlag(
      {
        NEXT_PUBLIC_RESUME_V2_STORE: 'true',
        NEXT_PUBLIC_DEBUG_UI: 'true',
      },
      async () => {
        const { store, actions } = createStoreBundle();
        const pageId = store.getState().pageOrder[0];

        act(() => {
          seedProfile(actions, pageId as string);
        });

        const fetchMock = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            url: 'https://example.com/resume.pdf',
            exportId: 'export_123',
            fileName: 'resume.pdf',
          }),
        });
        (global as any).fetch = fetchMock;

        const exportHook = renderHook(() => useResumeExport());
        await act(async () => {
          await exportHook.result.current.exportResume({
            resumeId: store.getState().docMeta.resumeId,
            format: 'pdf',
          });
        });

        expect(fetchMock).toHaveBeenCalledWith(
          '/api/resume/export',
          expect.objectContaining({
            method: 'POST',
          }),
        );

        const exportEvents = logEvent.mock.calls.map((call) => call[0]);
        expect(exportEvents).toContain('export_started');
        expect(exportEvents).toContain('export_succeeded');
      },
    );
  });
});
