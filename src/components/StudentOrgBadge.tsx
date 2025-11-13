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

  // Always call the hook; skip until ready/enabled
  const viewer = useQuery(
    api.viewer.getViewer,
    featureFlagEnabled && isLoaded && clerkUser ? {} : "skip",
  );

  // Don't render while query is loading or conditions not met
  if (!featureFlagEnabled || !isLoaded || !clerkUser || viewer === undefined) {
    return null;
  }

  // Don't render if no viewer data or not a student
  if (!viewer || !viewer.student || !viewer.student.universityName) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
      aria-label={`Student at ${viewer.student.universityName}`}
    >
      <School className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      <span className="truncate">
        {viewer.student.universityName}
      </span>
    </Badge>
  );
}
