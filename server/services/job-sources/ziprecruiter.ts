import axios from 'axios';
import { Job, JobSearchParams, JobSearchResults, JobSourceProvider } from '../../../shared/jobs';

// ZipRecruiter API response types
interface ZipRecruiterSearchResponse {
  success: boolean;
  jobs: ZipRecruiterJob[];
  total_jobs: number;
  num_pages: number;
  page: number;
}

interface ZipRecruiterJob {
  id: string;
  name: string;
  snippet: string;
  job_description?: string;
  posted_time: string;
  hiring_company: {
    name: string;
    url?: string;
    logo?: string;
  };
  location: string;
  city: string;
  state: string;
  country: string;
  url: string;
  salary_min?: number;
  salary_max?: number;
  salary_interval?: string;
  job_type?: string;
  job_type_full?: string;
  has_zipapply?: boolean;
  posted_date?: string;
}

// Transform a ZipRecruiter job to our standardized job format
function transformZipRecruiterJob(job: ZipRecruiterJob): Job {
  // Extract salary information if available
  let salary: string | undefined;
  if (job.salary_min && job.salary_max) {
    const interval = job.salary_interval ? job.salary_interval.toLowerCase() : 'year';
    salary = `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()} per ${interval}`;
  }

  // Check if job is remote based on location or description
  const isRemote = 
    job.location?.toLowerCase().includes('remote') || 
    job.job_description?.toLowerCase().includes('remote') || 
    job.snippet?.toLowerCase().includes('remote');

  return {
    id: `ziprecruiter-${job.id}`,
    source: 'ZipRecruiter',
    sourceId: job.id,
    title: job.name,
    company: job.hiring_company.name,
    location: job.location || `${job.city}, ${job.state}, ${job.country}`,
    description: job.snippet || '',
    fullDescription: job.job_description,
    applyUrl: job.url,
    salary,
    datePosted: job.posted_date || job.posted_time,
    jobType: job.job_type_full || job.job_type,
    isRemote,
    logo: job.hiring_company.logo,
    tags: [],
    benefits: [],
    requirements: [],
    isSaved: false,
    isApplied: false
  };
}

// ZipRecruiter API implementation
export const zipRecruiterProvider: JobSourceProvider = {
  name: 'ZipRecruiter',
  icon: '/ziprecruiter-logo.png', // Replace with actual logo path
  enabled: true,
  
  searchJobs: async (params: JobSearchParams): Promise<JobSearchResults> => {
    try {
      // Construct ZipRecruiter API URL with query parameters
      const apiUrl = 'https://api.ziprecruiter.com/jobs/v1';
      
      const queryParams = {
        api_key: process.env.ZIPRECRUITER_API_KEY,
        search: params.query,
        location: params.location || '',
        radius_miles: params.radius || 25,
        page: params.page || 1,
        jobs_per_page: params.pageSize || 10,
        refine_by_salary: params.salary || '',
        refine_by_tags: params.isRemote ? 'remote' : '',
        refine_by_job_type: params.jobType || '',
        days_ago: params.datePosted || '',
        sort: params.sortBy === 'date' ? 'date' : 'relevance',
      };
      
      // Make the API request
      const response = await axios.get<ZipRecruiterSearchResponse>(apiUrl, { params: queryParams });
      
      // Check if the request was successful
      if (!response.data.success) {
        throw new Error('ZipRecruiter API request failed');
      }
      
      // Transform the results
      const jobs = response.data.jobs.map(transformZipRecruiterJob);
      
      // Return the standardized results
      return {
        jobs,
        totalJobs: response.data.total_jobs,
        pageCount: response.data.num_pages,
        currentPage: response.data.page,
        source: 'ZipRecruiter'
      };
    } catch (error) {
      console.error('Error searching ZipRecruiter jobs:', error);
      throw error;
    }
  },
  
  getJobDetails: async (id: string): Promise<Job> => {
    // ZipRecruiter doesn't have a direct job details API endpoint
    // We would normally parse the ID and fetch it from our database or
    // implement scraping logic, but for now we'll return an error
    throw new Error('Direct job details fetching not supported for ZipRecruiter');
  }
};