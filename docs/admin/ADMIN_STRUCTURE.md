# Ascentul Admin Infrastructure

## Overview

Ascentul has a comprehensive admin system with **two distinct admin levels** that provide different scopes of control and functionality:

1. **University Admin** - For managing university students at specific institutions
2. **System Admin/Super Admin** - For managing the entire platform

---

## 🏫 University Admin Portal

### **Access & Role**

- **Role**: `university_admin` (in both `role` and `userType` fields)
- **Access URL**: `/university-admin/`
- **Scope**: Limited to their specific university

### **Features**

- **Dashboard**: Overview of university metrics and activities
- **Students Management**: View, manage, and monitor university students
- **Invite Students**: Send invitations to new students
- **Usage Analytics**: Track student engagement and platform usage
- **Settings**: Configure university-specific settings
- **Support**: Access to help and support resources

### **Layout & Navigation**

- Uses `UniversityAdminLayout` component
- Clean sidebar navigation with university branding
- User profile with role identification
- Protected by `UniversityAdminRouteGuard`

---

## 🔧 System Admin Portal

### **Access & Roles**

- **Roles**: `admin`, `super_admin`, `staff`
- **Access URL**: `/admin/`
- **Scope**: Platform-wide administration

### **Role Hierarchy**

#### **Admin** (`admin` role)

Base administrative access with core functionality:

- Dashboard overview
- Universities management
- Users management
- Analytics
- Reviews management
- Email administration

#### **Super Admin** (`super_admin` role)

Enhanced administrative access with additional privileged features:

- **All Admin features PLUS:**
- **System Settings**: Advanced configuration options
- **AI Models**: AI model management and configuration
- **System Logs**: Access to detailed system logs
- **Billing Management**: Financial and subscription management
- **System Security**: Advanced security monitoring and controls

### **Features by Role**

| Feature            | Admin | Super Admin |
| ------------------ | ----- | ----------- |
| Dashboard          | ✅    | ✅          |
| Universities       | ✅    | ✅          |
| Users              | ✅    | ✅          |
| Analytics          | ✅    | ✅          |
| Reviews            | ✅    | ✅          |
| Email              | ✅    | ✅          |
| System Settings    | ❌    | ✅          |
| AI Models          | ❌    | ✅          |
| System Logs        | ❌    | ✅          |
| Billing Management | ❌    | ✅          |
| System Security    | ❌    | ✅          |

### **Layout & Navigation**

- Uses `AdminLayout` component with role-based navigation
- Sidebar shows different options based on user role
- Super Admin users see a "Super Admin" badge
- Enhanced user profile section
- Protected by `AdminRouteGuard`

---

## 🛡️ Security & Access Control

### **Route Protection**

- **University Admin**: `UniversityAdminRouteGuard` - Checks for `university_admin` role
- **System Admin**: `AdminRouteGuard` - Checks for `admin`, `super_admin`, or `staff` roles
- **Super Admin Features**: Additional role checks within components

### **Access Validation**

- Authentication required for all admin areas
- Role-based navigation and feature visibility
- Automatic redirects based on user permissions
- Explicit role checking in sensitive components

---

## 🔗 Navigation & URLs

### **University Admin Routes**

```
/university-admin/               - Dashboard
/university-admin/students       - Student Management
/university-admin/invite         - Invite Students
/university-admin/usage          - Usage Analytics
/university-admin/settings       - Settings
/university-admin/support        - Support
```

### **System Admin Routes**

```
/admin/                         - Main Dashboard
/admin/universities             - Universities Management
/admin/users                    - User Management
/admin/analytics                - Platform Analytics
/admin/reviews                  - Reviews Management
/admin/email                    - Email Administration

Super Admin Only:
/admin/settings                 - System Settings
/admin/models                   - AI Models
/admin/openai-logs             - System Logs
/admin/billing                 - Billing Management
/admin/system-security         - Security Management
```

---

## 🚀 Getting Started

### **For University Admins**

1. Log in with university admin credentials
2. Navigate to `/university-admin/`
3. Use the sidebar to access different features
4. Manage students and view analytics for your institution

### **For System Admins**

1. Log in with admin or super admin credentials
2. Navigate to `/admin/`
3. Access features based on your role level
4. Super admins see additional menu items for advanced features

---

## 🔧 Technical Implementation

### **Key Components**

- `AdminLayout` - Main system admin layout with role-based navigation
- `UniversityAdminLayout` - University-specific admin layout
- `AdminRouteGuard` - Protects system admin routes
- `UniversityAdminRouteGuard` - Protects university admin routes

### **Role Checking**

```typescript
// Check for super admin
const isSuperAdmin = user?.role === "super_admin"

// Check for any admin
const isAdmin = user?.role === "admin" || user?.role === "super_admin"

// Check for university admin
const isUniversityAdmin = user?.userType === "university_admin"
```

### **Redirect Logic**

Users are automatically redirected to their appropriate portal based on their role:

- `university_admin` → `/university-admin/`
- `admin`, `super_admin`, `staff` → `/admin/`

---

## ✅ Status Summary

| Portal           | Status          | Features         | Access Control |
| ---------------- | --------------- | ---------------- | -------------- |
| University Admin | ✅ **Complete** | Full feature set | ✅ Role-based  |
| System Admin     | ✅ **Complete** | Base + Enhanced  | ✅ Role-based  |
| Super Admin      | ✅ **Complete** | All features     | ✅ Privileged  |

Both admin portals are **fully functional** with proper role-based access control, comprehensive features, and modern UI/UX design.
