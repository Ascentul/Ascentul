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
export const shouldShowTour = () => {
    const tourDismissed = localStorage.getItem(STORAGE_KEYS.tourDismissed) === 'true';
    const tourCompleted = localStorage.getItem(STORAGE_KEYS.tourCompleted) === 'true';
    return !tourDismissed && !tourCompleted;
};
/**
 * Mark the tour as dismissed
 */
export const dismissTour = () => {
    localStorage.setItem(STORAGE_KEYS.tourDismissed, 'true');
};
/**
 * Mark the tour as completed
 */
export const completeTour = () => {
    localStorage.setItem(STORAGE_KEYS.tourCompleted, 'true');
};
/**
 * Reset the tour state (for testing or developer use)
 */
export const resetTour = () => {
    localStorage.removeItem(STORAGE_KEYS.tourDismissed);
    localStorage.removeItem(STORAGE_KEYS.tourCompleted);
    console.log('Ascentul tour reset. Refresh the page to see the tour card.');
};
/**
 * Get tour status information
 * @returns {Object} Tour status information
 */
export const getTourStatus = () => {
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
export var TooltipPosition;
(function (TooltipPosition) {
    TooltipPosition["Top"] = "top";
    TooltipPosition["Right"] = "right";
    TooltipPosition["Bottom"] = "bottom";
    TooltipPosition["Left"] = "left";
})(TooltipPosition || (TooltipPosition = {}));
/**
 * Default tour steps - can be customized for the specific application
 */
export const DEFAULT_TOUR_STEPS = [
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
