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
  Activity as ActivityIcon,
  User as UserIcon,
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
  // Implementation omitted for brevity
  return <div>Horizontal Timeline</div>;
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const subtleUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const listContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// Main component
interface InterviewProps {
  practice?: boolean;
}

const Interview = ({ practice = false }: InterviewProps) => {
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('applications');
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [shouldAutoRefresh, setShouldAutoRefresh] = useState(true);
  const [showPracticeSession, setShowPracticeSession] = useState(false);
  const [practiceProcessId, setPracticeProcessId] = useState<number | null>(null);
  const [showApplyWizard, setShowApplyWizard] = useState(false);
  const [selectedJobInfo, setSelectedJobInfo] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch interview processes
  const { data: processes, isLoading: isLoadingProcesses } = useQuery<InterviewProcess[]>({
    queryKey: ['/api/interview/processes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/interview/processes');
      if (!response.ok) {
        throw new Error('Failed to fetch interview processes');
      }
      return response.json();
    },
    refetchInterval: shouldAutoRefresh ? 30000 : false, // auto-refresh every 30 seconds
  });

  // Fetch job applications
  const { data: applications, isLoading: isLoadingApplications } = useQuery<JobApplication[]>({
    queryKey: ['/api/apply/applications'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/apply/applications');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      return response.json();
    },
  });

  // Filter applications based on search query and status filter
  const filteredApplications = applications?.filter(app => {
    const matchesSearch = 
      app.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.status?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter ? app.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Filter processes by active/completed status
  const activeProcesses = processes?.filter(process => process.status !== 'Completed') || [];
  const completedProcesses = processes?.filter(process => process.status === 'Completed') || [];
  
  // Selected process for detail view
  const selectedProcess = processes?.find(p => p.id === selectedProcessId) || null;

  // When an application is selected, fetch its details
  useEffect(() => {
    if (selectedApplicationId) {
      const app = applications?.find(a => a.id === selectedApplicationId);
      setSelectedApplication(app || null);
    } else {
      setSelectedApplication(null);
    }
  }, [selectedApplicationId, applications]);

  // Application card renderer
  const renderApplicationCard = (application: JobApplication, index: number) => {
    return (
      <ApplicationCard
        key={application.id}
        application={application}
        isSelected={selectedApplicationId === application.id}
        onClick={() => setSelectedApplicationId(application.id)}
      />
    );
  };

  // Process card renderer
  const renderProcessCard = (process: InterviewProcess, index: number) => {
    return (
      <motion.div
        variants={listItem}
        key={process.id}
        className={`border rounded-lg p-4 ${
          selectedProcessId === process.id ? "border-primary bg-primary/5" : "border-border"
        } hover:border-primary/50 transition-colors cursor-pointer`}
        onClick={() => setSelectedProcessId(process.id)}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">{process.company}</h4>
          <InterviewProcessStatusBadge status={process.status} />
        </div>
        <p className="text-sm text-muted-foreground mb-1">
          {process.position}
        </p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3 mr-1" />
            {new Date(process.createdAt).toLocaleDateString()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setPracticeProcessId(process.id);
              setShowPracticeSession(true);
            }}
          >
            <ActivityIcon className="h-3 w-3 mr-1" />
            Practice
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="container mx-auto py-6 space-y-6"
    >
      {/* Common Header for both modes */}
      <motion.div 
        variants={subtleUp}
        className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0"
      >
        <div>
          <h1 className="text-2xl font-bold">{practice ? "Interview Practice" : "Application Tracker"}</h1>
          <p className="text-muted-foreground">
            {practice 
              ? "Practice your interview skills with AI-generated questions and feedback" 
              : "Manage your job applications from first save to final offer"
            }
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {practice ? "New Practice Session" : "New Application"}
        </Button>
      </motion.div>

      {/* Conditional Content Container - Main Content Area */}
      {/* Either show Interview Practice or Application Tracker */}
      {practice ? (
        // Interview Practice Mode Content
        <div className="space-y-6">
          <div className="space-y-4">
            {/* Search Input */}
            <motion.div variants={subtleUp} className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search practices by company, position, or status..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>

            {/* Interview Practice Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column: Interview Practice List */}
              <div className="space-y-6">
                {isLoadingProcesses ? (
                  <div className="py-6">
                    <LoadingState
                      message="Loading practice sessions..."
                      size="md"
                      variant="card"
                      className="w-full rounded-lg"
                    />
                  </div>
                ) : (
                  <motion.div variants={listContainer} initial="hidden" animate="visible" className="space-y-6">
                    {/* Active sessions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center">
                          <ActivityIcon className="h-4 w-4 mr-2" />
                          Active Practice Sessions
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCreateForm(true)}
                          className="text-xs"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          New Practice
                        </Button>
                      </div>
                      
                      {activeProcesses.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {activeProcesses.map((process, index) => renderProcessCard(process, index))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-6">No active practice sessions</p>
                      )}
                    </div>
                    
                    {/* Completed sessions */}
                    {completedProcesses.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h3 className="font-medium flex items-center">
                          <Check className="h-4 w-4 mr-2" />
                          Completed Practice Sessions
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          {completedProcesses.map((process, index) => renderProcessCard(process, index))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Right column: Selected Practice Details */}
              <div>
                {selectedProcess ? (
                  <motion.div
                    variants={fadeIn}
                    className="w-full h-full"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <InterviewProcessDetails
                      process={selectedProcess}
                      onEdit={() => {}}
                      onStart={() => {
                        setPracticeProcessId(selectedProcess.id);
                        setShowPracticeSession(true);
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div variants={fadeIn} className="flex flex-col items-center justify-center h-full py-12">
                    <div className="text-center max-w-md">
                      <UserIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <h3 className="text-xl font-medium mb-2">Select a Practice Session</h3>
                      <p className="text-muted-foreground mb-6">
                        Select a practice session from the list or create a new one to get started.
                      </p>
                      <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Practice Session
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Application Tracker Mode Content
        <>
          {/* Tabs navigation - only show in Application Tracker mode */}
          <motion.div variants={subtleUp} className="mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full max-w-md mx-auto">
                <TabsTrigger value="applications" className="flex-1">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Application Tracker
                </TabsTrigger>
                <TabsTrigger value="job_search" className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  Find Jobs
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
          
          {/* Job Search Tab - Only shown in Application Tracker mode */}
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
            
          {/* Applications View - Only shown in Application Tracker mode */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Application related titles */}
                <motion.div variants={subtleUp}>
                  <h2 className="text-2xl font-semibold mb-2">Application Tracker</h2>
                  <p className="text-muted-foreground">Track and manage your job applications and interviews</p>
                </motion.div>
                
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
                  {/* Applications content */}
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
                            <ApplicationDetails 
                              application={selectedApplication}
                              onClose={() => setSelectedApplicationId(null)}
                              onRefresh={() => {
                                queryClient.invalidateQueries({ queryKey: ['/api/apply/applications'] });
                                setLastUpdated(Date.now());
                              }}
                            />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                      <h3 className="text-xl font-medium mb-2">No Applications Yet</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Start by adding your first job application or search for new opportunities.
                      </p>
                      <div className="flex gap-4 justify-center">
                        <Button onClick={() => setShowApplyWizard(true)}>
                          <Plus className="h-4 w-4 mr-2" /> 
                          Add Application
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab('job_search')}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Find Jobs
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialogs - shared between both modes */}
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