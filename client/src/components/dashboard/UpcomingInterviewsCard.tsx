import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Users, ArrowRight, Plus } from "lucide-react";
import { format } from 'date-fns';
import { Link, useLocation } from "wouter";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  type InterviewStage, 
  type Application 
} from '@/types/application'; 
import InterviewCard from './InterviewCard';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Tracks both applications with status "Interviewing" and interview stages with status "scheduled"
export function UpcomingInterviewsCard() {
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewStage[]>([]);
  const [interviewCount, setInterviewCount] = useState<number>(0);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
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

  // Fix existing interviews with missing scheduled dates
  const fixExistingInterviews = () => {
    // For debugging - dump all localStorage keys related to interviews
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('mockInterviewStages_') || key.includes('mockStages_'))) {
        keys.push(key);
      }
    }
    console.log("All interview stage localStorage keys:", keys);
    
    // Process each key to fix any interviews with missing scheduled dates
    keys.forEach(key => {
      try {
        const stages = JSON.parse(localStorage.getItem(key) || '[]');
        let hasChanges = false;
        
        stages.forEach((stage: any) => {
          // Check if this is a scheduled or pending interview without a date
          if ((stage.status === 'scheduled' || stage.status === 'pending' || 
               stage.outcome === 'scheduled' || stage.outcome === 'pending') && 
              !stage.scheduledDate) {
            
            console.log(`Fixing stage ${stage.id} in ${key} - adding scheduled date`);
            
            // Add a scheduled date (7 days from now)
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 7);
            stage.scheduledDate = defaultDate.toISOString();
            
            // Ensure it has a status or outcome set to scheduled
            if (!stage.status && !stage.outcome) {
              stage.status = 'scheduled';
            }
            
            hasChanges = true;
          }
        });
        
        // Save back if changes were made
        if (hasChanges) {
          console.log(`Saving fixed stages back to ${key}`);
          localStorage.setItem(key, JSON.stringify(stages));
        }
      } catch (error) {
        console.error(`Error processing ${key}:`, error);
      }
    });
  };
  
  // Count applications with status "Interviewing" and load interview stages
  useEffect(() => {
    if (!applications || !Array.isArray(applications)) return;
    
    // Fix any existing interviews with missing scheduled dates
    fixExistingInterviews();
    
    // Filter applications with status "Interviewing"
    const interviewingApps = applications.filter(app => app.status === 'Interviewing');
    console.log("Interviewing applications:", interviewingApps.map(app => ({id: app.id, company: app.company || app.companyName})));
    
    // Count interviewing applications
    const appCount = interviewingApps.length;
    
    console.log(`Local count: ${appCount} interviewing applications, ${upcomingInterviews.length} scheduled interviews`);
    
    // Load interview stages from localStorage
    const stages: InterviewStage[] = [];
    
    // Check each application for interview stages
    interviewingApps.forEach(app => {
      console.log(`Checking stages for application ${app.id} (${app.company || app.companyName})`);
      
      try {
        // First check mockStages_${app.id}
        let appStages: any[] = [];
        let stagesJson = localStorage.getItem(`mockStages_${app.id}`);
        
        if (stagesJson) {
          try {
            const parsedStages = JSON.parse(stagesJson);
            if (Array.isArray(parsedStages) && parsedStages.length > 0) {
              appStages = parsedStages;
              console.log(`Found ${parsedStages.length} stages in mockStages_${app.id}:`, parsedStages);
            }
          } catch (e) {
            console.error(`Error parsing mockStages_${app.id}:`, e);
          }
        }
        
        // If no stages found, check mockInterviewStages_${app.id}
        if (appStages.length === 0) {
          stagesJson = localStorage.getItem(`mockInterviewStages_${app.id}`);
          if (stagesJson) {
            try {
              const parsedStages = JSON.parse(stagesJson);
              if (Array.isArray(parsedStages) && parsedStages.length > 0) {
                appStages = parsedStages;
                console.log(`Found ${parsedStages.length} stages in mockInterviewStages_${app.id}:`, parsedStages);
              }
            } catch (e) {
              console.error(`Error parsing mockInterviewStages_${app.id}:`, e);
            }
          }
        }
        
        if (appStages.length === 0) {
          console.log(`No interview stages found for application ${app.id}`);
          return; // No stages found for this application
        }
        
        // Filter only scheduled or pending stages and add application info
        const scheduledStages = appStages
          .filter((stage: any) => {
            // Ensure the stage exists and has a scheduled date
            if (!stage || !stage.scheduledDate) {
              console.log(`Stage ${stage?.id || 'unknown'} has no scheduledDate, skipping`);
              return false;
            }
            
            // Check status and outcome fields for 'scheduled' or 'pending'
            // Also accept undefined or null statuses if outcome is set appropriately
            const isScheduledOrPending = (
              (!stage.status || stage.status === 'scheduled' || stage.status === 'pending') &&
              (!stage.outcome || stage.outcome === 'scheduled' || stage.outcome === 'pending')
            );
            
            // Check if the interview is in the future
            const interviewDate = new Date(stage.scheduledDate);
            const isInFuture = interviewDate > new Date();
            
            const isValid = isScheduledOrPending && isInFuture;
            
            console.log(`Stage ${stage.id} status=${stage.status} outcome=${stage.outcome} date=${interviewDate.toISOString()} isScheduled=${isValid}`);
            
            return isValid;
          });
        
        console.log(`Found ${scheduledStages.length} scheduled stages for application ${app.id}`);
        
        scheduledStages.forEach((stage: any) => {
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
    
    console.log(`Total upcoming interviews found: ${sortedStages.length}:`, sortedStages);
    
    // Update state
    setUpcomingInterviews(sortedStages);
    
    // Calculate total count (interviewing apps + scheduled interviews)
    const totalCount = sortedStages.length > 0 ? sortedStages.length : appCount;
    
    setInterviewCount(totalCount);
  }, [applications]);

  // Handle editing an interview
  const handleEditInterview = (stageId: number, applicationId: number) => {
    navigate(`/interview/${stageId}?edit=true`);
  };

  // Handle loading state
  if (isLoadingApplications) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Upcoming Interviews</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show specific message when no interviews
  if (interviewCount === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Upcoming Interviews</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-center text-muted-foreground py-8 space-y-3">
            <p>No upcoming interviews</p>
            <Link href="/job-applications?filter=active">
              <Button variant="secondary" size="sm">
                View Active Applications
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find applications in interviewing stage but without scheduled interviews
  const interviewingApplications = applications?.filter(app => 
    app.status === 'Interviewing' && 
    !upcomingInterviews.some(interview => interview.applicationId === app.id)
  ) || [];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Upcoming Interviews</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {interviewCount} {interviewCount === 1 ? 'application' : 'applications'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4 overflow-auto max-h-[600px]">
        {/* Display only upcoming interview stages */}
        {upcomingInterviews.length > 0 ? (
          <div className="space-y-4">
            {upcomingInterviews.map((stage) => (
              <InterviewCard 
                key={stage.id} 
                stage={stage}
                onEdit={handleEditInterview}
              />
            ))}
          </div>
        ) : (
          <div className="py-2 space-y-4">
            <div className="text-center p-6">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No scheduled interviews</h3>
              <p className="text-sm text-muted-foreground mt-1">
                When you schedule interviews, they will appear here
              </p>
            </div>
          </div>
        )}
        
        <div className="mt-5 pt-3 border-t">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                Add New Interview
                <Plus className="h-4 w-4 ml-1" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Interview</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <h3 className="text-sm font-medium mb-3">Select an application:</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {applications?.filter(app => app.status === 'Applied' || app.status === 'Interviewing').map(app => (
                    <Card key={app.id} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        navigate(`/job-applications/${app.id}?addInterview=true`);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{app.company || app.companyName}</p>
                          <p className="text-sm text-muted-foreground">{app.position || app.jobTitle}</p>
                        </div>
                        <Badge>{app.status}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="mt-4">
                  <Link href="/job-applications?filter=interviewing">
                    <Button variant="outline" size="sm" className="w-full">
                      View all applications
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}