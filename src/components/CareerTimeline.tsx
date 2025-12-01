'use client';

import { useUser } from '@clerk/nextjs';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import {
  Briefcase,
  CheckCircle,
  Clock,
  FileText,
  Flame,
  FolderKanban,
  MessageSquare,
  PenLine,
  Plus,
  Sparkles,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Activity type configuration
const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  application: Briefcase,
  application_update: Briefcase,
  interview: MessageSquare,
  followup: Clock,
  followup_completed: CheckCircle,
  goal: Target,
  goal_completed: CheckCircle,
  resume: FileText,
  cover_letter: PenLine,
  project: FolderKanban,
  contact: Users,
};

const ACTIVITY_COLORS: Record<string, string> = {
  application: 'bg-blue-100 text-blue-600',
  application_update: 'bg-blue-100 text-blue-600',
  interview: 'bg-purple-100 text-purple-600',
  followup: 'bg-orange-100 text-orange-600',
  followup_completed: 'bg-green-100 text-green-600',
  goal: 'bg-indigo-100 text-indigo-600',
  goal_completed: 'bg-green-100 text-green-600',
  resume: 'bg-slate-100 text-slate-600',
  cover_letter: 'bg-rose-100 text-rose-600',
  project: 'bg-teal-100 text-teal-600',
  contact: 'bg-amber-100 text-amber-600',
};

// Get link for activity item
function getActivityLink(activity: {
  type: string;
  id: string;
  description: string;
}): string | null {
  // Extract entity ID from the activity id (format: "type-action-entityId")
  const idParts = activity.id.split('-');
  const entityId = idParts[idParts.length - 1];

  switch (activity.type) {
    case 'application':
    case 'application_update':
      return `/applications/${entityId}`;
    case 'interview':
      return `/applications`; // Interviews are viewed in context of applications
    case 'followup':
    case 'followup_completed':
      return `/applications`;
    case 'goal':
    case 'goal_completed':
      return `/goals`;
    case 'resume':
      return `/resumes/${entityId}`;
    case 'cover_letter':
      return `/cover-letters/${entityId}`;
    case 'project':
      return `/projects/${entityId}`;
    case 'contact':
      return `/contacts/${entityId}`;
    default:
      return null;
  }
}

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Group activities by day
function groupActivitiesByDay(
  activities: Array<{ id: string; type: string; description: string; timestamp: number }>,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayTs = yesterday.getTime();

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartTs = weekStart.getTime();

  const groups: {
    today: typeof activities;
    yesterday: typeof activities;
    earlierThisWeek: typeof activities;
    older: typeof activities;
  } = {
    today: [],
    yesterday: [],
    earlierThisWeek: [],
    older: [],
  };

  for (const activity of activities) {
    if (activity.timestamp >= todayTs) {
      groups.today.push(activity);
    } else if (activity.timestamp >= yesterdayTs) {
      groups.yesterday.push(activity);
    } else if (activity.timestamp >= weekStartTs) {
      groups.earlierThisWeek.push(activity);
    } else {
      groups.older.push(activity);
    }
  }

  return groups;
}

