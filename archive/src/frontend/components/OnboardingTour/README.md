# Ascentul Onboarding Tour

A hybrid onboarding experience for the Ascentul application dashboard.

## Features

- **Dashboard Card**: Dismissible card fixed at the top of the dashboard
- **Interactive Walkthrough**: Step-by-step overlay tour with tooltips that highlight key features
- **Local Storage**: Tracks user preferences (dismissed/completed) across sessions
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Customizable**: Easily adaptable to different UI layouts and feature sets

## How to Use

### 1. Add the Component to Your Dashboard Page

Import and include the `OnboardingTourComponent` in your dashboard page:

```jsx
import React from 'react';
import OnboardingTourComponent from '../components/OnboardingTour';

const DashboardPage = () => {
  return (
    <div id="dashboard">
      {/* Include the OnboardingTour component */}
      <OnboardingTourComponent />
      
      {/* Rest of your dashboard content */}
      <h1>Dashboard</h1>
      {/* ... */}
    </div>
  );
};

export default DashboardPage;
```

### 2. Add IDs to the Feature Elements

Make sure to add the appropriate IDs to the elements you want to highlight in the tour:

```jsx
<div id="resumeBuilder">
  {/* Resume builder content */}
</div>

<div id="goalTracker">
  {/* Goal tracker content */}
</div>

<div id="settings">
  {/* Settings content */}
</div>
```

### 3. Customize the Tour Steps

Update the `tourSteps` array in `OnboardingTour.js` to match your application's features:

```javascript
this.tourSteps = [
  {
    target: '#resumeBuilder',
    title: 'AI Resume Builder',
    content: 'Create professional resumes tailored to specific job descriptions with our AI-powered resume builder.',
    tryItText: 'Try Resume Builder',
    position: 'bottom'
  },
  // Add or modify steps as needed
];
```

## Customization Options

### Appearance

You can modify the appearance by editing the CSS in `onboarding.css`. The main color variables are:

- Primary color (buttons, highlights): `#4F46E5`
- Text colors: `#1E293B` (dark), `#64748B` (medium), `#94A3B8` (light)
- Background colors: `#F8FAFC` (light), `#F1F5F9` (subtle)

### Tour Step Configuration

Each tour step has the following properties:

- `target`: CSS selector for the element to highlight (required)
- `title`: Title of the tooltip (required)
- `content`: Description text (required)
- `tryItText`: Text for the action button (required)
- `position`: Position of the tooltip - 'top', 'right', 'bottom', or 'left' (optional, defaults to 'bottom')

### Reset Tour (For Testing)

You can reset the tour state in the browser console with:

```javascript
window.resetAscentulTour();
```

## Demo

A standalone demo is available in `demo.html` that showcases the tour functionality without requiring the full application.

## For Production

When integrating with the production application:

1. Update the tour steps to match your actual UI components
2. Test with different viewport sizes to ensure responsive behavior
3. Consider adding analytics tracking to monitor tour completion rates
4. Optionally add a way for users to restart the tour from settings or help section