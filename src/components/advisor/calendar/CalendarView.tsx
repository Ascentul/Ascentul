'use client';

import { useState, useEffect, useMemo } from 'react';
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
} from 'date-fns';
import { CalendarControls } from './CalendarControls';
import { DayCell } from './DayCell';
import { DayCard } from './DayCard';

type ViewMode = 'day' | 'week' | 'month';

/**
 * Helper function to group items by day
 * @param items Array of items to group
 * @param getTimestamp Function to extract timestamp from an item
 * @returns Map of date strings to arrays of items
 */
function groupByDay<T>(
  items: T[],
  getTimestamp: (item: T) => number | undefined
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  items.forEach((item) => {
    const timestamp = getTimestamp(item);
    if (timestamp) {
      const date = new Date(timestamp);
      const key = date.toDateString();
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    }
  });
  return grouped;
}

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
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: string;
}

interface CalendarViewProps {
  sessions: Session[];
  followUps: FollowUp[];
  isLoading?: boolean;
}

export function CalendarView({ sessions, followUps, isLoading }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
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
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get days to display based on view mode (memoized to avoid recalculation)
  const daysToDisplay = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate];
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      // Extend to start from Monday and end on Sunday
      const calendarStart = startOfWeek(start, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(end, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
  }, [viewMode, currentDate]);

  // Group sessions by day (memoized to avoid re-filtering)
  const sessionsByDay = useMemo(
    () => groupByDay(sessions, (s) => s.start_at),
    [sessions]
  );

  const getSessionsForDay = (day: Date) => sessionsByDay.get(day.toDateString()) || [];

  // Group follow-ups by day (memoized to avoid re-filtering)
  const followUpsByDay = useMemo(
    () => groupByDay(followUps, (f) => f.due_at),
    [followUps]
  );

  const getFollowUpsForDay = (day: Date) => followUpsByDay.get(day.toDateString()) || [];

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
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
      {viewMode === 'month' ? (
        <div className='border rounded-lg overflow-hidden'>
          {/* Month view - grid layout */}
          <div className='grid grid-cols-7 bg-muted'>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div
                key={day}
                className='p-2 text-center text-sm font-medium border-r last:border-r-0'
              >
                {day}
              </div>
            ))}
          </div>
          <div className='grid grid-cols-7'>
            {daysToDisplay.map((day) => (
              <DayCell
                key={day.toISOString()}
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
        <div className='space-y-4'>
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
