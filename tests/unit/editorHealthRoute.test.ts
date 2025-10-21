import { GET } from '@/app/api/editor/health/route';
import {
  resetEditorHealthSnapshot,
  updateEditorHealthSnapshot,
} from '@/features/resume/editor/state/editorHealth';

describe('editor health route', () => {
  beforeEach(() => {
    resetEditorHealthSnapshot();
    process.env.NEXT_PUBLIC_RESUME_V2_STORE = 'true';
    process.env.NEXT_PUBLIC_EDITOR_VERSION = 'test-build';
  });

  afterEach(() => {
    resetEditorHealthSnapshot();
    delete process.env.NEXT_PUBLIC_EDITOR_VERSION;
    delete process.env.NEXT_PUBLIC_RESUME_V2_STORE;
  });

  it('reports current editor health snapshot', async () => {
    updateEditorHealthSnapshot({ selectionCount: 2, isDirty: true });

    const response = await GET();
    const payload = await response.json();

    expect(payload).toMatchObject({
      version: 'test-build',
      storeActive: true,
      selectionCount: 2,
      isDirty: true,
    });
  });
});
