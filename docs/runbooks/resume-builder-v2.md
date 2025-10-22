# Resume Builder V2 Runbook

## Flag & Kill Switch Test Plan
- `NEXT_PUBLIC_ENABLE_RESUME = 0`: load `/resume` dashboard to confirm CTA hidden and editor routes 404. Reset to `1` when done.
- `NEXT_PUBLIC_RESUME_V2_STORE = false`: open an existing resume, verify legacy data source loads blocks and no store warnings in console. Duplicate a page to ensure broker stub still works.
- `NEXT_PUBLIC_RESUME_V2_STORE = true`: repeat duplicate + AI flows; confirm `MutationBroker` executes and store selection persists after refresh.
- Toggle `NEXT_PUBLIC_DEBUG_UI` while V2 store is on to verify debug panel behavior:
  - **Flag OFF**: Press Cmd/Ctrl + ` → no panel appears, no console.debug output
  - **Flag ON**: Press Cmd/Ctrl + ` → panel appears in bottom-right corner with:
    - ✓ Document ID, Page Count, Selected Block displayed correctly
    - ✓ Template, Theme, Last AI Action show current values
    - ✓ Last Save timestamp updates after edits
    - ✓ Click-to-copy works on any field (shows toast confirmation)
    - ✓ Collapse/expand button toggles content visibility
    - ✓ Console shows `[Telemetry]` debug statements for user actions (select, edit, etc.)
  - **Persistence**: Refresh page → panel state (open/closed) persists via sessionStorage
  - **Health endpoint**: `curl http://localhost:3000/api/editor/health` returns JSON with `version`, `storeActive`, `selectionCount`, `isDirty`
- Exercise `/api/ai/apply-suggestion` rate limiting by sending >20 requests/min and confirm 429 responses; verify idempotency cache by replaying the same suggestion ID (expect 200 with `idempotent=true`).

## Rollback Steps

**Execute in order. Do not skip steps unless explicitly noted.**

### Step 1: Assess Scope & Impact
- Check LaunchDarkly dashboard (`resume-v2` bucket) to determine rollout percentage
- Review error logs to confirm if issue is isolated to V2 store or broader
- **Decision tree:**
  - If <10% of users affected AND issue is V2-specific → proceed to Step 2 (feature flag rollback)
  - If >10% of users affected OR issue is code-related → proceed to Step 3 (code rollback)

### Step 2: Feature Flag Rollback (V2 Store Only)
1. **Vercel Environment Variables** (Owner: On-call engineer)
   - Set `NEXT_PUBLIC_RESUME_V2_STORE=false` in Vercel dashboard
   - Redeploy Edge config only (no code redeploy needed)
   - Verify flag change: `curl https://your-app.vercel.app/api/editor/health | jq '.storeActive'` → should return `false`
2. **LaunchDarkly Cohorts** (Owner: On-call engineer, requires LD admin access)
   - If partial rollout active: Disable `resume-v2` bucket targeting rules
   - If full rollout active: Set default variation to "legacy" (off state)
   - Verify in LD dashboard: All users now receive legacy data path
3. **Validation** (wait 2-3 minutes for propagation):
   - Open existing resume → verify no store warnings in console
   - Duplicate a page → confirm broker stub executes (no V2 mutations)
   - If validated → skip to Step 5 (announcement)

### Step 3: Code Rollback (Full Regression)
**⚠️ Only execute if Step 2 doesn't resolve the issue**

1. **Identify Last Stable SHA** (Owner: On-call engineer)
   - Check deploy logs in Vercel: Find last successful deployment before incident
   - OR use release tag: `git tag | grep resume-v2-prod` → use most recent tag (e.g., `resume-v2-prod-2024-01-15`)
   - If no tag exists: Use Git log to find SHA before merge: `git log --oneline --grep="resume-v2" -n 5`
2. **Redeploy Previous Version** (Owner: On-call engineer)
   - In Vercel dashboard: Navigate to Deployments → find stable SHA → click "Redeploy"
   - OR via CLI: `vercel rollback <deployment-url>` (requires Vercel CLI)
   - **DO NOT** force push to main/master
3. **CDN Cache Invalidation** (Owner: On-call engineer, execute AFTER redeploy completes)
   - Vercel projects with Edge Network: Cache invalidates automatically on redeploy
   - Manual verification: `curl -I https://your-app.vercel.app/resume | grep -i cache` → check for fresh cache headers
   - If using Cloudflare: Purge `/resume/*` path in Cloudflare dashboard (Zone → Caching → Purge Cache)
4. **Validation** (wait 5 minutes for CDN propagation):
   - Load `/resume` dashboard → verify CTA and routes work
   - Check `/api/editor/health` → confirm `version` field matches rolled-back SHA
   - Monitor error logs for 10 minutes → confirm error rate drops

