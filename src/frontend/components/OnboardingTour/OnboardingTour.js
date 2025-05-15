/**
 * Ascentul Onboarding Tour
 * 
 * This file provides the functionality for a hybrid onboarding experience:
 * 1. A dismissible dashboard card that shows at the top of the dashboard
 * 2. An interactive guided tour that highlights key features of the application
 * 
 * The user's preferences (dismissed/completed) are stored in localStorage to persist across sessions
 */

import './onboarding.css';

class OnboardingTour {
  constructor() {
    // Tour configuration - edit these steps when integrating with the real UI
    this.tourSteps = [
      {
        target: '#resumeBuilder', // Selector for the element to highlight
        title: 'AI Resume Builder',
        content: 'Create professional resumes tailored to specific job descriptions with our AI-powered resume builder.',
        tryItText: 'Try Resume Builder',
        position: 'bottom' // Position of the tooltip: top, right, bottom, left
      },
      {
        target: '#goalTracker',
        title: 'Goal Tracker',
        content: 'Set career goals and track your progress with our intuitive goal tracking system.',
        tryItText: 'Set a Goal',
        position: 'bottom'
      },
      {
        target: '#settings',
        title: 'Personalize Your Experience',
        content: 'Customize your account settings, notification preferences, and profile information.',
        tryItText: 'Update Settings',
        position: 'left'
      }
    ];

    // Local storage keys
    this.storageKeys = {
      tourDismissed: 'ascentul_tour_dismissed',
      tourCompleted: 'ascentul_tour_completed'
    };

    // Current step in the tour
    this.currentStep = 0;

    // DOM elements - will be initialized in the init method
    this.dashboardCard = null;
    this.tourOverlay = null;
    this.tourTooltip = null;

    // Bind methods to this instance
    this.init = this.init.bind(this);
    this.startTour = this.startTour.bind(this);
    this.dismissTour = this.dismissTour.bind(this);
    this.completeTour = this.completeTour.bind(this);
    this.showStep = this.showStep.bind(this);
    this.nextStep = this.nextStep.bind(this);
    this.prevStep = this.prevStep.bind(this);
    this.exitTour = this.exitTour.bind(this);
    this.showDashboardCard = this.showDashboardCard.bind(this);
    this.createTourOverlay = this.createTourOverlay.bind(this);
    this.createTooltip = this.createTooltip.bind(this);
    this.tryFeature = this.tryFeature.bind(this);
    this.resetTour = this.resetTour.bind(this); // For testing: can be called from console
  }

  /**
   * Initialize the onboarding experience
   * This should be called when the dashboard is loaded
   */
  init() {
    // Check if user has already dismissed or completed the tour
    const tourDismissed = localStorage.getItem(this.storageKeys.tourDismissed) === 'true';
    const tourCompleted = localStorage.getItem(this.storageKeys.tourCompleted) === 'true';

    // If user hasn't dismissed or completed the tour, show the dashboard card
    if (!tourDismissed && !tourCompleted) {
      this.showDashboardCard();
    }

    // Create the tour overlay and tooltip (hidden initially)
    this.createTourOverlay();
    this.createTooltip();

    // For development/testing, expose reset method to global scope
    window.resetAscentulTour = this.resetTour;
  }

  /**
   * Reset the tour state - for testing or developer use
   * This can be called from the browser console: window.resetAscentulTour()
   */
  resetTour() {
    localStorage.removeItem(this.storageKeys.tourDismissed);
    localStorage.removeItem(this.storageKeys.tourCompleted);
    console.log('Ascentul tour reset. Refresh the page to see the tour card.');
    
    // Remove any existing tour elements
    if (this.dashboardCard) {
      this.dashboardCard.remove();
    }
    
    // Re-initialize the tour
    this.showDashboardCard();
  }

