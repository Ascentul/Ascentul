"use client";

import { AdvisorGate } from '@/components/advisor/AdvisorGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  User,
  Video,
  MessageSquare,
  FileText,
  Target,
  Compass,
  MoreHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Id } from 'convex/_generated/dataModel';

/**
 * Session type icon mapping
 * Matches session types from convex/advisor_sessions_mutations.ts
 */
const SESSION_TYPE_ICONS = {
  'career_planning': Compass,
  'resume_review': FileText,
  'mock_interview': Video,
  'application_strategy': Target,
  'general_advising': MessageSquare,
  'other': MoreHorizontal,
} as const;

/**
 * Priority level color classes for follow-ups
 */
const PRIORITY_COLORS = {
  urgent: 'text-red-600 bg-red-50 border-red-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  low: 'text-blue-600 bg-blue-50 border-blue-200',
} as const;

/**
 * Format overdue time in a user-friendly way
 * Returns human-readable string like "2 hours", "45 minutes", or "2 days"
 */
function formatOverdueTime(dueAt: number, now: number): string {
  const diffMs = now - dueAt;
  if (diffMs < 0) {
    return 'not yet due';
  }
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (minutes === 0) {
    return 'less than a minute';
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

export default function AdvisorTodayPage() {
  const { user } = useUser();
  const clerkId = user?.id;
  const [completingId, setCompletingId] = useState<Id<"follow_ups"> | null>(null);

  // Get user's timezone offset for accurate "today" calculation
  const timezoneOffset = new Date().getTimezoneOffset();

  const todayData = useQuery(
    api.advisor_today.getTodayOverview,
    clerkId ? { clerkId, timezoneOffset } : 'skip'
  );

  const updateFollowup = useMutation(api.followups.updateFollowup);

  const now = Date.now();

  const handleCompleteFollowUp = async (followUpId: Id<"follow_ups">) => {
    if (!clerkId) return;

    setCompletingId(followUpId);
    try {
      await updateFollowup({ clerkId, followupId: followUpId, updates: { status: 'done' } });
      toast.success("Follow-up marked as complete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to complete follow-up");
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <AdvisorGate requiredFlag="advisor.advising">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Today</h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/advisor/advising/sessions/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </Link>
            <Link href="/advisor/advising/calendar">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sessions
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayData?.stats.totalSessions ?? "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {todayData?.stats.completedSessions ?? "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {todayData?.stats.upcomingSessions ?? "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {todayData?.stats.overdueFollowUps ?? "-"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!todayData ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading schedule...</p>
                  </div>
                </div>
              ) : todayData.sessions.length === 0 ? (
                <div className="border rounded-lg p-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No sessions scheduled for today
                  </p>
                  <Link href="/advisor/advising/sessions/new">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Session
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {todayData.sessions.map((session) => {
                    const isPast = session.end_at && session.end_at < now;
                    const isCurrent =
                      session.start_at <= now &&
                      session.end_at &&
                      session.end_at >= now;

                    const SessionIcon = SESSION_TYPE_ICONS[session.session_type as keyof typeof SESSION_TYPE_ICONS] || User;

                    return (
                      <div
                        key={session._id}
                        className={`p-4 border rounded-lg ${
                          isCurrent
                            ? "border-blue-500 bg-blue-50"
                            : isPast
                            ? "border-gray-300 bg-gray-50 opacity-60"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <SessionIcon
                              className={`h-5 w-5 ${
                                isCurrent
                                  ? "text-blue-500"
                                  : isPast
                                  ? "text-gray-400"
                                  : "text-primary"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-medium text-sm">
                                  {session.title || session.session_type}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {session.student_name}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-sm font-medium">
                                  {format(new Date(session.start_at), "h:mm a")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {session.duration_minutes} min
                                </div>
                              </div>
                            </div>
                            {isCurrent && (
                              <Badge variant="default" className="mt-2">
                                In Progress
                              </Badge>
                            )}
                            {isPast && session.status === "completed" && (
                              <Badge variant="secondary" className="mt-2">
                                Completed
                              </Badge>
                            )}
                            {isPast && session.status === "cancelled" && (
                              <Badge variant="outline" className="mt-2">
                                Cancelled
                              </Badge>
                            )}
                            {isPast && session.status === "no_show" && (
                              <Badge variant="destructive" className="mt-2">
                                No Show
                              </Badge>
                            )}
                            {isPast && (!session.status || session.status === "scheduled") && (
                              <Badge variant="outline" className="mt-2">
                                Past
                              </Badge>
                            )}
                            {session.notes && (
                              <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                                {session.notes}
                              </div>
                            )}
                            <div className="mt-3 flex gap-2">
                              <Link
                                href={`/advisor/students/${session.student_id}`}
                              >
                                <Button variant="outline" size="sm">
                                  View Student
                                </Button>
                              </Link>
                              {!isPast && (
                                <Link
                                  href={`/advisor/advising/sessions/${session._id}`}
                                >
                                  <Button variant="ghost" size="sm">
                                    View Details
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Follow-ups Due Today */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Follow-ups Due Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!todayData ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading tasks...</p>
                  </div>
                </div>
              ) : todayData.followUps.length === 0 ? (
                <div className="border rounded-lg p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No follow-ups due today
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {todayData.followUps.map((followUp) => {
                    const isOverdue = followUp.due_at ? followUp.due_at < now : false;
                    
                    return (
                      <div
                        key={followUp._id}
                        className={`p-4 border rounded-lg ${
                          isOverdue
                            ? "border-red-300 bg-red-50"
                            : PRIORITY_COLORS[followUp.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.low
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {isOverdue ? (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-current" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-medium text-sm">
                                  {followUp.title}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {followUp.student_name}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <Badge
                                  variant={
                                    followUp.priority === "urgent"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {followUp.priority}
                                </Badge>
                              </div>
                            </div>
                            {followUp.description && (
                              <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                                {followUp.description}
                              </div>
                            )}
                            {isOverdue && (
                              <div className="mt-2 text-xs text-red-600 font-medium">
                                Overdue by {followUp.due_at ? formatOverdueTime(followUp.due_at, now) : 'unknown'}
                              </div>
                            )}
                            {followUp.due_at && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Due: {format(new Date(followUp.due_at), "h:mm a")}
                              </div>
                            )}
                            <div className="mt-3 flex gap-2">
                              <Link
                                href={`/advisor/students/${followUp.student_id}`}
                              >
                                <Button variant="outline" size="sm">
                                  View Student
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCompleteFollowUp(followUp._id)}
                                disabled={completingId === followUp._id}
                              >
                                {completingId === followUp._id ? "Completing..." : "Mark Complete"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdvisorGate>
  );
}
