import { Request, Response, Router } from 'express';
import { IStorage } from '../storage';
import { requireAuth, requireLoginFallback } from '../auth';
import { z } from 'zod';
import { insertJobApplicationSchema } from "../../utils/schema";

export function registerApplicationRoutes(app: Router, storage: IStorage) {
  // Debug route to check all existing applications (remove in production)
  app.get('/api/debug/applications', async (req: Request, res: Response) => {
    try {
      // Get applications for all users for debugging purposes
      const testUsers = [1, 2, 3]; // Try common user IDs
      let allApplications = [];
      
      // Get applications for each test user ID
      for (const userId of testUsers) {
        const userApps = await storage.getJobApplications(userId);
        allApplications = [...allApplications, ...userApps];
      }
      
      // Return information about the applications
      res.json({
        applications: allApplications,
        count: allApplications.length,
        userIds: testUsers
      });
    } catch (error) {
      console.error('Error in debug route:', error);
      res.status(500).json({ message: 'Debug route error', error: String(error) });
    }
  });
  // Get all applications for the current user
  app.get('/api/applications', requireLoginFallback, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const applications = await storage.getJobApplications(userId);
      res.json(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  });
  
  // Get all applications for job tracker (alias for /api/applications)
  app.get('/api/job-applications', requireLoginFallback, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      const applications = await storage.getJobApplications(userId);
      res.json(applications);
    } catch (error) {
      console.error('Error fetching job applications:', error);
      res.status(500).json({ message: 'Failed to fetch job applications' });
    }
  });

  // Get a specific application
  app.get('/api/applications/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId as number;
      
      const application = await storage.getJobApplication(id);
      
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      // Check if the application belongs to the user
      if (application.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to access this application' });
      }
      
      // Get application wizard steps
      const steps = await storage.getApplicationWizardSteps(id);
      
      res.json({
        application,
        steps
      });
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({ message: 'Failed to fetch application' });
    }
  });

  // Create a new application
  app.post('/api/applications', requireLoginFallback, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId as number;
      
      // Validate the input
      const applicationData = insertJobApplicationSchema.parse(req.body);
      
      // Create the application
      const newApplication = await storage.createJobApplication(userId, applicationData);
      
      // Create default wizard steps
      const steps = [
        {
          applicationId: newApplication.id,
          stepName: 'personal_info',
          stepOrder: 1,
          completed: false,
          data: {}
        },
        {
          applicationId: newApplication.id,
          stepName: 'resume',
          stepOrder: 2,
          completed: false,
          data: {}
        },
        {
          applicationId: newApplication.id,
          stepName: 'cover_letter',
          stepOrder: 3,
          completed: false,
          data: {}
        },
        {
          applicationId: newApplication.id,
          stepName: 'review',
          stepOrder: 4,
          completed: false,
          data: {}
        }
      ];
      
      for (const step of steps) {
        await storage.createApplicationWizardStep(newApplication.id, step);
      }
      
      // Fetch the created steps
      const createdSteps = await storage.getApplicationWizardSteps(newApplication.id);
      
      res.status(201).json({
        application: newApplication,
        steps: createdSteps
      });
    } catch (error) {
      console.error('Error creating application:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid application data', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create application' });
    }
  });

  // Update an application
  app.put('/api/applications/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId as number;
      
      // Check if the application exists and belongs to the user
      const existingApplication = await storage.getJobApplication(id);
      
      if (!existingApplication) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      if (existingApplication.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to update this application' });
      }
      
      // Update the application
      const updatedApplication = await storage.updateJobApplication(id, req.body);
      
      res.json(updatedApplication);
    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({ message: 'Failed to update application' });
    }
  });

  // Submit an application (mark as applied or in progress)
  app.post('/api/applications/:id/submit', requireLoginFallback, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId as number;
      const { applied = false } = req.body; // Get applied status from request body, default to false
      
      // Check if the application exists and belongs to the user
      const existingApplication = await storage.getJobApplication(id);
      
      if (!existingApplication) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      if (existingApplication.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to submit this application' });
      }
      
      try {
        // Submit the application with the applied status
        const submittedApplication = await storage.submitJobApplication(id, !!applied);
        res.json(submittedApplication);
      } catch (submitError) {
        // If there's a validation error from the storage layer, send it as a 400 error
        console.error('Error in submitJobApplication:', submitError);
        if (submitError instanceof Error) {
          return res.status(400).json({ 
            message: submitError.message || 'Could not submit application',
            details: 'Make sure all required steps are completed before submitting.'
          });
        }
        throw submitError; // Re-throw if it's not an Error instance
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      res.status(500).json({ message: 'Failed to submit application' });
    }
  });

  // Delete an application
  app.delete('/api/applications/:id', requireLoginFallback, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId as number;
      
      // Check if the application exists and belongs to the user
      const existingApplication = await storage.getJobApplication(id);
      
      if (!existingApplication) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      if (existingApplication.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to delete this application' });
      }
      
      // Delete the application
      await storage.deleteJobApplication(id);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting application:', error);
      res.status(500).json({ message: 'Failed to delete application' });
    }
  });

  // Application wizard step routes
  
  // Get all steps for an application
  app.get('/api/applications/:id/steps', requireLoginFallback, async (req: Request, res: Response) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = req.session.userId as number;
      
      // Check if the application exists and belongs to the user
      const application = await storage.getJobApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      if (application.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to access this application' });
      }
      
      // Get the steps
      const steps = await storage.getApplicationWizardSteps(applicationId);
      
      res.json(steps);
    } catch (error) {
      console.error('Error fetching application steps:', error);
      res.status(500).json({ message: 'Failed to fetch application steps' });
    }
  });

  // Update a specific step
  app.put('/api/applications/steps/:stepId', requireLoginFallback, async (req: Request, res: Response) => {
    try {
      const stepId = parseInt(req.params.stepId);
      const userId = req.session.userId as number;
      
      // Get the step
      const step = await storage.getApplicationWizardStep(stepId);
      
      if (!step) {
        return res.status(404).json({ message: 'Step not found' });
      }
      
      // Check if the application belongs to the user
      const application = await storage.getJobApplication(step.applicationId);
      
      if (!application || application.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to update this step' });
      }
      
      // Update the step
      const updatedStep = await storage.updateApplicationWizardStep(stepId, req.body);
      
      res.json(updatedStep);
    } catch (error) {
      console.error('Error updating application step:', error);
      res.status(500).json({ message: 'Failed to update application step' });
    }
  });

  // Mark a step as completed
  app.post('/api/applications/steps/:stepId/complete', requireLoginFallback, async (req: Request, res: Response) => {
    try {
      const stepId = parseInt(req.params.stepId);
      const userId = req.session.userId as number;
      
      // Get the step
      const step = await storage.getApplicationWizardStep(stepId);
      
      if (!step) {
        return res.status(404).json({ message: 'Step not found' });
      }
      
      // Check if the application belongs to the user
      const application = await storage.getJobApplication(step.applicationId);
      
      if (!application || application.userId !== userId) {
        return res.status(403).json({ message: 'You do not have permission to update this step' });
      }
      
      // Complete the step
      const completedStep = await storage.completeApplicationWizardStep(stepId);
      
      res.json(completedStep);
    } catch (error) {
      console.error('Error completing application step:', error);
      res.status(500).json({ message: 'Failed to complete application step' });
    }
  });
}