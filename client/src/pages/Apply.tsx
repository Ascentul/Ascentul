import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { FileEdit, Plus, Filter, Search, Calendar, CalendarRange } from 'lucide-react';
import { ApplicationCard } from '@/components/apply/ApplicationCard';
import { ApplicationDetails } from '@/components/apply/ApplicationDetails';
import { ApplyWizard } from '@/components/apply/ApplyWizard';
import { motion } from 'framer-motion';
import { type ApplicationStatus } from '@/components/apply/ApplicationStatusBadge';

// Mock data for applications (to be replaced with API call)
const mockApplications = [
  {
    id: 1,
    jobTitle: "Software Engineer",
    companyName: "TechCorp",
    jobLocation: "San Francisco, CA",
    applicationDate: "2025-04-10",
    status: "Applied",
    notes: "Applied via company website. Sent follow-up email on April 12th.",
    jobLink: "https://example.com/job-posting-1",
  },
  {
    id: 2,
    jobTitle: "Frontend Developer",
    companyName: "Innovate Inc",
    jobLocation: "Remote",
    applicationDate: "2025-04-15",
    status: "Interviewing",
    notes: "First round interview scheduled for April 20th. Need to prepare for technical questions on React and TypeScript.",
    jobLink: "https://example.com/job-posting-2",
  },
  {
    id: 3,
    jobTitle: "Full Stack Engineer",
    companyName: "StartupXYZ",
    jobLocation: "New York, NY",
    applicationDate: "2025-04-05",
    status: "Rejected",
    notes: "Received rejection email on April 15th. They went with a more experienced candidate.",
    jobLink: "https://example.com/job-posting-3",
  },
  {
    id: 4,
    jobTitle: "UX Developer",
    companyName: "DesignHub",
    jobLocation: "Austin, TX",
    applicationDate: "2025-04-18",
    status: "Not Started",
    notes: "Preparing tailored resume and cover letter for this position.",
    jobLink: "https://example.com/job-posting-4",
  },
  {
    id: 5,
    jobTitle: "Senior React Developer",
    companyName: "BigTech",
    jobLocation: "Seattle, WA",
    applicationDate: "2025-04-01",
    status: "Offer",
    notes: "Received offer on April 18th. Need to review contract and negotiate salary.",
    jobLink: "https://example.com/job-posting-5",
  },
];

