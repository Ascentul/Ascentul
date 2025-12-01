'use client';

import { useUser } from '@clerk/nextjs';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import {
  Briefcase,
  Check,
  FileText,
  Flame,
  Plus,
  Sparkles,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Types for mission pills
interface Mission {
  id: string;
  text: string;
  icon: React.ElementType;
  href: string;
  isCompleted: boolean;
  type: 'application' | 'goal' | 'networking' | 'resume';
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

// Mission pill component
function MissionPill({ mission }: { mission: Mission }) {
  const Icon = mission.icon;

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

// Generate missions based on user data
function generateMissions(
  applicationsThisWeek: number,
  goalsUpdatedToday: boolean,
  hasContacts: boolean,
  todayActivity: { didAction: boolean; actionCount: number },
): Mission[] {
  const missions: Mission[] = [];

  // Mission 1: Add application (if less than 3 this week)
  missions.push({
    id: 'add-application',
    text: 'Add 1 new application',
    icon: Briefcase,
    href: '/applications/new',
    isCompleted: applicationsThisWeek >= 1 && todayActivity.didAction,
    type: 'application',
  });

  // Mission 2: Update a goal
  missions.push({
    id: 'update-goal',
    text: 'Update 1 goal step',
    icon: Target,
    href: '/goals',
    isCompleted: goalsUpdatedToday,
    type: 'goal',
  });

  // Mission 3: Network
  missions.push({
    id: 'networking',
    text: hasContacts ? 'Reach out to a contact' : 'Add a networking contact',
    icon: Users,
    href: '/contacts',
    isCompleted: false, // Hard to track programmatically
    type: 'networking',
  });

  return missions.slice(0, 3);
}

// Generate coaching copy based on activity
function getCoachingCopy(
  currentStreak: number,
  thisWeekActions: number,
  didActionToday: boolean,
): string {
  // Slow week
  if (thisWeekActions < 3 && !didActionToday) {
    return 'You had a lighter week. If you only have 10 minutes today, try completing one of your missions.';
  }

  // Active and on streak
  if (currentStreak >= 3) {
    return `Nice momentum! ${currentStreak} day streak. Keep it up by completing a mission today.`;
  }

  // Did action today
  if (didActionToday) {
    return "Great job today! You're building good habits. Consider tackling another mission.";
  }

  // Default
  return 'Small steps lead to big wins. Complete one mission to start your day.';
}

export function StreakAndMissions() {
  const { user: clerkUser } = useUser();
  const clerkId = clerkUser?.id;

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  // Fetch streak and activity data
  const activityData = useQuery(api.activity.getActivityYear, { timezone });
  const streakSummary = useQuery(api.activity.getStreakSummary, { timezone });

  // Fetch dashboard analytics for mission generation
  const dashboardData = useQuery(
    api.analytics.getUserDashboardAnalytics,
    clerkId ? { clerkId } : 'skip',
  );

  // Fetch goals to check for recent updates
  const goals = useQuery(api.goals.getUserGoals, clerkId ? { clerkId } : 'skip');

  // Fetch contacts
  const contacts = useQuery(api.contacts.getUserContacts, clerkId ? { clerkId } : 'skip');

  const isLoading = activityData === undefined || streakSummary === undefined;

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

  // Generate missions
  const missions = useMemo(() => {
    return generateMissions(
      dashboardData?.thisWeek?.applicationsAdded || 0,
      goalsUpdatedToday,
      (contacts?.length || 0) > 0,
      todayActivity,
    );
  }, [dashboardData, goalsUpdatedToday, contacts, todayActivity]);

  const completedMissions = missions.filter((m) => m.isCompleted).length;
  const coachingCopy = getCoachingCopy(
    streakSummary?.currentStreak || 0,
    dashboardData?.thisWeek?.totalActions || 0,
    todayActivity.didAction,
  );

  return (
    <section className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
      <div className="flex items-center justify-between px-5 py-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Flame className="h-4 w-4 text-orange-500" />
            Streak & Today's Missions
          </h3>
          <p className="text-xs text-slate-500">Build momentum with daily actions</p>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      <div className="flex-1 px-5 pb-4 pt-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex gap-6">
              <div className="h-5 w-32 bg-slate-100 rounded animate-pulse" />
              <div className="h-5 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-sm bg-slate-100 animate-pulse" />
              ))}
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Streak stats */}
            <div className="flex gap-6 mb-4">
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
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">Last 30 days</p>
              <CompactHeatmap data={activityData || []} />
            </div>

            {/* Today's Missions */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#5371FF]" />
                  Today's 3 Moves
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

            {/* Coach section */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-2 bg-gradient-to-r from-[#5371FF]/5 to-purple-50 rounded-xl p-3">
                <div className="w-6 h-6 rounded-full bg-[#5371FF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-3 w-3 text-[#5371FF]" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{coachingCopy}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
