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
import { useUpcomingInterviews, INTERVIEW_COUNT_UPDATE_EVENT } from '@/context/UpcomingInterviewsContext';

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
  
  // Use the UpcomingInterviewsContext hook
  const { upcomingInterviewCount, updateInterviewCount } = useUpcomingInterviews();
  
  // Count applications with status "Interviewing" and load interview stages
  useEffect(() => {
    if (!applications || !Array.isArray(applications)) return;
    
    // Fix any existing interviews with missing scheduled dates
    fixExistingInterviews();
    
    // Filter applications with status "Interviewing"
    const interviewingApps = applications.filter(app => app.status === 'Interviewing');
    console.log("Interviewing applications:", interviewingApps.map(app => ({id: app.id, company: app.company || app.companyName})));
    
    // Load all interview stages from both localStorage key patterns
    let allStages: any[] = [];
    
    // First pass - collect all keys for interview stages
    const stageKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('mockInterviewStages_') || key.includes('mockStages_'))) {
        stageKeys.push(key);
      }
    }
    
    // Second pass - process all keys
    stageKeys.forEach(key => {
      try {
        const stagesJson = localStorage.getItem(key);
        if (!stagesJson) return;
        
        const parsedStages = JSON.parse(stagesJson);
        if (!Array.isArray(parsedStages) || parsedStages.length === 0) return;
        
        // For each stage, determine which application it belongs to
        parsedStages.forEach((stage: any) => {
          // Extract application ID from the key
          let applicationId: string | number | null = null;
          
          if (key.includes('mockStages_')) {
            applicationId = key.replace('mockStages_', '');
          } else if (key.includes('mockInterviewStages_')) {
            applicationId = key.replace('mockInterviewStages_', '');
          }
          
          if (applicationId) {
            // Find the application this stage belongs to
            const app = interviewingApps.find(a => a.id.toString() === applicationId.toString());
            if (app) {
              // Add application info to the stage
              allStages.push({
                ...stage,
                applicationId: stage.applicationId || app.id,
                application: app
              });
            }
          }
        });
      } catch (error) {
        console.error(`Error processing ${key}:`, error);
      }
    });
    
    // Filter for upcoming interviews
    const upcomingStages = allStages.filter(stage => {
      // Ensure stage has a scheduled date
      if (!stage || !stage.scheduledDate) return false;
      
      // Check for scheduled or pending status/outcome
      const isScheduledOrPending = (
        stage.status === 'scheduled' || 
        stage.status === 'pending' || 
        stage.outcome === 'scheduled' || 
        stage.outcome === 'pending'
      );
      
      // Check if the interview is in the future
      const isInFuture = new Date(stage.scheduledDate) > new Date();
      
      return isScheduledOrPending && isInFuture;
    });
    
    // Sort by date
    const sortedStages = upcomingStages.sort((a, b) => {
      if (a.scheduledDate && b.scheduledDate) {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      }
      return 0;
    });
    
    // Update state with all upcoming interviews
    setUpcomingInterviews(sortedStages);
    
    // Set the count of interviews (from context if available, otherwise use local count)
    setInterviewCount(upcomingInterviewCount > 0 ? upcomingInterviewCount : sortedStages.length);
    
    // Update the central context with our findings
    updateInterviewCount();
    
    // Force a UI update by dispatching the update event
    window.dispatchEvent(new Event(INTERVIEW_COUNT_UPDATE_EVENT));
    
  }, [applications, upcomingInterviewCount, updateInterviewCount]);

  // Handle editing an interview
  const handleEditInterview = (stageId: number, applicationId: number) => {
    // Trigger an event to refresh the interview display when navigating back
    window.localStorage.setItem('lastEditedInterviewStage', stageId.toString());
    // Trigger interview update event
    window.dispatchEvent(new Event(INTERVIEW_COUNT_UPDATE_EVENT));
    // Navigate to edit page
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
                Scheduled or pending interviews will appear here
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