  /**
   * Create and show the dashboard card
   */
  showDashboardCard() {
    // Find the dashboard container
    const dashboardContainer = document.querySelector('#dashboard');
    
    if (!dashboardContainer) {
      console.warn('Dashboard container (#dashboard) not found. Cannot show onboarding card.');
      return;
    }

    // Create the dashboard card
    this.dashboardCard = document.createElement('div');
    this.dashboardCard.className = 'onboarding-card';
    this.dashboardCard.innerHTML = `
      <div class="onboarding-card-content">
        <p class="onboarding-card-text">✅ Want a quick walkthrough? See how Ascentul helps you level up in 3 steps.</p>
      </div>
      <div class="onboarding-card-actions">
        <button class="onboarding-btn-primary" id="start-tour-btn">Start Tour</button>
        <button class="onboarding-btn-secondary" id="dismiss-tour-btn">Maybe Later</button>
      </div>
    `;

    // Add event listeners
    this.dashboardCard.querySelector('#start-tour-btn').addEventListener('click', this.startTour);
    this.dashboardCard.querySelector('#dismiss-tour-btn').addEventListener('click', this.dismissTour);

    // Insert the card at the top of the dashboard
    dashboardContainer.insertBefore(this.dashboardCard, dashboardContainer.firstChild);
  }

  /**
   * Create the tour overlay that dims the rest of the page during the tour
   */
  createTourOverlay() {
    this.tourOverlay = document.createElement('div');
    this.tourOverlay.className = 'tour-overlay';
    document.body.appendChild(this.tourOverlay);
  }

  /**
   * Create the tooltip element that shows step information
   */
  createTooltip() {
    this.tourTooltip = document.createElement('div');
    this.tourTooltip.className = 'tour-tooltip';
    document.body.appendChild(this.tourTooltip);
  }

  /**
   * Start the guided tour
   */
  startTour() {
    // Hide the dashboard card
    if (this.dashboardCard) {
      this.dashboardCard.style.display = 'none';
    }

    // Reset to the first step
    this.currentStep = 0;

    // Activate the overlay
    this.tourOverlay.classList.add('active');

    // Show the first step
    this.showStep(0);
  }

  /**
   * Dismiss the tour (user clicked "Maybe Later")
   */
  dismissTour() {
    // Mark the tour as dismissed in localStorage
    localStorage.setItem(this.storageKeys.tourDismissed, 'true');

    // Remove the dashboard card
    if (this.dashboardCard) {
      this.dashboardCard.remove();
    }
  }

  /**
   * Complete the tour (user went through all steps)
   */
  completeTour() {
    // Mark the tour as completed in localStorage
    localStorage.setItem(this.storageKeys.tourCompleted, 'true');

    // Hide overlay and tooltip
    this.tourOverlay.classList.remove('active');
    this.tourTooltip.classList.remove('active');

    // Remove any highlights
    const highlighted = document.querySelector('.tour-target-highlight');
    if (highlighted) {
      highlighted.classList.remove('tour-target-highlight');
    }
  }

