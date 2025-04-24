import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { format } from 'date-fns';
import { Link } from "wouter";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  type InterviewStage, 
  type Application 
} from '@/types/application'; 

// Tracks both applications with status "Interviewing" and interview stages with status "scheduled"
export function UpcomingInterviewsCard() {
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewStage[]>([]);
  const [interviewCount, setInterviewCount] = useState<number>(0);
  
  // Fetch job applications
  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['/api/job-applications'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/job-applications');
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        
        // Try to get from localStorage as a fallback
        const mockApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
        return mockApps;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Count applications with status "Interviewing" and load interview stages
  useEffect(() => {
    if (!applications || !Array.isArray(applications)) return;
    
    // Filter applications with status "Interviewing"
    const interviewingApps = applications.filter(app => app.status === 'Interviewing');
    
    // Count interviewing applications
    const appCount = interviewingApps.length;
    
    // Load interview stages from localStorage
    const stages: InterviewStage[] = [];
    
    // Check each application for interview stages
    interviewingApps.forEach(app => {
      try {
        // Get stages from localStorage
        const stagesJson = localStorage.getItem(`mockStages_${app.id}`);
        if (!stagesJson) return;
        
        const appStages = JSON.parse(stagesJson);
        if (!Array.isArray(appStages)) return;
        
        // Filter only scheduled stages and add application info
        appStages
          .filter((stage: any) => 
            stage && 
            stage.status === 'scheduled' && 
            new Date(stage.scheduledDate) > new Date() // Only future interviews
          )
          .forEach((stage: any) => {
            stages.push({
              ...stage,
              applicationId: stage.applicationId || app.id,
              application: app
            });
          });
      } catch (error) {
        console.error(`Error loading stages for application ${app.id}:`, error);
      }
    });
    
    // Sort stages by scheduled date
    const sortedStages = stages.sort((a, b) => {
      if (a.scheduledDate && b.scheduledDate) {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      }
      return 0;
    });
    
    // Update state
    setUpcomingInterviews(sortedStages);
    
    // Calculate total count (interviewing apps + scheduled interviews)
    // If we want to avoid double-counting, we can use:
    // const totalCount = Math.max(appCount, sortedStages.length);
    // If we want to count both, use:
    const totalCount = appCount;
    
    setInterviewCount(totalCount);
    
    // Store the count in localStorage for persistence
    localStorage.setItem('upcomingInterviewCount', String(totalCount));
    
  }, [applications]);

  // Handle loading state
  if (isLoadingApplications) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show specific message when no interviews
  if (interviewCount === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-2">Upcoming Interviews</h3>
          <div className="text-center text-muted-foreground py-2">
            <p>No upcoming interviews</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">Upcoming Interviews</h3>
          <Badge variant="secondary" className="text-xs">
            {interviewCount} {interviewCount === 1 ? 'application' : 'applications'}
          </Badge>
        </div>
        
        {/* Display upcoming interview stages if available */}
        {upcomingInterviews.length > 0 ? (
          <div className="space-y-3">
            {upcomingInterviews.slice(0, 3).map((stage) => (
              <div key={stage.id} className="border rounded-md p-3">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{stage.application?.company}</span>
                    <Badge variant="outline" className="text-xs">
                      {stage.type}
                    </Badge>
                  </div>
                  
                  {stage.scheduledDate && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1.5" />
                      <span>{format(new Date(stage.scheduledDate), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  )}
                  
                  {stage.location && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1.5" />
                      <span>{stage.location}</span>
                    </div>
                  )}
                  
                  {stage.interviewers && stage.interviewers.length > 0 && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users className="h-3 w-3 mr-1.5" />
                      <span>
                        {stage.interviewers.slice(0, 2).join(', ')}
                        {stage.interviewers.length > 2 && ` +${stage.interviewers.length - 2} more`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {upcomingInterviews.length > 3 && (
              <div className="text-center mt-2">
                <span className="text-xs text-muted-foreground">
                  +{upcomingInterviews.length - 3} more interview{upcomingInterviews.length - 3 !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              {interviewCount} application{interviewCount !== 1 ? 's' : ''} in interview stage
            </p>
          </div>
        )}
        
        <div className="mt-3">
          <Link href="/job-applications?filter=interviewing">
            <Button variant="outline" size="sm" className="w-full">
              View all interviews
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}