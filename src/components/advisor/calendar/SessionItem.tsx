"use client";

import { Badge } from "@/components/ui/badge";
import { User, Video, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Session {
  _id: string;
  student_id: string;
  student_name: string;
  title: string;
  session_type: string;
  start_at: number;
  end_at?: number;
  duration_minutes: number;
  location?: string;
  meeting_url?: string;
  notes?: string;
  visibility: string;
  status?: string;
}

interface SessionItemProps {
  session: Session;
  now: number;
}

export function SessionItem({ session, now }: SessionItemProps) {
  // Calculate end_at from duration if not provided
  const endAt = session.end_at ?? (session.start_at + (session.duration_minutes || 60) * 60 * 1000);
  const isPast = endAt < now;
  const isCurrent = session.start_at <= now && endAt >= now;

  const sessionIcon = {
    "1-on-1": User,
    group: User,
    workshop: User,
    virtual: Video,
    phone: MessageSquare,
  }[session.session_type || "1-on-1"] || User;

  const SessionIcon = sessionIcon;

  return (
    <Link href={`/advisor/advising/sessions/${session._id}`}>
      <div
        className={`p-3 border rounded-lg hover:bg-muted/50 cursor-pointer ${
          isCurrent ? "border-blue-500 bg-blue-50" : isPast ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <SessionIcon
            className={`h-5 w-5 ${
              isCurrent ? "text-blue-500" : isPast ? "text-gray-400" : "text-primary"
            }`}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">
                {session.title || session.session_type}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(session.start_at), "h:mm a")} -{" "}
                {format(new Date(endAt), "h:mm a")}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">{session.student_name}</div>
          </div>
          {isCurrent && <Badge variant="default">In Progress</Badge>}
        </div>
      </div>
    </Link>
  );
}
