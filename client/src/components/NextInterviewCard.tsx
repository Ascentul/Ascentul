import { Card, CardContent } from '@/components/ui/card';
import dayjs from 'dayjs';
import { Calendar } from 'lucide-react';

// Utility function to get the next interview date
function getNextInterviewDate(applications: any[]) {
  const now = dayjs();
  const upcoming = applications
    .filter(app => app.status === "active" || app.status === "interviewing")
    .flatMap(app => {
      // Check for interviews in local storage
      const key = `mockInterviewStages_${app.id}`;
      const storedStages = localStorage.getItem(key);
      return storedStages ? JSON.parse(storedStages) : [];
    })
    .filter(interview => interview.status === "scheduled")
    .map(i => dayjs(i.date))
    .filter(date => date.isAfter(now));

  if (upcoming.length === 0) return null;

  return upcoming.reduce((soonest, current) =>
    current.isBefore(soonest) ? current : soonest
  );
}

// Utility to format how it displays
function formatInterviewCountdown(date: dayjs.Dayjs | null) {
  if (!date) return "None";
  const days = date.diff(dayjs(), "day");
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `In ${days} Days`;
  return "In 1+ Week";
}

interface NextInterviewCardProps {
  applications: any[];
}

export function NextInterviewCard({ applications }: NextInterviewCardProps) {
  const nextDate = getNextInterviewDate(applications);
  const label = formatInterviewCountdown(nextDate);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 p-3 rounded-full bg-purple-100">
            <Calendar className="h-5 w-5 text-purple-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-neutral-500 text-sm">Next Interview</h3>
            <p className="text-2xl font-semibold">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}