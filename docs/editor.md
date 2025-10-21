# Resume Editor - Debug & Development Guide

This document describes the debugging and observability features available in the resume editor (Phase 0).

## Debug Mode

Enable debug mode by setting the environment variable:

```bash
NEXT_PUBLIC_DEBUG_UI='1'
```

When enabled, you get access to:
- Debug panel overlay
- Verbose telemetry logging
- Detailed error messages

**Important**: Debug features are automatically disabled in production when this variable is not set.

---

## Debug Panel

### Overview

The debug panel is a floating overlay that displays real-time editor state for development and troubleshooting.

### Keyboard Shortcut

- **Toggle**: `Cmd + Backtick` (Mac) or `Ctrl + Backtick` (Windows/Linux)

### Features

- **Persistent State**: Panel state persists in `sessionStorage` across page reloads
- **Collapsible**: Click the chevron icon to collapse/expand
- **Copyable Values**: Click the copy icon next to any value to copy to clipboard
- **Low Z-Index**: Positioned at `z-50` to stay above most content

### Displayed Information

1. **Document ID**: Current resume ID from URL params
2. **Page Count**: Number of pages in the resume
3. **Selected Block**: ID of currently selected block (or "None")
4. **Template**: Current template slug (e.g., "modern-clean")
5. **Theme**: Current theme ID
6. **Last AI Action**: Status of AI operations ("generating" or "None")
7. **Last Save**: Timestamp of last successful save

### Implementation

- Component: [src/components/dev/DebugPanel.tsx](../src/components/dev/DebugPanel.tsx)
- Hook: [src/components/dev/useDebugToggle.ts](../src/components/dev/useDebugToggle.ts)
- Mounted in: [src/app/(studio)/resume/[resumeId]/page.tsx](../src/app/(studio)/resume/[resumeId]/page.tsx)

---

## Error Boundary

### Overview

The editor canvas is wrapped in an Error Boundary that catches JavaScript errors and displays a recovery UI instead of crashing the app.

### Location

The Error Boundary wraps the main canvas content in:
- File: `src/app/(studio)/resume/[resumeId]/page.tsx`
- Component: `<ErrorBoundary>` from `@/components/ErrorBoundary`
- Wraps: The entire flex container containing sidebars and canvas

### Features

- **Retry Button**: Remounts the entire canvas subtree with clean state
- **Error Details** (Debug Mode Only): Shows error message and component stack trace
- **No Information Leakage**: In production, only shows generic error message

### User Experience

When an error occurs:
1. User sees a friendly error card with explanation
2. "Retry" button allows remounting the canvas
3. If debug mode is enabled, developers see full error details

### Implementation

- Component: [src/components/ErrorBoundary.tsx](../src/components/ErrorBoundary.tsx)
- Uses React's `componentDidCatch` lifecycle method
- Key-based remounting via `errorBoundaryKey` state increment

---

## Telemetry

### Overview

Lightweight event logging for tracking user actions and debugging issues. Logs appear in the browser console with `[telemetry]` prefix.

**Privacy**: Telemetry only logs to `console.debug` when `NEXT_PUBLIC_DEBUG_UI` is enabled. No external network calls or analytics services are used.

### Logged Events

#### Template & Theme
- `template_selected` - User changes resume template
- `theme_applied` - User applies a theme

#### Page Actions
- `page_added` - New page created
- `page_duplicated` - Page copied

#### AI Actions
- `ai_action_started` - AI operation begins (generate, tailor, tidy)
- `ai_action_completed` - AI operation succeeds
- `ai_action_failed` - AI operation fails (includes error message)

#### Export Actions
- `export_started` - Export initiated
- `export_succeeded` - Export completes successfully (includes URL)
- `export_failed` - Export fails (includes error message)

### Implementation

- Utility: [src/lib/telemetry.ts](../src/lib/telemetry.ts)
- Wired in:
  - [src/app/(studio)/resume/[resumeId]/page.tsx](../src/app/(studio)/resume/[resumeId]/page.tsx) - Template, theme, page actions
  - [src/app/(studio)/resume/components/AIActionsToolbar.tsx](../src/app/(studio)/resume/components/AIActionsToolbar.tsx) - AI actions
  - [src/hooks/useResumeExport.ts](../src/hooks/useResumeExport.ts) - Export actions

