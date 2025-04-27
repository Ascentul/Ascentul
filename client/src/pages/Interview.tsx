import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  loadInterviewStagesForApplication, 
  loadAllInterviewStages,
  notifyInterviewDataChanged,
  INTERVIEW_DATA_CHANGED_EVENT,
  INTERVIEW_STAGE_ADDED_EVENT,
  INTERVIEW_STAGE_UPDATED_EVENT,
  MOCK_STAGES_PREFIX,
  MOCK_INTERVIEW_STAGES_PREFIX
} from '@/lib/interview-utils';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Briefcase,
  CalendarDays,
  Check,
  Plus,
  ListChecks,
  Search,
  BookOpenText,
  GanttChartSquare as Timeline,
  Building,
  MapPin,
  FileText,
  Calendar,
  Link as LinkIcon,
  ExternalLink,
  ArrowRight,
  FilterX,
  Filter,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { InterviewProcessStatusBadge } from '@/components/interview/InterviewProcessStatusBadge';
import { NewInterviewProcessForm } from '@/components/interview/NewInterviewProcessForm';
import { InterviewProcessDetails } from '@/components/interview/InterviewProcessDetails';
import { GamePracticeSession } from '@/components/interview/GamePracticeSession';
import { HorizontalTimeline, StageDetailsDialog } from '@/components/interview/HorizontalTimeline';
import { ApplyWizard } from '@/components/apply/ApplyWizard';
import { ApplicationCard } from '@/components/apply/ApplicationCard';
import { ApplicationDetails } from '@/components/apply/ApplicationDetails';
import { ApplicationStatusBadge } from '@/components/apply/ApplicationStatusBadge';
import { AdzunaJobSearch } from '@/components/apply/AdzunaJobSearch';
import { ApplicationWizard } from '@/components/apply/ApplicationWizard';
import { type InterviewProcess, type InterviewStage, type JobApplication } from '@shared/schema';
import { motion } from 'framer-motion';
import { LoadingState } from '@/components/ui/loading-state';
import { useLoading } from '@/contexts/loading-context';
import { apiRequest } from '@/lib/queryClient';

