"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { School } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * StudentOrgBadge Component
 *
 * Displays the student's university name in a small bordered pill badge.
 * Only visible for users with student role and valid university affiliation.
 *
 * Shows loading state without flickering (returns null during load).
 * Defensive null checks for all data fields.
 *
 * Usage:
 * <StudentOrgBadge />
 */
export function StudentOrgBadge() {
  const { user: clerkUser, isLoaded } = useUser();

  // Feature flag check (environment variable)
  const featureFlagEnabled =
    process.env.NEXT_PUBLIC_ENABLE_STUDENT_ORG_BADGE === "true";

  // Don't render if feature is disabled
  if (!featureFlagEnabled) {
    return null;
  }

  // Don't render anything while loading to avoid flicker
  if (!isLoaded || !clerkUser) {
    return null;
  }

  // Query viewer data (includes student context)
  const viewer = useQuery(api.viewer.getViewer, {
    clerkId: clerkUser.id,
  });

  // Don't render while query is loading
  if (viewer === undefined) {
    return null;
  }

  // Don't render if no viewer data
  if (!viewer) {
    return null;
  }

  // Don't render if not a student or no student context
  if (!viewer.student || !viewer.student.universityName) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
    >
      <School className="h-3.5 w-3.5" />
      <span className="truncate max-w-[180px]">
        {viewer.student.universityName}
      </span>
    </Badge>
  );
}