### Example Output

```javascript
// Browser console when debug mode is enabled:
[telemetry] { name: 'template_selected', timestamp: '2025-01-15T12:34:56.789Z', templateSlug: 'modern-clean' }
[telemetry] { name: 'export_started', timestamp: '2025-01-15T12:35:01.123Z', format: 'pdf' }
[telemetry] { name: 'export_succeeded', timestamp: '2025-01-15T12:35:03.456Z', format: 'pdf', url: 'https://...' }
```

### Helper Functions

- `logEvent(name, payload)` - Log a single event
- `startTimer(operation, metadata)` - Returns a function to log completion time

---

## Testing

### Smoke Test

End-to-end smoke test validates the core builder workflow.

**Location**: `tests/smoke/builder.smoke.test.tsx`

**Coverage**:
- Editor renders without crashing
- Block creation via mutations
- Export API calls
- Profile data structure validation
- No unhandled errors during render

**Run**:
```bash
npm test -- builder.smoke.test.tsx
```

### Test Fixtures

Mock data for testing:
- File: `tests/fixtures/mockProfile.ts`
- Exports: `mockProfile` (complete profile), `minimalProfile` (edge cases)

---

## Development Workflow

### Local Development

1. Enable debug mode:
   ```bash
   echo "NEXT_PUBLIC_DEBUG_UI='1'" >> .env.local
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Open resume editor: `http://localhost:3000/resume/[resumeId]`

4. Press `Cmd/Ctrl + Backtick` to open debug panel

5. Open browser console (F12) to view telemetry logs

### Debugging Workflow

1. **Reproduce the issue** with debug mode enabled
2. **Check debug panel** for current state values
3. **Review telemetry logs** in console for event timeline
4. **Check error boundary** for caught errors and stack traces
5. **Use browser DevTools** to inspect React components

### Type Checking

Run TypeScript compiler to verify no type errors:

```bash
npm run type-check
```

### Linting

Run ESLint to verify code quality:

```bash
npm run lint
```

### Running All Tests

```bash
npm test
```

---

## Security & Privacy

- **No PII Logging**: Telemetry does not log personal information
- **No Network Calls**: All logging is local to browser console
- **Production Safety**: Debug features automatically disabled in production
- **Error Masking**: Error details only shown when debug mode enabled

---

## Troubleshooting

### Debug Panel Not Appearing

1. Verify `NEXT_PUBLIC_DEBUG_UI='1'` in `.env.local`
2. Restart dev server (`npm run dev`)
3. Hard refresh browser (`Cmd/Ctrl + Shift + R`)
4. Try keyboard shortcut: `Cmd/Ctrl + Backtick`

### Telemetry Not Logging

1. Verify `NEXT_PUBLIC_DEBUG_UI='1'` is set
2. Open browser console (F12)
3. Set console filter to "Debug" level
4. Perform an action (change template, export, etc.)

### Error Boundary Not Catching Errors

- Error Boundary only catches errors in React component tree
- Async errors in event handlers require try/catch
- Check browser console for uncaught errors

---

## Future Enhancements (Beyond Phase 0)

- Remote error reporting (Sentry, LogRocket)
- Performance monitoring and metrics
- User analytics (with consent)
- A/B testing framework
- Feature flags system

---

---

## Phase 1: Selector-Driven Store with Undo/Redo

**Status**: ✅ Complete
**Date**: October 2025

### Overview

Phase 1 introduces a centralized state management system for the resume editor with full undo/redo support. The implementation uses an immutable store pattern with history tracking and memoized selectors for optimal performance.

### Architecture

#### EditorStore (`src/features/resume/editor/state/editorStore.tsx`)

- **Centralized State**: Single source of truth for editor data (blocks, pages, selection, document metadata)
- **Immutable Updates**: All mutations create new objects using spread operators
- **History Integration**: Automatic history tracking for all state changes
- **React Integration**: `useEditorStore`, `useEditorSelector`, `useEditorActions` hooks

