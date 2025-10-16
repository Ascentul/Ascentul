'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface OnboardingTourProps {
  steps: OnboardingStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  localStorageKey?: string;
}

export function OnboardingTour({
  steps,
  onComplete,
  onSkip,
  localStorageKey = 'onboarding-completed',
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Check if onboarding has been completed before
  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem(localStorageKey);
      if (!hasCompleted) {
        setIsVisible(true);
      }
    } catch (error) {
      // localStorage unavailable (SSR, private browsing) - show tour by default
      setIsVisible(true);
    }
  }, [localStorageKey]);

  // Add/remove document body class when tour is active
  useEffect(() => {
    if (isVisible) {
      document.body.classList.add('onboarding-tour-active');
    } else {
      document.body.classList.remove('onboarding-tour-active');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('onboarding-tour-active');
    };
  }, [isVisible]);

  // Update target element and position when step changes
  useEffect(() => {
    if (!isVisible) return;

    // Card dimensions and padding constants
    const cardWidth = 320; // matches maxWidth in render
    const cardHeight = cardRef.current?.offsetHeight ?? 400; // measure actual height, fallback to 400
    const padding = 10; // minimum padding from viewport edges

    const step = steps[currentStep];
    let currentTarget: HTMLElement | null = null;

    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        currentTarget = element;
        setTargetElement(element);
        const rect = element.getBoundingClientRect();

        // Calculate position based on step position preference
        let top = rect.bottom + window.scrollY + 10;
        let left = rect.left + window.scrollX;

        if (step.position === 'top') {
          top = rect.top + window.scrollY - cardHeight - 10;
        } else if (step.position === 'left') {
          left = rect.left + window.scrollX - cardWidth;
          top = rect.top + window.scrollY;
        } else if (step.position === 'right') {
          left = rect.right + window.scrollX + 10;
          top = rect.top + window.scrollY;
        } else if (step.position === 'center') {
          top = window.innerHeight / 2;
          left = window.innerWidth / 2 - 150;
        }

        // Viewport boundary checks to prevent off-screen rendering
        // Ensure card stays within horizontal viewport bounds
        left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding));

        // Ensure card stays within vertical viewport bounds
        // For vertical positioning, we need to consider scroll position
        const viewportTop = window.scrollY + padding;
        const viewportBottom = window.scrollY + window.innerHeight - cardHeight - padding;
        top = Math.max(viewportTop, Math.min(top, viewportBottom));

        setPosition({ top, left });

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add highlight class
        element.classList.add('onboarding-highlight');
      }
    } else {
      setTargetElement(null);
      // Center the card if no target
      let top = window.scrollY + window.innerHeight / 2 - cardHeight / 2;
      let left = window.innerWidth / 2 - cardWidth / 2;

      // Apply boundary checks for centered positioning
      left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding));
      const viewportTop = window.scrollY + padding;
      const viewportBottom = window.scrollY + window.innerHeight - cardHeight - padding;
      top = Math.max(viewportTop, Math.min(top, viewportBottom));

      setPosition({ top, left });
    }

    return () => {
      // Remove highlight when step changes - use captured element to avoid stale closure
      if (currentTarget) {
        currentTarget.classList.remove('onboarding-highlight');
      }
    };
    // Note: If parent component recreates steps array on every render, consider memoizing
    // with useMemo to prevent unnecessary effect runs. The early return check (line 62)
    // mitigates performance impact, but memoization is cleaner.
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem(localStorageKey, 'true');
    } catch (error) {
      // localStorage unavailable - continue anyway
      console.warn('localStorage unavailable, onboarding state will not persist');
    }
    setIsVisible(false);
    if (targetElement) {
      targetElement.classList.remove('onboarding-highlight');
    }
    onComplete?.();
  };

  const handleSkip = () => {
    try {
      localStorage.setItem(localStorageKey, 'true');
    } catch (error) {
      // localStorage unavailable - continue anyway
      console.warn('localStorage unavailable, onboarding state will not persist');
    }
    setIsVisible(false);
    if (targetElement) {
      targetElement.classList.remove('onboarding-highlight');
    }
    onSkip?.();
  };

  if (!isVisible || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm" />

      {/* Onboarding Card */}
      <div
        ref={cardRef}
        className="fixed z-[10000] transition-all duration-300"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          maxWidth: '320px',
        }}
      >
        <Card className="shadow-2xl border-primary/20">
          <CardHeader className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentStep
                        ? 'w-6 bg-primary'
                        : index < currentStep
                        ? 'w-1.5 bg-primary/50'
                        : 'w-1.5 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-auto">
                {currentStep + 1} of {steps.length}
              </span>
            </div>
            <CardTitle className="text-lg mt-2">{step.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription className="text-sm leading-relaxed">
              {step.description}
            </CardDescription>

            {step.action && (
              <Button
                variant="outline"
                size="sm"
                onClick={step.action.onClick}
                className="w-full"
              >
                {step.action.label}
              </Button>
            )}

            <div className="flex justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              {isLastStep ? (
                <Button size="sm" onClick={handleComplete} className="gap-1">
                  <Check className="h-4 w-4" />
                  Finish
                </Button>
              ) : (
                <Button size="sm" onClick={handleNext} className="gap-1">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
            >
              Skip tutorial
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Scoped styles for highlighting - only active when tour is running */}
      <style jsx global>{`
        .onboarding-tour-active .onboarding-highlight {
          position: relative;
          z-index: 9999;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 8px;
          transition: all 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
}

/**
 * Hook to manage onboarding state
 */
export function useOnboarding(localStorageKey = 'onboarding-completed') {
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    try {
      const completed = localStorage.getItem(localStorageKey);
      setHasCompleted(!!completed);
    } catch (error) {
      // localStorage unavailable (SSR, private browsing) - assume not completed
      setHasCompleted(false);
    }
  }, [localStorageKey]);

  const resetOnboarding = () => {
    try {
      localStorage.removeItem(localStorageKey);
      setHasCompleted(false);
    } catch (error) {
      // localStorage unavailable - just update state
      console.warn('localStorage unavailable, onboarding reset will not persist');
      setHasCompleted(false);
    }
  };

  return {
    hasCompleted,
    resetOnboarding,
  };
}
