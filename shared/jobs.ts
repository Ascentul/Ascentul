// Standardized job schema that all job sources will adapt to
export interface Job {
  id: string;                // Unique ID (source-specific)
  source: string;            // Job board source (e.g., "ZipRecruiter", "Indeed")
  sourceId: string;          // Original ID from the source
  title: string;             // Job title
  company: string;           // Company name
  location: string;          // Job location
  description: string;       // Job description (may be truncated in listings)
  fullDescription?: string;  // Full job description (when available)
  applyUrl: string;          // URL to apply for the job
  salary?: string;           // Salary information when available
  datePosted?: string;       // When the job was posted
  jobType?: string;          // Full-time, part-time, contract, etc.
  isRemote?: boolean;        // Whether the job is remote
  logo?: string;             // Company logo URL
  tags?: string[];           // Additional tags or categories
  benefits?: string[];       // Listed benefits
  requirements?: string[];   // Job requirements
  isSaved?: boolean;         // Whether the user has saved this job
  isApplied?: boolean;       // Whether the user has applied to this job
}

// Search parameters interface - common for all job sources
export interface JobSearchParams {
  query: string;             // Job title or keywords
  location?: string;         // Location to search in
  radius?: number;           // Search radius in miles
  page?: number;             // Page number for pagination
  pageSize?: number;         // Results per page
  isRemote?: boolean;        // Filter for remote jobs only
  jobType?: string;          // Job type filter (full-time, part-time, etc.)
  datePosted?: string;       // Filter by posting date (e.g., "1d" for last day)
  salary?: string;           // Filter by salary range
  sortBy?: 'relevance' | 'date'; // Sort method
}

// Search results interface
export interface JobSearchResults {
  jobs: Job[];               // List of jobs matching the search
  totalJobs: number;         // Total number of jobs available
  pageCount: number;         // Total number of pages
  currentPage: number;       // Current page number
  source: string;            // Source of these results
}

// Interface for a job source provider
export interface JobSourceProvider {
  name: string;              // Name of the job source
  icon: string;              // Icon or logo URL
  enabled: boolean;          // Whether this source is enabled
  searchJobs: (params: JobSearchParams) => Promise<JobSearchResults>;
  getJobDetails?: (id: string) => Promise<Job>; // Optional method to get full job details
}