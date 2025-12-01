/**
 * Empty State Components for Advisor Applications
 *
 * Provides contextual empty states for different scenarios:
 * - No applications exist yet (onboarding state)
 * - No results match current filters (encourage filter adjustment)
 * - No applications need action (positive reinforcement)
 *
 * Design principles:
 * - Clear, actionable messaging
 * - Helpful illustrations/icons
 * - Suggested next actions
 * - Accessible and keyboard-navigable
 */

import { CheckCircle2, FileText, Filter, Users } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ============================================================================
// Types
// ============================================================================

export type EmptyStateType = 'no-apps' | 'no-results' | 'no-action-needed';

interface EmptyStateProps {
  type: EmptyStateType;
  onClearFilters?: () => void;
  onViewAllStudents?: () => void;
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function EmptyState({
  type,
  onClearFilters,
  onViewAllStudents,
  className = '',
}: EmptyStateProps) {
  switch (type) {
    case 'no-apps':
      return <NoApplicationsState className={className} onViewAllStudents={onViewAllStudents} />;
    case 'no-results':
      return <NoResultsState className={className} onClearFilters={onClearFilters} />;
    case 'no-action-needed':
      return <NoActionNeededState className={className} />;
    default:
      return null;
  }
}

// ============================================================================
// Empty State Variants
// ============================================================================

/**
 * No Applications State
 * Shown when no applications exist for this advisor's students
 */
function NoApplicationsState({
  className,
  onViewAllStudents,
}: {
  className?: string;
  onViewAllStudents?: () => void;
}) {
  return (
    <Card className={`p-12 text-center ${className}`}>
      <div className="mx-auto max-w-md space-y-6">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <FileText className="h-8 w-8 text-blue-600" aria-hidden="true" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">No applications yet</h3>
          <p className="text-sm text-gray-600">
            Your students haven&apos;t started tracking applications yet. Once they add applications
            to their dashboard, you&apos;ll see them here.
          </p>
        </div>

        {/* Suggested Actions */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">What you can do:</p>
          <ul className="space-y-2 text-left text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                aria-hidden="true"
              />
              <span>Encourage students to start tracking their job search</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                aria-hidden="true"
              />
              <span>Share best practices for application tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                aria-hidden="true"
              />
              <span>Set up check-ins to review their progress</span>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        {onViewAllStudents && (
          <div className="pt-4">
            <Button onClick={onViewAllStudents} variant="outline" className="gap-2">
              <Users className="h-4 w-4" aria-hidden="true" />
              View All Students
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * No Results State
 * Shown when filters return no matching applications
 */
function NoResultsState({
  className,
  onClearFilters,
}: {
  className?: string;
  onClearFilters?: () => void;
}) {
  return (
    <Card className={`p-12 text-center ${className}`}>
      <div className="mx-auto max-w-md space-y-6">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <Filter className="h-8 w-8 text-amber-600" aria-hidden="true" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            No applications match your filters
          </h3>
          <p className="text-sm text-gray-600">
            Try adjusting your search criteria or clearing filters to see more results.
          </p>
        </div>

        {/* Suggestions */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Try this:</p>
          <ul className="space-y-2 text-left text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Filter className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
              <span>Remove some stage or cohort filters</span>
            </li>
            <li className="flex items-start gap-2">
              <Filter className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
              <span>Broaden your search terms</span>
            </li>
            <li className="flex items-start gap-2">
              <Filter className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
              <span>Adjust the date range filter</span>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        {onClearFilters && (
          <div className="pt-4">
            <Button onClick={onClearFilters} variant="default" className="gap-2">
              <Filter className="h-4 w-4" aria-hidden="true" />
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * No Action Needed State
 * Shown when filtering by "needs action" but nothing needs attention
 * (Positive reinforcement - good state!)
 */
function NoActionNeededState({ className }: { className?: string }) {
  return (
    <Card className={`p-12 text-center ${className}`}>
      <div className="mx-auto max-w-md space-y-6">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">All caught up!</h3>
          <p className="text-sm text-gray-600">
            Great work! No applications need immediate attention right now. All active applications
            have clear next steps and are on track.
          </p>
        </div>

        {/* Positive reinforcement */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Your students are set up for success:</p>
          <ul className="space-y-2 text-left text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                aria-hidden="true"
              />
              <span>All applications have defined next steps</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                aria-hidden="true"
              />
              <span>No overdue tasks or stale applications</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                aria-hidden="true"
              />
              <span>Students are making consistent progress</span>
            </li>
          </ul>
        </div>

        {/* Subtle encouragement */}
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-800">
            Keep up the great advising! Check back regularly to stay on top of new developments.
          </p>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// Loading Skeleton (bonus utility for loading states)
// ============================================================================

/**
 * Loading skeleton for the applications view
 * Shown while data is being fetched
 */
export function ApplicationsLoadingSkeleton({ viewMode }: { viewMode: 'table' | 'kanban' }) {
  if (viewMode === 'kanban') {
    return <KanbanLoadingSkeleton />;
  }
  return <TableLoadingSkeleton />;
}

function TableLoadingSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading applications">
      {/* Header row */}
      <div className="flex gap-4 border-b border-gray-200 pb-3">
        <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Row skeletons */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 py-3">
          <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      ))}
      <span className="sr-only">Loading applications...</span>
    </div>
  );
}

function KanbanLoadingSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4"
      role="status"
      aria-label="Loading kanban board"
    >
      {[1, 2, 3, 4].map((col) => (
        <div key={col} className="space-y-3">
          {/* Column header */}
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />

          {/* Card skeletons */}
          {[1, 2, 3].map((card) => (
            <Card key={card} className="p-4 space-y-3">
              <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            </Card>
          ))}
        </div>
      ))}
      <span className="sr-only">Loading kanban board...</span>
    </div>
  );
}
