import {
  getEditorHealthSnapshot,
  resetEditorHealthSnapshot,
  updateEditorHealthSnapshot,
} from '@/features/resume/editor/state/editorHealth';

describe('editor health snapshot', () => {
  afterEach(() => {
    resetEditorHealthSnapshot();
  });

  it('returns defaults when untouched', () => {
    const snapshot = getEditorHealthSnapshot();
    expect(snapshot.selectionCount).toBe(0);
    expect(snapshot.isDirty).toBe(false);
  });

  it('updates selection count and dirty state', () => {
    updateEditorHealthSnapshot({ selectionCount: 3, isDirty: true });
    const snapshot = getEditorHealthSnapshot();
    expect(snapshot.selectionCount).toBe(3);
    expect(snapshot.isDirty).toBe(true);
  });
});
