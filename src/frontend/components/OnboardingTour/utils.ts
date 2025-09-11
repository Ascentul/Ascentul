/**
 * Utility functions for the Onboarding Tour
 */

// Local storage keys
const STORAGE_KEYS = {
  tourDismissed: 'ascentul_tour_dismissed',
  tourCompleted: 'ascentul_tour_completed'
};

/**
 * Check if the user has dismissed or completed the tour
 * @returns {boolean} True if the tour should be shown
 */
export const shouldShowTour = (): boolean => {
  const tourDismissed = localStorage.getItem(STORAGE_KEYS.tourDismissed) === 'true';
  const tourCompleted = localStorage.getItem(STORAGE_KEYS.tourCompleted) === 'true';
  
  return !tourDismissed && !tourCompleted;
};

/**
 * Mark the tour as dismissed
 */
export const dismissTour = (): void => {
  localStorage.setItem(STORAGE_KEYS.tourDismissed, 'true');
};

/**
 * Mark the tour as completed
 */
export const completeTour = (): void => {
  localStorage.setItem(STORAGE_KEYS.tourCompleted, 'true');
};

/**
 * Reset the tour state (for testing or developer use)
 */
export const resetTour = (): void => {
  localStorage.removeItem(STORAGE_KEYS.tourDismissed);
  localStorage.removeItem(STORAGE_KEYS.tourCompleted);

};

/**
 * Get tour status information
 * @returns {Object} Tour status information
 */
export const getTourStatus = (): {
  isDismissed: boolean;
  isCompleted: boolean;
  shouldShow: boolean;
} => {
  const isDismissed = localStorage.getItem(STORAGE_KEYS.tourDismissed) === 'true';
  const isCompleted = localStorage.getItem(STORAGE_KEYS.tourCompleted) === 'true';
  
  return {
    isDismissed,
    isCompleted,
    shouldShow: !isDismissed && !isCompleted
  };
};

/**
 * Available positions for the tooltip
 */
export enum TooltipPosition {
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
  Left = 'left'
}

/**
 * Tour step interface
 */
export interface TourStep {
  target: string;
  title: string;
  content: string;
  tryItText: string;
  position: TooltipPosition;
}

/**
 * Default tour steps - can be customized for the specific application
 */
export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    target: '#resumeBuilder',
    title: 'AI Resume Builder',
    content: 'Create professional resumes tailored to specific job descriptions with our AI-powered resume builder.',
    tryItText: 'Try Resume Builder',
    position: TooltipPosition.Bottom
  },
  {
    target: '#goalTracker',
    title: 'Goal Tracker',
    content: 'Set career goals and track your progress with our intuitive goal tracking system.',
    tryItText: 'Set a Goal',
    position: TooltipPosition.Bottom
  },
  {
    target: '#settings',
    title: 'Personalize Your Experience',
    content: 'Customize your account settings, notification preferences, and profile information.',
    tryItText: 'Update Settings',
    position: TooltipPosition.Left
  }
];