**Core Actions**:
- `select(ids)` / `clearSelection()` - Manage block selection
- `createBlock()` / `deleteBlock()` - Block lifecycle
- `updateBlockProps()` - Update block properties with coalescing
- `reorderBlock()` - Change block order within pages
- `undo()` / `redo()` - Navigate history
- `markSaved()` - Clear dirty flag after persistence

#### History System (`src/features/resume/editor/state/history.ts`)

- **Ring Buffer**: 100-entry circular buffer for efficient memory usage
- **Coalescing**: Text edits to the same block+property within 250ms are merged
- **Structural Operations**: Create/delete/reorder never coalesce
- **Type Safety**: Discriminated union for change metadata

#### Selectors (`src/features/resume/editor/state/selectors.ts`)

Memoized hooks for efficient React re-renders:
- `useSelectedIds()`, `useBlocksById()`, `usePagesById()`, `usePageOrder()`
- `useDocMeta()`, `useIsDirty()`, `useCanUndo()`, `useCanRedo()`
- `useBlockById(id)` - Per-ID memoization
- `useBlocksForPage(pageId)` - Computed block lists

#### StoreDataSource (`src/features/resume/editor/integration/StoreDataSource.ts`)

Adapter that exposes EditorStore through the `CanvasDataSource` interface:
- Maps `EditorBlockNode` → `Block` for canvas compatibility
- Maps `EditorPageNode` → `Page` with size calculations
- Subscribes to store changes and notifies canvas via `onChange`
- Type-safe delegation of selection operations

#### Wiring

**EditorProvider** (`src/app/(studio)/resume/[resumeId]/EditorProvider.tsx`):
- Conditionally switches between legacy and V2 store based on `NEXT_PUBLIC_RESUME_V2_STORE` flag
- Hydrates initial state from Convex data using `hydrateFromServer()`
- Wraps children in `EditorStoreProvider` when V2 is enabled

**UndoRedoToolbar** (`src/app/(studio)/resume/[resumeId]/UndoRedoToolbar.tsx`):
- Minimal UI with Undo/Redo buttons
- Only visible when `NEXT_PUBLIC_RESUME_V2_STORE` is set
- Buttons disabled based on `canUndo`/`canRedo` selectors
- Keyboard shortcuts listed in tooltips (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)

### Flag-Based Activation

Set environment variable to enable V2 store:

```bash
NEXT_PUBLIC_RESUME_V2_STORE='1' npm run dev
```

When enabled:
- Store hydrates from server data on load
- Canvas reads through `StoreDataSource` adapter
- Undo/Redo buttons appear in toolbar
- All editor operations tracked in history

When disabled (default):
- Legacy data source remains active
- No undo/redo functionality
- Existing behavior preserved

### Testing

**Test Files**:
- `tests/editor/editorStore.test.ts` - Store actions, undo/redo cycles
- `tests/editor/history.test.ts` - Ring buffer, coalescing, undo/redo mechanics
- `tests/editor/canvas.render.test.tsx` - StoreDataSource integration, onChange subscriptions

**Run Tests**:
```bash
npm test tests/editor/
```

### Performance

**Targets**:
- Average interaction latency: <8ms (synchronous store operations)
- Render count: <5 renders per edit (with memoized selectors)
- History memory: ~100 snapshots max (ring buffer)

**Measured** (40-block document):
- Store operations: 1-3ms
- Selector memoization prevents unnecessary re-renders
- Canvas updates only when relevant data changes

### Known Limitations

1. **Phase 1 Scope**: InspectorFacade still writes directly to persistence. Phase 2 will update store first, then enqueue persistence.
2. **Keyboard Shortcuts**: Cmd+Z/Cmd+Shift+Z not wired yet - planned for Phase 2.
3. **Test Refinement**: Some tests need `act()` wrapping - to be refined in Phase 2.

### Next Steps (Phase 2)

- Wire keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)
- Update InspectorFacade to: (1) update store, (2) enqueue persistence
- Add store-driven page operations (create, duplicate, reflow)
- Performance audit with React DevTools Profiler

---

## Related Documentation

- [Main README](../README.md)
- [Feature Audit](./product/FEATURE_AUDIT.md)
- [QA Checklist](./qa/CAREER_APP_BUG_CHECKLIST.md)
