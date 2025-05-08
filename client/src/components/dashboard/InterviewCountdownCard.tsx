import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { useUpcomingInterviews } from '@/context/UpcomingInterviewsContext';
import { apiRequest } from '@/lib/queryClient';

type NextInterviewInfo = {
  daysUntil: number;
  company: string;
  position: string;
  date: Date;
};

export function InterviewCountdownCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [nextInterview, setNextInterview] = useState<NextInterviewInfo | null>(null);
  const { upcomingInterviewCount, updateInterviewCount } = useUpcomingInterviews();

  // Function to get the next interview
  const fetchNextInterview = async () => {
    setIsLoading(true);

    try {
      // First check interview stages in localStorage
      const now = new Date();
      const allStages: any[] = [];

      // Scan localStorage for interview stages
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (!key.includes('mockStages_') && !key.includes('mockInterviewStages_')) continue;

        try {
          const stagesJson = localStorage.getItem(key);
          if (!stagesJson) continue;

          const stages = JSON.parse(stagesJson);
          if (!Array.isArray(stages) || stages.length === 0) continue;

          // Add all stages to our collection
          stages.forEach((stage: any) => {
            if (!stage || !stage.scheduledDate) return;
            allStages.push(stage);
          });
        } catch (error) {
          console.error(`Error processing stages from key ${key}:`, error);
        }
      }

      // Filter for valid upcoming scheduled interviews
      const upcomingStages = allStages.filter(stage => {
        if (!stage.scheduledDate) return false;

        const isScheduledOrPending = (
          stage.status === 'scheduled' || 
          stage.status === 'pending' || 
          stage.outcome === 'scheduled' || 
          stage.outcome === 'pending'
        );

        const stageDate = new Date(stage.scheduledDate);
        // Include interviews if they're scheduled for today or in the future
        // For today's interviews, we'll check if they're on the same day rather than strictly after now
        const isToday = stageDate.getDate() === now.getDate() && 
                        stageDate.getMonth() === now.getMonth() && 
                        stageDate.getFullYear() === now.getFullYear();

        return isScheduledOrPending && (isToday || stageDate > now);
      });

      // Sort by date (earliest first)
      upcomingStages.sort((a, b) => {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });

      // Get the next interview (first in sorted list)
      const nextStage = upcomingStages.length > 0 ? upcomingStages[0] : null;

      if (nextStage) {
        // Try to get company and position info from related process
        let company = 'Company';
        let position = 'Position';

        // If we have a processId, try to get process details
        if (nextStage.processId) {
          const processKey = `mockInterviewProcess_${nextStage.processId}`;
          const processJson = localStorage.getItem(processKey);

          if (processJson) {
            try {
              const process = JSON.parse(processJson);
              company = process.companyName || company;
              position = process.position || position;
            } catch (error) {
              console.error('Error parsing process data:', error);
            }
          }
        }

        // If we have an applicationId, try to get application details
        if (nextStage.applicationId && (!company || !position)) {
          const applicationsJson = localStorage.getItem('mockJobApplications');

          if (applicationsJson) {
            try {
              const applications = JSON.parse(applicationsJson);
              const application = applications.find((app: any) => app.id === nextStage.applicationId);

              if (application) {
                company = application.company || application.companyName || company;
                position = application.position || application.jobTitle || position;
              }
            } catch (error) {
              console.error('Error parsing applications data:', error);
            }
          }
        }

        // Calculate days until interview
        const interviewDate = new Date(nextStage.scheduledDate);
        const daysUntil = Math.ceil((interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        setNextInterview({
          daysUntil,
          company,
          position,
          date: interviewDate
        });
      } else {
        setNextInterview(null);
      }

      // Also check from API
      try {
        // First check if there are any upcoming interviews via the API
        const response = await apiRequest('GET', '/api/interview/processes');
        if (!response.ok) {
          setIsLoading(false);
          return;
        }

        const processes = await response.json();

        if (!Array.isArray(processes) || processes.length === 0) {
          setIsLoading(false);
          return;
        }

        // Flatten all interview stages from all processes
        const apiStages: any[] = [];
        processes.forEach((process: any) => {
          if (process.stages && Array.isArray(process.stages)) {
            process.stages.forEach((stage: any) => {
              if (stage.scheduledDate) {
                apiStages.push({
                  ...stage,
                  companyName: process.companyName,
                  position: process.position
                });
              }
            });
          }
        });

        // Filter for valid upcoming scheduled interviews
        const apiUpcomingStages = apiStages.filter(stage => {
          if (!stage.scheduledDate) return false;

          const isScheduledOrPending = (
            stage.status === 'scheduled' || 
            stage.status === 'pending' || 
            stage.outcome === 'scheduled' || 
            stage.outcome === 'pending'
          );

          const stageDate = new Date(stage.scheduledDate);
          // Include interviews if they're scheduled for today or in the future
          // For today's interviews, we'll check if they're on the same day rather than strictly after now
          const isToday = stageDate.getDate() === now.getDate() && 
                        stageDate.getMonth() === now.getMonth() && 
                        stageDate.getFullYear() === now.getFullYear();

          return isScheduledOrPending && (isToday || stageDate > now);
        });

        // Sort by date (earliest first)
        apiUpcomingStages.sort((a, b) => {
          return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
        });

        // Get the next interview (first in sorted list)
        const nextApiStage = apiUpcomingStages.length > 0 ? apiUpcomingStages[0] : null;

        if (nextApiStage) {
          // Calculate days until interview
          const interviewDate = new Date(nextApiStage.scheduledDate);
          const daysUntil = Math.ceil((interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Use API data if it's available and has an earlier interview than localStorage
          if (!nextInterview || interviewDate < nextInterview.date) {
            setNextInterview({
              daysUntil,
              company: nextApiStage.companyName || 'Company',
              position: nextApiStage.position || 'Position',
              date: interviewDate
            });
          }
        }
      } catch (error) {
        console.error('Error getting API interview data:', error);
      }
    } catch (error) {
      console.error('Error fetching next interview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and setup refresh
  useEffect(() => {
    fetchNextInterview();

    // Set up interval to refresh data
    const interval = setInterval(() => {
      fetchNextInterview();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  // Re-fetch when upcomingInterviewCount changes
  useEffect(() => {
    fetchNextInterview();
  }, [upcomingInterviewCount]);

  // Helper function for formatting display text
  const getDisplayText = () => {
    if (!nextInterview) return "No Interviews";

    if (nextInterview.daysUntil === 0) {
      return "Today";
    } else if (nextInterview.daysUntil === 1) {
      return "Tomorrow";
    } else {
      return `In ${nextInterview.daysUntil} Days`;
    }
  };

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
            <div className="flex-shrink-0 p-3 rounded-full bg-blue-500/20">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-neutral-500 text-sm">Next Interview</h3>
              <p className="text-2xl font-semibold">{getDisplayText()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}