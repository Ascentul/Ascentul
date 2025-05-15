import React, { useEffect } from 'react';
import OnboardingTourComponent from './index';

/**
 * Example of integrating the OnboardingTour into a Dashboard component
 * 
 * This shows how to add the tour to an existing dashboard page
 */

interface DashboardProps {
  // Your existing dashboard props
  user?: {
    name: string;
    email: string;
  };
}

// Example Dashboard component with integrated onboarding tour
const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // Any existing dashboard logic...
  
  useEffect(() => {
    // You can add additional logic here that should run alongside the tour
    // For example, tracking when the dashboard was first visited
    
    console.log('Dashboard loaded with onboarding tour');
  }, []);

  return (
    <div className="dashboard-container" id="dashboard">
      {/* Include the OnboardingTourComponent */}
      <OnboardingTourComponent />
      
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'User'}</h1>
        <p>Here's your career progress dashboard</p>
      </div>
      
      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Make sure to add the appropriate ID attributes to elements 
            that will be highlighted in the tour */}
        
        {/* Resume Builder Section - referenced in tour step 1 */}
        <section id="resumeBuilder" className="dashboard-section">
          <h2>Resume Builder</h2>
          {/* Resume builder content */}
        </section>
        
        {/* Goal Tracker Section - referenced in tour step 2 */}
        <section id="goalTracker" className="dashboard-section">
          <h2>Goal Tracker</h2>
          {/* Goal tracker content */}
        </section>
      </div>
      
      {/* ... other dashboard sections ... */}
      
      {/* Example of Settings Button - referenced in tour step 3 */}
      <div className="dashboard-settings">
        <button id="settings" className="settings-button">
          Settings
        </button>
      </div>
    </div>
  );
};

export default Dashboard;

/**
 * INTEGRATION NOTES:
 * 
 * 1. Add OnboardingTourComponent to your dashboard page
 * 2. Make sure the container element has id="dashboard"
 * 3. Add the appropriate ID attributes to elements that will be 
 *    highlighted in the tour (resumeBuilder, goalTracker, settings)
 * 4. If you need to customize the tour steps, update the tourSteps array 
 *    in OnboardingTour.js
 * 5. To reset the tour for testing: window.resetAscentulTour()
 */