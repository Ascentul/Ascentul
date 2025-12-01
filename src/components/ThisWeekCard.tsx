'use client';

import { useUser } from '@clerk/nextjs';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import {
  Briefcase,
  CalendarDays,
  Check,
  Clock,
  FileText,
  MessageSquare,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { generateMissions, JourneyStage, type Mission } from '@/lib/journey';
import { cn } from '@/lib/utils';

interface ThisWeekCardProps {
  currentStage: JourneyStage;
}

// Mission pill component
function MissionPill({ mission }: { mission: Mission }) {
  const iconMap = {
    application: Briefcase,
    goal: Target,
    resume: FileText,
    interview: MessageSquare,
    contact: Users,
  };
  const Icon = iconMap[mission.type];

  return (
    <Link href={mission.href}>
      <button
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all w-full',
          mission.isCompleted
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-[#5371FF]/50 hover:bg-[#5371FF]/5',
        )}
      >
        {mission.isCompleted ? (
          <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
        ) : (
          <Icon className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
        )}
        <span className={cn(mission.isCompleted && 'line-through')}>{mission.text}</span>
      </button>
    </Link>
  );
}

interface UpcomingItem {
  id: string;
  type: 'interview' | 'goal' | 'followup';
  title: string;
  subtitle?: string;
  date: number;
  href: string;
}

function formatUpcomingDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (isTomorrow) {
    return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function UpcomingItemRow({ item }: { item: UpcomingItem }) {
  const iconMap = {
    interview: MessageSquare,
    goal: Target,
    followup: Clock,
  };
  const colorMap = {
    interview: 'bg-purple-100 text-purple-600',
    goal: 'bg-indigo-100 text-indigo-600',
    followup: 'bg-amber-100 text-amber-600',
  };

  const Icon = iconMap[item.type];

  return (
    <Link
      href={item.href}
      className="flex items-start gap-3 py-2 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
    >
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
          colorMap[item.type],
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 truncate">{item.title}</p>
        {item.subtitle && <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>}
      </div>
      <span className="text-xs text-slate-500 flex-shrink-0">{formatUpcomingDate(item.date)}</span>
    </Link>
  );
}

export function ThisWeekCard({ currentStage }: ThisWeekCardProps) {
  const { user: clerkUser } = useUser();
  const clerkId = clerkUser?.id;
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  // Fetch dashboard data
  const dashboardData = useQuery(
    api.analytics.getUserDashboardAnalytics,
    clerkId ? { clerkId } : 'skip',
  );

  // Fetch activity data for streak
  const activityData = useQuery(api.activity.getActivityYear, { timezone });

  // Fetch goals
  const goals = useQuery(api.goals.getUserGoals, clerkId ? { clerkId } : 'skip');

  // Fetch contacts
  const contacts = useQuery(api.contacts.getUserContacts, clerkId ? { clerkId } : 'skip');

  const isLoading = dashboardData === undefined;

  // Get today's activity
  const todayIso = new Date().toISOString().split('T')[0];
  const todayActivity = useMemo(() => {
    if (!activityData) return { didAction: false, actionCount: 0 };
    const today = activityData.find((d) => d.date === todayIso);
    return {
      didAction: today?.didAction ?? false,
      actionCount: today?.actionCount ?? 0,
    };
  }, [activityData, todayIso]);

  // Check if any goals were updated today
  const goalsUpdatedToday = useMemo(() => {
    if (!goals) return false;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return goals.some((g) => g.updated_at && g.updated_at >= todayStart.getTime());
  }, [goals]);

  // Generate missions based on stage
  const missions = useMemo(() => {
    return generateMissions(currentStage, {
      applicationsThisWeek: dashboardData?.thisWeek?.applicationsAdded || 0,
      goalsUpdatedToday,
      hasContacts: (contacts?.length || 0) > 0,
      didActionToday: todayActivity.didAction,
      hasResume: (dashboardData?.journeyProgress?.resumeBuilding?.count || 0) > 0,
    });
  }, [currentStage, dashboardData, goalsUpdatedToday, contacts, todayActivity]);

  // Build upcoming items from dashboard data
  const upcomingItems = useMemo(() => {
    const items: UpcomingItem[] = [];
    const now = Date.now();
    const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;

    // Add next interview if available
    if (dashboardData?.nextInterviewDetails) {
      const interview = dashboardData.nextInterviewDetails;
      if (interview.date && interview.date <= weekFromNow) {
        items.push({
          id: `interview-${interview.company}`,
          type: 'interview',
          title: `Interview at ${interview.company}`,
          subtitle: interview.title,
          date: interview.date,
          href: '/applications',
        });
      }
    }

    // Add goals with target dates
    if (goals) {
      for (const goal of goals) {
        if (
          goal.target_date &&
          goal.target_date <= weekFromNow &&
          goal.target_date >= now &&
          (goal.status === 'active' || goal.status === 'in_progress')
        ) {
          items.push({
            id: `goal-${goal._id}`,
            type: 'goal',
            title: goal.title,
            date: goal.target_date,
            href: '/goals',
          });
        }
      }
    }

    // Sort by date
    items.sort((a, b) => a.date - b.date);

    return items.slice(0, 4);
  }, [dashboardData, goals]);

  const completedMissions = missions.filter((m) => m.isCompleted).length;

  return (
    <section className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CalendarDays className="h-4 w-4 text-[#5371FF]" />
            This Week
          </h3>
          <p className="text-xs text-slate-500">Your upcoming tasks and goals</p>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 animate-pulse" />
                <div className="flex-1 h-4 bg-slate-100 rounded animate-pulse" />
                <div className="w-16 h-3 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Upcoming Items */}
            {upcomingItems.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Coming Up
                </h4>
                <div className="space-y-1">
                  {upcomingItems.map((item) => (
                    <UpcomingItemRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for upcoming */}
            {upcomingItems.length === 0 && (
              <div className="py-4 text-center">
                <CalendarDays className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No upcoming items this week</p>
                <p className="text-xs text-slate-400 mt-1">
                  Set goal deadlines or schedule interviews
                </p>
              </div>
            )}

            {/* Today's Missions */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#5371FF]" />
                  Today's Missions
                </h4>
                <span className="text-xs text-slate-500">
                  {completedMissions}/{missions.length} done
                </span>
              </div>
              <div className="space-y-2">
                {missions.map((mission) => (
                  <MissionPill key={mission.id} mission={mission} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
