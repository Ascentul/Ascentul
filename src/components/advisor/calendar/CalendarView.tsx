"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
} from "date-fns";
import { CalendarControls } from "./CalendarControls";
import { DayCell } from "./DayCell";
import { DayCard } from "./DayCard";

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

  // Navigation handlers
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

  // Get days to display based on view mode (memoized to avoid recalculation)
  const daysToDisplay = useMemo(() => {
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
  }, [viewMode, currentDate]);

  // Get sessions for a specific day (memoized to avoid re-filtering)
  const getSessionsForDay = useCallback(
    (day: Date) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      return sessions.filter(
        (s) => s.start_at >= dayStart.getTime() && s.start_at <= dayEnd.getTime()
      );
    },
    [sessions]
  );

  // Get follow-ups for a specific day (memoized to avoid re-filtering)
  const getFollowUpsForDay = useCallback(
    (day: Date) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      return followUps.filter(
        (f) => f.due_at && f.due_at >= dayStart.getTime() && f.due_at <= dayEnd.getTime()
      );
    },
    [followUps]
  );

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
      <CalendarControls
        currentDate={currentDate}
        viewMode={viewMode}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onViewModeChange={setViewMode}
      />

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
            {daysToDisplay.map((day, idx) => (
              <DayCell
                key={idx}
                day={day}
                currentMonth={currentDate}
                sessions={getSessionsForDay(day)}
                followUps={getFollowUpsForDay(day)}
              />
            ))}
          </div>
        </div>
      ) : (
        // Day/Week view - list layout
        <div className="space-y-4">
          {daysToDisplay.map((day) => (
            <DayCard
              key={day.toISOString()}
              day={day}
              sessions={getSessionsForDay(day)}
              followUps={getFollowUpsForDay(day)}
              now={now}
            />
          ))}
        </div>
      )}
    </div>
  );
}
