import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Loader2, Search } from 'lucide-react';
import { AdzunaJob, JobSearchParams } from '@shared/adzuna';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ApplicationWizard } from './ApplicationWizard';

interface AdzunaJobSearchProps {
  onSelectJob?: (jobInfo: { title: string; company: string; url: string; description: string; location?: string }) => void;
}

export function AdzunaJobSearch({ onSelectJob }: AdzunaJobSearchProps) {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState<JobSearchParams>({
    keywords: '',
    location: '',
    remoteOnly: false,
  });
  const [searchHistory, setSearchHistory] = useState<Array<{ keywords: string; location: string; timestamp: Date }>>([]);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [searchResults, setSearchResults] = useState<AdzunaJob[]>([]);
  const [directIsLoading, setDirectIsLoading] = useState(false);

  // Reset search results when search params change
  useEffect(() => {
    setShouldFetch(false);
    setSearchResults([]);
  }, [searchParams]);

  // Log shouldFetch changes
  useEffect(() => {
    console.log('shouldFetch state changed to:', shouldFetch);
  }, [shouldFetch]);
  
  // Direct fetch function (alternative approach)
  const directFetch = useCallback(async () => {
    if (!searchParams.keywords) {
      toast({
        title: "Search Error",
        description: "Please enter keywords for your job search",
        variant: "destructive"
      });
      return;
    }
    
    setDirectIsLoading(true);
    console.log('Direct fetch initiated with params:', searchParams);
    
    try {
      const params = new URLSearchParams();
      params.append('keywords', searchParams.keywords);
      if (searchParams.location) {
        params.append('location', searchParams.location);
      }
      params.append('remoteOnly', searchParams.remoteOnly ? 'true' : 'false');
      
      // Important: Make sure this matches the server-side endpoint
      const endpointUrl = `/api/adzuna/jobs?${params.toString()}`;
      console.log('Directly fetching from:', endpointUrl);
      
      const timeout = setTimeout(() => {
        // Show a loading message if it's taking longer than expected
        toast({
          title: "Searching...",
          description: "This may take a moment to connect to the job database",
        });
      }, 3000);
      
      const response = await fetch(endpointUrl);
      console.log('Fetching from API using endpoint:', endpointUrl);
      clearTimeout(timeout);
      
      console.log('Direct fetch response status:', response.status);
      
      // Check if response is ok
      if (!response.ok) {
        let errorMessage = "Failed to fetch job listings";
        try {
          const errorData = await response.json();
          console.error('API error in direct fetch:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse as JSON, try plain text
          const errorText = await response.text();
          console.error('API error in direct fetch:', errorText);
          errorMessage = `${errorMessage}: ${errorText}`;
        }
        
        toast({
          title: "Search Error",
          description: "There was a problem with the job search service. Please try again later.",
          variant: "destructive"
        });
        throw new Error(errorMessage);
      }
      
      // Parse response data
      const data = await response.json();
      console.log('Direct fetch received data:', data);
      
      // Check if there's an error field in the response
      if (data.error) {
        toast({
          title: "Search Error",
          description: data.error || "Failed to fetch job listings",
          variant: "destructive"
        });
        throw new Error(data.error);
      }
      
      // Check if results exist and have items
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        setSearchResults(data.results);
        // Automatically switch to results tab when results are available
        setActiveTab('results');
        
        // Show success message with count
        toast({
          title: "Search Complete",
          description: `Found ${data.results.length} job listings matching your search`,
        });
      } else {
        // If no results, show a message
        setSearchResults([]);
        setActiveTab('results');
        toast({
          title: "No Results Found",
          description: "Try different keywords or location, or remove filters",
        });
      }
    } catch (error) {
      console.error('Direct fetch error:', error);
      // Error message already shown in the earlier try-catch
    } finally {
      setDirectIsLoading(false);
    }
  }, [searchParams, toast]);
  
  // Fetch jobs from Adzuna API
  const { isLoading: queryIsLoading, data, error } = useQuery({
    queryKey: ['jobs', searchParams, shouldFetch],
    queryFn: async () => {
      if (!shouldFetch) {
        console.log('Search is not enabled yet');
        return null;
      }
      
      const params = new URLSearchParams();
      params.append('keywords', searchParams.keywords);
      if (searchParams.location) {
        params.append('location', searchParams.location);
      }
      params.append('remoteOnly', searchParams.remoteOnly ? 'true' : 'false');
      
      // Important: Make sure this matches the server-side endpoint
      const endpointUrl = `/api/adzuna/jobs?${params.toString()}`;
      console.log('Fetching from:', endpointUrl);
      
      try {
        const response = await fetch(endpointUrl);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', errorText);
          throw new Error(`Failed to fetch jobs: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        return data;
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    },
    enabled: shouldFetch,
    refetchOnWindowFocus: false
  });
  
  // Update loading state to combine both loading indicators
  const isLoading = queryIsLoading || directIsLoading;
  
  // Log any errors
  useEffect(() => {
    if (error) {
      console.error('Query error:', error);
    }
  }, [error]);

  // Update search results when data changes
  useEffect(() => {
    if (data && data.results) {
      setSearchResults(data.results);
    }
  }, [data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRemoteOnlyChange = (checked: boolean) => {
    setSearchParams((prev) => ({
      ...prev,
      remoteOnly: checked,
    }));
  };

  const handleSearch = useCallback(() => {
    // Validate inputs
    if (!searchParams.keywords.trim()) {
      alert('Please enter keywords for your job search');
      return;
    }

    console.log('Search initiated with params:', searchParams);

    // Add to search history
    setSearchHistory((prev) => [
      { keywords: searchParams.keywords, location: searchParams.location, timestamp: new Date() },
      ...prev.slice(0, 9), // Keep only the 10 most recent searches
    ]);

    // Trigger fetch
    console.log('Setting shouldFetch to true');
    setShouldFetch(true);
    console.log('shouldFetch should now be true');
  }, [searchParams]);

  // State to store selected job
  const [selectedJob, setSelectedJob] = useState<AdzunaJob | null>(null);
  const [showApplicationWizard, setShowApplicationWizard] = useState(false);
  const [applicationJob, setApplicationJob] = useState<{
    id?: string;
    title: string;
    company: string;
    description: string;
    location?: string;
    url?: string;
  } | null>(null);
  
  // Handle starting an application
  const handleStartApplication = async (job: AdzunaJob) => {
    try {
      // Open the job URL in a new tab
      window.open(job.redirect_url, '_blank');
      
      // Directly create the application with "In Progress" status
      const now = new Date().toISOString();
      const newApplication = {
        jobId: 0, // Local job entry from Adzuna data
        title: job.title,
        jobTitle: job.title,
        position: job.title,
        company: job.company.display_name,
        companyName: job.company.display_name,
        location: job.location.display_name || 'Remote',
        jobLocation: job.location.display_name || 'Remote',
        description: job.description,
        status: 'In Progress',
        adzunaJobId: job.id || '',
        externalJobUrl: job.redirect_url || '',
        jobLink: job.redirect_url || '',
        notes: '',
        source: 'Adzuna',
        applicationDate: now,
        createdAt: now,
        updatedAt: now
      };
      
      try {
        // Try to use the API first
        const response = await apiRequest({
          url: '/api/applications',
          method: 'POST',
          data: newApplication
        });
        
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
        
        console.log('Application created:', response);
      } catch (error) {
        console.error('API error, falling back to localStorage:', error);
        
        // Fallback to localStorage for demo mode
        const mockId = Date.now();
        const mockApp = {
          id: mockId,
          ...newApplication
        };
        
        // Store application in localStorage
        const storedApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
        storedApplications.push(mockApp);
        localStorage.setItem('mockJobApplications', JSON.stringify(storedApplications));
        
        // Dispatch event to notify application status change
        window.dispatchEvent(new Event('applicationStatusChange'));
      }
      
      // Show success toast
      toast({
        title: "Added to Application Tracker",
        description: `${job.title} at ${job.company.display_name} has been added to your tracker`,
      });
      
    } catch (error) {
      console.error('Error starting application:', error);
      toast({
        title: "Error",
        description: "Failed to start application. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleSelectJob = (job: AdzunaJob) => {
    // Store the full job object
    setSelectedJob(job);
    
    // Set tab to job view
    setActiveTab('job-view');
    
    // Pass job info to parent component if callback exists
    if (onSelectJob) {
      onSelectJob({
        title: job.title,
        company: job.company.display_name,
        url: job.redirect_url,
        description: job.description,
        location: job.location?.display_name
      });
    }
  };

  const handleHistoryItemClick = (item: { keywords: string; location: string }) => {
    setSearchParams((prev) => ({
      ...prev,
      keywords: item.keywords,
      location: item.location,
    }));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  // Format salary if available
  const formatSalary = (job: AdzunaJob) => {
    if (job.salary_min && job.salary_max) {
      return `$${Math.round(job.salary_min).toLocaleString()} - $${Math.round(job.salary_max).toLocaleString()}${job.salary_is_predicted ? ' (estimated)' : ''}`;
    } else if (job.salary_min) {
      return `$${Math.round(job.salary_min).toLocaleString()}${job.salary_is_predicted ? ' (estimated)' : ''}`;
    } else if (job.salary_max) {
      return `Up to $${Math.round(job.salary_max).toLocaleString()}${job.salary_is_predicted ? ' (estimated)' : ''}`;
    }
    return 'Salary not specified';
  };

  // State for active tab
  const [activeTab, setActiveTab] = useState('search');
  
  // Automatically switch to results tab when search results are received
  useEffect(() => {
    if (searchResults.length > 0) {
      setActiveTab('results');
    }
  }, [searchResults]);
  
  return (
    <>
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Job Search
        </CardTitle>
        <CardDescription>
          Search for jobs on Adzuna directly within the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
            {searchResults.length > 0 && (
              <TabsTrigger value="results" className="flex-1">Results ({searchResults.length})</TabsTrigger>
            )}
            {selectedJob && (
              <TabsTrigger value="job-view" className="flex-1">Job Details</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="search" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                name="keywords"
                placeholder="Software Engineer, Product Manager, etc."
                value={searchParams.keywords}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                name="location"
                placeholder="Chicago, Boston, etc."
                value={searchParams.location}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="remoteOnly"
                checked={searchParams.remoteOnly}
                onCheckedChange={handleRemoteOnlyChange}
              />
              <Label htmlFor="remoteOnly">Remote jobs only</Label>
            </div>
            
            <Button 
              onClick={(e) => {
                console.log('Search button clicked!');
                e.preventDefault();
                // Update search history
                if (searchParams.keywords.trim()) {
                  setSearchHistory((prev) => [
                    { keywords: searchParams.keywords, location: searchParams.location, timestamp: new Date() },
                    ...prev.slice(0, 9), // Keep only the 10 most recent searches
                  ]);
                  // Use direct fetch instead of the query
                  directFetch();
                }
              }} 
              disabled={isLoading || !searchParams.keywords.trim()} 
              className="w-full mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search Jobs'
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="results">
            {searchResults.length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {searchResults.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectJob(job)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartApplication(job);
                          }}
                        >
                          Add to Tracker
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-medium">{job.company.display_name}</p>
                    <p className="text-sm text-gray-500">{job.location.display_name}</p>
                    
                    {(job.salary_min || job.salary_max) && (
                      <p className="text-sm text-gray-700 mt-1">{formatSalary(job)}</p>
                    )}
                    
                    <p className="mt-2 text-sm line-clamp-2 text-gray-600">{job.description}</p>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      Posted: {new Date(job.created).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Searching for jobs...</p>
                  </div>
                ) : (
                  <p className="text-gray-500">No job results found. Try a different search.</p>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            {searchHistory.length > 0 ? (
              <>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {searchHistory.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                      onClick={() => handleHistoryItemClick(item)}
                    >
                      <div>
                        <p className="font-medium">{item.keywords}</p>
                        <p className="text-sm text-gray-500">{item.location || 'No location'}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={clearSearchHistory} className="mt-4">
                  Clear History
                </Button>
              </>
            ) : (
              <p className="text-center py-8 text-gray-500">No search history available</p>
            )}
          </TabsContent>
          
          <TabsContent value="job-view">
            {selectedJob ? (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Job Details</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(selectedJob.redirect_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Apply on Adzuna
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setActiveTab('results')}
                    >
                      Back to Results
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-6 overflow-auto max-h-[600px]">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">{selectedJob.title}</h2>
                    <div className="flex flex-wrap gap-2 mb-4 text-sm">
                      <span className="font-medium">{selectedJob.company.display_name}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">{selectedJob.location.display_name}</span>
                    </div>
                    
                    {(selectedJob.salary_min || selectedJob.salary_max) && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-md inline-block">
                        <span className="font-medium">Salary: </span>
                        <span>{formatSalary(selectedJob)}</span>
                      </div>
                    )}
                    
                    {selectedJob.contract_time && (
                      <div className="mb-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {selectedJob.contract_time === 'full_time' ? 'Full-time' : 
                           selectedJob.contract_time === 'part_time' ? 'Part-time' : 
                           selectedJob.contract_time}
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                      <div className="text-gray-700 whitespace-pre-line">
                        {selectedJob.description}
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <span className="text-sm text-gray-500">
                        Posted: {new Date(selectedJob.created).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleStartApplication(selectedJob)}
                    >
                      Add to Tracker
                    </Button>
                    
                    <Button 
                      variant="default" 
                      onClick={() => window.open(selectedJob.redirect_url, '_blank')}
                    >
                      Apply on Adzuna
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No job selected. Select a job from the results to view details.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        {searchResults.length > 0 && (
          <Button 
            onClick={() => {
              setShouldFetch(false);
              setSelectedJob(null);
              setActiveTab('search');
            }} 
            variant="secondary"
          >
            Clear Results
          </Button>
        )}
      </CardFooter>
    </Card>
    
    {applicationJob && (
      <ApplicationWizard
        isOpen={showApplicationWizard}
        onClose={() => setShowApplicationWizard(false)}
        jobDetails={applicationJob}
      />
    )}
    </>
  );
}