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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  format,
} from "date-fns";

export default function AdvisorCalendarPage() {
  const { user } = useUser();
  const clerkId = user?.id;

  const [currentDate, setCurrentDate] = useState(new Date());

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

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isLoading = sessions === undefined || followUps === undefined || stats === undefined;

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
            {/* TODO: Implement calendar export functionality (export to .ics format) */}
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
                {stats?.totalHours !== undefined ? `${stats.totalHours}h` : "-"}
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Advising Calendar
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="min-w-[100px]"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CalendarView
              sessions={sessions || []}
              followUps={followUps || []}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </AdvisorGate>
  );
}
