# Resume Builder V2 Runbook

## Flag & Kill Switch Test Plan
- `NEXT_PUBLIC_ENABLE_RESUME = 0`: load `/resume` dashboard to confirm CTA hidden and editor routes 404. Reset to `1` when done.
- `NEXT_PUBLIC_RESUME_V2_STORE = false`: open an existing resume, verify legacy data source loads blocks and no store warnings in console. Duplicate a page to ensure broker stub still works.
- `NEXT_PUBLIC_RESUME_V2_STORE = true`: repeat duplicate + AI flows; confirm `MutationBroker` executes and store selection persists after refresh.
- Toggle `NEXT_PUBLIC_DEBUG_UI` while V2 store is on to ensure debug panel shortcut (Cmd/Ctrl + `) appears only when flag truthy and telemetry console.debug statements emit.

## Rollback Steps
1. Flip `NEXT_PUBLIC_RESUME_V2_STORE` to `false` (or remove) in Vercel/Env to force legacy data path; redeploy Edge config only.
2. If regression persists, redeploy the previous Git SHA (see `git tag resume-v2-prod`) and invalidate CDN cache for `/resume/*`.
3. Disable feature flag cohorts in LaunchDarkly (bucket `resume-v2`) if partial rollout caused issue.
4. Announce rollback completion in `#eng-deploy` and capture postmortem notes in Linear ticket.

## Alerting & Thresholds
- `builder_error_boundary_triggered` (Log-based): alert when >5 errors in 5 min.
- `builder_export_failed` (Telemetry counter): alert when error rate >2% per 1k exports.
- `ai_action_failed` (Telemetry counter): warn when 3 consecutive failures for same resume.
- CloudWatch heartbeat (`/api/editor/health`): alert if stale (>5 min) or `storeActive=false` during rollout window.

## Contact Ladder
1. On-call engineer (PagerDuty schedule `resume-builder`).
2. Product owner – Emma Ruiz (`@emma`).
3. Design partner – Alex Chen (`@alex`).
4. Platform SRE backup – Priya Das (`@priya`).

Escalate to leadership (VP Eng) if downtime exceeds 60 minutes or >25% of active editors impacted.
