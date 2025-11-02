# Nudge System - Navigation & UI Integration

## Overview

The Proactive AI Agent Nudge System is now fully integrated into the application navigation and UI. Users can access nudge settings, view nudges in their dashboard, and admins can monitor the system.

## User-Facing Navigation

### 1. Account Settings → Agent Preferences

**Location**: `/account` (Account Settings page)

**Access Path**:
1. Click profile avatar (top right)
2. Select "Account Settings"
3. See "AI Agent Preferences" card
4. Click "Manage Agent" button

**Features**:
- Master toggle for AI agent (on/off)
- Proactive nudges toggle
- Quiet hours configuration (start/end time, timezone)
- Notification channels (in-app, email, push)
- Playbook toggles (6 categories: job search, resume, interview, networking, career path, applications)
- Reset to defaults button

**File**: [src/app/(dashboard)/account/page.tsx](../src/app/(dashboard)/account/page.tsx) (lines 266-293)

**Direct Link**: `/account/agent-preferences`

### 2. Dashboard → Nudge Display

**Location**: `/dashboard` (Main Dashboard)

**Position**: Row 3.5 (after "Today's Recommendations", before "Active Interviews")

**Features**:
- Shows top 3 pending nudges
- Each nudge displays:
  - Category badge (Urgent/Suggestion/Tip/Maintenance)
  - Time ago (e.g., "2h ago")
  - Reason and suggested action
  - Action buttons: "Take Action", "Snooze", "Dismiss"
- Link to view all nudges if more than 3
- Empty state when no nudges

**File**: [src/app/(dashboard)/dashboard/page.tsx](../src/app/(dashboard)/dashboard/page.tsx) (lines 353-356)

**Component**: [src/components/dashboard/NudgeList.tsx](../src/components/dashboard/NudgeList.tsx)

## Admin Navigation

### 3. Admin Sidebar → Nudge System

**Location**: Admin navigation sidebar (left panel)

**Position**: After "Analytics", before "Support Tickets"

**Icon**: Bell icon

**Features**:
- Global metrics cards (total nudges, acceptance rate, engagement, avg time to action)
- Status distribution (accepted, snoozed, dismissed, pending)
- Rule performance table (by rule type with acceptance rates)
- 7-day volume trend chart
- Recent activity log (latest 20 interactions)

**File**: [src/components/Sidebar.tsx](../src/components/Sidebar.tsx) (lines 273-278)

**Dashboard**: [src/app/(dashboard)/admin/nudges/page.tsx](../src/app/(dashboard)/admin/nudges/page.tsx)

**Direct Link**: `/admin/nudges`

## Navigation Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                     USER NAVIGATION                          │
└─────────────────────────────────────────────────────────────┘

Dashboard (/dashboard)
   ↓
   ├─ View Nudges (Row 3.5)
   │    ├─ Click "Take Action" → Navigate to action URL
   │    ├─ Click "Snooze" → Hide nudge (1h/4h/24h/1week)
   │    └─ Click "Dismiss" → Remove from feed
   │
   └─ Profile Avatar → Account Settings (/account)
        └─ "AI Agent Preferences" card
             └─ Click "Manage Agent" → /account/agent-preferences
                  ├─ Toggle agent on/off
                  ├─ Toggle proactive nudges
                  ├─ Set quiet hours
                  ├─ Choose channels (in-app/email/push)
                  └─ Toggle playbooks

┌─────────────────────────────────────────────────────────────┐
│                    ADMIN NAVIGATION                          │
└─────────────────────────────────────────────────────────────┘

Admin Sidebar
   └─ Nudge System (/admin/nudges)
        ├─ View global metrics
        ├─ Monitor rule performance
        ├─ Review volume trends
        └─ Check recent activity
```

## UI Components Hierarchy

```text
User Dashboard:
┌─ NudgeList (maxDisplay=3, showHeader=true)
   └─ NudgeCard (for each nudge)
        ├─ Badge (category)
        ├─ Icon (based on category)
        ├─ Title (reason)
        ├─ Description (suggested action)
        └─ Actions (accept, snooze, dismiss)

User Preferences:
┌─ Agent Preferences Page
   ├─ Master Toggles (agent, proactive)
   ├─ Quiet Hours (start/end, timezone)
   ├─ Channels (in-app, email, push)
   └─ Playbook Toggles (6 categories)

Admin Dashboard:
┌─ Nudge Monitoring Page
   ├─ Metrics Cards (4 key metrics)
   ├─ Status Distribution (4 statuses)
   ├─ Rule Performance Table
   ├─ Volume Trend Chart (7 days)
   └─ Recent Activity Table (20 entries)
```

## Access Control

**User Preferences** (`/account/agent-preferences`):
- Accessible by: All authenticated users
- Permission: Own account only
- Features: Full control over personal nudge settings

**Dashboard Nudges** (`/dashboard`):
- Accessible by: All authenticated users (role: `user`)
- Permission: View own nudges only
- Features: Accept, snooze, dismiss actions

**Admin Dashboard** (`/admin/nudges`):
- Accessible by: `super_admin`, `admin` roles only
- Permission: View all users' nudge data (aggregated)
- Features: Read-only monitoring and analytics

## Testing Navigation

### User Flow Test
1. ✅ Visit `/dashboard` → See nudge list (or empty state)
2. ✅ Click nudge "Take Action" → Navigate to correct URL
3. ✅ Click "Snooze" → Nudge disappears, reappears after snooze time
4. ✅ Click "Dismiss" → Nudge removed permanently
5. ✅ Go to `/account` → See "AI Agent Preferences" card
6. ✅ Click "Manage Agent" → Navigate to `/account/agent-preferences`
7. ✅ Toggle settings → Preferences saved
8. ✅ Toggle agent off → Nudges stop appearing in dashboard

### Admin Flow Test
1. ✅ Login as admin
2. ✅ See "Nudge System" in sidebar (with bell icon)
3. ✅ Click "Nudge System" → Navigate to `/admin/nudges`
4. ✅ View metrics → See global statistics
5. ✅ Change time range (day/week/month/all) → Data updates
6. ✅ Review rule performance → Identify effective rules
7. ✅ Check recent activity → See latest user interactions

## Mobile Responsiveness

**Dashboard Nudges**:
- Stacks vertically on mobile
- Full-width cards
- Touch-friendly buttons

**Agent Preferences**:
- Single column layout on mobile
- All toggles accessible
- Quiet hours in stacked selects

**Admin Dashboard**:
- Metrics cards stack 2x2 on tablet, 1 column on mobile
- Tables scroll horizontally
- Charts remain readable on small screens

## Accessibility

**Keyboard Navigation**:
- All buttons and links accessible via Tab
- Enter to activate buttons
- Escape to close dialogs

**Screen Readers**:
- Proper ARIA labels on all interactive elements
- Status updates announced
- Icon meanings conveyed via labels

**Color Contrast**:
- All text meets WCAG AA standards
- Category badges use sufficient contrast
- Icons paired with text labels

---

**Last Updated**: 2025-11-02
**Status**: ✅ Fully Integrated
**Version**: 1.0.0
