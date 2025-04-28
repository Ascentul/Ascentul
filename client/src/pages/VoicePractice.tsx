import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Type definition for job applications
interface JobApplication {
  id: number | string;
  title?: string;
  jobTitle?: string;
  position?: string;
  company?: string;
  companyName?: string;
  description?: string;
  jobDescription?: string;
  status?: string;
}

export default function VoicePractice() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'listening', 'thinking', 'speaking'
  const [selectedApplication, setSelectedApplication] = useState<string>('');
  const [selectedJobDetails, setSelectedJobDetails] = useState<{
    title: string;
    company: string;
    description: string;
  } | null>(null);

  // Fetch job applications from the API
  const { data: applications, isLoading: isLoadingApplications } = useQuery<JobApplication[]>({
    queryKey: ['/api/job-applications'],
    queryFn: async () => {
      try {
        // First check localStorage for any saved applications
        const mockApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
        
        // Try to get server applications
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
            
            return mergedApps;
          }
          
          return Array.isArray(response) ? response : [];
        } catch (serverError) {
          // If server request fails, fall back to the localStorage applications
          console.log('Using mock job applications from localStorage due to server error');
          if (mockApplications.length > 0) {
            return mockApplications;
          }
          throw serverError; // Re-throw if no localStorage data available
        }
      } catch (error) {
        console.error('Error fetching job applications:', error);
        return [];
      }
    },
    staleTime: 60000, // Refresh every minute
  });

  // Filter applications to show only active ones
  const activeApplications = applications?.filter(app => 
    app.status === 'In Progress' || 
    app.status === 'Applied' || 
    app.status === 'Interviewing'
  ) || [];

  // Update selected job details when application selection changes
  useEffect(() => {
    if (selectedApplication && activeApplications.length > 0) {
      const selected = activeApplications.find(app => app.id.toString() === selectedApplication);
      if (selected) {
        setSelectedJobDetails({
          title: selected.title || selected.jobTitle || selected.position || 'Unknown Position',
          company: selected.company || selected.companyName || 'Unknown Company',
          description: selected.description || selected.jobDescription || ''
        });
      }
    } else {
      setSelectedJobDetails(null);
    }
  }, [selectedApplication, activeApplications]);

  const startRecording = () => {
    if (!selectedJobDetails) return;
    setIsRecording(true);
    setStatus('listening');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStatus('idle');
    // In a real implementation, this would trigger AI processing
    // and then set status to 'thinking' and later 'speaking'
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Voice Interview Practice</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Practice for your interviews</CardTitle>
          <CardDescription>
            Use voice commands to practice answering interview questions specific to your job applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="w-full max-w-md mb-8">
            <label className="block text-sm font-medium mb-2">Select Active Application</label>
            {isLoadingApplications ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div>
                <span className="ml-2 text-sm text-muted-foreground">Loading applications...</span>
              </div>
            ) : activeApplications.length === 0 ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No active applications</AlertTitle>
                <AlertDescription>
                  You must have an active application to start interview practice.
                  Go to the Application Tracker to create or update applications.
                </AlertDescription>
              </Alert>
            ) : (
              <Select 
                value={selectedApplication} 
                onValueChange={setSelectedApplication}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job to practice for" />
                </SelectTrigger>
                <SelectContent>
                  {activeApplications.map(app => (
                    <SelectItem key={app.id} value={app.id.toString()}>
                      {(app.title || app.jobTitle || app.position || 'Unknown Position')} at {(app.company || app.companyName || 'Unknown Company')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col items-center justify-center mt-6">
            <Button
              variant="default"
              size="lg"
              className={`w-40 h-40 rounded-full flex items-center justify-center transition-all ${
                isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
              }`}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={!selectedJobDetails || activeApplications.length === 0}
            >
              <Mic className="w-16 h-16" />
            </Button>
            <p className="mt-4 text-center text-lg font-medium">
              {!selectedJobDetails ? 'Select an application first' : (
                <>
                  {status === 'idle' && 'Hold to Speak'}
                  {status === 'listening' && <span className="text-green-500">Listening...</span>}
                  {status === 'thinking' && <span className="text-amber-500">Thinking...</span>}
                  {status === 'speaking' && <span className="text-blue-500">Speaking...</span>}
                </>
              )}
            </p>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              {!selectedJobDetails ? (
                activeApplications.length === 0 ? 
                  'Add active applications in the Application Tracker' : 
                  'Choose a job from the dropdown above'
              ) : (
                <>
                  {status === 'idle' && 'Press and hold the microphone button to start speaking'}
                  {status === 'listening' && 'Release the button when you finish speaking'}
                  {status === 'thinking' && 'AI is generating a response to your answer'}
                  {status === 'speaking' && 'AI is providing feedback on your answer'}
                </>
              )}
            </p>
          </div>
          
          <div className="mt-12 w-full max-w-md">
            <Card className="bg-muted/40">
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Tips:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Speak clearly and at a moderate pace</li>
                  <li>Select a specific job application for tailored practice</li>
                  <li>Try different types of questions to practice your skills</li>
                  <li>Review AI feedback to improve your interview performance</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversation History</CardTitle>
          <CardDescription>
            Your conversation with the AI interview assistant will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Start speaking to see your conversation
          </div>
        </CardContent>
      </Card>
    </div>
  );
}