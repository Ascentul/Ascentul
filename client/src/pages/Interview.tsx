import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NewInterviewProcessForm } from '@/components/interview/NewInterviewProcessForm';
import { InterviewProcessDetails } from '@/components/interview/InterviewProcessDetails';
import { type InterviewProcess } from '@shared/schema';

const Interview = () => {
  const [activeTab, setActiveTab] = useState('processes');
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch interview processes
  const { data: processes, isLoading } = useQuery<InterviewProcess[]>({
    queryKey: ['/api/interview/processes'],
    placeholderData: [],
  });

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
  const activeProcesses = processes?.filter(p => p.status !== 'Completed' && p.status !== 'Rejected') || [];
  const completedProcesses = processes?.filter(p => p.status === 'Completed' || p.status === 'Rejected') || [];

  const renderProcessCard = (process: InterviewProcess) => {
    return (
      <Card 
        key={process.id}
        className={`cursor-pointer transition-colors hover:bg-accent/50 ${
          selectedProcessId === process.id ? 'border-primary' : ''
        }`}
        onClick={() => setSelectedProcessId(process.id)}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base">{process.companyName}</CardTitle>
            <StatusBadge status={process.status} />
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
    );
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'In Progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600">{status}</Badge>;
      case 'Completed':
        return <Badge className="bg-green-500 hover:bg-green-600">{status}</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-500 hover:bg-red-600">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Interview Tracker</h1>
          <p className="text-muted-foreground">Manage your job applications and interviews</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Interview Process
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="processes" className="flex-1">
                <Briefcase className="h-4 w-4 mr-2" />
                All Processes
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex-1">
                <ListChecks className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="practice" className="flex-1">
                <BookOpenText className="h-4 w-4 mr-2" />
                Practice
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="w-full">
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
          </div>

          <div className="space-y-3">
            {activeTab === 'processes' && (
              <>
                {isLoading ? (
                  <>
                    <ProcessCardSkeleton />
                    <ProcessCardSkeleton />
                    <ProcessCardSkeleton />
                  </>
                ) : filteredProcesses && filteredProcesses.length > 0 ? (
                  filteredProcesses.map(renderProcessCard)
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No interview processes found.</p>
                    <Button 
                      variant="link" 
                      onClick={() => setShowCreateForm(true)}
                      className="mt-2"
                    >
                      Create your first interview process
                    </Button>
                  </div>
                )}
              </>
            )}

            {activeTab === 'dashboard' && (
              <>
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Active Processes ({activeProcesses.length})
                  </h3>
                  {isLoading ? (
                    <>
                      <ProcessCardSkeleton />
                      <ProcessCardSkeleton />
                    </>
                  ) : activeProcesses.length > 0 ? (
                    activeProcesses.map(renderProcessCard)
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No active processes</p>
                  )}
                </div>

                <div className="space-y-3 mt-6">
                  <h3 className="font-medium flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    Completed Processes ({completedProcesses.length})
                  </h3>
                  {isLoading ? (
                    <ProcessCardSkeleton />
                  ) : completedProcesses.length > 0 ? (
                    completedProcesses.map(renderProcessCard)
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No completed processes</p>
                  )}
                </div>
              </>
            )}

            {activeTab === 'practice' && (
              <div className="text-center py-8">
                <h3 className="font-medium">Interview Practice</h3>
                <p className="text-muted-foreground mt-2">
                  Practice common interview questions and improve your skills.
                </p>
                <Button className="mt-4">
                  Start Practice Session
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedProcess ? (
            <InterviewProcessDetails process={selectedProcess} />
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-8 text-center">
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
            </Card>
          )}
        </div>
      </div>

      <NewInterviewProcessForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />
    </div>
  );
};

export default Interview;