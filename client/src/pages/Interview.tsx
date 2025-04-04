import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { InterviewProcessStatusBadge } from '@/components/interview/InterviewProcessStatusBadge';
import { NewInterviewProcessForm } from '@/components/interview/NewInterviewProcessForm';
import { InterviewProcessDetails } from '@/components/interview/InterviewProcessDetails';
import { GamePracticeSession } from '@/components/interview/GamePracticeSession';
import { HorizontalTimeline, StageDetailsDialog } from '@/components/interview/HorizontalTimeline';
import { type InterviewProcess, type InterviewStage } from '@shared/schema';
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
  
  // Fetch stages for all processes
  const { data: allStages, isLoading } = useQuery<Record<number, InterviewStage[]>>({
    queryKey: ['/api/interview/stages'],
    queryFn: async () => {
      // Create a map of process ID -> stages array
      const stagesMap: Record<number, InterviewStage[]> = {};
      
      // Fetch stages for each process
      if (processes.length > 0) {
        for (const process of processes) {
          try {
            const response = await apiRequest('GET', `/api/interview/processes/${process.id}/stages`);
            const stagesData = await response.json();
            console.log(`Fetched stages for process ${process.id}:`, stagesData);
            stagesMap[process.id] = stagesData;
          } catch (error) {
            console.error(`Error fetching stages for process ${process.id}:`, error);
            stagesMap[process.id] = [];
          }
        }
      }
      
      return stagesMap;
    },
    enabled: processes !== undefined && processes.length > 0,
    placeholderData: {},
    refetchOnWindowFocus: true
  });
  
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
      // Invalidate stages query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/interview/stages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
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
    setSelectedProcessId(processId);
    setSelectedStageId(stageId);
    
    // Find the selected stage
    const stage = allStages && allStages[processId]?.find(s => s.id === stageId);
    if (stage) {
      setSelectedStage(stage);
      setIsStageDialogOpen(true);
    }
  };
  
  // Handle saving changes to a stage
  const handleSaveStage = (updatedStage: Partial<InterviewStage>) => {
    if (selectedStageId) {
      updateStageMutation.mutate(updatedStage);
    }
  };
  
  return (
    <div className="space-y-6">
      {isLoading ? (
        <LoadingState 
          message="Loading interview stages..." 
          size="md" 
          variant="card" 
          className="w-full p-6 rounded-lg"
        />
      ) : !processes.length ? (
        <div className="text-center p-8 border rounded-lg bg-muted/30">
          <h3 className="text-lg font-medium mb-2">No interview processes found</h3>
          <p className="text-muted-foreground mb-4">Create a new interview process to get started.</p>
        </div>
      ) : !allStages || Object.keys(allStages).length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/30">
          <h3 className="text-lg font-medium mb-2">No interview stages found</h3>
          <p className="text-muted-foreground mb-4">Add interview stages to your processes to track your progress.</p>
        </div>
      ) : (
        <>
          <HorizontalTimeline 
            processes={processes}
            stages={allStages}
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
      )}
    </div>
  );
};

