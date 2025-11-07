"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Video,
  MessageSquare,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
} from "date-fns";
import Link from "next/link";

type ViewMode = "day" | "week" | "month";

interface Session {
  _id: string;
  student_id: string;
  student_name: string;
  title: string;
  session_type: string;
  start_at: number;
  end_at: number;
  duration_minutes: number;
  location?: string;
  meeting_url?: string;
  notes?: string;
  visibility: string;
  status?: string;
}

interface FollowUp {
  _id: string;
  student_id: string;
  student_name: string;
  title: string;
  due_at?: number;
  priority: "urgent" | "high" | "medium" | "low";
  status: string;
}

interface CalendarViewProps {
  sessions: Session[];
  followUps: FollowUp[];
  isLoading?: boolean;
}

export function CalendarView({ sessions, followUps, isLoading }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [now, setNow] = useState(Date.now());

  // Update current time every minute for accurate session status
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handlePrevious = () => {
    if (viewMode === "day") setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === "day") setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get days to display based on view mode
  const getDaysToDisplay = () => {
    if (viewMode === "day") {
      return [currentDate];
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      // Extend to start from Sunday and end on Saturday
      const calendarStart = startOfWeek(start);
      const calendarEnd = endOfWeek(end);
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
  };

  const daysToDisplay = getDaysToDisplay();

  // Get sessions for a specific day
  const getSessionsForDay = (day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    return sessions.filter(
      (s) => s.start_at >= dayStart.getTime() && s.start_at <= dayEnd.getTime()
    );
  };

  // Get follow-ups for a specific day
  const getFollowUpsForDay = (day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    return followUps.filter(
      (f) => f.due_at && f.due_at >= dayStart.getTime() && f.due_at <= dayEnd.getTime()
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-4 font-semibold text-lg">
            {viewMode === "month"
              ? format(currentDate, "MMMM yyyy")
              : viewMode === "week"
              ? `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`
              : format(currentDate, "EEEE, MMMM d, yyyy")}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("day")}
          >
            Day
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === "month" ? (
        <div className="border rounded-lg overflow-hidden">
          {/* Month view - grid layout */}
          <div className="grid grid-cols-7 bg-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium border-r last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {daysToDisplay.map((day, idx) => {
              const daySessions = getSessionsForDay(day);
              const dayFollowUps = getFollowUpsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={idx}
                  className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                    !isCurrentMonth ? "bg-muted/30" : ""
                  } ${isToday ? "bg-blue-50" : ""}`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isToday
                        ? "text-blue-600 font-bold"
                        : !isCurrentMonth
                        ? "text-muted-foreground"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {daySessions.slice(0, 2).map((session) => (
                      <Link
                        key={session._id}
                        href={`/advisor/advising/sessions/${session._id}`}
                      >
                        <div className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate hover:bg-blue-200 cursor-pointer">
                          {format(new Date(session.start_at), "h:mm a")} •{" "}
                          {session.student_name}
                        </div>
                      </Link>
                    ))}
                    {dayFollowUps.slice(0, 1).map((followUp) => (
                      <Link
                        key={followUp._id}
                        href={`/advisor/students/${followUp.student_id}`}
                      >
                        <div className="text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded truncate hover:bg-orange-200 cursor-pointer">
                          Task: {followUp.title}
                        </div>
                      </Link>
                    ))}
                    {(() => {
                      const displayed = Math.min(daySessions.length, 2) + Math.min(dayFollowUps.length, 1);
                      const total = daySessions.length + dayFollowUps.length;
                      const hidden = total - displayed;
                      return hidden > 0 && (
                        <div className="text-xs text-muted-foreground">
                          +{hidden} more
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Day/Week view - list layout
        <div className="space-y-4">
          {daysToDisplay.map((day) => {
            const daySessions = getSessionsForDay(day);
            const dayFollowUps = getFollowUpsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <Card key={day.toISOString()} className={isToday ? "border-blue-500" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">
                        {format(day, "EEEE, MMMM d")}
                      </h3>
                      {isToday && (
                        <Badge variant="default" className="ml-2">
                          Today
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {daySessions.length} sessions, {dayFollowUps.length} tasks
                    </div>
                  </div>

                  {daySessions.length === 0 && dayFollowUps.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No sessions or tasks scheduled
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Sessions */}
                      {daySessions.map((session) => {
                        const isPast = session.end_at && session.end_at < now;
                        const isCurrent =
                          session.start_at <= now && session.end_at && session.end_at >= now;

                        const sessionIcon = {
                          "1-on-1": User,
                          "group": User,
                          "workshop": User,
                          "virtual": Video,
                          "phone": MessageSquare,
                        }[session.session_type || "1-on-1"] || User;

                        const SessionIcon = sessionIcon;

                        return (
                          <Link
                            key={session._id}
                            href={`/advisor/advising/sessions/${session._id}`}
                          >
                            <div
                              className={`p-3 border rounded-lg hover:bg-muted/50 cursor-pointer ${
                                isCurrent
                                  ? "border-blue-500 bg-blue-50"
                                  : isPast
                                  ? "opacity-60"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <SessionIcon
                                  className={`h-5 w-5 ${
                                    isCurrent
                                      ? "text-blue-500"
                                      : isPast
                                      ? "text-gray-400"
                                      : "text-primary"
                                  }`}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium text-sm">
                                      {session.title || session.session_type}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {format(new Date(session.start_at), "h:mm a")} -{" "}
                                      {format(new Date(session.end_at), "h:mm a")}
                                    </div>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {session.student_name}
                                  </div>
                                </div>
                                {isCurrent && (
                                  <Badge variant="default">In Progress</Badge>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}

                      {/* Follow-ups */}
                      {dayFollowUps.map((followUp) => {
                        const isOverdue = followUp.due_at && followUp.due_at < now;

                        return (
                          <Link
                            key={followUp._id}
                            href={`/advisor/students/${followUp.student_id}`}
                          >
                            <div
                              className={`p-3 border rounded-lg hover:bg-muted/50 cursor-pointer ${
                                isOverdue ? "border-red-300 bg-red-50" : "bg-orange-50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-orange-500" />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium text-sm">
                                      {followUp.title}
                                    </div>
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
                                  <div className="text-sm text-muted-foreground">
                                    {followUp.student_name}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
