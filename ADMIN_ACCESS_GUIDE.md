w# Admin Account Access Guide

## 🎉 **ADMIN ACCOUNTS ARE READY!**

All admin accounts have been successfully created in Supabase and are ready to use.

---

## 🔑 **Working Login Credentials**

### **🔧 System Admin (Super Admin)**

- **Email**: `admin@careertracker.io`
- **Password**: `admin123`
- **Role**: `super_admin`
- **Access**: Full system administration with all features

### **🏫 University Admin**

- **Email**: `admin@university.edu`
- **Password**: `password`
- **Role**: `university_admin`
- **Access**: University-specific administration

### **🔧 Alternative System Admin**

- **Email**: `admin@example.com`
- **Password**: `changeme123`
- **Role**: `admin`
- **Access**: System administration

---

## 🚀 **How to Access Admin Portals**

### **Step 1: Login**

1. **Go to**: `http://localhost:3000/sign-in`
2. **Enter any of the email/password combinations above**
3. **Click Sign In**

### **Step 2: Automatic Redirect**

- **System Admins** → Redirected to `/admin/` dashboard
- **University Admins** → Redirected to `/university-admin/` dashboard

---

## 🎯 **Portal Features**

### **System Admin Portal** (`/admin/`)

- **Dashboard**: System overview and metrics
- **User Management**: Manage all user types
- **Universities**: Manage university accounts
- **Analytics**: Platform-wide analytics
- **Billing**: Subscription and payment management
- **Reviews**: User feedback and ratings
- **System Security**: Security settings (super_admin only)
- **Settings**: System configuration

### **University Admin Portal** (`/university-admin/`)

- **Dashboard**: University-specific metrics
- **Students**: Manage university students
- **Invite**: Send student invitations
- **Usage Analytics**: Track university usage
- **Settings**: University configuration
- **Support**: Help and support tools

---

## 🔧 **Admin Account Management**

### **Creating Additional Admin Accounts**

Run the setup script anytime to ensure accounts are properly configured:

```bash
npm run create:admins
```

### **Changing Admin Passwords**

Admin passwords can be changed through:

1. **Supabase Dashboard** → Auth → Users
2. **Admin Portal** → Settings → Account Settings

### **Role Permissions**

- **`super_admin`**: Full access to all features including system security
- **`admin`**: System administration without security settings
- **`university_admin`**: Limited to university-specific features

---

## 🌐 **Quick Access Links**

- **Login Page**: http://localhost:3000/sign-in
- **System Admin Portal**: http://localhost:3000/admin/
- **University Admin Portal**: http://localhost:3000/university-admin/

---

## ✅ **Verification Checklist**

- [x] Supabase Auth users created
- [x] Database records synchronized
- [x] Role-based access configured
- [x] Admin portals functional
- [x] Login credentials verified
- [x] Automatic redirects working

**Status**: 🟢 **ALL ADMIN ACCOUNTS READY FOR USE**