// Component to handle loading stages and displaying the horizontal timeline
const HorizontalTimelineSection = ({ 
  processes, 
  onEditProcess 
}: { 
  processes: InterviewProcess[],
  onEditProcess: (processId: number) => void 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStage, setSelectedStage] = useState<InterviewStage | null>(null);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  
  // Fetch stages for all applications with interview data
  const { data: allStages, isLoading, refetch: refetchAllStages } = useQuery<Record<number, InterviewStage[]>>({
    queryKey: ['/api/interview/stages'],
    queryFn: async () => {
      console.log('Loading interview stages from localStorage...');
      
      try {
        // Use our improved utility function to load all stages from all sources
        const stagesMap = loadAllInterviewStages();
        
        // Log summary info for debugging
        const applications = Object.keys(stagesMap);
        console.log(`Found ${applications.length} applications with interviews to display`);
        
        // Log details about each application's stages
        for (const appId of applications) {
          const numericAppId = Number(appId);
          const stages = stagesMap[numericAppId];
          const app = stages[0]; // Get the first stage which has company info attached
          
          // Log each application's stages
          console.log(`Application ${appId} (${app?.companyName || 'Unknown'}): found ${stages.length} stages`);
        }
        
        console.log('Combined timeline stages:', stagesMap);
        return stagesMap;
      } catch (error) {
        console.error('Error loading interview stages:', error);
        return {};
      }
    },
    enabled: true, // Always enable the query
    placeholderData: {},
    refetchOnWindowFocus: true,
    refetchInterval: 5000 // Refresh every 5 seconds to pick up new stages
  });
  
  // Set up listeners for interview data changes to trigger refreshes
  useEffect(() => {
    // Event handler for any interview data change
    const handleInterviewDataChanged = () => {
      console.log('Interview data changed event received, refreshing stages');
      refetchAllStages();
    };
    
    // Listen to all our custom events from interview-utils.ts
    window.addEventListener(INTERVIEW_DATA_CHANGED_EVENT, handleInterviewDataChanged);
    window.addEventListener(INTERVIEW_STAGE_ADDED_EVENT, handleInterviewDataChanged);
    window.addEventListener(INTERVIEW_STAGE_UPDATED_EVENT, handleInterviewDataChanged);
    
    // Also listen to storage events that might come from other tabs/windows
    window.addEventListener('storage', (event) => {
      if (event.key && (
        event.key.startsWith(MOCK_STAGES_PREFIX) || 
        event.key.startsWith(MOCK_INTERVIEW_STAGES_PREFIX)
      )) {
        console.log('Storage event detected for interview stages, refreshing');
        refetchAllStages();
      }
    });
    
    return () => {
      // Clean up event listeners
      window.removeEventListener(INTERVIEW_DATA_CHANGED_EVENT, handleInterviewDataChanged);
      window.removeEventListener(INTERVIEW_STAGE_ADDED_EVENT, handleInterviewDataChanged);
      window.removeEventListener(INTERVIEW_STAGE_UPDATED_EVENT, handleInterviewDataChanged);
      window.removeEventListener('storage', handleInterviewDataChanged);
    };
  }, [refetchAllStages]);
  
  // Update stage
  const updateStageMutation = useMutation({
    mutationFn: async (updatedStage: Partial<InterviewStage>) => {
      if (!selectedStageId) throw new Error("No stage selected");
      const response = await apiRequest('PUT', `/api/interview/stages/${selectedStageId}`, updatedStage);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stage updated",
        description: "Interview stage has been updated successfully.",
      });
      // Invalidate all stage-related queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/interview/stages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      
      // Dispatch event to notify components about interview data changes
      notifyInterviewDataChanged();
      setIsStageDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update stage",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle stage click to open edit dialog
  const handleStageClick = (processId: number, stageId: number) => {
    // In our adapter, processId is actually applicationId
    const applicationId = processId;
    setSelectedProcessId(processId);
    setSelectedStageId(stageId);
    
    console.log(`Stage clicked: Application ${applicationId}, Stage ${stageId}`);
    
    // Find the selected stage - using the application ID to look up in our stored stages
    const stage = allStages && allStages[applicationId]?.find(s => s.id === stageId);
    if (stage) {
      console.log("Found stage for viewing/editing:", stage);
      setSelectedStage(stage);
      setIsStageDialogOpen(true);
    } else {
      console.error(`Stage not found: Application ${applicationId}, Stage ${stageId}`);
      console.log("Available stages:", allStages && allStages[applicationId]);
    }
  };
  
  // Handle saving changes to a stage
  const handleSaveStage = (updatedStage: Partial<InterviewStage>) => {
    if (selectedStageId) {
      updateStageMutation.mutate(updatedStage);
    }
  };
  
  // Debug the derived states
  const hasProcesses = Array.isArray(processes) && processes.length > 0;
  const hasStages = allStages && Object.keys(allStages).length > 0;
  const stagesCount = hasStages ? Object.values(allStages).flat().length : 0;
  
  // Generate a map of application IDs to "fake" process IDs for the timeline
  // This allows us to use the applications data with the process-oriented timeline
  const applicationToProcessMap = new Map<number, number>();
  const processToApplicationMap = new Map<number, number>();
  
  // Build adapted data for the timeline by treating applications as processes
  let adaptedStages: Record<number, InterviewStage[]> = {};
  let generatedProcesses: InterviewProcess[] = [];
  
  if (hasStages) {
    // Extract applications with stages
    const applicationIds = Object.keys(allStages).map(Number);
    
    // Map each application to a unique process ID (for now, just use the app ID)
    applicationIds.forEach(appId => {
      // Use application ID as process ID for simplicity
      applicationToProcessMap.set(appId, appId);
      processToApplicationMap.set(appId, appId);
      
      // Build a fake process object from the application data
      // using stage data to get company and position info
      const stages = allStages[appId] || [];
      if (stages.length > 0) {
        const firstStage = stages[0];
        generatedProcesses.push({
          id: appId, // Use application ID as process ID
          companyName: firstStage.companyName || 'Unknown Company',
          position: firstStage.jobTitle || 'Unknown Position',
          status: 'Interviewing', // Default status
          createdAt: new Date(firstStage.createdAt || Date.now()),
          updatedAt: new Date(firstStage.updatedAt || Date.now())
        });
        
        // Use the same mapping for stages
        adaptedStages[appId] = stages;
      }
    });
  }
  
  console.log("Timeline Debug:", {
    isLoading,
    hasProcesses,
    hasStages,
    stagesCount, 
    adaptedProcesses: generatedProcesses.length,
    stageKeys: hasStages ? Object.keys(allStages) : [],
    allStagesData: allStages
  });
  
  return (
    <div className="space-y-6">
      {/* Debug panel */}
      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800 mb-3">
        <p><strong>Debug Info:</strong> Loading: {isLoading ? 'Yes' : 'No'} | 
          Applications with interviews: {hasStages ? Object.keys(allStages).length : 0} | 
          Generated processes: {generatedProcesses.length} |
          Total stages: {stagesCount}</p>
      </div>
      
      {isLoading ? (
        <LoadingState 
          message="Loading interview stages..." 
          size="md" 
          variant="card" 
          className="w-full p-6 rounded-lg"
        />
      ) : !hasStages || stagesCount === 0 ? (
        // Show if we have no stages
        <div className="text-center p-8 border rounded-lg bg-muted/30">
          <h3 className="text-lg font-medium mb-2">No interview stages found</h3>
          <p className="text-muted-foreground mb-4">
            Add interview stages to your applications to track your interview progress.
          </p>
        </div>
      ) : hasStages && stagesCount > 0 ? (
        // Show timeline if we have stages - use our adapted data
        <>
          <HorizontalTimeline 
            processes={generatedProcesses}
            stages={adaptedStages}
            onStageClick={handleStageClick}
            onEditProcess={onEditProcess}
            className="w-full"
          />
          {selectedStage && (
            <StageDetailsDialog 
              isOpen={isStageDialogOpen}
              onClose={() => setIsStageDialogOpen(false)}
              stage={selectedStage}
              onSave={handleSaveStage}
            />
          )}
        </>
      ) : (
        // Fallback if the other conditions don't apply
        <div className="text-center p-8 border rounded-lg bg-muted/30">
          <h3 className="text-lg font-medium mb-2">No interview timeline data</h3>
          <p className="text-muted-foreground mb-4">
            Interview data may be loading or no interviews have been added yet.
          </p>
        </div>
      )}
    </div>
  );
};

const Interview = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showApplyWizard, setShowApplyWizard] = useState(false);
  const [showPracticeSession, setShowPracticeSession] = useState(false);
  const [practiceProcessId, setPracticeProcessId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedJobInfo, setSelectedJobInfo] = useState<{ 
    title: string; 
    company: string; 
    url: string; 
    description: string;
    location?: string;
  } | null>(null);
  const { showGlobalLoading, hideGlobalLoading } = useLoading();
  const [location] = useLocation();

  // Check for create=true query parameter to automatically open the form
  useEffect(() => {
    // Parse the URL to check for the create=true parameter
    const url = new URL(window.location.href);
    const shouldCreate = url.searchParams.get('create');
    if (shouldCreate === 'true') {
      setShowCreateForm(true);
    }
  }, [location]);

  // Animation variants - keeping them subtle
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } }
  };

  const subtleUp = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const listContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Very slight stagger for minimal distraction
        when: "beforeChildren"
      }
    }
  };

  const listItem = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
  };

  // Fetch interview processes
  const { data: processes, isLoading: isLoadingProcesses } = useQuery<InterviewProcess[]>({
    queryKey: ['/api/interview/processes'],
    placeholderData: [],
  });
  
  // Fetch job applications
  const { data: applications, isLoading: isLoadingApplications } = useQuery<JobApplication[]>({
    queryKey: ['/api/job-applications'],
    queryFn: async () => {
      try {
        // First check localStorage for any saved applications
        const mockApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
        
        // Try to get server applications (if logged in)
        try {
          const response = await apiRequest({
            url: '/api/job-applications',
            method: 'GET'
          });
          
          // If we have mock applications in localStorage, merge with server applications
          if (mockApplications.length > 0) {
            // Check if response is an array
            const serverApps = Array.isArray(response) ? response : [];
            // Create a set of existing IDs to avoid duplicates
            const existingIds = new Set(serverApps.map((app: any) => app.id));
            // Merge server and local applications
            const mergedApps = [
              ...serverApps,
              ...mockApplications.filter((app: any) => !existingIds.has(app.id))
            ];
            
            console.log('Combined applications:', mergedApps);
            return mergedApps;
          }
          
          return Array.isArray(response) ? response : [];
        } catch (serverError) {
          // If server request fails, fall back to the localStorage applications
          console.log('Using mock job applications from localStorage due to server error');
          if (mockApplications.length > 0) {
            console.log('Retrieved applications from localStorage:', mockApplications);
            return mockApplications;
          }
          throw serverError; // Re-throw if no localStorage data available
        }
      } catch (error) {
        console.error('Error fetching job applications:', error);
        return [];
      }
    },
    placeholderData: [],
    staleTime: 10000, // Refresh every 10 seconds
    refetchOnWindowFocus: true, // Refresh when the page gains focus
  });
  
  // Get access to the query client
  const queryClient = useQueryClient();
  
  // Helper function to sync application updates to localStorage
  const syncApplicationToLocalStorage = useCallback((applicationId: number, updates: Partial<JobApplication>) => {
    try {
      // Get applications from localStorage
      const mockApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
      const appIndex = mockApplications.findIndex((a: any) => a.id === applicationId);
      
      // If the application exists in localStorage, update it
      if (appIndex !== -1) {
        mockApplications[appIndex] = {
          ...mockApplications[appIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('mockJobApplications', JSON.stringify(mockApplications));
        console.log(`Application ${applicationId} updated in localStorage:`, updates);
        
        // Force refresh the applications query
        queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error syncing application to localStorage:', error);
      return false;
    }
  }, [queryClient]);
  
  // Get selected application details
  const selectedApplication = applications?.find(a => a.id === selectedApplicationId) || null;
  console.log("Selected application ID:", selectedApplicationId);
  console.log("Selected application:", selectedApplication);
  console.log("Available applications:", applications);
  
  // Disable automatic refreshing if an application is selected
  const shouldAutoRefresh = selectedApplicationId === null;
  
  // Refresh the applications list when the page loads and periodically
  useEffect(() => {
    // Function to refresh applications that maintains selection
    const refreshApplications = async () => {
      console.log('Refreshing applications list...');
      
      // If we have a selected application, skip refresh to prevent losing selection
      if (!shouldAutoRefresh) {
        console.log('Application selected, skipping auto-refresh to maintain selection');
        return;
      }
      
      // Refetch the applications
      await queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
    };
    
    // Force an immediate refresh of applications on mount
    if (shouldAutoRefresh) {
      refreshApplications();
    }
    
    // Set up periodic refreshes while the page is open, but only if no application is selected
    let refreshInterval: NodeJS.Timeout | null = null;
    if (shouldAutoRefresh) {
      refreshInterval = setInterval(refreshApplications, 5000); // Refresh every 5 seconds
    }
    
    // Set up focus-based refresh
    const handleFocus = () => {
      if (shouldAutoRefresh) {
        console.log('Window gained focus, refreshing applications...');
        refreshApplications();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Clean up
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, [queryClient, shouldAutoRefresh]);

  // Use global loading state for initial data fetch
  useEffect(() => {
    if (isLoadingProcesses || isLoadingApplications) {
      showGlobalLoading("Loading your applications...", "thinking");
    } else {
      hideGlobalLoading();
    }
  }, [isLoadingProcesses, isLoadingApplications, showGlobalLoading, hideGlobalLoading]);

  // Get selected process details
  const selectedProcess = processes?.find(p => p.id === selectedProcessId) || null;

  // Filter processes by search query
  const filteredProcesses = processes?.filter(process => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      process.companyName.toLowerCase().includes(query) ||
      process.position.toLowerCase().includes(query) ||
      process.status.toLowerCase().includes(query)
    );
  });
  
  // Filter applications by search query and status
  const filteredApplications = applications?.filter(app => {
    // First filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      // Get properties safely with fallbacks for different property formats
      const company = (app.companyName || app.company || '').toLowerCase();
      const title = (app.jobTitle || app.title || app.position || '').toLowerCase();
      const status = (app.status || '').toLowerCase();
      const location = (app.jobLocation || app.location || '').toLowerCase();
      
      // Check if any field matches the search query
      const companyMatch = company.includes(query);
      const titleMatch = title.includes(query);
      const statusMatch = status.includes(query);
      const locationMatch = location.includes(query);
      
      if (!(companyMatch || titleMatch || statusMatch || locationMatch)) {
        return false;
      }
    }
    
    // Then filter by status if a status filter is set
    if (statusFilter && app.status !== statusFilter) {
      return false;
    }
    
    return true;
  }) || [];

  // Group processes by status for dashboard view
  const activeProcesses = processes?.filter(p => 
    p.status !== 'Completed' && 
    p.status !== 'Rejected' && 
    p.status !== 'Not Selected' && 
    p.status !== 'Hired'
  ) || [];
  const completedProcesses = processes?.filter(p => 
    p.status === 'Completed' || 
    p.status === 'Rejected' || 
    p.status === 'Not Selected' || 
    p.status === 'Hired'
  ) || [];

  // Function to view/edit a process (which is actually an application in our adapter)
  const handleViewProcess = (processId: number) => {
    // In our adapter, processId is actually applicationId
    const applicationId = processId;
    
    console.log(`View application request for process/application ID: ${applicationId}`);
    
    // Set the selected application ID
    setSelectedApplicationId(applicationId);
    
    // Switch to applications tab to show details
    setActiveTab('applications');
  };
  
  const renderProcessCard = (process: InterviewProcess, index: number) => {
    // Determine card background color based on status
    const isRejected = process.status === 'Not Selected';
    const isHired = process.status === 'Hired';
    
    return (
      <motion.div
        variants={listItem}
        initial="hidden"
        animate="visible"
        key={process.id}
      >
        <Card 
          className={`cursor-pointer transition-colors hover:bg-accent/50 ${
            selectedProcessId === process.id ? 'border-primary' : ''
          } ${isRejected ? 'bg-red-100/70' : ''} ${isHired ? 'bg-green-100/70' : ''}`}
          onClick={() => setSelectedProcessId(process.id)}
        >
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{process.companyName}</CardTitle>
              <InterviewProcessStatusBadge status={process.status} />
            </div>
            <CardDescription>{process.position}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="h-3 w-3 mr-1" />
              {new Date(process.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };
  
  // Render a job application card
  const renderApplicationCard = (application: JobApplication, index: number) => {
    // Create a function that captures the application ID in a closure
    const handleCardClick = () => {
      console.log("Card clicked, setting selectedApplicationId to:", application.id);
      // Explicitly disable auto-refresh before setting ID
      setSelectedApplicationId(application.id);
      // Verify the selection happened
      console.log("Selection should now be:", application.id);
      setTimeout(() => {
        console.log("After setState, selectedApplicationId is now:", selectedApplicationId);
      }, 10);
    };

    return (
      <motion.div
        variants={listItem}
        initial="hidden"
        animate="visible"
        key={application.id}
        className="md:w-full"
      >
        <ApplicationCard 
          application={application}
          isSelected={selectedApplicationId === application.id}
          onClick={handleCardClick}
          onEditSuccess={() => queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] })}
        />
      </motion.div>
    );
  };

  // Loading skeleton
  const ProcessCardSkeleton = () => (
    <Card className="cursor-pointer">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-36 mt-2" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  );

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="container mx-auto py-6 space-y-6"
    >
      <motion.div 
        variants={subtleUp}
        className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0"
      >
        <div>
          <h1 className="text-2xl font-bold">Application Tracker</h1>
          <p className="text-muted-foreground">Manage your job applications from first save to final offer</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </motion.div>

      {/* Tabs navigation */}
      <motion.div variants={subtleUp} className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-md mx-auto">
            <TabsTrigger value="applications" className="flex-1">
              <Briefcase className="h-4 w-4 mr-2" />
              All Applications
            </TabsTrigger>
            <TabsTrigger value="job_search" className="flex-1">
              <Search className="h-4 w-4 mr-2" />
              Find Jobs
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex-1">
              <Timeline className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex-1">
              <BookOpenText className="h-4 w-4 mr-2" />
              Practice
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Job Search Tab */}
      {activeTab === 'job_search' && (
        <motion.div variants={fadeIn} className="container mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-medium">Find Jobs</h2>
                <p className="text-sm text-muted-foreground">Search for jobs and start applying</p>
              </div>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <AdzunaJobSearch 
                  onSelectJob={(jobInfo) => {
                    // When a job is selected from search results
                    // Store the job info and open the application wizard with pre-filled job info
                    setSelectedJobInfo(jobInfo);
                    setShowApplyWizard(true);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
      
      {/* Timeline View - Full Width */}
      {activeTab === 'dashboard' && (
        <motion.div variants={fadeIn} className="container mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-medium">Interview Process Timeline</h2>
                <p className="text-sm text-muted-foreground">Visualize your interview journey</p>
              </div>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {isLoadingProcesses ? (
                  <div className="py-4">
                    <LoadingState 
                      message="Loading interview stages..." 
                      size="sm" 
                      variant="card" 
                      className="w-full rounded-lg"
                    />
                  </div>
                ) : (
                  <HorizontalTimelineSection 
                    processes={filteredProcesses || []} 
                    onEditProcess={handleViewProcess}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* All Processes & Practice Views - Full Width */}
      {activeTab !== 'dashboard' && activeTab !== 'job_search' && (
        <div className="space-y-6">
          <div className="space-y-4">
            {/* Search Input - Only for Applications and Practice */}
            <motion.div variants={subtleUp} className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search company, position, or status..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>

            <div className="space-y-3">
              {activeTab === 'applications' && (
                <>
                  {isLoadingApplications ? (
                    <div className="py-6">
                      <LoadingState 
                        message="Loading applications..." 
                        size="md" 
                        variant="card" 
                        className="w-full rounded-lg"
                      />
                    </div>
                  ) : applications && applications.length > 0 ? (
                    <div className={`grid grid-cols-1 ${selectedApplication ? 'md:grid-cols-7' : 'md:grid-cols-1'} gap-6`}>
                      {/* Left column: Applications list - always visible but width changes */}
                      <div className={selectedApplication ? "md:col-span-3" : "md:col-span-1"}>
                        <motion.div variants={listContainer} initial="hidden" animate="visible" className="space-y-6">
                          {/* Active section */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium flex items-center">
                                <Briefcase className="h-4 w-4 mr-2" />
                                Active Applications
                              </h3>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowApplyWizard(true)}
                                className="text-xs"
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                New Application
                              </Button>
                            </div>
                            
                            {/* Status filter buttons */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Button
                                variant={statusFilter === null ? "secondary" : "outline"}
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setStatusFilter(null)}
                              >
                                All
                              </Button>
                              <Button
                                variant={statusFilter === "In Progress" ? "secondary" : "outline"}
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setStatusFilter("In Progress")}
                              >
                                <ApplicationStatusBadge status="In Progress" showIcon={false} className="border-none bg-transparent hover:bg-transparent p-0" />
                              </Button>
                              <Button
                                variant={statusFilter === "Applied" ? "secondary" : "outline"}
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setStatusFilter("Applied")}
                              >
                                <ApplicationStatusBadge status="Applied" showIcon={false} className="border-none bg-transparent hover:bg-transparent p-0" />
                              </Button>
                              <Button
                                variant={statusFilter === "Interviewing" ? "secondary" : "outline"}
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setStatusFilter("Interviewing")}
                              >
                                <ApplicationStatusBadge status="Interviewing" showIcon={false} className="border-none bg-transparent hover:bg-transparent p-0" />
                              </Button>
                              <Button
                                variant={statusFilter === "Offer" ? "secondary" : "outline"}
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setStatusFilter("Offer")}
                              >
                                <ApplicationStatusBadge status="Offer" showIcon={false} className="border-none bg-transparent hover:bg-transparent p-0" />
                              </Button>
                              <Button
                                variant={statusFilter === "Rejected" ? "secondary" : "outline"}
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setStatusFilter("Rejected")}
                              >
                                <ApplicationStatusBadge status="Rejected" showIcon={false} className="border-none bg-transparent hover:bg-transparent p-0" />
                              </Button>
                              {statusFilter && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => setStatusFilter(null)}
                                >
                                  <FilterX className="h-3.5 w-3.5 mr-1" />
                                  Clear
                                </Button>
                              )}
                            </div>
                            
                            {filteredApplications.filter(app => 
                              app.status !== 'Offer' && 
                              app.status !== 'Rejected'
                            ).length > 0 ? (
                              <div className="grid grid-cols-1 gap-3 mt-4">
                                {filteredApplications
                                  .filter(app => 
                                    app.status !== 'Offer' && 
                                    app.status !== 'Rejected'
                                  )
                                  .map((app, index) => renderApplicationCard(app, index))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-center py-6">
                                {statusFilter ? 'No applications matching the selected filter' : 'No active applications'}
                              </p>
                            )}
                          </div>
                          
                          {/* Completed applications section */}
                          <div className="space-y-3 pt-2">
                            <h3 className="font-medium flex items-center">
                              <Check className="h-4 w-4 mr-2" />
                              Completed Applications
                            </h3>
                            {filteredApplications.filter(app => 
                              app.status === 'Offer' || 
                              app.status === 'Rejected'
                            ).length > 0 ? (
                              <div className="grid grid-cols-1 gap-3">
                                {filteredApplications
                                  .filter(app => 
                                    app.status === 'Offer' || 
                                    app.status === 'Rejected'
                                  )
                                  .map((app, index) => renderApplicationCard(app, index))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-center py-6">No completed applications</p>
                            )}
                          </div>
                        </motion.div>
                      </div>
                      
                      {/* Right column: Application details - only visible when an application is selected */}
                      {selectedApplication && (
                        <div className="md:col-span-4">
                          <motion.div 
                            variants={fadeIn}
                            className="w-full h-full"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                          >
                            {/* Debug info for selection */}
                            <div className="bg-amber-100 border border-amber-300 rounded mb-2 p-2 text-xs text-amber-800">
                              Debug: selectedApplicationId: {selectedApplicationId ? selectedApplicationId : 'null'} | 
                              Applications: {applications?.length || 0} | Auto-refresh: {shouldAutoRefresh ? 'Yes' : 'No'}
                            </div>
                            
                            <ApplicationDetails 
                              application={selectedApplication}
                              onClose={() => setSelectedApplicationId(null)}
                              onDelete={() => setSelectedApplicationId(null)}
                              onStatusChange={(applicationId, newStatus) => {
                                console.log(`Status change handler called for application ${applicationId} to status ${newStatus}`);
                                // Update the application status in localStorage
                                syncApplicationToLocalStorage(applicationId, { status: newStatus });
                              }}
                            />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <motion.div variants={fadeIn} className="text-center py-8">
                      <div className="mx-auto flex flex-col items-center justify-center space-y-4">
                        <div className="rounded-full bg-muted p-3">
                          <Briefcase className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold tracking-tight">No applications yet</h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Get started by creating your first job application or searching for jobs.
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button onClick={() => setShowApplyWizard(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Application
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setActiveTab('job_search')}
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Search for Jobs
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              {activeTab === 'practice' && (
                <motion.div variants={fadeIn} className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-medium">Select an Application</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a job application to practice for. We'll generate relevant interview questions based on the job description.
                    </p>

                    {isLoadingProcesses ? (
                      <div className="py-4">
                        <LoadingState 
                          message="Loading practice interviews..." 
                          size="sm" 
                          variant="card"
                          mascotAction="thinking"
                          className="w-full rounded-lg"
                        />
                      </div>
                    ) : processes && processes.length > 0 ? (
                      <motion.div 
                        variants={listContainer} 
                        initial="hidden" 
                        animate="visible" 
                        className="space-y-6 mt-4"
                      >
                        {/* Active processes for practice */}
                        <div className="space-y-3">
                          <h3 className="font-medium flex items-center text-sm">
                            <Briefcase className="h-4 w-4 mr-2" />
                            Active Applications
                          </h3>
                          
                          {activeProcesses.length > 0 ? (
                            <div className="space-y-3">
                              {activeProcesses.map((process, index) => (
                                <motion.div variants={listItem} key={process.id}>
                                  <Card 
                                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${process.status === 'Not Selected' ? 'bg-red-100/70' : process.status === 'Hired' ? 'bg-green-100/70' : ''}`}
                                    onClick={() => setSelectedProcessId(process.id)}
                                  >
                                    <CardHeader className="p-4 pb-2">
                                      <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">{process.companyName}</CardTitle>
                                        <InterviewProcessStatusBadge status={process.status} />
                                      </div>
                                      <CardDescription>{process.position}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                          <CalendarDays className="h-3 w-3 mr-1" />
                                          {new Date(process.createdAt).toLocaleDateString()}
                                        </div>
                                        <Button 
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPracticeProcessId(process.id);
                                            setShowPracticeSession(true);
                                          }}
                                        >
                                          Practice
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-2">No active processes</p>
                          )}
                        </div>
                        
                        {/* Completed processes for practice */}
                        <div className="space-y-3">
                          <h3 className="font-medium flex items-center text-sm">
                            <Check className="h-4 w-4 mr-2" />
                            Completed Applications
                          </h3>
                          
                          {completedProcesses.length > 0 ? (
                            <div className="space-y-3">
                              {completedProcesses.map((process, index) => (
                                <motion.div variants={listItem} key={process.id}>
                                  <Card 
                                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${process.status === 'Not Selected' ? 'bg-red-100/70' : process.status === 'Hired' ? 'bg-green-100/70' : ''}`}
                                    onClick={() => setSelectedProcessId(process.id)}
                                  >
                                    <CardHeader className="p-4 pb-2">
                                      <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">{process.companyName}</CardTitle>
                                        <InterviewProcessStatusBadge status={process.status} />
                                      </div>
                                      <CardDescription>{process.position}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                          <CalendarDays className="h-3 w-3 mr-1" />
                                          {new Date(process.createdAt).toLocaleDateString()}
                                        </div>
                                        <Button 
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPracticeProcessId(process.id);
                                            setShowPracticeSession(true);
                                          }}
                                        >
                                          Practice
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-2">No completed processes</p>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div variants={fadeIn} className="text-center py-8">
                        <p className="text-muted-foreground">No applications found.</p>
                        <Button 
                          variant="link" 
                          onClick={() => {
                            setActiveTab('applications');
                            setShowCreateForm(true);
                          }}
                          className="mt-2"
                        >
                          Create an application first
                        </Button>
                      </motion.div>
                    )}
                  </div>

                  <motion.div 
                    variants={subtleUp}
                    className="text-center border-t pt-6 mt-6"
                  >
                    <h3 className="font-medium">General Interview Practice</h3>
                    <p className="text-muted-foreground mt-2">
                      Practice common interview questions and improve your skills without selecting a specific job.
                    </p>
                    <Button 
                      className="mt-4"
                      onClick={() => {
                        setPracticeProcessId(null);
                        setShowPracticeSession(true);
                      }}
                    >
                      Start General Practice
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>

          <motion.div 
            variants={fadeIn}
            className="w-full"
          >
            {activeTab === 'practice' ? null : selectedProcess ? (
              <InterviewProcessDetails process={selectedProcess} />
            ) : (
              <Card className="h-full flex flex-col items-center justify-center p-8 text-center">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Application Selected</h3>
                  <p className="text-muted-foreground max-w-md mt-2">
                    Select an application from the list to view details, or create a new one to start tracking your job application journey.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Application
                  </Button>
                </motion.div>
              </Card>
            )}
          </motion.div>
        </div>
      )}

      <NewInterviewProcessForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />

      {/* Practice Session Dialog */}
      <GamePracticeSession
        isOpen={showPracticeSession}
        onClose={() => setShowPracticeSession(false)}
        process={processes?.find(p => p.id === practiceProcessId) || undefined}
      />
      
      {/* Apply Wizard Dialog */}
      <ApplyWizard 
        isOpen={showApplyWizard}
        onClose={() => {
          setShowApplyWizard(false);
          setSelectedJobInfo(null); // Clear selected job when closing
        }}
        jobInfo={selectedJobInfo}
      />
    </motion.div>
  );
};

export default Interview;