# 🛠 Refactor Instructions: Replace `user.userType` checks with `user.role`

## Overview
The application currently uses both `user.userType` and `user.role` fields for authorization, leading to inconsistent user routing. This guide outlines how to standardize by prioritizing the `user.role` field.

## Problem
- Super admin users see `/admin-dashboard` briefly before being redirected to `/career-dashboard`
- Some route guards check only `userType` while others check both fields
- Admin users with `role='super_admin'` but `userType='admin'` are being incorrectly routed

## Strategy
Always check both fields with role taking precedence:

### Examples

**For admin checks, replace:**
```javascript
if (user.userType === 'admin') {
  // Admin-specific logic
}
```

**With:**
```javascript
if (user.role === 'super_admin' || user.role === 'admin' || user.userType === 'admin') {
  // Admin-specific logic
}
```

**For staff checks, replace:**
```javascript
if (user.userType === 'staff') {
  // Staff-specific logic
}
```

**With:**
```javascript
if (user.role === 'staff' || user.userType === 'staff') {
  // Staff-specific logic
}
```

**For university admin checks, replace:**
```javascript
if (user.userType === 'university_admin') {
  // University admin logic
}
```

**With:**
```javascript
if (user.role === 'university_admin' || user.userType === 'university_admin') {
  // University admin logic
}
```

**For regular user checks, replace:**
```javascript
if (user.userType === 'regular' || user.userType === 'user') {
  // Regular user logic
}
```

**With:**
```javascript
if (user.role === 'user' || user.role === 'university_user' || user.userType === 'regular' || user.userType === 'user') {
  // Regular user logic
}
```

## Files to Update
Based on the grep results, focus on these critical files:

### 1. Authentication & Routing Logic
- `client/src/lib/useUserData.tsx` - Contains helper hooks for role checking
- `client/src/components/RouteProtection.tsx` - Contains all route guards
- `client/src/components/LoginDialog.tsx` - Handles post-login navigation

### 2. Admin-Specific Pages
- `client/src/pages/admin-login.tsx`
- `client/src/layouts/AdminLayout.tsx`

### 3. Staff-Specific Pages
- `client/src/pages/staff-login.tsx`
- `client/src/components/StaffLayout.tsx`

### 4. University-Specific Pages
- `client/src/layouts/UniversityAdminLayout.tsx`

## Testing Checklist
- ✅ Login as superadmin@dev.ascentul (should be redirected to `/admin-dashboard`)
- ✅ Login as a regular user (should be redirected to `/career-dashboard`)
- ✅ Login as a university admin (should be redirected to `/university-admin/dashboard`)
- ✅ Login as a university student (should be redirected to `/university`)
- ✅ Login as a staff member (should be redirected to `/staff-dashboard`)

## Additional Notes
- Display of user role/type in UI (user profile, account settings) can continue to use `userType` for now
- For consistency, consider a database migration to update all users to have matching `role` and `userType` values