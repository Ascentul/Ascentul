import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth';
import { jobSourceRegistry } from '../services/job-sources';
import { JobSearchParams } from '../../shared/jobs';
import { z } from 'zod';
import { IStorage } from '../storage';

const jobSearchParamsSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  location: z.string().optional(),
  radius: z.number().positive().optional(),
  page: z.number().positive().optional(),
  pageSize: z.number().positive().optional(),
  isRemote: z.boolean().optional(),
  jobType: z.string().optional(),
  datePosted: z.string().optional(),
  salary: z.string().optional(),
  sortBy: z.enum(['relevance', 'date']).optional(),
});

export function registerJobRoutes(router: Router, storage: IStorage) {
  // Get list of available job sources
  router.get('/api/jobs/sources', requireAuth, (req: Request, res: Response) => {
    try {
      const sources = jobSourceRegistry.getAllProviders().map(provider => ({
        name: provider.name,
        icon: provider.icon,
        enabled: provider.enabled
      }));
      
      res.json({ sources });
    } catch (error) {
      console.error('Error getting job sources:', error);
      res.status(500).json({ message: 'Failed to get job sources' });
    }
  });

  // Search for jobs
  router.get('/api/jobs/search', requireAuth, async (req: Request, res: Response) => {
    try {
      // Validate and extract search parameters
      const params = jobSearchParamsSchema.parse({
        query: req.query.query || '',
        location: req.query.location,
        radius: req.query.radius ? parseInt(req.query.radius as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 10,
        isRemote: req.query.isRemote === 'true',
        jobType: req.query.jobType,
        datePosted: req.query.datePosted,
        salary: req.query.salary,
        sortBy: req.query.sortBy || 'relevance',
      });

      // If source specified, search that source only
      const source = req.query.source as string;
      if (source) {
        const provider = jobSourceRegistry.getProvider(source);
        if (!provider) {
          return res.status(404).json({ message: `Job source '${source}' not found` });
        }
        
        if (!provider.enabled) {
          return res.status(400).json({ message: `Job source '${source}' is disabled` });
        }
        
        const results = await provider.searchJobs(params);
        return res.json(results);
      }
      
      // Otherwise search all enabled sources
      const results = await jobSourceRegistry.searchAllJobs(params);
      res.json({
        jobs: results.combinedJobs,
        totalJobs: results.totalJobs,
        sources: results.results.map(r => r.source),
        currentPage: params.page || 1
      });
    } catch (error) {
      console.error('Error searching jobs:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid search parameters', 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: 'Failed to search jobs' });
    }
  });

  // Get job details by ID
  router.get('/api/jobs/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const jobId = req.params.id;
      
      // Parse the ID to determine the source
      // Format: {source}-{sourceId}
      const parts = jobId.split('-');
      if (parts.length < 2) {
        return res.status(400).json({ message: 'Invalid job ID format' });
      }
      
      const source = parts[0];
      const sourceId = parts.slice(1).join('-'); // In case the original ID contained hyphens
      
      const provider = jobSourceRegistry.getProvider(source);
      if (!provider) {
        return res.status(404).json({ message: `Job source '${source}' not found` });
      }
      
      if (!provider.getJobDetails) {
        return res.status(404).json({ message: `Job details not available for source '${source}'` });
      }
      
      const job = await provider.getJobDetails(sourceId);
      
      // Check if job is saved/applied for the current user
      const userId = req.session.userId;
      if (userId) {
        // Check for saved status (this would use your storage interface)
        // const isSaved = await storage.isJobSaved(userId, jobId);
        // const isApplied = await storage.isJobApplied(userId, jobId);
        // job.isSaved = isSaved;
        // job.isApplied = isApplied;
      }
      
      res.json(job);
    } catch (error) {
      console.error('Error getting job details:', error);
      res.status(500).json({ message: 'Failed to get job details' });
    }
  });

  // Save a job for later
  router.post('/api/jobs/:id/save', requireAuth, async (req: Request, res: Response) => {
    try {
      const jobId = req.params.id;
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Save the job for the user
      // await storage.saveJob(userId, jobId, req.body);
      
      res.json({ success: true, message: 'Job saved successfully' });
    } catch (error) {
      console.error('Error saving job:', error);
      res.status(500).json({ message: 'Failed to save job' });
    }
  });

  // Mark a job as applied
  router.post('/api/jobs/:id/apply', requireAuth, async (req: Request, res: Response) => {
    try {
      const jobId = req.params.id;
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Mark the job as applied
      // await storage.markJobApplied(userId, jobId, req.body);
      
      res.json({ success: true, message: 'Job marked as applied' });
    } catch (error) {
      console.error('Error marking job as applied:', error);
      res.status(500).json({ message: 'Failed to mark job as applied' });
    }
  });
}