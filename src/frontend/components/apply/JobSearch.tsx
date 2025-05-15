import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Search, MapPin, Briefcase, Building, ExternalLink, Star, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { EmbeddedApplyFrame } from './EmbeddedApplyFrame';

// Define the job interface
export interface Job {
  id: string;
  source: string;
  sourceId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  fullDescription?: string;
  applyUrl: string;
  salary?: string;
  datePosted?: string;
  jobType?: string;
  isRemote?: boolean;
  logo?: string;
  tags?: string[];
  benefits?: string[];
  requirements?: string[];
  isSaved?: boolean;
  isApplied?: boolean;
}

// Props for the JobSearch component
interface JobSearchProps {
  onSelectJob?: (job: Job) => void;
}

export function JobSearch({ onSelectJob }: JobSearchProps) {
  // Search state
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [jobType, setJobType] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Apply modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  // State for search execution
  const [searchParams, setSearchParams] = useState<any>(null);
  
  // Get job sources
  const { data: sources, isLoading: isLoadingSources } = useQuery({
    queryKey: ['/api/jobs/sources'],
    queryFn: async () => {
      try {
        const response = await apiRequest<{ sources: Array<{ name: string, id: string }> }>({
          url: '/api/jobs/sources'
        });
        return response.sources || [];
      } catch (error) {
        console.error('Error fetching job sources:', error);
        return [];
      }
    },
    enabled: true,
  });

  // Define the search results type
  interface JobSearchResults {
    jobs: Job[];
    totalJobs: number;
    currentPage: number;
    pageCount: number;
  }

  // Job search query
  const { 
    data: searchResults, 
    isLoading, 
    isError,
    error 
  } = useQuery<JobSearchResults>({
    queryKey: ['/api/jobs/search', searchParams],
    queryFn: async () => {
      if (!searchParams) {
        return { jobs: [], totalJobs: 0, currentPage: 1, pageCount: 1 };
      }
      
      try {
        const queryString = new URLSearchParams({
          query: searchParams.query,
          ...(searchParams.location && { location: searchParams.location }),
          ...(searchParams.isRemote && { isRemote: 'true' }),
          ...(searchParams.jobType && { jobType: searchParams.jobType }),
          ...(searchParams.source && { source: searchParams.source }),
          page: searchParams.page.toString(),
          pageSize: '10',
        }).toString();
        
        const response = await apiRequest<JobSearchResults>({
          url: `/api/jobs/search?${queryString}`
        });
        return response;
      } catch (error) {
        console.error('Error searching jobs:', error);
        throw error;
      }
    },
    enabled: !!searchParams,
  });

  // Handle search execution
  const handleSearch = () => {
    if (!query) return;
    
    setSearchParams({
      query,
      location,
      isRemote,
      jobType,
      source,
      page: 1,
    });
    
    setPage(1);
  };

  // Handle job selection
  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    if (onSelectJob) {
      onSelectJob(job);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSearchParams((prev: any) => ({ ...prev, page: newPage }));
  };

  // Render job card
  const renderJobCard = (job: Job) => {
    const formattedDate = job.datePosted ? new Date(job.datePosted).toLocaleDateString() : '';
    
    return (
      <Card 
        key={job.id} 
        className={`mb-4 cursor-pointer hover:shadow-md transition-shadow ${
          selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => handleSelectJob(job)}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {job.logo ? (
              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                <img src={job.logo} alt={`${job.company} logo`} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <Building className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1 space-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-lg">{job.title}</h3>
                  <Badge variant="outline">{job.source}</Badge>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  <span>{job.company}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>{job.location}</span>
                </div>
                
                {job.jobType && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                    <span>{job.jobType}</span>
                  </div>
                )}
                
                {formattedDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>Posted {formattedDate}</span>
                  </div>
                )}
              </div>
              
              {job.isRemote && (
                <Badge variant="secondary" className="text-xs">Remote</Badge>
              )}
              
              <p className="text-sm line-clamp-2">{job.description}</p>
              
              {job.salary && (
                <div className="text-sm font-medium">{job.salary}</div>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-1">
                  {job.tags?.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setApplyJob(job);
                      setApplyModalOpen(true);
                    }}
                  >
                    Apply Now
                  </Button>
                  
                  <a 
                    href={job.applyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center gap-1 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Original
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Embedded Apply Frame */}
      {applyJob && (
        <EmbeddedApplyFrame
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          jobTitle={applyJob.title}
          companyName={applyJob.company}
          applyUrl={applyJob.applyUrl}
        />
      )}
    
      {/* Search form */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Job title search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Job title, keywords, or company"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          {/* Location search */}
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="City, state, or zip code"
              className="pl-9"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <Button onClick={handleSearch} className="md:w-auto w-full">Search Jobs</Button>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Job type filter */}
          <Select value={jobType} onValueChange={setJobType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Type</SelectItem>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="part-time">Part-time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Remote filter */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remote-filter"
              checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="remote-filter" className="text-sm">Remote only</label>
          </div>
          
          {/* Source filter */}
          {!isLoadingSources && sources && sources.length > 0 && (
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Job Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sources</SelectItem>
                {sources.map((src: any) => (
                  <SelectItem key={src.id} value={src.id}>
                    {src.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      
      {/* Results section */}
      <div>
        {isLoading && (
          <>
            <Skeleton className="h-36 w-full rounded-md mb-4" />
            <Skeleton className="h-36 w-full rounded-md mb-4" />
            <Skeleton className="h-36 w-full rounded-md" />
          </>
        )}
        
        {isError && (
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">Error searching jobs</p>
            <p className="text-muted-foreground">{(error as any)?.message || 'An unknown error occurred'}</p>
          </div>
        )}
        
        {!isLoading && !isError && (!searchResults || !searchResults.jobs || searchResults.jobs.length === 0) && (
          <div className="text-center py-8">
            <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-lg font-medium">No jobs found</p>
            <p className="text-muted-foreground">Try different search terms or filters</p>
          </div>
        )}
        
        {!isLoading && !isError && searchResults && searchResults.jobs && searchResults.jobs.length > 0 && (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Found {searchResults.totalJobs} jobs matching your search
              </p>
            </div>
            
            <div>
              {searchResults.jobs.map(renderJobCard)}
            </div>
            
            {/* Pagination */}
            {searchResults.pageCount > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) handlePageChange(page - 1);
                      }}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, searchResults.pageCount) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink 
                          href="#"
                          isActive={pageNumber === page}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNumber);
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < searchResults.pageCount) handlePageChange(page + 1);
                      }}
                      className={page >= searchResults.pageCount ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
}