import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Briefcase, ExternalLink, Search } from 'lucide-react';
import { AdzunaJobSearch } from '@/components/apply/AdzunaJobSearch';
import { ApplicationAssistant } from '@/components/apply/ApplicationAssistant';

export default function Apply() {
  // State for AI assistant
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<{
    title: string;
    company: string;
    description: string;
    url?: string;
  } | null>(null);

  // Handle selecting a job from the search
  const handleSelectJob = (jobInfo: { title: string; company: string; url: string; description: string }) => {
    // Set the selected job information
    setSelectedJob({
      title: jobInfo.title,
      company: jobInfo.company,
      description: jobInfo.description,
      url: jobInfo.url
    });
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
            <Tabs defaultValue="adzuna" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="adzuna" className="flex items-center gap-1">
                  <Search className="h-4 w-4" />
                  Job Search
                </TabsTrigger>
                <TabsTrigger value="tracked" className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  Tracked Applications
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="adzuna">
                <AdzunaJobSearch 
                  onSelectJob={handleSelectJob}
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
                        onClick={() => selectedJob.url && window.open(selectedJob.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Apply to Job
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
                    onClick={() => document.querySelector('button[value="adzuna"]')?.click()}
                  >
                    Find Jobs
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Job search component is now integrated directly in the page */}

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