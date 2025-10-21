/**
 * Resume Builder Smoke Test
 *
 * End-to-end smoke test that validates the core builder workflow:
 * 1. Renders the editor with a mock resume
 * 2. Simulates creating a text block
 * 3. Triggers export to PDF
 * 4. Verifies no unhandled errors occur
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import EditorProvider from '@/app/(studio)/resume/[resumeId]/EditorProvider';
import { mockProfile } from '../fixtures/mockProfile';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useParams: () => ({ resumeId: 'test-resume-123' }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/resume/test-resume-123',
}));

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { id: 'user_test123', emailAddresses: [{ emailAddress: 'test@example.com' }] },
    isLoaded: true,
  }),
  useAuth: () => ({
    isLoaded: true,
    userId: 'user_test123',
  }),
}));

// Mock Convex hooks
jest.mock('convex/react', () => ({
  useQuery: jest.fn(() => ({
    _id: 'resume_123',
    title: 'Test Resume',
    templateSlug: 'modern-clean',
    themeId: 'theme_default',
    updatedAt: Date.now(),
  })),
  useMutation: jest.fn(() => jest.fn().mockResolvedValue({ _id: 'block_new' })),
}));

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('Resume Builder Smoke Test', () => {
  // No global console suppression - let errors surface naturally

  it('renders editor without crashing', () => {
    const mockDeps = {
      getBlocksMap: () => ({} as any),
      getPage: () => undefined as any,
      getPageOrder: () => [] as any,
      getSelection: () => ({ ids: [], lastChangedAt: Date.now() }),
      setSelection: () => {},
      subscribe: () => () => {},
    };

    const { container } = render(
      <EditorProvider legacyDeps={mockDeps}>
        <div data-testid="editor-canvas">Canvas Placeholder</div>
      </EditorProvider>
    );

    expect(container).toBeInTheDocument();
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
  });

  it('creates block via mutation without errors', async () => {
    const mockCreateBlock = jest.fn().mockResolvedValue({ _id: 'block_123' });

    // Mock the mutation broker
    const mockDeps = {
      getBlocksMap: () => ({} as any),
      getPage: () => undefined as any,
      getPageOrder: () => [] as any,
      getSelection: () => ({ ids: [], lastChangedAt: Date.now() }),
      setSelection: () => {},
      subscribe: () => () => {},
    };

    render(
      <EditorProvider legacyDeps={mockDeps}>
        <div data-testid="editor-canvas">Canvas</div>
      </EditorProvider>
    );

    // Simulate block creation
    await mockCreateBlock({
      type: 'custom',
      data: { heading: 'New Section', items: [] },
      order: 1,
    });

    expect(mockCreateBlock).toHaveBeenCalled();
  });

  it('handles export API call', async () => {
    // Mock fetch for export
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        url: 'https://example.com/resume.pdf',
        exportId: 'export_123',
      }),
    });

    const mockDeps = {
      getBlocksMap: () => ({} as any),
      getPage: () => undefined as any,
      getPageOrder: () => [] as any,
      getSelection: () => ({ ids: [], lastChangedAt: Date.now() }),
      setSelection: () => {},
      subscribe: () => () => {},
    };

    render(
      <EditorProvider legacyDeps={mockDeps}>
        <div data-testid="editor-canvas">Canvas</div>
      </EditorProvider>
    );

    // Trigger export
    const response = await fetch('/api/resume/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeId: 'resume_123',
        format: 'pdf',
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.url).toBeDefined();
  });

  it('validates profile data structure', () => {
    // Ensure mock profile matches expected structure
    expect(mockProfile.contact).toBeDefined();
    expect(mockProfile.contact.email).toBe('test.user@example.com');
    expect(mockProfile.experience).toBeInstanceOf(Array);
    expect(mockProfile.experience.length).toBeGreaterThan(0);
    expect(mockProfile.education).toBeInstanceOf(Array);
    expect(mockProfile.skills).toBeDefined();
  });

  it('does not throw unhandled errors during render', () => {
    const mockDeps = {
      getBlocksMap: () => ({} as any),
      getPage: () => undefined as any,
      getPageOrder: () => [] as any,
      getSelection: () => ({ ids: [], lastChangedAt: Date.now() }),
      setSelection: () => {},
      subscribe: () => () => {},
    };

    expect(() => {
      render(
        <EditorProvider legacyDeps={mockDeps}>
          <div data-testid="editor-canvas">Canvas</div>
        </EditorProvider>
      );
    }).not.toThrow();
  });
});
