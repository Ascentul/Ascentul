/**
 * ZipRecruiter Job Provider
 * This provider integrates with the ZipRecruiter API using the Publisher API
 */

import https from 'https';
import { Job } from '@shared/jobs';
import { JobProvider, JobSearchParams } from './index';

// ZipRecruiter API key is required for this provider to work
const API_KEY = process.env.ZIPRECRUITER_API_KEY;

// Helper function to fetch data from ZipRecruiter API with redirect handling
function fetchZipRecruiterApi(url: string, headers: Record<string, string>, redirectCount = 0): Promise<any> {
  return new Promise((resolve, reject) => {
    // Maximum number of redirects to follow to prevent infinite loops
    const MAX_REDIRECTS = 5;
    
    if (redirectCount > MAX_REDIRECTS) {
      reject(new Error(`Maximum number of redirects (${MAX_REDIRECTS}) exceeded`));
      return;
    }
    
    const options = {
      headers: headers
    };

    https.get(url, options, (res) => {
      let data = '';
      
      // Handle redirects
      if (res.statusCode && (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308)) {
        const location = res.headers.location;
        
        if (!location) {
          reject(new Error(`Redirect response ${res.statusCode} without Location header`));
          return;
        }

        // Recursively follow the redirect
        fetchZipRecruiterApi(location, headers, redirectCount + 1)
          .then(resolve)
          .catch(reject);
        
        return;
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Log detailed response information for debugging

          // Log the first 500 characters of the response for debugging
          if (data.length > 0) {

          } else {

          }
          
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`API returned ${res.statusCode}: ${data}`));
            return;
          }
          
          if (data.trim().length === 0) {
            resolve({});
            return;
          }
          
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (parseError: any) {
            console.error('JSON parse error:', parseError.message);
            console.error('Response was not valid JSON:', data.substring(0, 200));
            reject(new Error(`Failed to parse API response: ${parseError.message}`));
          }
        } catch (e: any) {
          console.error('Error processing response:', e.message);
          reject(e);
        }
      });
    }).on('error', (err) => {
      console.error('HTTP request error:', err.message);
      reject(err);
    });
  });
}

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

      // Build query parameters for the new API endpoint
      const queryParams = new URLSearchParams({
        job_title: params.query,
        ...(params.location && { location: params.location }),
        distance: '10', // Default to 10 miles as requested
        page: params.page.toString(),
        jobs_per_page: params.pageSize.toString(),
      });

      if (params.isRemote) {
        queryParams.set('location', 'remote');
      }

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
      
      // API URL using the new endpoint - using trailing slash as the API redirects to this
      const apiUrl = `https://api.ziprecruiter.com/jobs/?${queryParams.toString()}`;

      // API headers with Bearer token authentication
      const headers = {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      };
      
      // Call the API with the new authentication method
      const data = await fetchZipRecruiterApi(apiUrl, headers);

      if (!data.jobs) {
        console.error('No jobs found in ZipRecruiter response');
        return [];
      }
      
      // Calculate pagination info
      const totalJobs = data.total_jobs || data.jobs.length;
      const totalPages = Math.ceil(totalJobs / params.pageSize);

      // Map API response to our Job interface
      return data.jobs.map((job: any) => {
        // Normalize the job data to our schema
        return {
          id: `ziprecruiter_${job.id || job.job_id}`,
          source: 'ZipRecruiter',
          sourceId: job.id || job.job_id,
          title: job.name || job.title,
          company: job.hiring_company?.name || job.company_name || 'Unknown Company',
          location: job.location || job.city_state_country || 'Unknown Location',
          description: job.snippet || job.description_preview || job.description || '',
          fullDescription: job.description || job.snippet || '',
          applyUrl: job.url || job.apply_url || job.job_url,
          salary: job.salary_formatted || job.salary_range || '',
          datePosted: job.posted_time || job.posted_date || new Date().toISOString(),
          jobType: job.employment_type || job.job_type || '',
          isRemote: job.remote || job.location?.toLowerCase().includes('remote') || false,
          logo: job.hiring_company?.logo || job.company_logo || '',
          tags: job.category ? [job.category] : [],
          benefits: job.benefits || [],
          requirements: job.requirements || [],
          isSaved: false,
          isApplied: false,
        };
      });
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
      // Extract the actual job ID from our prefixed ID
      const jobId = id.replace('ziprecruiter_', '');
      
      // API URL for specific job with the new endpoint - using trailing slash
      const apiUrl = `https://api.ziprecruiter.com/jobs/${jobId}/`;
      
      // API headers with Bearer token authentication
      const headers = {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      };
      
      // Call the API with the new authentication method
      const data = await fetchZipRecruiterApi(apiUrl, headers);
      
      if (!data.job) {
        console.error('No job found in ZipRecruiter response');
        return null;
      }
      
      const job = data.job;
      
      // Map API response to our Job interface with the normalized schema
      return {
        id: `ziprecruiter_${job.id || job.job_id}`,
        source: 'ZipRecruiter',
        sourceId: job.id || job.job_id,
        title: job.name || job.title,
        company: job.hiring_company?.name || job.company_name || 'Unknown Company',
        location: job.location || job.city_state_country || 'Unknown Location',
        description: job.snippet || job.description_preview || job.description || '',
        fullDescription: job.description || job.snippet || '',
        applyUrl: job.url || job.apply_url || job.job_url,
        salary: job.salary_formatted || job.salary_range || '',
        datePosted: job.posted_time || job.posted_date || new Date().toISOString(),
        jobType: job.employment_type || job.job_type || '',
        isRemote: job.remote || job.location?.toLowerCase().includes('remote') || false,
        logo: job.hiring_company?.logo || job.company_logo || '',
        tags: job.category ? [job.category] : [],
        benefits: job.benefits || [],
        requirements: job.requirements || [],
        isSaved: false,
        isApplied: false,
      };
    } catch (error) {
      console.error('Error getting ZipRecruiter job:', error);
      return null;
    }
  },
};