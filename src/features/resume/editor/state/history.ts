import { type EditorSnapshot, type HistoryChangeMeta } from '../types/editorTypes';

const HISTORY_LIMIT = 100;
const COALESCE_WINDOW_MS = 250;

export interface HistoryEntry {
  snapshot: EditorSnapshot;
  meta: HistoryChangeMeta;
  timestamp: number;
}

export interface HistoryState {
  past: HistoryEntry[];
  present: HistoryEntry;
  future: HistoryEntry[];
}

export const createHistoryState = (
  initialSnapshot: EditorSnapshot,
  meta: HistoryChangeMeta,
): HistoryState => {
  const initialEntry: HistoryEntry = {
    snapshot: initialSnapshot,
    meta,
    timestamp: Date.now(),
  };
  return {
    past: [],
    present: initialEntry,
    future: [],
  };
};

const shouldCoalesce = (
  prevEntry: HistoryEntry,
  nextMeta: HistoryChangeMeta,
  now: number,
): boolean => {
  if (prevEntry.meta.type !== 'block-prop') {
    return false;
  }
  if (nextMeta.type !== 'block-prop') {
    return false;
  }
  if (prevEntry.meta.blockId !== nextMeta.blockId) {
    return false;
  }
  if (prevEntry.meta.propKey !== nextMeta.propKey) {
    return false;
  }
  return now - prevEntry.timestamp <= COALESCE_WINDOW_MS;
};

export const pushHistory = (
  history: HistoryState,
  snapshot: EditorSnapshot,
  meta: HistoryChangeMeta,
): HistoryState => {
  const now = Date.now();
  const entry: HistoryEntry = {
    snapshot,
    meta,
    timestamp: now,
  };

  if (shouldCoalesce(history.present, meta, now)) {
    return {
      ...history,
      present: entry,
    };
  }

  const nextPast = [...history.past, history.present];
  if (nextPast.length > HISTORY_LIMIT) {
    nextPast.shift();
  }

  return {
    past: nextPast,
    present: entry,
    future: [],
  };
};

export const undoHistory = (
  history: HistoryState,
): { history: HistoryState; snapshot: EditorSnapshot | null } => {
  if (history.past.length === 0) {
    return { history, snapshot: null };
  }

  const previous = history.past[history.past.length - 1];
  const nextPast = history.past.slice(0, -1);
  const nextFuture = [history.present, ...history.future];

  return {
    history: {
      past: nextPast,
      present: previous,
      future: nextFuture,
    },
    snapshot: previous.snapshot,
  };
};

export const redoHistory = (
  history: HistoryState,
): { history: HistoryState; snapshot: EditorSnapshot | null } => {
  if (history.future.length === 0) {
    return { history, snapshot: null };
  }

  const next = history.future[0];
  const nextFuture = history.future.slice(1);
  const nextPast = [...history.past, history.present];
  if (nextPast.length > HISTORY_LIMIT) {
    nextPast.shift();
  }

  return {
    history: {
      past: nextPast,
      present: next,
      future: nextFuture,
    },
    snapshot: next.snapshot,
  };
};

export const canUndo = (history: HistoryState): boolean => history.past.length > 0;
export const canRedo = (history: HistoryState): boolean => history.future.length > 0;

export const replacePresent = (
  history: HistoryState,
  snapshot: EditorSnapshot,
  meta?: HistoryChangeMeta,
): HistoryState => ({
  past: history.past,
  present: {
    snapshot,
    meta: meta ?? history.present.meta,
    timestamp: Date.now(),
  },
  future: history.future,
});
