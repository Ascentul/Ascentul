'use client';

import { useUser } from '@clerk/nextjs';
import { api } from 'convex/_generated/api';
import { useQuery as useConvexQuery } from 'convex/react';
import { format, formatDistanceToNowStrict, isToday, isTomorrow } from 'date-fns';
import {
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

// Types from ActiveInterviewsSummary
type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
type StageOutcome = 'pending' | 'scheduled' | 'passed' | 'failed';

interface ApplicationDoc {
  _id: string;
  company: string;
  job_title: string;
  status: ApplicationStatus;
  applied_at?: number;
  created_at: number;
  updated_at: number;
}

interface InterviewStageDoc {
  _id: string;
  application_id: string;
  title: string;
  scheduled_at?: number;
  outcome: StageOutcome;
  location?: string;
  notes?: string;
  created_at: number;
  updated_at: number;
}

// Types from FollowupActionsSummary
type FollowupAction = {
  _id: string;
  description?: string;
  due_date?: number;
  notes?: string;
  type?: string;
  completed: boolean;
  application?: {
    _id: string;
    company: string;
    job_title: string;
    status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
  } | null;
  contact?: {
    _id: string;
    name?: string;
    company?: string;
  } | null;
  created_at: number;
  updated_at: number;
};

// Derived interview type for display
interface InterviewItem {
  id: string;
  applicationId: string;
  company: string;
  position: string;
  stageTitle: string;
  scheduledAt?: number;
  location?: string;
  status: StageOutcome;
}

export function InterviewsAndFollowUpsCard() {
  const { user: clerkUser } = useUser();
  const clerkId = clerkUser?.id;

  // Fetch interviews data
  const applications = useConvexQuery(
    api.applications.getUserApplications,
    clerkId ? { clerkId } : 'skip',
  ) as ApplicationDoc[] | undefined;

  const interviewStages = useConvexQuery(
    api.interviews.getUserInterviewStages,
    clerkId ? { clerkId } : 'skip',
  ) as InterviewStageDoc[] | undefined;

  // Fetch follow-ups data (query uses JWT auth internally, no clerkId arg needed)
  const followupActions = useConvexQuery(api.followups.getUserFollowups, clerkId ? {} : 'skip') as
    | FollowupAction[]
    | undefined;

  const isLoadingInterviews =
    Boolean(clerkId) && (applications === undefined || interviewStages === undefined);
  const isLoadingFollowups = followupActions === undefined;
  const isLoading = isLoadingInterviews || isLoadingFollowups;

  // Process interviews
  const applicationDocs = useMemo(() => applications ?? [], [applications]);
  const stageDocs = useMemo(() => interviewStages ?? [], [interviewStages]);

  const upcomingInterviews = useMemo<InterviewItem[]>(() => {
    if (!stageDocs.length) return [];

    const applicationMap = new Map(applicationDocs.map((app) => [app._id, app]));
    const now = Date.now();

    return stageDocs
      .filter(
        (stage) =>
          stage.outcome !== 'failed' &&
          stage.outcome !== 'passed' &&
          stage.scheduled_at &&
          stage.scheduled_at > now,
      )
      .map((stage) => {
        const app = applicationMap.get(stage.application_id);
        return {
          id: stage._id,
          applicationId: stage.application_id,
          company: app?.company ?? 'Unknown Company',
          position: app?.job_title ?? stage.title,
          stageTitle: stage.title,
          scheduledAt: stage.scheduled_at,
          location: stage.location,
          status: stage.outcome,
        };
      })
      .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0));
  }, [stageDocs, applicationDocs]);

  const nextInterview = upcomingInterviews[0] ?? null;

  // Process follow-ups
  const actionsArray = useMemo(() => followupActions ?? [], [followupActions]);

  const activeFollowUps = useMemo(() => {
    const now = Date.now();

    return actionsArray
      .filter((action) => {
        if (action.completed) return false;
        if (!action.application) return true;
        return action.application.status !== 'offer' && action.application.status !== 'rejected';
      })
      .sort((a, b) => {
        const aDue = a.due_date;
        const bDue = b.due_date;
        const aOverdue = !!aDue && aDue < now;
        const bOverdue = !!bDue && bDue < now;

        if (aOverdue !== bOverdue) {
          return aOverdue ? -1 : 1;
        }

        if (aDue && bDue) {
          return aDue - bDue;
        }

        if (aDue || bDue) {
          return aDue ? -1 : 1;
        }

        return b.updated_at - a.updated_at;
      });
  }, [actionsArray]);

  const displayFollowUps = activeFollowUps.slice(0, 3);
  const upcomingCount = upcomingInterviews.length;
  const followUpCount = activeFollowUps.length;

  // Format interview date
  const formatInterviewDate = (timestamp: number) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    }
    return format(date, "EEE, MMM d 'at' h:mm a");
  };

  // Format due date for follow-ups
  const formatDueDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();

    if (timestamp < now) {
      return 'Overdue';
    }
    if (isToday(date)) {
      return 'Due today';
    }
    if (isTomorrow(date)) {
      return 'Due tomorrow';
    }
    return `Due ${format(date, 'EEE')}`;
  };

  const getFollowUpStatus = (dueDate?: number) => {
    if (!dueDate) return null;
    const now = Date.now();
    if (dueDate < now) {
      return { text: 'Overdue', tone: 'danger' as const };
    }
    // Due within 2 days
    if (dueDate - now < 2 * 24 * 60 * 60 * 1000) {
      return { text: 'Due soon', tone: 'warning' as const };
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-150 hover:shadow-md md:p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-900 md:text-base">
            Interviews & Follow-ups
          </h2>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#EEF1FF] px-2.5 py-1 text-xs font-medium text-[#5371FF]">
              {upcomingCount} upcoming
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              {followUpCount} follow-ups
            </span>
          </div>
        </div>
        <Link href="/applications">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium text-[#5371FF] hover:bg-[#EEF1FF] hover:text-[#5371FF]"
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            View all
          </Button>
        </Link>
      </div>

      {/* Body - Two column grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:mt-5 md:grid-cols-2 md:gap-6">
        {/* Left column: Next Interview */}
        <div className="flex flex-col">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Next Interview
          </h3>

          {isLoadingInterviews ? (
            <div className="flex flex-1 items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : nextInterview ? (
            <div className="flex flex-1 flex-col rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 md:text-base">
                  {formatInterviewDate(nextInterview.scheduledAt!)}
                </p>
                <p className="mt-1 text-xs text-slate-500 md:text-sm">
                  {nextInterview.company} · {nextInterview.position}
                </p>
                {nextInterview.stageTitle && (
                  <p className="mt-0.5 text-xs text-slate-400">{nextInterview.stageTitle}</p>
                )}
                {nextInterview.location && (
                  <div className="mt-2 flex items-center gap-1.5">
                    {nextInterview.location.toLowerCase().includes('virtual') ||
                    nextInterview.location.toLowerCase().includes('zoom') ||
                    nextInterview.location.toLowerCase().includes('teams') ||
                    nextInterview.location.toLowerCase().includes('meet') ? (
                      <Video className="h-3 w-3 text-slate-400" />
                    ) : (
                      <MapPin className="h-3 w-3 text-slate-400" />
                    )}
                    <span className="text-xs text-slate-500">{nextInterview.location}</span>
                  </div>
                )}
              </div>
              <Link href={`/applications/${nextInterview.applicationId}`} className="mt-4">
                <Button size="sm" className="w-full bg-[#5371FF] text-white hover:bg-[#4361ee]">
                  Open interview
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
              <Calendar className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No interviews scheduled</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Book your next interview or mock session
              </p>
              <Link href="/applications" className="mt-3">
                <Button variant="outline" size="sm" className="text-xs">
                  View applications
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right column: Follow-ups */}
        <div className="flex flex-col">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Follow-ups
          </h3>

          {isLoadingFollowups ? (
            <div className="flex flex-1 items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : displayFollowUps.length > 0 ? (
            <div className="flex flex-1 flex-col">
              <div className="flex-1 space-y-2">
                {displayFollowUps.map((action) => {
                  const status = getFollowUpStatus(action.due_date);
                  return (
                    <Link
                      key={action._id}
                      href={
                        action.application
                          ? `/applications/${action.application._id}`
                          : '/applications'
                      }
                      className="group flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-3 transition-all hover:border-slate-200 hover:shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 group-hover:text-[#5371FF]">
                          {action.description || action.notes || 'Follow-up action'}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {action.due_date && (
                            <span
                              className={cn(
                                'text-xs',
                                action.due_date < Date.now() ? 'text-red-500' : 'text-slate-500',
                              )}
                            >
                              {formatDueDate(action.due_date)}
                            </span>
                          )}
                          {action.application && (
                            <span className="truncate text-xs text-slate-400">
                              · {action.application.company}
                            </span>
                          )}
                        </div>
                      </div>
                      {status && (
                        <StatusBadge tone={status.tone} className="flex-shrink-0">
                          {status.text}
                        </StatusBadge>
                      )}
                    </Link>
                  );
                })}
              </div>

              {followUpCount > 3 && (
                <Link
                  href="/applications"
                  className="mt-3 text-center text-xs font-medium text-[#5371FF] hover:text-[#4361ee] md:text-sm"
                >
                  View all {followUpCount} follow-ups
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
              <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-300" />
              <p className="text-sm font-medium text-slate-600">You're all caught up</p>
              <p className="mt-0.5 text-xs text-slate-400">
                We'll remind you when there's something to do
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
