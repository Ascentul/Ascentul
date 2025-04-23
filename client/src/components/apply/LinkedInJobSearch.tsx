import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Briefcase, Building, ExternalLink } from 'lucide-react';
import { constructLinkedInSearchUrl, LinkedInSearchParams } from '@shared/linkedin';
import { LinkedInFrame } from './LinkedInFrame';
import { ApplicationAssistant } from './ApplicationAssistant';

interface LinkedInJobSearchProps {
  onSelectJob?: (jobInfo: { title: string, company: string, url: string }) => void;
}

export function LinkedInJobSearch({ onSelectJob }: LinkedInJobSearchProps) {
  // Search parameters
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [jobType, setJobType] = useState('');
  const [experience, setExperience] = useState('');
  
  // UI state
  const [searchUrl, setSearchUrl] = useState('');
  const [isFrameOpen, setIsFrameOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Handle search submission
  const handleSearch = () => {
    if (!jobTitle) return;
    
    const searchParams: LinkedInSearchParams = {
      jobTitle,
      location,
      remote: isRemote,
      jobType: jobType || undefined,
      experience: experience || undefined
    };
    
    const url = constructLinkedInSearchUrl(searchParams);
    setSearchUrl(url);
    setIsFrameOpen(true);
    
    // If callback provided, pass the job info
    if (onSelectJob) {
      onSelectJob({
        title: jobTitle,
        company: '', // Not available until a specific job is selected
        url
      });
    }
  };

  // Toggle AI assistant
  const toggleAssistant = () => {
    setIsAssistantOpen(!isAssistantOpen);
  };

  return (
    <div className="space-y-6">
      {/* Search form */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">LinkedIn Job Search</h3>
        
        <div className="flex flex-col md:flex-row gap-3">
          {/* Job title search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Job title or keyword"
              className="pl-9"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          {/* Location search */}
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Location (city, state, or country)"
              className="pl-9"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <Button onClick={handleSearch} className="md:w-auto w-full">
            Search LinkedIn
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {/* Remote filter */}
          <div className="flex items-center space-x-2">
            <Switch
              id="remote-filter"
              checked={isRemote}
              onCheckedChange={setIsRemote}
            />
            <Label htmlFor="remote-filter">Remote only</Label>
          </div>
          
          {/* Job type filter */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="job-type">Job Type:</Label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger id="job-type" className="w-[140px]">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Type</SelectItem>
                <SelectItem value="full_time">Full-time</SelectItem>
                <SelectItem value="part_time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Experience level filter */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="experience">Experience:</Label>
            <Select value={experience} onValueChange={setExperience}>
              <SelectTrigger id="experience" className="w-[140px]">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Level</SelectItem>
                <SelectItem value="entry_level">Entry Level</SelectItem>
                <SelectItem value="mid_level">Mid-Senior Level</SelectItem>
                <SelectItem value="senior_level">Director/Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Tips card */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <h4 className="font-medium">How it works:</h4>
            <ol className="list-decimal pl-5 text-sm space-y-1">
              <li>Search for jobs using the form above</li>
              <li>Browse LinkedIn search results in the embedded view</li>
              <li>When you find a job you like, use our AI Assistant to help craft your application</li>
              <li>Apply directly through LinkedIn's platform</li>
            </ol>
            
            <p className="text-xs text-muted-foreground mt-2">
              Note: Some websites block being embedded in iframes. If LinkedIn results don't load properly, 
              you'll be prompted to open in a new tab.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick search examples */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Quick searches:</h4>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setJobTitle('Software Engineer');
              setLocation('');
              setIsRemote(true);
              handleSearch();
            }}
          >
            Remote Software Engineer
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setJobTitle('Marketing Manager');
              setLocation('New York');
              setIsRemote(false);
              handleSearch();
            }}
          >
            Marketing Manager in New York
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setJobTitle('Data Analyst');
              setLocation('San Francisco');
              setIsRemote(false);
              handleSearch();
            }}
          >
            Data Analyst in San Francisco
          </Button>
        </div>
      </div>
      
      {/* LinkedIn Iframe Dialog */}
      {searchUrl && (
        <LinkedInFrame
          isOpen={isFrameOpen}
          onClose={() => setIsFrameOpen(false)}
          url={searchUrl}
          jobTitle={jobTitle}
          onOpenAssistant={toggleAssistant}
        />
      )}
      
      {/* Application Assistant */}
      <ApplicationAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        jobTitle={jobTitle}
      />
    </div>
  );
}