/**
 * Telemetry / Event Logging Utility
 *
 * Phase 0: Minimal telemetry for debugging and observability.
 * Only logs to console.debug when NEXT_PUBLIC_DEBUG_UI is enabled.
 * No external network calls or analytics services.
 *
 * Usage:
 *   import { logEvent } from '@/lib/telemetry';
 *   logEvent('template_selected', { templateSlug: 'modern-clean' });
 */

/**
 * Telemetry event names - strict typing for event catalog
 *
 * **Event Naming Convention:**
 * - Use action-based names (e.g., `export_succeeded`, `ai_authoring_cancelled`)
 * - Include metrics as payload properties (e.g., `duration_ms`, `latency_ms`)
 * - Do NOT create event names for metrics (e.g., avoid `export_duration_ms`)
 *
 * **Duration Metrics:**
 * Use `startTimer()` helper to automatically add `duration_ms` to completion events:
 * ```ts
 * const endTimer = startTimer('export', { format: 'pdf' });
 * // ... do work ...
 * endTimer('export_succeeded'); // Logs with duration_ms in payload
 * ```
 *
 * **Custom Metrics:**
 * Pass metrics as payload properties on action events:
 * ```ts
 * logEvent('ai_authoring_cancelled', { cancel_latency_ms: 234 });
 * logEvent('ai_guardrail_blocked', { reason: 'pii', redactions: 3 });
 * ```
 */
export type TelemetryEvent =
  // Template & Theme
  | 'template_selected'
  | 'theme_applied'
  // Page Actions
  | 'page_added'
  | 'page_duplicated'
  // AI Actions
  | 'ai_action_started'
  | 'ai_action_completed'
  | 'ai_action_failed'
  // Export Actions
  | 'export_started'
  | 'export_succeeded'
  | 'export_failed'
  | 'export_clickable_links_enabled'
  // Coach Actions (Phase 6)
  | 'coach_analyzed'
  | 'coach_suggestion_applied'
  // Streaming Suggestions (Phase 7 - Part A)
  | 'ai_stream_started'
  | 'ai_stream_suggestion_received'
  | 'ai_stream_completed'
  | 'ai_stream_failed'
  | 'ai_stream_cancelled'
  | 'ai_suggestion_applied'
  | 'ai_suggestion_apply_failed'
  // Guardrails (Phase 7 - Part B)
  | 'ai_guardrail_blocked'
  | 'ai_content_sanitized'
  // Audit Log (Phase 7 - Part C)
  | 'ai_audit_added'
  // Editor Stability (Observability)
  | 'editor_error_boundary_triggered'
  | 'editor_retry_success'
  | 'editor_retry_failed'
  | 'editor_time_to_interactive'
  | 'editor_hydration_error'
  // Editing Quality (Observability)
  | 'undo_used'
  | 'redo_used'
  | 'inspector_batch_edit_saved'
  | 'inspector_edit_count_per_session'
  // Personalization (Observability)
  | 'layout_switch_started'
  | 'layout_switch_completed'
  | 'layout_switch_failed'
  | 'theme_switch_started'
  | 'theme_switch_completed'
  | 'overflow_panel_opened'
  | 'overflow_block_remapped'
  // AI Authoring (Phase 7 - Observability)
  | 'ai_authoring_started'
  | 'ai_authoring_completed'
  | 'ai_authoring_cancelled'
  // Records Grid (Phase 8)
  | 'records_grid_rename_started'
  | 'records_grid_rename_completed'
  | 'records_grid_rename_cancelled'
  | 'records_grid_thumbnail_refreshed';

/**
 * Log a telemetry event to the console (debug mode only)
 *
 * @param name - Event name from the TelemetryEvent catalog
 * @param payload - Optional metadata (should not contain PII or secrets)
 *
 * @example
 * logEvent('template_selected', { templateSlug: 'modern-clean' });
 * logEvent('export_started', { format: 'pdf' });
 * logEvent('ai_action_failed', { action: 'generate', error: 'timeout' });
 */
export function logEvent(
  name: TelemetryEvent,
  payload?: Record<string, unknown>
): void {
  // Only log when NEXT_PUBLIC_DEBUG_UI is enabled
  // This prevents noise in production and respects user privacy
  if (process.env.NEXT_PUBLIC_DEBUG_UI !== "true") {
    return;
  }

  const timestamp = new Date().toISOString();
  const event = {
    ...payload,
    name,
    timestamp,
  };

  // Use console.debug for developer-focused logging
  // Browser dev tools can filter by log level
  console.debug('[telemetry]', event);
}

/**
 * Helper to measure and log operation duration
 * Returns a function to call when the operation completes
 *
 * @example
 * const endTimer = startTimer('export', { format: 'pdf' });
 * // ... do work ...
 * endTimer('export_succeeded');
 */
export function startTimer(
  operation: string,
  metadata?: Record<string, unknown>
): (completionEvent: TelemetryEvent) => void {
  const startTime = performance.now();

  return (completionEvent: TelemetryEvent) => {
    const duration = performance.now() - startTime;
    logEvent(completionEvent, {
      ...metadata,
      operation,
      duration_ms: Math.round(duration),
    });
  };
}
