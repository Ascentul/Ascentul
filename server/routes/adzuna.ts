import { Request, Response } from 'express';
import { z } from 'zod';

// Adzuna API constants
const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs/us/search/1';
const ADZUNA_APP_ID = '***REMOVED***';
const ADZUNA_APP_KEY = '***REMOVED***';

// Validation schema for search params
const searchParamsSchema = z.object({
  keywords: z.string().min(1, "Keywords are required"),
  location: z.string().optional(),
  remoteOnly: z.union([
    z.boolean(),
    z.string().transform(val => val === 'true')
  ]).optional().default(false),
});

export const registerAdzunaRoutes = (app: any) => {
  app.get('/api/adzuna/jobs', async (req: Request, res: Response) => {
    try {
      const { keywords, location, remoteOnly } = searchParamsSchema.parse(req.query);
      
      // Build the query parameters
      const params = new URLSearchParams({
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_APP_KEY,
        results_per_page: '20',
        what: keywords,
      });
      
      // Add location if provided
      if (location) {
        params.append('where', location);
      }
      
      // Add remote filter if requested
      if (remoteOnly) {
        params.append('category', 'it-jobs'); // Focus on IT jobs which have more remote options
        params.append('title_only', 'remote'); // Look for remote in title
      }
      
      // Make the API request
      const response = await fetch(`${ADZUNA_BASE_URL}?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Adzuna API error:', errorData);
        return res.status(response.status).json({ 
          error: 'Error fetching jobs from Adzuna',
          details: errorData
        });
      }
      
      const data = await response.json();
      return res.json(data);
    } catch (error) {
      console.error('Error in job search:', error);
      return res.status(400).json({ 
        error: 'Invalid search parameters',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
};