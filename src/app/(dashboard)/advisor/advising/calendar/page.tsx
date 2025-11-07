"use client";

import { useState, useMemo } from "react";
import { AdvisorGate } from "@/components/advisor/AdvisorGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarView } from "@/components/advisor/calendar/CalendarView";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import {
  Calendar as CalendarIcon,
  Download,
  Plus,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

export default function AdvisorCalendarPage() {
  const { user } = useUser();
  const clerkId = user?.id;

  // For now, fetch data for the current month
  const [currentDate] = useState(new Date());

  const { startDate, endDate } = useMemo(() => {
    // Fetch data for the current month plus adjacent weeks for smooth navigation
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);

    return {
      startDate: start.getTime(),
      endDate: end.getTime(),
    };
  }, [currentDate]);

  const sessions = useQuery(
    api.advisor_calendar.getSessionsInRange,
    clerkId ? { clerkId, startDate, endDate } : "skip"
  );

  const followUps = useQuery(
    api.advisor_calendar.getFollowUpsInRange,
    clerkId ? { clerkId, startDate, endDate } : "skip"
  );

  const stats = useQuery(
    api.advisor_calendar.getCalendarStats,
    clerkId ? { clerkId, startDate, endDate } : "skip"
  );

  return (
    <AdvisorGate requiredFlag="advisor.advising">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground mt-1">
              Manage your advising schedule
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/advisor/advising/sessions/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </Link>
            <Button variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              Export Calendar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sessions
              </CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalSessions ?? "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalHours ?? "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.uniqueStudents ?? "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Sessions
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.upcomingSessions ?? "-"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Advising Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarView
              sessions={sessions || []}
              followUps={followUps || []}
              isLoading={sessions === undefined || followUps === undefined}
            />
          </CardContent>
        </Card>
      </div>
    </AdvisorGate>
  );
}
