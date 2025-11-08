'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { SessionItem } from './SessionItem';
import { FollowUpItem } from './FollowUpItem';
import { cn } from '@/lib/utils';

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
  priority: string;
  due_at?: number | null;
}

interface DayCardProps {
  day: Date;
  sessions: Session[];
  followUps: FollowUp[];
  now: number,
}

export function DayCard({ day, sessions, followUps, now }: DayCardProps) {
  const isToday = isSameDay(day, new Date(now));

  return (
    <Card className={cn(isToday && 'border-blue-500')}>
      <CardContent className='p-4'>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">{format(day, "EEEE, MMMM d")}</h3>
            {isToday && (
              <Badge variant="default" className="ml-2">
                Today
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {sessions.length} sessions, {followUps.length} tasks
          </div>
        </div>

        {sessions.length === 0 && followUps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No sessions or tasks scheduled
          </div>
        ) : (
          <div className="space-y-2">
            {/* Sessions */}
            {sessions.map((session) => (
              <SessionItem key={session._id} session={session} now={now} />
            ))}

            {/* Follow-ups */}
            {followUps.map((followUp) => (
              <FollowUpItem key={followUp._id} followUp={followUp} now={now} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
