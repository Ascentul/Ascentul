type EditorHealthSnapshot = {
  selectionCount: number;
  isDirty: boolean;
  lastUpdated: number;
};

const GLOBAL_KEY = '__ASCENTFUL_EDITOR_HEALTH__';

const DEFAULT_SNAPSHOT: Pick<EditorHealthSnapshot, 'selectionCount' | 'isDirty'> = {
  selectionCount: 0,
  isDirty: false,
};

const getMutableSnapshot = (): EditorHealthSnapshot => {
  const target = globalThis as typeof globalThis & Record<string, EditorHealthSnapshot>;
  if (!target[GLOBAL_KEY]) {
    target[GLOBAL_KEY] = {
      ...DEFAULT_SNAPSHOT,
      lastUpdated: Date.now(),
    };
  }
  return target[GLOBAL_KEY];
};

export const getEditorHealthSnapshot = (): EditorHealthSnapshot => {
  const snapshot = getMutableSnapshot();
  return {
    selectionCount: snapshot.selectionCount,
    isDirty: snapshot.isDirty,
    lastUpdated: snapshot.lastUpdated,
  };
};

export const updateEditorHealthSnapshot = (
  update: Partial<Pick<EditorHealthSnapshot, 'selectionCount' | 'isDirty'>>,
): EditorHealthSnapshot => {
  const snapshot = getMutableSnapshot();

  if (typeof update.selectionCount === 'number') {
    snapshot.selectionCount = update.selectionCount;
  }

  if (typeof update.isDirty === 'boolean') {
    snapshot.isDirty = update.isDirty;
  }

  snapshot.lastUpdated = Date.now();
  return getEditorHealthSnapshot();
};

export const resetEditorHealthSnapshot = (): void => {
  const target = globalThis as typeof globalThis & Record<string, EditorHealthSnapshot>;
  target[GLOBAL_KEY] = {
    ...DEFAULT_SNAPSHOT,
    lastUpdated: Date.now(),
  };
};
