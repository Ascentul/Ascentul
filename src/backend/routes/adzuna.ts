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
  app.get('/adzuna/jobs', async (req: Request, res: Response) => {
    try {
      // Validate input parameters
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
      
      // Make the API request with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        // Make the API request
        const response = await fetch(`${ADZUNA_BASE_URL}?${params.toString()}`, {
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          let errorMessage = 'Error fetching jobs from Adzuna';
          
          try {
            // Try to parse as JSON first
            const errorData = await response.json();
            console.error('Adzuna API error (JSON):', errorData);
            return res.status(response.status).json({ 
              error: errorMessage,
              details: errorData
            });
          } catch (jsonError) {
            // If not JSON, get it as text
            const errorText = await response.text();
            console.error('Adzuna API error (Text):', errorText);
            return res.status(response.status).json({ 
              error: errorMessage,
              details: errorText
            });
          }
        }
        
        // Parse the response JSON
        const data = await response.json();
        
        // Return the data
        return res.json(data);
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          console.error('Adzuna API request timed out');
          return res.status(504).json({ 
            error: 'Job search request timed out',
            details: 'The request to the job search service took too long to respond'
          });
        }
        
        console.error('Fetch error in job search:', fetchError);
        return res.status(500).json({ 
          error: 'Failed to connect to job search service',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError)
        });
      }
    } catch (validationError) {
      console.error('Validation error in job search:', validationError);
      return res.status(400).json({ 
        error: 'Invalid search parameters',
        details: validationError instanceof Error ? validationError.message : String(validationError)
      });
    }
  });
};