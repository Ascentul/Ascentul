# Bug Fix Implementation Plan
## Based on Review PDFs from September 27, 2025

---

## 🎯 **CAREER APP (Student-Facing)**

### **CRITICAL PRIORITY - Authentication & Core Flow**

#### 1. Login/Sign-In Issues
- [ ] Update login screen text to previous version:
  - "Accelerate Your Career Path"
  - "Your all-in-one platform to plan, build, and launch your career."
  - ✔ AI-powered coaching to guide your next steps
  - ✔ Create polished resumes and tailored cover letters
  - ✔ Track and achieve your career goals with clarity
  - ✔ Explore career paths and opportunities with confidence
  - ✔ Organize your projects, skills, and experiences in one place
- [ ] Make Google/LinkedIn OAuth buttons functional
- [ ] Remove Personal/University login toggle (all logins work regardless)
- [ ] Fix "Forgot Password" functionality

#### 2. Onboarding
- [ ] Replace current onboarding with: Major, Graduation Year, Dream Job questions
- [ ] OR remove onboarding entirely if replacement not feasible

---

### **HIGH PRIORITY - Navigation & Core Features**

#### 3. Navigation Bar Structure
- [ ] Implement group tabs:
  - Dashboard
  - Applications
  - **My Path (Group Tab)**
    - Goals
    - Career Path Explorer
  - **Portfolio (Group Tab)**
    - Resume Studio
    - Cover Letter Coach
    - Projects
  - **Connections (Group Tab)**
    - Network Hub
  - Coach
  - Profile (formerly career profile)

