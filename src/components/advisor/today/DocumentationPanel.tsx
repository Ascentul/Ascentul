'use client';

/**
 * DocumentationPanel - Sessions missing notes
 *
 * Shows completed sessions from the last 3 days that
 * don't have notes, prompting the advisor to document them.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, User, CheckCircle2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Id } from 'convex/_generated/dataModel';

interface UndocumentedSession {
  _id: Id<"advisor_sessions">;
  student_id: Id<"users">;
  student_name: string;
  title: string;
  session_type?: string;
  start_at: number;
  status?: string;
}

interface DocumentationPanelProps {
  sessions: UndocumentedSession[];
  onAddNote?: (sessionId: Id<"advisor_sessions">) => void;
  isLoading?: boolean;
}

const sessionTypeLabels: Record<string, string> = {
  career_planning: 'Career Planning',
  resume_review: 'Resume Review',
  mock_interview: 'Mock Interview',
  application_strategy: 'Application Strategy',
  general_advising: 'General Advising',
  other: 'Other',
};

export function DocumentationPanel({
  sessions,
  onAddNote,
  isLoading,
}: DocumentationPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-slate-500">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500 opacity-70" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs mt-0.5">No sessions need notes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-amber-600" />
          Documentation
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
            {sessions.length} need notes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="flex items-center justify-between p-3 rounded-lg bg-white border border-amber-100"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium text-slate-900 truncate">
                    {session.student_name}
                  </span>
                  {session.session_type && (
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {sessionTypeLabels[session.session_type] || session.session_type}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 ml-5">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(session.start_at, { addSuffix: true })}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 bg-white hover:bg-amber-50 border-amber-200"
                onClick={() => onAddNote?.(session._id)}
              >
                <FileText className="h-3 w-3" />
                Add Note
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
