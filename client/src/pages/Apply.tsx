import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SiLinkedin } from 'react-icons/si';
import { Briefcase, ExternalLink, Search } from 'lucide-react';
import { LinkedInJobSearch } from '@/components/apply/LinkedInJobSearch';
import { LinkedInFrame } from '@/components/apply/LinkedInFrame';
import { ApplicationAssistant } from '@/components/apply/ApplicationAssistant';

export default function Apply() {
  // State for LinkedIn search and frame
  const [linkedInUrl, setLinkedInUrl] = useState<string>('');
  const [isLinkedInFrameOpen, setIsLinkedInFrameOpen] = useState(false);
  
  // State for AI assistant
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<{
    title: string;
    company: string;
    description: string;
  } | null>(null);

  // Handle selecting a job from the search
  const handleSelectJob = (jobInfo: { title: string; company: string; url: string }) => {
    setLinkedInUrl(jobInfo.url);
    
    // Extract job information from the URL for the AI assistant
    const jobTitle = jobInfo.title || decodeURIComponent(jobInfo.url.split('keywords=')[1]?.split('&')[0] || 'Job Position');
    
    // Set the selected job information
    setSelectedJob({
      title: jobTitle,
      company: 'LinkedIn',
      description: 'This is a job found on LinkedIn. For more details, please view the job posting directly on LinkedIn.'
    });
    
    // Due to LinkedIn's iframe restrictions, we'll open in a new tab by default
    window.open(jobInfo.url, '_blank', 'noopener,noreferrer');
  };

  // Handle opening LinkedIn in the iframe
  const handleOpenLinkedIn = (url: string) => {
    setLinkedInUrl(url);
    setIsLinkedInFrameOpen(true);
  };

  // Handle job selection from the LinkedIn frame
  const handleJobSelection = (jobInfo: { title: string; company: string; description: string }) => {
    setSelectedJob(jobInfo);
    setIsLinkedInFrameOpen(false);
    setIsAIAssistantOpen(true);
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Application Agent</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find and Apply for Jobs
            </CardTitle>
            <CardDescription>
              Search for jobs, get AI-powered application assistance, and apply with confidence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="linkedin" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="linkedin" className="flex items-center gap-1">
                  <SiLinkedin className="text-[#0A66C2]" />
                  LinkedIn Jobs
                </TabsTrigger>
                <TabsTrigger value="tracked" className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  Tracked Applications
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="linkedin">
                <LinkedInJobSearch 
                  onSelectJob={handleSelectJob}
                  onOpenLinkedIn={handleOpenLinkedIn}
                />
                
                {/* Display selected job information */}
                {selectedJob && (
                  <div className="mt-8 border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">{selectedJob.title}</h3>
                    <p className="text-gray-600">{selectedJob.company}</p>
                    <div className="mt-4 flex gap-4">
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-1"
                        onClick={() => window.open(linkedInUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Apply on LinkedIn
                      </Button>
                      <Button
                        onClick={() => setIsAIAssistantOpen(true)}
                        className="flex items-center gap-1"
                      >
                        Get AI Application Help
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="tracked">
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No tracked applications yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start searching for jobs and tracking your applications to see them here
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => document.querySelector('button[value="linkedin"]')?.click()}
                  >
                    Find Jobs on LinkedIn
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* LinkedIn Frame Component */}
      <LinkedInFrame 
        isOpen={isLinkedInFrameOpen}
        onClose={() => setIsLinkedInFrameOpen(false)}
        jobUrl={linkedInUrl}
        onSelectJob={handleJobSelection}
      />

      {/* Application Assistant Component */}
      <ApplicationAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        jobTitle={selectedJob?.title}
        companyName={selectedJob?.company}
        jobDescription={selectedJob?.description}
      />
    </div>
  );
}