"use client";

/**
 * AdvisorGate Component
 *
 * Protects advisor routes with role and feature flag checks
 * Redirects unauthorized users to appropriate dashboards
 */

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

interface AdvisorGateProps {
  children: React.ReactNode;
  /**
   * Specific feature flag to check (e.g., "advisor.students")
   * If not provided, checks root "advisor.dashboard" flag
   */
  requiredFlag?: string;
  /**
   * Fallback component to show while loading
   */
  loadingFallback?: React.ReactNode;
}

const ALLOWED_ROLES = ['advisor', 'university_admin', 'super_admin'];

export function AdvisorGate({
  children,
  requiredFlag = "advisor.dashboard",
  loadingFallback,
}: AdvisorGateProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const featureEnabled = useFeatureFlag(requiredFlag);
  const isFeatureLoading = typeof featureEnabled === "undefined";
  const isFeatureEnabled = featureEnabled === true;

  const userRole = user?.publicMetadata?.role as string | undefined;
  const isAuthorized = !!userRole && ALLOWED_ROLES.includes(userRole);

  useEffect(() => {
    if (!isLoaded || isFeatureLoading) return;

    // Not signed in - Clerk middleware should have caught this
    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Check role authorization
    if (!isAuthorized) {
      // Redirect based on role
      if (userRole === "super_admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      return;
    }

    // Feature flag check - redirect to dashboard with message
    if (!isFeatureEnabled) {
      console.warn(
        `Advisor feature "${requiredFlag}" is not enabled. Redirecting to dashboard.`,
      );
      router.push("/dashboard");
      return;
    }
  }, [
    isLoaded,
    user,
    userRole,
    isAuthorized,
    isFeatureEnabled,
    isFeatureLoading,
    router,
    requiredFlag,
  ]);

  // Loading state
  if (!isLoaded || isFeatureLoading) {
    return (
      loadingFallback || (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Not authorized or feature disabled - render nothing (redirect in useEffect)
  if (!isAuthorized || !isFeatureEnabled) {
    return null;
  }

  // Authorized and feature enabled
  return <>{children}</>;
}
