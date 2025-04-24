import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { useUpcomingInterviews } from '@/context/UpcomingInterviewsContext';

interface InterviewsStatCardProps {
  isLoading?: boolean;
}

export function InterviewsStatCard({ isLoading = false }: InterviewsStatCardProps) {
  const { upcomingInterviewCount } = useUpcomingInterviews();

  if (isLoading) {
    return (
      <Card className="p-5 flex justify-center items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Link href="/job-applications?filter=interviewing">
      <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Upcoming Interviews</p>
            <h2 className="text-3xl font-bold mt-1">{upcomingInterviewCount}</h2>
          </div>
          <div className="bg-primary/10 p-2 rounded-full">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {upcomingInterviewCount === 0
            ? 'No applications in interview stage'
            : upcomingInterviewCount === 1
            ? '1 application in interview stage'
            : `${upcomingInterviewCount} applications in interview stage`}
        </p>
      </Card>
    </Link>
  );
}