import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth';
import { jobProviders } from '../services/job-sources';
import { IStorage } from '../storage';

export function registerJobRoutes(app: Router, storage: IStorage) {
  // Get available job sources
  app.get('/api/jobs/sources', (req: Request, res: Response) => {
    try {
      const sources = Object.keys(jobProviders).map(id => ({
        id,
        name: jobProviders[id].name,
      }));
      
      return res.json({ sources });
    } catch (error) {
      console.error('Error getting job sources:', error);
      return res.status(500).json({ message: 'Failed to get job sources' });
    }
  });

  // Search for jobs
  app.get('/api/jobs/search', async (req: Request, res: Response) => {
    try {
      const { 
        query = '', 
        location = '', 
        jobType = '',
        source = '',
        isRemote,
        page = '1',
        pageSize = '10' 
      } = req.query;

      console.log('Job search request:', { query, location, jobType, source, isRemote, page, pageSize });

      // Use the specified provider or default to using all providers
      const providers = source 
        ? [jobProviders[source as string]].filter(Boolean)
        : Object.values(jobProviders);
      
      if (providers.length === 0) {
        return res.status(400).json({ message: 'Invalid job source provider' });
      }
      
      // Map query parameters
      const searchParams = {
        query: query as string,
        location: location as string,
        jobType: jobType as string,
        isRemote: isRemote === 'true',
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      };
      
      // Execute search across all providers or the specified provider
      const allJobs = [];
      for (const provider of providers) {
        try {
          console.log(`Searching jobs with provider: ${provider.name}`);
          const results = await provider.searchJobs(searchParams);
          console.log(`Found ${results.length} jobs from ${provider.name}`);
          allJobs.push(...results);
        } catch (providerError) {
          console.error(`Error searching jobs with provider ${provider.name}:`, providerError);
          // Continue with other providers
        }
      }
      
      // Simple pagination handling (should be improved for a production app)
      const startIndex = (searchParams.page - 1) * searchParams.pageSize;
      const endIndex = startIndex + searchParams.pageSize;
      const paginatedJobs = allJobs.slice(startIndex, endIndex);
      
      console.log(`Returning ${paginatedJobs.length} jobs, total: ${allJobs.length}`);
      
      return res.json({
        jobs: paginatedJobs,
        totalJobs: allJobs.length,
        currentPage: searchParams.page,
        pageCount: Math.ceil(allJobs.length / searchParams.pageSize),
      });
    } catch (error) {
      console.error('Error searching jobs:', error);
      return res.status(500).json({ message: 'Failed to search jobs' });
    }
  });

  // Get job details
  app.get('/api/jobs/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { source } = req.query;
      
      // Job ID format: {provider-id}_{job-id}
      const [providerId, jobId] = id.split('_');
      
      // Use the specified provider from query or from the job ID
      const provider = source 
        ? jobProviders[source as string]
        : jobProviders[providerId];
      
      if (!provider) {
        return res.status(400).json({ message: 'Invalid job source provider' });
      }
      
      const job = await provider.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      return res.json({ job });
    } catch (error) {
      console.error('Error getting job details:', error);
      return res.status(500).json({ message: 'Failed to get job details' });
    }
  });

  // Save job (add to favorites/saved jobs)
  app.post('/api/jobs/save', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId } = req.session;
      const { job } = req.body;
      
      if (!job || !job.id) {
        return res.status(400).json({ message: 'Invalid job data' });
      }
      
      // In a real implementation, save to database
      // For now, just return success
      console.log(`User ${userId} saved job ${job.id}`);
      
      return res.json({ success: true, message: 'Job saved' });
    } catch (error) {
      console.error('Error saving job:', error);
      return res.status(500).json({ message: 'Failed to save job' });
    }
  });
}