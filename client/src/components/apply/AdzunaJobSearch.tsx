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

interface AdzunaJobSearchProps {
  onSelectJob?: (jobInfo: { title: string; company: string; url: string; description: string }) => void;
}

export function AdzunaJobSearch({ onSelectJob }: AdzunaJobSearchProps) {
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
    if (!searchParams.keywords) return;
    
    setDirectIsLoading(true);
    console.log('Direct fetch initiated with params:', searchParams);
    
    try {
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
        throw new Error(`Failed to fetch jobs: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Direct fetch received data:', data);
      
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Direct fetch error:', error);
    } finally {
      setDirectIsLoading(false);
    }
  }, [searchParams]);
  
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

  const handleSelectJob = (job: AdzunaJob) => {
    if (onSelectJob) {
      onSelectJob({
        title: job.title,
        company: job.company.display_name,
        url: job.redirect_url,
        description: job.description,
      });
    }
    // Open job URL in a new tab
    window.open(job.redirect_url, '_blank', 'noopener,noreferrer');
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

  return (
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
        <Tabs defaultValue="search">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
            {searchResults.length > 0 && (
              <TabsTrigger value="results" className="flex-1">Results ({searchResults.length})</TabsTrigger>
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
                // Use direct fetch instead of the query
                directFetch();
                // Also update search history
                setSearchHistory((prev) => [
                  { keywords: searchParams.keywords, location: searchParams.location, timestamp: new Date() },
                  ...prev.slice(0, 9), // Keep only the 10 most recent searches
                ]);
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
                      <Button size="sm" variant="ghost" className="h-6 gap-1">
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Button>
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
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.open('https://www.adzuna.com/', '_blank')}>
          Visit Adzuna
        </Button>
        {searchResults.length > 0 && (
          <Button onClick={() => setShouldFetch(false)} variant="secondary">
            Clear Results
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}