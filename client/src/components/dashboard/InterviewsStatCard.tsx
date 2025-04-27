import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
      <Card>
        <CardContent className="p-4 flex justify-center items-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href="/job-applications?filter=interviewing">
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-full bg-primary/20">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="ml-4">
              <h3 className="text-neutral-500 text-sm">Upcoming Interviews</h3>
              <p className="text-2xl font-semibold">{upcomingInterviewCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}