export default function Apply() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isApplyWizardOpen, setIsApplyWizardOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // In real implementation, this would be a query to the API
  const { data: applications, isLoading } = useQuery({
    queryKey: ['/api/job-applications'],
    queryFn: async () => {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockApplications;
    },
  });

  // Filter applications based on selected status and search query
  const filteredApplications = applications?.filter((app) => {
    const matchesStatus = selectedStatus ? app.status === selectedStatus : true;
    const matchesSearch = searchQuery
      ? app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  // Get application counts by status
  const getStatusCount = (status: ApplicationStatus | null) => {
    if (!applications) return 0;
    return status 
      ? applications.filter(app => app.status === status).length 
      : applications.length;
  };

  // Handle card click to open details
  const handleApplicationClick = (application: any) => {
    setSelectedApplication(application);
    setIsDetailsOpen(true);
  };

  // Render application cards with loading state
  const renderApplications = () => {
    if (isLoading) {
      return Array(4).fill(0).map((_, i) => (
        <div key={i} className="mb-4">
          <Skeleton className="h-36 w-full rounded-md" />
        </div>
      ));
    }

    if (filteredApplications?.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileEdit className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No applications found</h3>
          <p className="text-muted-foreground mb-4">
            {selectedStatus || searchQuery 
              ? "Try changing your filters or search term" 
              : "Start by adding your first job application"}
          </p>
          <Button onClick={() => setIsApplyWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Application
          </Button>
        </div>
      );
    }

    return filteredApplications?.map((application) => (
      <ApplicationCard
        key={application.id}
        application={application}
        onClick={() => handleApplicationClick(application)}
        className="mb-4"
      />
    ));
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } }
  };
  
  const subtleUp = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-8">
      <motion.div 
        variants={subtleUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0"
      >
        <div>
          <h1 className="text-2xl font-bold">Application Agent</h1>
          <p className="text-muted-foreground">Manage your job applications and track their progress from start to finish</p>
        </div>
        <Button onClick={() => setIsApplyWizardOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar with filters and stats */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Filter Applications</CardTitle>
              <CardDescription>
                View applications by status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div 
                className={`px-3 py-2 rounded-md cursor-pointer transition-colors flex justify-between items-center ${!selectedStatus ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                onClick={() => setSelectedStatus(null)}
              >
                <span>All Applications</span>
                <span className="text-sm bg-muted px-2 py-0.5 rounded-md">{getStatusCount(null)}</span>
              </div>
              
              <div 
                className={`px-3 py-2 rounded-md cursor-pointer transition-colors flex justify-between items-center ${selectedStatus === 'Not Started' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                onClick={() => setSelectedStatus('Not Started')}
              >
                <span>Not Started</span>
                <span className="text-sm bg-muted px-2 py-0.5 rounded-md">{getStatusCount('Not Started')}</span>
              </div>
              
              <div 
                className={`px-3 py-2 rounded-md cursor-pointer transition-colors flex justify-between items-center ${selectedStatus === 'Applied' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                onClick={() => setSelectedStatus('Applied')}
              >
                <span>Applied</span>
                <span className="text-sm bg-muted px-2 py-0.5 rounded-md">{getStatusCount('Applied')}</span>
              </div>
              
              <div 
                className={`px-3 py-2 rounded-md cursor-pointer transition-colors flex justify-between items-center ${selectedStatus === 'Interviewing' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                onClick={() => setSelectedStatus('Interviewing')}
              >
                <span>Interviewing</span>
                <span className="text-sm bg-muted px-2 py-0.5 rounded-md">{getStatusCount('Interviewing')}</span>
              </div>
              
              <div 
                className={`px-3 py-2 rounded-md cursor-pointer transition-colors flex justify-between items-center ${selectedStatus === 'Offer' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                onClick={() => setSelectedStatus('Offer')}
              >
                <span>Offer</span>
                <span className="text-sm bg-muted px-2 py-0.5 rounded-md">{getStatusCount('Offer')}</span>
              </div>
              
              <div 
                className={`px-3 py-2 rounded-md cursor-pointer transition-colors flex justify-between items-center ${selectedStatus === 'Rejected' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                onClick={() => setSelectedStatus('Rejected')}
              >
                <span>Rejected</span>
                <span className="text-sm bg-muted px-2 py-0.5 rounded-md">{getStatusCount('Rejected')}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Statistics</CardTitle>
              <CardDescription>
                Your application metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Application Success Rate</div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '35%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>35% success rate</span>
                  <span>{getStatusCount('Offer')} offers / {getStatusCount(null)} applications</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Interview Success Rate</div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>60% interview rate</span>
                  <span>{getStatusCount('Interviewing') + getStatusCount('Offer')} interviews / {getStatusCount('Applied') + getStatusCount('Interviewing') + getStatusCount('Offer')} applications</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search applications..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStatus(null);
                  setSearchQuery("");
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
              
              <Button onClick={() => setIsApplyWizardOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Application
              </Button>
            </div>
          </div>

          {/* Applications list */}
          <div>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming Interviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {renderApplications()}
              </TabsContent>
              
              <TabsContent value="recent">
                <div className="text-center py-12">
                  <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">View applications from the last 7 days</p>
                </div>
              </TabsContent>
              
              <TabsContent value="upcoming">
                <div className="text-center py-12">
                  <CalendarRange className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">View upcoming interviews and deadlines</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Application Wizard Dialog */}
      <ApplyWizard 
        isOpen={isApplyWizardOpen} 
        onClose={() => setIsApplyWizardOpen(false)} 
      />

      {/* Application Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          {selectedApplication && (
            <ApplicationDetails 
              application={selectedApplication} 
              onClose={() => setIsDetailsOpen(false)} 
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}