- [ ] Fix profile image click to go to `/account` instead of Clerk settings
- [ ] Fix settings cog alignment in expanded nav view
- [ ] Change all page headers from black to brand blue (#0C29AB)

#### 4. Dashboard Layout & Functionality
**Correct Layout Order:**
- Row 1: Stat cards
- Row 2: Onboarding Checklist
- Row 3: Recommendations
- Row 4: Active Interviews element, Follow up actions element, Goals element
- Row 5: Recent Activity

**Fixes:**
- [ ] Reorder dashboard elements to match layout above
- [ ] Fix onboarding checklist functionality (mark items complete when done)
- [ ] Fix recommendations to auto-display without click
- [ ] Show one recommendation at a time
- [ ] Remove "Interview Rate" stat card
- [ ] Add "Add Contact" button to Quick Actions (links to Network Hub)
- [ ] Change "Pending tasks" to "Pending Follow ups"
- [ ] Fix progress bar showing color at 0% (should be empty)

#### 5. Applications Feature
**Structure:**
- [ ] Add Applications/Job Search toggle at top of page
- [ ] Applications toggle (default): Shows application tracker
- [ ] Job Search toggle: Shows job search interface

**Application Detail Page:**
- [ ] Ensure tabs work: Details, Materials, Interviews, Follow-up
- [ ] Make interview status bubbles clickable to change status
- [ ] Enable edit/delete for interviews
- [ ] Fix "pending" bubble functionality

---

### **HIGH PRIORITY - Goals & Career Path**

#### 6. Goals Feature Fixes
- [ ] Fix goal creation (currently not saving)
- [ ] Fix goal completion errors (repeating error messages every 0.5s)
- [ ] Show completed goals in timeline
- [ ] Fix "In Progress" filter display: "in_progress" → "In Progress" (remove underscore)
- [ ] Remove redundant bubble on goal template cards
- [ ] Center-align template titles with icons
- [ ] Remove visible scrollbar but keep scroll functionality
- [ ] Color template icon backgrounds: brand blue (#0C29AB) with white icons
- [ ] Auto-populate checklist in goal creation form (don't require "Add first item" click)

#### 7. Career Path Explorer - RESTORE PREVIOUS WORKING VERSION
**Note:** This was functioning correctly until latest update

**Two-Toggle System:**

**Primary Toggle: "My Best Path"**
- [ ] One-tap generation of 3-5 recommended paths from user profile
- [ ] Uses current role/major, resume data, saved jobs, applications, goals, skills
- [ ] Generates horizontal career role cards with: title, experience needed, salary range
- [ ] Clicking card opens overview popup with 3 tabs:

**Overview Tab:**
- [ ] Role description
- [ ] Growth outlook
- [ ] Compensation details
- [ ] Experience required
- [ ] "Add as Goal" button (creates career goal with customized checklist)

**Skills & Requirements Tab:**
- [ ] List of skills in bubbles
- [ ] + button next to each skill to add to user profile

**Certifications Tab:**
- [ ] Grid of suggested/required certifications
- [ ] Each cert has "Add as Goal" button
- [ ] AI-generated for accuracy

**Secondary Toggle: "Explore any Role"**
- [ ] Typeahead search for any target job
- [ ] Generates path from current profile to that role
- [ ] Include "Compare to best paths" option

---

### **MEDIUM PRIORITY - Documents & Portfolio**

#### 8. Resume Studio - Three Toggle System

**My Resumes Toggle:**
- [ ] Show all created resumes in card grid (manual, AI-generated, AI-optimized, PDF upload)
- [ ] Restore card styling from old UI
- [ ] Add buttons to each card: Edit, Copy, Delete, Export
- [ ] Fix PDF export styling (currently unstyled block of text)

**Generate with AI Toggle:**
- [ ] Allow user to paste job description
- [ ] Click Generate to create optimized resume
- [ ] Two buttons: "Save Resume" and "Optimize My Profile"
- [ ] Use all career profile data as source

**Upload & Analyze Toggle:**
- [ ] User uploads PDF resume
- [ ] Paste job description
- [ ] Tool analyzes fit for role
- [ ] Provides analysis and suggestions
- [ ] Option to optimize and save to "My Resumes"
- [ ] Show analysis in right modal panel

#### 9. Cover Letter Coach - Three Toggle System

**My Cover Letters Toggle:**
- [ ] Same issues as Resume Studio - need card styling
- [ ] Show all created cover letters (manual, AI-generated, AI-optimized, PDF upload)
- [ ] Add Export, Edit, Copy, Delete buttons
- [ ] Fix PDF export functionality (currently missing)

**Generate with AI Toggle:**
- [ ] Paste job description
- [ ] Generate optimized cover letter
- [ ] Use all career profile data (must be truthful)
- [ ] Save to "My Cover Letters"

**Upload & Analyze Toggle:**
- [ ] Paste cover letter text
- [ ] Paste job description
- [ ] Analyze fit for role
- [ ] Provide optimization suggestions
- [ ] Option to optimize and save

**Cover Letter Styling:**
- [ ] Apply same styling as resume analysis results
- [ ] Ensure proper formatting in output

#### 10. Projects
- [ ] Rename from "Project Portfolio" to "Projects"
- [ ] Add image upload functionality to cards
- [ ] Add edit option for project records
- [ ] Add delete option for project records
- [ ] Restore old UI card styling

---

### **MEDIUM PRIORITY - Networking & Coach**

#### 11. Network Hub - Complete Rebuild
**Main Screen UI:**
- [ ] Add search module
- [ ] Add toggle area (All Contacts, Companies, Need Follow-up)
- [ ] Add contact table with columns: Contact, Position, Relationship, Last Contact, Actions

**Actions Button Features:**
- [ ] View Contact
- [ ] Edit Contact
- [ ] Log Interaction
- [ ] Schedule Follow-up

**Contact Details View:**
- [ ] Make contact names blue and clickable
- [ ] Show contact details popup with 4 tabs:
  - **Info Tab:** Contact information, Social & Web links, Follow-up information
  - **Interactions Tab:** Log of interactions
  - **Follow-ups Tab:** Scheduled follow-ups
  - **Notes Tab:** Private notes
- [ ] Add "Log Interaction" button
- [ ] Add "Schedule Follow-up" button
- [ ] Show "Needs follow-up" status with date

#### 12. Career Coach
- [ ] Keep within app (currently opens new tab - should stay in app with nav bar)
- [ ] Restore previous UI styling with chat interface

#### 13. Career Profile - NEW IMPLEMENTATION
**URL Structure:**
- [ ] Change from `/account` to `/profile/studentid#`

**Functionality:**
- [ ] Page where students enter all career data:
  - Major
  - Education
  - Work history
  - Professional summary
  - Skills
  - Achievements
  - Career interests

**Design Elements:**
- [ ] Add cover image banner
- [ ] Add profile image
- [ ] Display all activity summary in individual modules
- [ ] Make viewable by university admins (when they click "View Profile" on student)
- [ ] Allow editing of all profile sections
- [ ] Remove "Profile" from account settings page once this is implemented

**Suggested Layout:**
- Profile header with cover image and profile photo
- Career summary section
- LinkedIn profile link
- Major and graduation info
- Work history
- Education
- Skills
- Activity overview (applications, goals, projects, etc.)

---

### **LOW PRIORITY - Settings & Polish**

#### 14. Account Settings (`/account`)
**Profile Tab:**
- [ ] Ensure all field changes save properly (currently only name saves)
- [ ] Fix avatar upload functionality (Change Avatar button not working)
- [ ] Remove AI model information from student settings

**Security Tab:**
- [ ] Fix password change functionality (currently fails)
- [ ] Ensure security settings save properly

**Notes:**
- Once Career Profile is implemented at `/profile/studentid#`, remove profile section from `/account`

---

## 🏫 **UNIVERSITY ADMIN**

### **CRITICAL PRIORITY - Core Navigation & Structure**

#### 1. Navigation Bar Restructure
- [ ] Add "Students" tab to main nav (not dropdown)
  - Sub-pages accessible via toggles at top:
    - Students (list view)
    - Student Progress (charts)
    - Invite Students (import page)

- [ ] Add "Departments" tab to main nav
- [ ] Fix tab highlighting (only current page highlighted, not multiple)
- [ ] Fix settings/logout button alignment in expanded nav
- [ ] Remove "free plan" text from nav

#### 2. Student Invitation & Activation System
**Assign Student Licenses Button:**
- [ ] Show count of remaining seats available
- [ ] Add dropdown to select which program students assigned to
- [ ] Change "Staff" button to "Advisor / Staff"
- [ ] Ensure activation email sends (allows user to set password)
- [ ] Provide CSV import template download link
  - Template fields: email, first_name, last_name, program, cohort, role, tags
  - OR simpler: just email field

**Activation Flow:**
- [ ] Remove requirement for students to sign up first
- [ ] Invite action creates account AND sends activation email (magic link style)
- [ ] Email allows student to set password and activate under specific university
- [ ] Use email copy from: https://docs.google.com/document/d/1fmah8v0yrtTCmFeBmWUjVxggaElzfEUcpJAaMzgQn9M/edit?usp=sharing

---

### **HIGH PRIORITY - Dashboard & Analytics**

#### 3. Dashboard - Overview Toggle
- [ ] Fix "Export Reports" button (currently errors: "No university assigned to user")
- [ ] Fix progress bar at 0% (should be empty, currently shows some color)
- [ ] Ensure all charts display data:
  - Total Students (shows data ✓)
  - License Usage (shows data ✓)
  - Active Students (shows data ✓)
  - Platform Usage (shows data ✓)
  - Feature Usage (no pie chart showing currently)
  - Weekly Activity (needs verification)

- [ ] Remove "Course Stats" chart entirely
- [ ] Fix Feature Usage chart text crowding
- [ ] Add bar count labels to Student Progress Insights (visible without hover)
- [ ] Add vertical spacing between key and chart in "Student Distribution by Department"

#### 4. Dashboard - Students Toggle
- [ ] Remove toggle buttons (page should show stats/charts only)
- [ ] Add stat cards at top:
  - Active Students This Month (unique students who logged in/engaged)
  - Average Asset Completion % (percentage of career assets completed)
  - Total Advisor Sessions Logged (advising interactions recorded)
  - At-Risk Students (count and % with low usage and low progress)

- [ ] Show charts:
  - Overall Progress Completion Rate (% of students who completed core assets)
  - Asset Completion Breakdown by Category (average completion: resumes, cover letters, goals, applications)
  - Student Engagement Over Time (line chart: logins/sessions per week/month)
  - Top Features Used (ranked bar chart of most accessed tools)
  - At-Risk Students Segment (students with low progress AND low usage)

#### 5. Dashboard - Departments Toggle
- [ ] Move stat cards to top of page
- [ ] Ensure charts populate when student data exists:
  - Student Distribution by Department
  - Department Utilization Trends

#### 6. Dashboard - Analytics Toggle
- [ ] Make time filter functional (currently doesn't change data when switched)
- [ ] Make programs filter functional (currently doesn't change data)
- [ ] Make Overview/Features/Programs buttons functional (currently don't change data)
- [ ] Remove dummy data from "Recent Reports" element

---

### **MEDIUM PRIORITY - Students & Departments**

#### 7. Students Tab (NEW - Main Nav)
**Students Toggle (List View):**
- [ ] Show contact list of students
- [ ] Add search bar
- [ ] Add action button on each student record
- [ ] Make student record clickable → shows career profile overview
- [ ] Implement filters and sorting

**Student Progress Toggle (Charts Page):**
- [ ] Stat cards at top:
  - Active Students This Month
  - Average Asset Completion
  - Total Advisor Sessions Logged
  - At-Risk Students

- [ ] Show charts:
  - Overall Progress Completion Rate
  - Asset Completion Breakdown by Category
  - Student Engagement Over Time
  - Top Features Used
  - At-Risk Students Segment

**Invite Students Toggle (Import Page):**
- [ ] Better UX than popup
- [ ] CSV import functionality
- [ ] Program assignment dropdown
- [ ] Remaining seats display
- [ ] CSV template download

#### 8. Departments Tab (NEW - Main Nav)
- [ ] Fix "Add Department" button (currently errors)
- [ ] Add department management interface
- [ ] Show department charts:
  - Student Distribution by Department
  - Department Utilization Trends
- [ ] Add stat cards for department metrics

#### 9. Analytics Tab
**Replace "Coming Soon" with Full Analytics:**

- [ ] Add filters:
  - Time range (Last 7 days, Last 30 days, etc.)
  - Programs filter
  - Department filter

- [ ] Add overview/features/programs toggle buttons

- [ ] Implement charts:
  - Total Logins
  - Active Users
  - Platform Usage (total logins, active users, avg session time trend)
  - Feature Usage (most popular features among students)
  - Weekly Activity (user and assignment submissions)
  - Student Progress Insights
  - Student Distribution by Department
  - Department Utilization Trends

---

### **LOW PRIORITY - Settings**

#### 10. University Settings (`/university/settings`)
- [ ] Add "Programs" toggle for program management
  - Add new programs
  - Assign students to programs
  - Manage program settings

- [ ] Ensure all changes save properly (currently not saving)
- [ ] Remove "API Access" from advanced settings
- [ ] Make "License Management" view-only (currently editable)
- [ ] Remove "Maximum students" field
- [ ] Fix Email Notifications configure button
- [ ] Fix Data Export button
- [ ] Fix Security configure button

#### 11. Account Settings (`/account`)
**Profile Tab:**
- [ ] Fix save functionality (only name saves, company doesn't)
- [ ] Fix "Change Avatar" button (not functional)
- [ ] Remove AI model information from university admin

**Security Tab:**
- [ ] Fix password change functionality

**Optional Enhancement:**
- [ ] Allow university admin to upload school logo
- [ ] Show school logo on all student accounts

---

## 👑 **SUPER ADMIN**

### **CRITICAL PRIORITY - Navigation & User Management**

#### 1. Navigation Bar Fixes
- [ ] Remove group dropdown structure (use flat nav structure)
- [ ] Fix button highlight colors:
  - Selected background: #f0f2ff
  - Selected text: #616ebf
  - Match career app style

- [ ] Fix settings/logout button alignment in expanded nav
- [ ] Remove "free plan" text from nav

#### 2. User Management & Role Structure
**Fix Role Structure:**
- [ ] User
- [ ] Staff
- [ ] University Admin
- [ ] Advisor (same permissions as University Admin, different label)
- [ ] Super Admin

**Filters:**
- [ ] Add "Free plan" to Plans filter (currently missing)
- [ ] Remove "College" filter (not needed)

**Activation Emails:**
- [ ] Send activation email when adding staff user
- [ ] Send activation email for ALL new user types
- [ ] Email should allow password reset and login
- [ ] System creates account first, then sends reset email
- [ ] Use email copy from: https://docs.google.com/document/d/1fmah8v0yrtTCmFeBmWUjVxggaElzfEUcpJAaMzgQn9M/edit?usp=sharing

---

### **HIGH PRIORITY - Dashboard & Universities**

#### 3. Admin Dashboard - Overview Toggle
- [ ] Add Feature Usage count chart showing all features:
  - Applications
  - Job searches
  - Goals
  - Career Paths explored
  - Resumes
  - Cover letters
  - Network Hub
  - Career coach
  - Project Portfolio

#### 4. Admin Dashboard - Analytics Toggle
**Replace "Coming Soon" with:**

- [ ] Active Users Over Time (Students vs Advisors)
  - Line chart with daily/weekly/monthly toggle
  - Core growth and engagement metric

- [ ] License Utilization by University
  - Bar chart showing % of licenses activated
  - Measures adoption and rollout success

- [ ] Activation Funnel
  - Steps: Invite sent → Account created → Profile completed → First login
  - Identifies onboarding leaks

- [ ] Feature Usage Breakdown
  - Stacked bar or donut chart (Resume Studio, Goal Tracker, Path Explorer, etc.)
  - Shows engagement depth and value drivers

- [ ] Applications → Interviews → Offers Funnel
  - Conversion funnel chart
  - Connects usage to career outcomes

#### 5. Admin Dashboard - Universities Toggle
**Replace List View with Charts:**

- [ ] License Utilization by University
  - Bar chart: % of licenses activated (students & advisors)
  - Shows if schools are adopting platform

- [ ] Monthly Active Students (MAU) per University
  - Trend line or stacked line by school
  - Core engagement measure

- [ ] Feature Usage Breakdown
  - Stacked bar: which tools students use most
  - Reveals engagement depth and underused features

- [ ] Applications → Interviews → Offers Funnel
  - Conversion funnel chart
  - Ties Ascentful to leadership outcomes

#### 6. Admin Dashboard - System Toggle
- [ ] Verify data is real (currently appears to be dummy data for support metrics)
- [ ] Ensure all system metrics are accurate

#### 7. Universities Tab
- [ ] Send activation email when adding university admin
- [ ] Activation email allows password reset and login

---

### **MEDIUM PRIORITY - Support & Analytics**

#### 8. Support Tickets Tab
- [ ] Replace "Loading support tickets..." with functional support dashboard
- [ ] Show actual ticket data (currently stuck loading)
- [ ] URL: `/admin/support`

#### 9. Analytics Tab
- [ ] Replace "Loading analytics..." with functional analytics
- [ ] URL: `/admin/analytics`

**Implement Full Analytics Suite:**
- [ ] Active Users Over Time (Students vs Advisors)
- [ ] License Utilization by University
- [ ] Activation Funnel
- [ ] Feature Usage Breakdown
- [ ] Applications → Interviews → Offers Funnel

---

### **LOW PRIORITY - Settings**

#### 10. Admin Settings (`/admin/settings`)
- [ ] Ensure all changes save properly
- [ ] Move OpenAI Model Configuration here (consolidate from account settings)
- [ ] Configure OpenAI model settings for entire platform

#### 11. Account Settings (Bottom Nav - `/account`)
**Profile Tab:**
- [ ] Remove Professional Details section (not needed for super admin)
- [ ] Remove Bio field (not needed for super admin)
- [ ] Fix save functionality (currently not saving changes)
- [ ] Fix "Change Avatar" button (not functional)

**Security Tab:**
- [ ] Fix password change functionality (currently fails with error)

**AI Model Section:**
- [ ] Move this section to Admin Settings (`/admin/settings`)
- [ ] Remove from Account Settings
- [ ] Consolidate all OpenAI configuration in one place

---

## 📊 **IMPLEMENTATION PRIORITY TIMELINE**

### **WEEK 1 - CRITICAL FOUNDATION**
1. ✅ Authentication & Activation Emails (All Apps)
2. Navigation Structure (All Apps)
3. Settings Save Functionality (All Apps)
4. Core Dashboard Fixes (Career App)

### **WEEK 2 - CORE FEATURES**
1. Goals Feature Fixes (Career App)
2. Applications Feature (Career App)
3. Student Management System (University Admin)
4. User Management & Roles (Super Admin)

### **WEEK 3 - DOCUMENTS & PATH**
1. Resume Studio (Career App)
2. Cover Letter Coach (Career App)
3. Career Path Explorer Restoration (Career App)
4. Analytics Dashboards (University Admin & Super Admin)

### **WEEK 4 - NETWORKING & PROFILE**
1. Network Hub (Career App)
2. Career Profile Implementation (Career App)
3. Projects Feature (Career App)
4. Department Management (University Admin)

### **WEEK 5 - POLISH & ENHANCEMENT**
1. Career Coach (Career App)
2. Advanced Analytics (All Apps)
3. Support Tickets System (Super Admin)
4. Final UI/UX Polish (All Apps)

---

## 🔑 **KEY TECHNICAL NOTES**

### **Activation Email System**
- Must send when: Super Admin creates University Admin, University Admin creates Student/Advisor/Staff
- Email should: Allow password reset/setting, Magic link style
- Copy reference: https://docs.google.com/document/d/1fmah8v0yrtTCmFeBmWUjVxggaElzfEUcpJAaMzgQn9M/edit?usp=sharing

### **Brand Colors**
- Primary Blue: `#0C29AB`
- Selected Background: `#f0f2ff`
- Selected Text: `#616ebf`

### **URL Structure**
- Career Profile: `/profile/studentid#` (not `/account`)
- University Settings: `/university/settings`
- Admin Settings: `/admin/settings`
- Account Settings: `/account`

### **Role Hierarchy**
1. Super Admin (full access)
2. University Admin (university-level access)
3. Advisor (same as University Admin, different label)
4. Staff (limited admin access)
5. User (student access)

---

## ✅ **COMPLETION CHECKLIST**

### Career App
- [ ] All authentication issues resolved
- [ ] Navigation with group tabs working
- [ ] Dashboard properly structured
- [ ] Applications feature complete
- [ ] Goals feature working
- [ ] Career Path Explorer restored
- [ ] Resume Studio with 3 toggles
- [ ] Cover Letter Coach with 3 toggles
- [ ] Projects feature enhanced
- [ ] Network Hub rebuilt
- [ ] Career Coach styled
- [ ] Career Profile implemented
- [ ] All settings functional

### University Admin
- [ ] Navigation restructured
- [ ] Student invitation/activation working
- [ ] Dashboard toggles functional
- [ ] Students tab with 3 sub-pages
- [ ] Departments tab functional
- [ ] Analytics fully implemented
- [ ] Settings saving properly
- [ ] Programs management added

### Super Admin
- [ ] Navigation simplified
- [ ] User management with proper roles
- [ ] Activation emails working
- [ ] Dashboard with feature usage
- [ ] Analytics implemented
- [ ] Universities tab with charts
- [ ] Support tickets functional
- [ ] Settings consolidated
- [ ] All account settings working

---

## 📝 **NOTES FOR CONTEXT CONTINUATION**

**Last Updated:** 2025-10-02

**Current Status:** Plan created, ready to begin implementation starting with Week 1 Critical Foundation items.

**Priority Order:**
1. Start with authentication/activation emails across all apps
2. Fix navigation structures
3. Ensure all save functionality works
4. Then proceed feature by feature following priority order

**Key Files to Check:**
- Password reset functionality
- Student/user creation flows
- Settings pages across all apps
- Dashboard components
- Navigation components

**Testing Requirements:**
- Test activation email flow end-to-end
- Verify all save operations persist data
- Test navigation highlighting
- Verify role-based permissions
- Test CSV import for student invitations
