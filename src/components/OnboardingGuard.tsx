'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/ClerkAuthProvider';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, isLoading, isSignedIn, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isSignedIn && user) {
      // Skip onboarding for:
      // 1. Admin roles
      // 2. Users who explicitly completed onboarding
      // 3. University users (they have university_id)
      // 4. Users created by admin
      // 5. Existing users (created more than 5 minutes ago - likely pre-existing accounts)

      const accountAge = Date.now() - user.created_at;
      const fiveMinutes = 5 * 60 * 1000;
      const isExistingUser = accountAge > fiveMinutes;

      const shouldSkipOnboarding =
        isAdmin ||
        user.onboarding_completed === true ||
        user.university_id != null ||
        user.created_by_admin === true ||
        isExistingUser;

      // Only redirect to onboarding if user is new and hasn't completed it
      if (!shouldSkipOnboarding) {
        router.push('/onboarding');
      }
    }
  }, [user, isLoading, isSignedIn, router, isAdmin]);

  // Show loading state while checking authentication and user data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if we should show onboarding redirect loading
  if (isSignedIn && user) {
    const accountAge = Date.now() - user.created_at;
    const fiveMinutes = 5 * 60 * 1000;
    const isExistingUser = accountAge > fiveMinutes;

    const shouldSkipOnboarding =
      isAdmin ||
      user.onboarding_completed === true ||
      user.university_id != null ||
      user.created_by_admin === true ||
      isExistingUser;

    if (!shouldSkipOnboarding) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Setting up your profile...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