// Compact heatmap for the last 30 days
function CompactHeatmap({
  data,
}: {
  data: Array<{ date: string; didAction: boolean; actionCount: number }>;
}) {
  const todayIso = new Date().toISOString().split('T')[0];

  // Generate last 30 days
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const activity = data.find((d) => d.date === dateStr);

      result.push({
        date: dateStr,
        didAction: activity?.didAction ?? false,
        actionCount: activity?.actionCount ?? 0,
        isToday: dateStr === todayIso,
      });
    }
    return result;
  }, [data, todayIso]);

  // Get intensity level
  const getIntensity = (count: number, didAction: boolean) => {
    if (!didAction) return 0;
    if (count <= 1) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  // Format date for tooltip
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00Z');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-wrap gap-1">
        {days.map((day) => {
          const level = getIntensity(day.actionCount, day.didAction);

          return (
            <Tooltip key={day.date}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'w-3 h-3 rounded-sm transition-all',
                    level === 0 && 'bg-slate-100 border border-slate-200',
                    level === 1 && 'bg-indigo-100',
                    level === 2 && 'bg-indigo-200',
                    level === 3 && 'bg-indigo-300',
                    level === 4 && 'bg-indigo-500',
                    day.isToday && 'ring-2 ring-indigo-400 ring-offset-1',
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {formatDate(day.date)} • {day.actionCount} action{day.actionCount !== 1 ? 's' : ''}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

interface ActivityItemProps {
  activity: {
    id: string;
    type: string;
    description: string;
    timestamp: number;
  };
}

function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = ACTIVITY_ICONS[activity.type] || Sparkles;
  const colorClass = ACTIVITY_COLORS[activity.type] || 'bg-slate-100 text-slate-600';
  const link = getActivityLink(activity);

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 py-3 px-3 rounded-xl transition-colors',
        link && 'hover:bg-slate-50 cursor-pointer',
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          colorClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 leading-snug">{activity.description}</p>
        <p className="text-xs text-slate-500 mt-0.5">{formatRelativeTime(activity.timestamp)}</p>
      </div>
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }

  return content;
}

interface DayGroupProps {
  label: string;
  activities: Array<{ id: string; type: string; description: string; timestamp: number }>;
}

function DayGroup({ label, activities }: DayGroupProps) {
  if (activities.length === 0) return null;

  return (
    <div className="mb-4 last:mb-0">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-3">
        {label}
      </h4>
      <div className="divide-y divide-slate-100">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

export function CareerTimeline() {
  const { user: clerkUser } = useUser();
  const clerkId = clerkUser?.id;

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  // Fetch dashboard data which includes recentActivity
  const dashboardData = useQuery(
    api.analytics.getUserDashboardAnalytics,
    clerkId ? { clerkId } : 'skip',
  );

  // Fetch streak and activity data
  const activityData = useQuery(api.activity.getActivityYear, { timezone });
  const streakSummary = useQuery(api.activity.getStreakSummary, { timezone });

  const isLoading = dashboardData === undefined;
  const isStreakLoading = activityData === undefined || streakSummary === undefined;

  // Get recent activity from dashboard data
  const activities = useMemo(() => {
    if (!dashboardData?.recentActivity) return [];
    return dashboardData.recentActivity;
  }, [dashboardData]);

  // Group by day
  const groupedActivities = useMemo(() => {
    return groupActivitiesByDay(activities);
  }, [activities]);

  const hasAnyActivity = activities.length > 0;

  return (
    <Card className="overflow-hidden p-0 shadow-sm">
      <div className="flex items-center justify-between px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Career Timeline</h3>
          <p className="text-xs text-slate-500">Your latest career steps</p>
        </div>
      </div>
      <div className="border-t border-slate-100" />

      {/* Streak & Heatmap Section */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        {isStreakLoading ? (
          <div className="space-y-3">
            <div className="flex gap-6">
              <div className="h-5 w-32 bg-slate-100 rounded animate-pulse" />
              <div className="h-5 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-sm bg-slate-100 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Streak stats */}
            <div className="flex gap-6 mb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-slate-600">Current streak:</span>
                <span className="font-semibold text-slate-900">
                  {streakSummary?.currentStreak || 0} days
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-slate-600">Longest:</span>
                <span className="font-semibold text-slate-900">
                  {streakSummary?.longestStreak || 0} days
                </span>
              </div>
            </div>

            {/* Compact heatmap */}
            <div>
              <p className="text-xs text-slate-500 mb-2">Last 30 days</p>
              <CompactHeatmap data={activityData || []} />
            </div>
          </>
        )}
      </div>

      <CardContent className="px-2 pb-4 pt-3">
        {isLoading ? (
          <div className="space-y-3 px-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-1/4 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasAnyActivity ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 mb-1">No activity yet</p>
            <p className="text-xs text-slate-500 mb-4 max-w-[220px]">
              Start building your career timeline by adding an application or creating a goal
            </p>
            <div className="flex gap-2">
              <Link href="/applications/new">
                <Button size="sm" variant="outline" className="text-xs rounded-xl">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add application
                </Button>
              </Link>
              <Link href="/goals">
                <Button size="sm" variant="outline" className="text-xs rounded-xl">
                  <Target className="h-3.5 w-3.5 mr-1" />
                  Create goal
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <DayGroup label="Today" activities={groupedActivities.today} />
            <DayGroup label="Yesterday" activities={groupedActivities.yesterday} />
            <DayGroup label="Earlier this week" activities={groupedActivities.earlierThisWeek} />
            <DayGroup label="Older" activities={groupedActivities.older} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
