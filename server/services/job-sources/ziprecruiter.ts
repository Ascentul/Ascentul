/**
 * ZipRecruiter Job Provider
 * This provider integrates with the ZipRecruiter API
 */

import https from 'https';
import { Job } from '@shared/jobs';
import { JobProvider, JobSearchParams } from './index';

// ZipRecruiter API key is required for this provider to work
const API_KEY = process.env.ZIPRECRUITER_API_KEY;

// ZipRecruiter Provider Implementation
export const zipRecruiterProvider: JobProvider = {
  id: 'ziprecruiter',
  name: 'ZipRecruiter',
  
  // Search for jobs
  searchJobs: async (params: JobSearchParams): Promise<Job[]> => {
    if (!API_KEY) {
      console.error('ZIPRECRUITER_API_KEY is not set');
      return [];
    }
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        api_key: API_KEY,
        search: params.query,
        page: params.page.toString(),
        jobs_per_page: params.pageSize.toString(),
        ...(params.location && { location: params.location }),
        ...(params.isRemote && { remote_jobs_only: 'true' }),
      });

      if (params.jobType) {
        // Map our job types to ZipRecruiter job types
        const jobTypeMap: Record<string, string> = {
          'full-time': 'full_time',
          'part-time': 'part_time',
          'contract': 'contractor',
          'internship': 'intern',
        };
        
        if (jobTypeMap[params.jobType]) {
          queryParams.append('employment_type', jobTypeMap[params.jobType]);
        }
      }
      
      // API URL
      const apiUrl = `https://api.ziprecruiter.com/jobs/v1?${queryParams.toString()}`;
      
      // Call the API
      const response = await fetchZipRecruiterApi(apiUrl);
      
      if (!response.success || !response.jobs) {
        throw new Error('Failed to fetch jobs from ZipRecruiter');
      }
      
      // Map API response to our Job interface
      return response.jobs.map((job: any) => ({
        id: `ziprecruiter_${job.id}`,
        source: 'ZipRecruiter',
        sourceId: job.id,
        title: job.name,
        company: job.hiring_company.name,
        location: job.location,
        description: job.snippet,
        fullDescription: job.description,
        applyUrl: job.url,
        salary: job.salary_interval ? `${job.salary_min}-${job.salary_max} ${job.salary_interval}` : undefined,
        datePosted: job.posted_time,
        jobType: job.employment_type,
        isRemote: job.remote,
        logo: job.hiring_company.logo,
        tags: job.category ? [job.category] : [],
        benefits: [],
        requirements: [],
        isSaved: false,
        isApplied: false,
      }));
    } catch (error) {
      console.error('Error searching ZipRecruiter jobs:', error);
      return [];
    }
  },
  
  // Get job details
  getJob: async (id: string): Promise<Job | null> => {
    if (!API_KEY) {
      console.error('ZIPRECRUITER_API_KEY is not set');
      return null;
    }
    
    try {
      // API URL for specific job
      const apiUrl = `https://api.ziprecruiter.com/jobs/v1/${id}?api_key=${API_KEY}`;
      
      // Call the API
      const response = await fetchZipRecruiterApi(apiUrl);
      
      if (!response.success || !response.job) {
        throw new Error('Failed to fetch job from ZipRecruiter');
      }
      
      const job = response.job;
      
      // Map API response to our Job interface
      return {
        id: `ziprecruiter_${job.id}`,
        source: 'ZipRecruiter',
        sourceId: job.id,
        title: job.name,
        company: job.hiring_company.name,
        location: job.location,
        description: job.snippet,
        fullDescription: job.description,
        applyUrl: job.url,
        salary: job.salary_interval ? `${job.salary_min}-${job.salary_max} ${job.salary_interval}` : undefined,
        datePosted: job.posted_time,
        jobType: job.employment_type,
        isRemote: job.remote,
        logo: job.hiring_company.logo,
        tags: job.category ? [job.category] : [],
        benefits: [],
        requirements: [],
        isSaved: false,
        isApplied: false,
      };
    } catch (error) {
      console.error('Error getting ZipRecruiter job:', error);
      return null;
    }
  },
};

// Helper function to fetch data from ZipRecruiter API
function fetchZipRecruiterApi(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}