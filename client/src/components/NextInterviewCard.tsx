import { Card, CardContent } from '@/components/ui/card';
import dayjs from 'dayjs';
import { Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUpcomingInterviews, INTERVIEW_COUNT_UPDATE_EVENT } from '@/context/UpcomingInterviewsContext';

// Utility to get the next interview date from localStorage
function getNextInterviewDate() {
  const now = dayjs();
  const upcomingDates: dayjs.Dayjs[] = [];
  
  // Find all interview stage keys in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('mockInterviewStages_') || key.includes('mockStages_'))) {
      try {
        const stages = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(stages)) {
          stages.forEach(stage => {
            if ((stage.status === 'scheduled' || stage.outcome === 'scheduled') && stage.scheduledDate) {
              const interviewDate = dayjs(stage.scheduledDate);
              if (interviewDate.isAfter(now)) {
                upcomingDates.push(interviewDate);
              }
            }
          });
        }
      } catch (e) {
        console.error(`Error processing interview stages in ${key}:`, e);
      }
    }
  }

  if (upcomingDates.length === 0) return null;

  // Find the soonest date
  return upcomingDates.reduce((soonest, current) =>
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

export function NextInterviewCard() {
  const { upcomingInterviewCount, updateInterviewCount } = useUpcomingInterviews();
  const [nextInterviewDate, setNextInterviewDate] = useState<dayjs.Dayjs | null>(null);

  // Update interview data when component mounts or interview count changes
  useEffect(() => {
    const nextDate = getNextInterviewDate();
    setNextInterviewDate(nextDate);
    
    // Set up an event listener for interview updates
    const handleInterviewUpdate = () => {
      const updatedDate = getNextInterviewDate();
      setNextInterviewDate(updatedDate);
    };
    
    window.addEventListener(INTERVIEW_COUNT_UPDATE_EVENT, handleInterviewUpdate);
    
    // Clean up listener
    return () => {
      window.removeEventListener(INTERVIEW_COUNT_UPDATE_EVENT, handleInterviewUpdate);
    };
  }, [upcomingInterviewCount]);

  const label = formatInterviewCountdown(nextInterviewDate);

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