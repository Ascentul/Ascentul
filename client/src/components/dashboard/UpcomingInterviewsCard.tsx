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
        {/* Display only scheduled or pending interview stages */}
        {upcomingInterviews.filter(stage => 
          stage.outcome === 'scheduled' || stage.outcome === 'pending'
        ).length > 0 ? (
          <div className="space-y-4">
            {upcomingInterviews
              .filter(stage => stage.outcome === 'scheduled' || stage.outcome === 'pending')
              .map((stage) => (
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