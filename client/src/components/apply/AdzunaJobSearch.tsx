import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Briefcase, MapPin, Calendar, ExternalLink, Clock, Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AdzunaJob, JobSearchParams } from '@shared/adzuna';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ApplicationAssistant } from './ApplicationAssistant';
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
  const [selectedJob, setSelectedJob] = useState<AdzunaJob | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showApplicationWizard, setShowApplicationWizard] = useState(false);
  const [applicationJob, setApplicationJob] = useState<{
    id?: string;
    title: string;
    company: string;
    description: string;
    location?: string;
    url?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState('search');

  // Reset search results when search params change
  useEffect(() => {
    setShouldFetch(false);
    setSearchResults([]);
  }, [searchParams]);

  // Log shouldFetch changes
  useEffect(() => {
    console.log('shouldFetch state changed to:', shouldFetch);
  }, [shouldFetch]);

  // Effects to run on component mount
  useEffect(() => {
    // Load search history from localStorage
    const savedHistory = localStorage.getItem('adzuna_search_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Convert string dates back to Date objects
        const history = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setSearchHistory(history);
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  // Save search history to localStorage when it changes
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem('adzuna_search_history', JSON.stringify(searchHistory));
    }
  }, [searchHistory]);

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
      
      console.log('Fetching from:', `/api/adzuna/jobs?${params.toString()}`);
      
      try {
        const response = await fetch(`/api/adzuna/jobs?${params.toString()}`);
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

  // Effect to process query results
  useEffect(() => {
    if (data?.results && Array.isArray(data.results)) {
      setSearchResults(data.results);
      // Clear loading state
      setDirectIsLoading(false);
    }
  }, [data]);

  // Toggle direct fetch approach when query fails
  useEffect(() => {
    if (error) {
      console.error('Error in useQuery:', error);
      // If the query fails, try direct fetch approach
      performDirectSearch();
    }
  }, [error]);

  // Handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handler for remote only checkbox
  const handleRemoteOnlyChange = (checked: boolean) => {
    setSearchParams((prev) => ({
      ...prev,
      remoteOnly: checked,
    }));
  };
  
  // Direct search function as a fallback
  const performDirectSearch = async () => {
    if (!searchParams.keywords.trim()) return;
    
    setDirectIsLoading(true);
    
    const params = new URLSearchParams();
    params.append('keywords', searchParams.keywords);
    if (searchParams.location) {
      params.append('location', searchParams.location);
    }
    params.append('remoteOnly', searchParams.remoteOnly ? 'true' : 'false');
    
    console.log('Directly fetching from:', `/api/adzuna/jobs?${params.toString()}`);
    
    const response = await fetch(`/api/adzuna/jobs?${params.toString()}`);
    console.log('Direct fetch response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error in direct fetch:', errorText);
      toast({
        title: "Search Error",
        description: "Failed to search for jobs. Please try again.",
        variant: "destructive"
      });
      setDirectIsLoading(false);
      return;
    }
    
    const data = await response.json();
    console.log('Direct fetch data:', data);
    
    if (data.results && Array.isArray(data.results)) {
      setSearchResults(data.results);
    } else {
      toast({
        title: "No Results",
        description: "No jobs matching your criteria were found.",
      });
    }
    
    setDirectIsLoading(false);
  };

  // Handler for search button
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

  // Combined loading state
  const isLoading = queryIsLoading || directIsLoading;

  // Close assistant modal
  const handleCloseAssistant = () => {
    setShowAssistant(false);
  };

  // Close application wizard
  const handleCloseWizard = () => {
    setShowApplicationWizard(false);
  };

  // Start application process
  const handleStartApplication = async (job: AdzunaJob) => {
    try {
      // Prepare job data for application
      const jobData = {
        id: job.id,
        title: job.title,
        company: job.company.display_name,
        description: job.description,
        location: job.location?.display_name || 'Remote',
        url: job.redirect_url,
      };
      
      // Set application job
      setApplicationJob(jobData);
      
      // Show application wizard
      setShowApplicationWizard(true);
      
      // Send job to API to create application
      const response = await apiRequest("POST", "/api/job-applications", {
        title: job.title,
        company: job.company.display_name,
        description: job.description,
        location: job.location?.display_name || 'Remote',
        url: job.redirect_url,
        status: 'active',
        notes: '',
        dataSource: 'adzuna',
        sourceId: job.id,
      });
      
      // Invalidate applications cache
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
      
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
              onClick={handleSearch} 
              disabled={isLoading || !searchParams.keywords.trim()} 
              className="w-full mt-2"
              type="button"
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
                      <div>
                        <h3 className="font-medium text-lg">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.company.display_name}</p>
                      </div>
                      <Badge variant={job.category.label === 'IT Jobs' ? 'default' : 'secondary'}>
                        {job.category.label}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-3">
                      {job.location && (
                        <span className="text-xs flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location.display_name}
                        </span>
                      )}
                      
                      {(job.salary_min || job.salary_max) && (
                        <span className="text-xs flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {formatSalary(job)}
                        </span>
                      )}
                      
                      {job.created && (
                        <span className="text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(job.created).toLocaleDateString()}
                        </span>
                      )}
                      
                      {/* Note: contract_time might not be available in all jobs */}
                      {job['contract_time'] && (
                        <span className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {job['contract_time'] === 'full_time' ? 'Full-time' : 
                           job['contract_time'] === 'part_time' ? 'Part-time' : 
                           job['contract_time']}
                        </span>
                      )}
                    </div>
                    
                    <p className="mt-2 text-sm line-clamp-2">{job.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No search results yet.</p>
                <p className="text-sm text-gray-400 mt-1">Try searching for jobs first.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            {searchHistory.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Recent Searches</h3>
                  <Button variant="outline" size="sm" onClick={clearSearchHistory}>
                    Clear History
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {searchHistory.map((item, index) => (
                    <div 
                      key={index}
                      className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleHistoryItemClick(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.keywords}</p>
                          {item.location && (
                            <p className="text-sm text-gray-500">{item.location}</p>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {item.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No search history yet.</p>
                <p className="text-sm text-gray-400 mt-1">Your recent searches will appear here.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="job-view">
            {selectedJob ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{selectedJob.title}</h2>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {selectedJob.company.display_name}
                    </p>
                  </div>
                  
                  <Badge variant={selectedJob.category.label === 'IT Jobs' ? 'default' : 'secondary'}>
                    {selectedJob.category.label}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-4 mt-3">
                  {selectedJob.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{selectedJob.location.display_name}</span>
                    </div>
                  )}
                  
                  {(selectedJob.salary_min || selectedJob.salary_max) && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span>{formatSalary(selectedJob)}</span>
                    </div>
                  )}
                  
                  {selectedJob.created && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Posted {new Date(selectedJob.created).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-medium mb-2">Job Description</h3>
                  <div className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                  />
                </div>
                
                <div className="flex gap-2 mt-6">
                  <Button variant="default" onClick={() => handleStartApplication(selectedJob)}>
                    Add to Application Tracker
                  </Button>
                  
                  <Button variant="outline" onClick={() => setShowAssistant(true)}>
                    Get Application Help
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <a 
                      href={selectedJob.redirect_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Apply Externally
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No job selected.</p>
                <p className="text-sm text-gray-400 mt-1">Select a job from the results to view details.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    
    {showAssistant && selectedJob && (
      <ApplicationAssistant 
        jobTitle={selectedJob.title}
        company={selectedJob.company.display_name}
        description={selectedJob.description}
        onClose={handleCloseAssistant}
      />
    )}
    
    {showApplicationWizard && applicationJob && (
      <ApplicationWizard
        job={applicationJob}
        onClose={handleCloseWizard}
      />
    )}
    </>
  );
}