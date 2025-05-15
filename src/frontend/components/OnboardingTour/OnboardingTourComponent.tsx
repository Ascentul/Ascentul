import React, { useEffect, useRef } from 'react';
import OnboardingTour from './OnboardingTour';

/**
 * React component wrapper for the OnboardingTour
 * 
 * This component initializes and manages the OnboardingTour class
 * It can be included in the dashboard page or other parent component
 */
const OnboardingTourComponent: React.FC = () => {
  // Use ref to store the tour instance
  const tourRef = useRef<any>(null);

  useEffect(() => {
    // Instantiate the tour only once
    if (!tourRef.current) {
      tourRef.current = new OnboardingTour();
      
      // Initialize the tour
      tourRef.current.init();
    }

    // Cleanup function when the component unmounts
    return () => {
      // Any cleanup needed for the tour (e.g., removing event listeners)
      const tourOverlay = document.querySelector('.tour-overlay');
      const tourTooltip = document.querySelector('.tour-tooltip');
      
      if (tourOverlay) {
        tourOverlay.remove();
      }
      
      if (tourTooltip) {
        tourTooltip.remove();
      }
    };
  }, []);

  // We don't render anything directly - the tour creates its own UI elements
  return null;
};

export default OnboardingTourComponent;