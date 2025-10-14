'use client';

import { OnboardingTour, OnboardingStep } from '@/components/OnboardingTour';

export function ResumeBuilderOnboarding() {
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Resume Builder! 👋',
      description: 'Let\'s take a quick tour to help you create an amazing resume. This will only take a minute.',
      position: 'center',
    },
    {
      id: 'ai-actions',
      title: 'AI-Powered Assistance',
      description: 'Use AI Actions to generate content from your profile, tailor your resume to specific jobs, or improve existing content.',
      target: '[data-onboarding="ai-actions"]',
      position: 'bottom',
    },
    {
      id: 'blocks',
      title: 'Click to Edit Blocks',
      description: 'Click any section to edit it. Your changes are saved automatically as you type.',
      target: '[data-onboarding="resume-canvas"]',
      position: 'left',
    },
    {
      id: 'suggestions',
      title: 'Smart Suggestions',
      description: 'When you select a block, you\'ll see AI-powered suggestions to improve your content - like stronger action verbs or adding metrics.',
      position: 'center',
    },
    {
      id: 'layout',
      title: 'Customize Layout',
      description: 'Change templates, adjust spacing, and customize your resume\'s appearance with layout settings.',
      target: '[data-onboarding="layout-settings"]',
      position: 'bottom',
    },
    {
      id: 'coach',
      title: 'Resume Coach',
      description: 'Get expert tips and best practices from the Resume Coach panel. Dismiss tips as you apply them.',
      position: 'center',
    },
    {
      id: 'export',
      title: 'Export Your Resume',
      description: 'When you\'re ready, export your resume as a PDF to share with employers.',
      target: '[data-onboarding="export-button"]',
      position: 'bottom',
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🎉',
      description: 'Start building your resume now. Remember, you can always access the Resume Coach for tips and use AI Actions to improve your content.',
      position: 'center',
    },
  ];

  return (
    <OnboardingTour
      steps={steps}
      localStorageKey="resume-builder-onboarding-v1"
      onComplete={() => {
        // TODO: Add analytics tracking
        // analytics.track('resume_builder_onboarding_completed');
      }}
      onSkip={() => {
        // TODO: Add analytics tracking
        // analytics.track('resume_builder_onboarding_skipped');
      }}
    />
  );
}