### Step 4: Database State Check (If Applicable)
**⚠️ Only required if V2 store was writing to Convex**

- Check Convex dashboard for orphaned mutations in `builder_resumes` table
- If mutations are queued but failing: Contact platform team to drain queue
- **DO NOT** manually delete Convex data without consulting data team

### Step 5: Communication & Postmortem
1. **Immediate announcement** in `#eng-deploy`:
   ```
   🚨 Resume Builder V2 rollback completed
   - Scope: [feature flag only / full code rollback]
   - Root cause: [brief description]
   - User impact: [% affected, duration]
   - Validation: [health check passing / error rate normalized]
   ```
2. **Create postmortem ticket** in Linear:
   - Title: `[Incident] Resume Builder V2 Rollback - [Date]`
   - Assign to: Product owner (Emma Ruiz) + on-call engineer
   - Include: Timeline, root cause, rollback steps executed, preventive measures
3. **Update status page** (if customer-facing):
   - Mark incident as resolved
   - Add postmortem link when available

## Alerting & Thresholds
- `builder_error_boundary_triggered` (CloudWatch Logs): alert to PagerDuty + #eng-incidents when >5 errors in 5 min (baseline: ~2 errors/day in prod). Query: [CloudWatch Insights link](link-to-saved-query).
- `builder_export_failed` (Telemetry counter): alert when error rate >2% per 1k exports.
- `ai_action_failed` (Segment event): warn to Slack #ai-actions when 3 consecutive failures for same resume within 10 min. Manual silence: [DataDog muting docs](link).
- CloudWatch heartbeat (`/api/editor/health`): alert if stale (>5 min) or `storeActive=false` during rollout window.
  - Alert if stale (>5 min) always.
  - Alert if `storeActive=false` between [Rollout Start: Oct 21 14:00 UTC] and [Rollout Complete: Oct 21 16:00 UTC]. Mute alert outside window.
  - Baseline: expect `storeActive=true` post-rollout; if `false`, indicates store initialization failure.

## Contact Ladder & Escalation

### Primary Contacts (Execute in Order)
1. **On-call engineer** (PagerDuty schedule `resume-builder`)
   - Auto-paged on alert threshold breach
   - Acknowledges incident within 15 minutes
2. **Product owner** – Emma Ruiz (`@emma` in Slack, emma.ruiz@company.com)
   - Notify if user-impacting issue or rollback required
   - Owns product decisions for degraded functionality
3. **Design partner** – Alex Chen (`@alex` in Slack, alex.chen@company.com)
   - Engage for UI/UX issues affecting rendering or canvas
4. **Platform SRE backup** – Priya Das (`@priya` in Slack, +1-555-0100, priya.das@company.com)
   - Escalate if infrastructure-related (CDN, database, hosting)

### Leadership Escalation
**VP Engineering** – Jordan Taylor (`@jordan` in Slack, +1-555-0199, jordan.taylor@company.com)

**Escalation triggers (manual decision by on-call engineer):**
- **Severity 1 (Sev-1)**: Immediate escalation
  - >25% of active editors impacted (data loss, crashes, unable to save)
  - Downtime exceeds 60 minutes with no resolution path
  - Data integrity issue affecting user resumes
  - **Action**: On-call engineer pages VP Eng via PagerDuty + calls phone
- **Severity 2 (Sev-2)**: Escalate within 30 minutes
  - 10-25% of users impacted OR non-critical feature degradation
  - Rollback attempted but regression persists
  - **Action**: Notify VP Eng in Slack `#eng-leadership` + email
- **Severity 3 (Sev-3)**: Inform via status update
  - <10% of users impacted OR cosmetic/performance issues
  - Resolution in progress, no customer escalations
  - **Action**: Post update in `#eng-deploy`, cc VP Eng on postmortem

### SLA Response Times
| Severity | Acknowledge | Engage Team | Resolve Target | Leadership Notification |
|----------|-------------|-------------|----------------|------------------------|
| Sev-1    | 5 min       | 10 min      | 2 hours        | Immediate (page + call) |
| Sev-2    | 15 min      | 30 min      | 8 hours        | Within 30 min (Slack)   |
| Sev-3    | 30 min      | 1 hour      | 24 hours       | Postmortem only         |

### Escalation Decision Tree
```
Incident detected
    ↓
Is data at risk? (data loss, corruption, unauthorized access)
    YES → Sev-1: Page VP Eng immediately
    NO → Continue
        ↓
    Are >25% of active users impacted?
        YES → Sev-1: Page VP Eng immediately
        NO → Continue
            ↓
        Are 10-25% of users impacted OR rollback failed?
            YES → Sev-2: Notify VP Eng in Slack within 30 min
            NO → Continue
                ↓
            Is impact <10% AND resolution in progress?
                YES → Sev-3: Postmortem notification only
```
