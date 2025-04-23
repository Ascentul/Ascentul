import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { SiLinkedin } from 'react-icons/si';

interface LinkedInJobSearchProps {
  onSelectJob?: (jobInfo: { title: string; company: string; url: string }) => void;
  onOpenLinkedIn?: (url: string) => void;
}

interface LinkedInSearchParams {
  jobTitle: string;
  location: string;
  remoteOnly: boolean;
}

export function LinkedInJobSearch({ onSelectJob, onOpenLinkedIn }: LinkedInJobSearchProps) {
  const [searchParams, setSearchParams] = useState<LinkedInSearchParams>({
    jobTitle: '',
    location: '',
    remoteOnly: false,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<Array<{ title: string; location: string; timestamp: Date }>>([]);

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
    if (!searchParams.jobTitle.trim()) {
      alert('Please enter a job title');
      return;
    }

    setIsSearching(true);

    // Add to search history
    setSearchHistory((prev) => [
      { title: searchParams.jobTitle, location: searchParams.location, timestamp: new Date() },
      ...prev.slice(0, 9), // Keep only the 10 most recent searches
    ]);

    // Construct LinkedIn search URL
    let linkedInUrl = 'https://www.linkedin.com/jobs/search/?keywords=';
    
    // Encode the job title
    linkedInUrl += encodeURIComponent(searchParams.jobTitle);
    
    // Add location if provided
    if (searchParams.location.trim()) {
      linkedInUrl += '&location=' + encodeURIComponent(searchParams.location);
    }
    
    // Add remote filter if selected
    if (searchParams.remoteOnly) {
      linkedInUrl += '&f_WT=2';
    }

    // Simulate network delay
    setTimeout(() => {
      setIsSearching(false);
      // If a job is selected, call the onSelectJob callback
      if (onSelectJob) {
        onSelectJob({
          title: searchParams.jobTitle,
          company: 'LinkedIn Search',
          url: linkedInUrl,
        });
      }
      
      // If open in LinkedIn is requested, call the onOpenLinkedIn callback
      if (onOpenLinkedIn) {
        onOpenLinkedIn(linkedInUrl);
      }
    }, 800);
  }, [searchParams, onSelectJob, onOpenLinkedIn]);

  const handleHistoryItemClick = (item: { title: string; location: string }) => {
    setSearchParams((prev) => ({
      ...prev,
      jobTitle: item.title,
      location: item.location,
    }));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SiLinkedin className="text-[#0A66C2]" size={24} />
          LinkedIn Job Search
        </CardTitle>
        <CardDescription>
          Search for jobs on LinkedIn directly within the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="search">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                placeholder="Software Engineer, Product Manager, etc."
                value={searchParams.jobTitle}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                name="location"
                placeholder="San Francisco, Remote, etc."
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
                        <p className="font-medium">{item.title}</p>
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
        <Button variant="outline" onClick={() => window.open('https://www.linkedin.com/jobs', '_blank')}>
          Browse LinkedIn Jobs
        </Button>
        <Button onClick={handleSearch} disabled={isSearching || !searchParams.jobTitle.trim()}>
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            'Search Jobs'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}