const Interview = () => {
  const [activeTab, setActiveTab] = useState('processes');
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPracticeSession, setShowPracticeSession] = useState(false);
  const [practiceProcessId, setPracticeProcessId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
  const { data: processes, isLoading } = useQuery<InterviewProcess[]>({
    queryKey: ['/api/interview/processes'],
    placeholderData: [],
  });

  // Use global loading state for initial data fetch
  useEffect(() => {
    if (isLoading) {
      showGlobalLoading("Loading your interview processes...", "thinking");
    } else {
      hideGlobalLoading();
    }
  }, [isLoading, showGlobalLoading, hideGlobalLoading]);

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

  // Function to view/edit a process, passed to the HorizontalTimelineSection
  const handleViewProcess = (processId: number) => {
    setSelectedProcessId(processId);
    setActiveTab('processes'); // Switch to processes tab to show details
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
          <h1 className="text-2xl font-bold">Interview Tracker</h1>
          <p className="text-muted-foreground">Manage your job applications and interviews</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Interview Process
        </Button>
      </motion.div>

      {/* Tabs navigation */}
      <motion.div variants={subtleUp} className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-md mx-auto">
            <TabsTrigger value="processes" className="flex-1">
              <Briefcase className="h-4 w-4 mr-2" />
              All Processes
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
                {isLoading ? (
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

      {/* All Processes & Practice Views - Two Columns */}
      {activeTab !== 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {/* Search Input - Only for Processes and Practice */}
            <motion.div variants={subtleUp} className="w-full">
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
              {activeTab === 'processes' && (
                <>
                  {isLoading ? (
                    <div className="py-6">
                      <LoadingState 
                        message="Loading interview processes..." 
                        size="md" 
                        variant="card" 
                        className="w-full rounded-lg"
                      />
                    </div>
                  ) : filteredProcesses && filteredProcesses.length > 0 ? (
                    <motion.div variants={listContainer} initial="hidden" animate="visible" className="space-y-6">
                      {/* Active section */}
                      <div className="space-y-3">
                        <h3 className="font-medium flex items-center">
                          <Briefcase className="h-4 w-4 mr-2" />
                          Active Interview Processes
                        </h3>
                        {filteredProcesses.filter(p => 
                          p.status !== 'Completed' && 
                          p.status !== 'Rejected' && 
                          p.status !== 'Not Selected' && 
                          p.status !== 'Hired'
                        ).length > 0 ? (
                          <div className="space-y-3">
                            {filteredProcesses
                              .filter(p => 
                                p.status !== 'Completed' && 
                                p.status !== 'Rejected' && 
                                p.status !== 'Not Selected' && 
                                p.status !== 'Hired'
                              )
                              .map((process, index) => renderProcessCard(process, index))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-2">No active processes</p>
                        )}
                      </div>
                      
                      {/* Completed section */}
                      <div className="space-y-3 pt-2">
                        <h3 className="font-medium flex items-center">
                          <Check className="h-4 w-4 mr-2" />
                          Completed Interview Processes
                        </h3>
                        {filteredProcesses.filter(p => 
                          p.status === 'Completed' || 
                          p.status === 'Rejected' || 
                          p.status === 'Not Selected' || 
                          p.status === 'Hired'
                        ).length > 0 ? (
                          <div className="space-y-3">
                            {filteredProcesses
                              .filter(p => 
                                p.status === 'Completed' || 
                                p.status === 'Rejected' || 
                                p.status === 'Not Selected' || 
                                p.status === 'Hired'
                              )
                              .map((process, index) => renderProcessCard(process, index))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-2">No completed processes</p>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div variants={fadeIn} className="text-center py-8">
                      <p className="text-muted-foreground">No interview processes found.</p>
                      <Button 
                        variant="link" 
                        onClick={() => setShowCreateForm(true)}
                        className="mt-2"
                      >
                        Create your first interview process
                      </Button>
                    </motion.div>
                  )}
                </>
              )}

              {activeTab === 'practice' && (
                <motion.div variants={fadeIn} className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-medium">Select an Interview Process</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose an interview process to practice for. We'll generate relevant questions based on the job description.
                    </p>

                    {isLoading ? (
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
                            Active Processes
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
                            Completed Processes
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
                        <p className="text-muted-foreground">No interview processes found.</p>
                        <Button 
                          variant="link" 
                          onClick={() => {
                            setActiveTab('processes');
                            setShowCreateForm(true);
                          }}
                          className="mt-2"
                        >
                          Create an interview process first
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
            className="lg:col-span-2"
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
                  <h3 className="text-lg font-medium">No Process Selected</h3>
                  <p className="text-muted-foreground max-w-md mt-2">
                    Select an interview process from the list to view details, or create a new one to start tracking your interview journey.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Process
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
    </motion.div>
  );
};

export default Interview;