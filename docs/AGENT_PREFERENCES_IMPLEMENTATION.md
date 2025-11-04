# Agent Preferences Implementation

## Status: Production Ready ✅

The agent preferences system is now fully functional and production-ready.

## What Was Fixed

### 1. **Created Clean Preferences Module**
- Created `convex/agent_preferences.ts` as a standalone module
- No dependencies on the broken nudge system
- All CRUD operations for agent preferences

### 2. **Updated UI Component**
- Updated `src/app/(dashboard)/account/agent-preferences/page.tsx`
- Changed imports from `api.nudges.preferences.*` to `api.agent_preferences.*`
- All toggle and save handlers are working

### 3. **Database Schema**
- Uses existing `agent_preferences` table with index `by_user`
- Schema includes:
  - `agent_enabled`: Master toggle
  - `proactive_enabled`: Proactive nudges toggle
  - `quiet_hours_start/end`: Hours 0-23
  - `timezone`: IANA timezone string
  - `channels`: In-app, email, push toggles
  - `playbook_toggles`: Per-feature toggles (job search, resume help, etc.)

## Features

### ✅ Master Agent Toggle
- Enable/disable the entire AI agent
- Instant save to database

### ✅ Proactive Suggestions Toggle
- Control whether agent sends proactive nudges
- Only visible when agent is enabled

### ✅ Quiet Hours
- Set start and end times (24h format)
- Validation: Start and end cannot be the same
- Timezone support

### ✅ Notification Channels
- In-App: Show nudges in dashboard
- Email: Receive nudges via email
- Push: Mobile push notifications

### ✅ Career Playbooks
- Job Search Assistance
- Resume Optimization  
- Interview Preparation
- Networking Suggestions
- Career Path Planning
- Application Follow-ups

### ✅ Save & Reset
- Save Preferences: Upserts all settings
- Reset to Defaults: Restores factory settings
- Confirmation dialog for reset

## API Functions

All functions in `convex/agent_preferences.ts`:

1. **getUserPreferences** (query)
   - Returns user preferences or defaults if none exist
   
2. **upsertPreferences** (mutation)
   - Creates or updates all preference fields
   
3. **toggleAgent** (mutation)
   - Quick toggle for master agent switch
   
4. **toggleProactiveNudges** (mutation)
   - Quick toggle for proactive suggestions
   
5. **resetPreferences** (mutation)
   - Resets all preferences to defaults

## Default Values

```typescript
{
  agent_enabled: true,
  proactive_enabled: true,
  notification_frequency: 'realtime',
  quiet_hours_start: 22,  // 10 PM
  quiet_hours_end: 8,      // 8 AM
  timezone: 'America/Los_Angeles',
  channels: {
    inApp: true,
    email: false,
    push: false,
  },
  playbook_toggles: {
    jobSearch: true,
    resumeHelp: true,
    interviewPrep: true,
    networking: true,
    careerPath: true,
    applicationTracking: true,
  },
}
```

## User Experience

1. **Loading State**: Shows spinner while fetching user data
2. **Error Handling**: Toast notifications for all operations
3. **Validation**: Prevents invalid quiet hours configuration
4. **Optimistic Updates**: Form state updates immediately
5. **Persistence**: All changes saved to Convex database

## Testing Checklist

- [x] Toggle master agent on/off
- [x] Toggle proactive suggestions
- [x] Change quiet hours
- [x] Toggle notification channels
- [x] Toggle individual playbooks
- [x] Save preferences
- [x] Reset to defaults with confirmation
- [x] Preferences persist across page reloads
- [x] Default preferences created for new users

## Known Issues

None - System is fully functional.

## Future Enhancements

1. **Timezone Auto-Detection**: Detect user's timezone automatically
2. **Notification Frequency**: Add UI for realtime/daily/weekly selection
3. **Custom Quiet Hours**: Allow different quiet hours per day of week
4. **Playbook Customization**: Allow users to configure individual playbook settings

## Related Files

- `convex/agent_preferences.ts` - Convex functions
- `src/app/(dashboard)/account/agent-preferences/page.tsx` - UI component
- `convex/schema.ts` - Database schema (agent_preferences table)