  /**
   * Show a specific step in the tour
   * @param {number} stepIndex - The index of the step to show
   */
  showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.tourSteps.length) {
      console.warn(`Invalid step index: ${stepIndex}`);
      return;
    }

    // Update current step
    this.currentStep = stepIndex;
    const step = this.tourSteps[stepIndex];

    // Clear any previous highlights
    const previousHighlight = document.querySelector('.tour-target-highlight');
    if (previousHighlight) {
      previousHighlight.classList.remove('tour-target-highlight');
    }

    // Find the target element to highlight
    const targetElement = document.querySelector(step.target);
    if (!targetElement) {
      console.warn(`Target element not found: ${step.target}`);
      return;
    }

    // Highlight the target element
    targetElement.classList.add('tour-target-highlight');

    // Scroll to make the target visible if needed
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    // Position the tooltip relative to the target
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipWidth = 320; // Use the max-width from CSS
    let tooltipLeft, tooltipTop;

    switch (step.position) {
      case 'top':
        tooltipLeft = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        tooltipTop = targetRect.top - 20 - this.tourTooltip.offsetHeight;
        break;
      case 'right':
        tooltipLeft = targetRect.right + 20;
        tooltipTop = targetRect.top + (targetRect.height / 2) - (this.tourTooltip.offsetHeight / 2);
        break;
      case 'bottom':
        tooltipLeft = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        tooltipTop = targetRect.bottom + 20;
        break;
      case 'left':
        tooltipLeft = targetRect.left - 20 - tooltipWidth;
        tooltipTop = targetRect.top + (targetRect.height / 2) - (this.tourTooltip.offsetHeight / 2);
        break;
      default:
        tooltipLeft = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        tooltipTop = targetRect.bottom + 20;
    }

    // Ensure tooltip stays within the viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    tooltipLeft = Math.max(20, Math.min(viewportWidth - tooltipWidth - 20, tooltipLeft));
    tooltipTop = Math.max(20, Math.min(viewportHeight - this.tourTooltip.offsetHeight - 20, tooltipTop));

    // Update tooltip content and position
    this.tourTooltip.style.left = `${tooltipLeft}px`;
    this.tourTooltip.style.top = `${tooltipTop}px`;

    // Generate step indicator dots
    const stepDots = this.tourSteps.map((_, index) => {
      return `<div class="tour-step-dot ${index === stepIndex ? 'active' : ''}"></div>`;
    }).join('');

    // Update tooltip content
    this.tourTooltip.innerHTML = `
      <h3 class="tour-tooltip-header">${step.title}</h3>
      <div class="tour-tooltip-content">${step.content}</div>
      <div class="tour-tooltip-actions">
        <div class="tour-step-indicator">
          ${stepDots}
        </div>
        <button class="tour-try-btn" id="tour-try-btn">${step.tryItText}</button>
      </div>
      <div class="tour-navigation">
        ${stepIndex > 0 ? '<button class="tour-btn" id="tour-prev-btn">Back</button>' : ''}
        ${stepIndex < this.tourSteps.length - 1 
          ? '<button class="tour-btn tour-btn-next" id="tour-next-btn">Next</button>' 
          : '<button class="tour-btn tour-btn-next" id="tour-complete-btn">Finish</button>'}
        <button class="tour-exit-btn" id="tour-exit-btn">Exit Tour</button>
      </div>
    `;

    // Add event listeners
    this.tourTooltip.querySelector('#tour-try-btn').addEventListener('click', () => this.tryFeature(stepIndex));
    
    if (stepIndex > 0) {
      this.tourTooltip.querySelector('#tour-prev-btn').addEventListener('click', this.prevStep);
    }
    
    if (stepIndex < this.tourSteps.length - 1) {
      this.tourTooltip.querySelector('#tour-next-btn').addEventListener('click', this.nextStep);
    } else {
      this.tourTooltip.querySelector('#tour-complete-btn').addEventListener('click', this.completeTour);
    }
    
    this.tourTooltip.querySelector('#tour-exit-btn').addEventListener('click', this.exitTour);

    // Show the tooltip with animation
    this.tourTooltip.classList.add('active');
  }

  /**
   * Move to the next step in the tour
   */
  nextStep() {
    if (this.currentStep < this.tourSteps.length - 1) {
      this.showStep(this.currentStep + 1);
    }
  }

  /**
   * Move to the previous step in the tour
   */
  prevStep() {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }

  /**
   * Exit the tour without completing it
   */
  exitTour() {
    // Hide overlay and tooltip
    this.tourOverlay.classList.remove('active');
    this.tourTooltip.classList.remove('active');

    // Remove any highlights
    const highlighted = document.querySelector('.tour-target-highlight');
    if (highlighted) {
      highlighted.classList.remove('tour-target-highlight');
    }

    // Show the dashboard card again
    if (this.dashboardCard) {
      this.dashboardCard.style.display = 'flex';
    }
  }

  /**
   * Try the feature being highlighted in the current step
   * @param {number} stepIndex - The index of the current step
   */
  tryFeature(stepIndex) {
    const step = this.tourSteps[stepIndex];
    console.log(`User wants to try: ${step.title}`);
    
    // This is where you would implement the action for each feature
    // For now, we'll just log it and go to the next step
    
    alert(`This would navigate to ${step.target} feature in the real application.`);
    
    // Go to the next step if not the last step
    if (stepIndex < this.tourSteps.length - 1) {
      this.nextStep();
    } else {
      this.completeTour();
    }
  }
}

export default OnboardingTour;