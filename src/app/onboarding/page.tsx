'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { useAuth } from '@/contexts/ClerkAuthProvider';

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Redirect to sign in if not authenticated
        router.push('/sign-in');
      } else if (user.onboarding_completed) {
        // Redirect to dashboard if onboarding is already completed
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no user after loading is complete, show a message (this is a fallback)
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">Redirecting to sign in...</div>
    );
  }

  // If onboarding is already completed, show a message (this is a fallback)
  if (user.onboarding_completed) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Redirecting to dashboard...
      </div>
    );
  }

  return <OnboardingFlow />;
}
