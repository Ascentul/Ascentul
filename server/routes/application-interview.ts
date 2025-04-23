import { Request, Response, Router } from 'express';
import { IStorage } from '../storage';
import { requireAuth, requireLoginFallback } from '../auth';
import { z } from 'zod';
import { insertInterviewStageSchema, insertFollowupActionSchema } from '@shared/schema';

export function registerApplicationInterviewRoutes(app: Router, storage: IStorage) {
  // Get interview stages for an application
  app.get('/api/applications/:applicationId/stages', requireLoginFallback, async (req: Request, res: Response) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid application ID" });
      }
      
      // Get current user from session
      const userId = req.session.userId as number;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get the application to verify ownership
      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Check if the application belongs to the current user
      if (application.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access stages for this application" });
      }
      
      // Get stages for this application
      const stages = await storage.getInterviewStagesForApplication(applicationId);
      res.status(200).json(stages);
    } catch (error) {
      console.error('Error fetching application interview stages:', error);
      res.status(500).json({ message: "Error fetching interview stages" });
    }
  });
  
  // Create a new interview stage for an application
  app.post('/api/applications/:applicationId/stages', requireAuth, async (req: Request, res: Response) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid application ID" });
      }
      
      // Get current user from session
      const userId = req.session.userId as number;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get the application to verify ownership
      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Check if the application belongs to the current user
      if (application.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to add stages to this application" });
      }
      
      // If the application isn't in "Interviewing" status, update it
      if (application.status !== "Interviewing") {
        // Update the application status to "Interviewing"
        await storage.updateJobApplication(applicationId, {
          ...application,
          status: "Interviewing"
        });
        
        console.log(`Updated application ${applicationId} status to "Interviewing"`);
      }
      
      // Parse the stage data
      const stageData = {
        ...req.body,
        applicationId
      };
      
      // Create the stage
      const stage = await storage.createInterviewStageForApplication(applicationId, stageData);
      res.status(201).json(stage);
    } catch (error) {
      console.error('Error creating application interview stage:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid stage data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating interview stage" });
    }
  });
  
  // Get follow-up actions for an application
  app.get('/api/applications/:applicationId/followups', requireLoginFallback, async (req: Request, res: Response) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid application ID" });
      }
      
      // Get current user from session
      const userId = req.session.userId as number;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get the application to verify ownership
      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Check if the application belongs to the current user
      if (application.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access followups for this application" });
      }
      
      // Get follow-up actions for this application
      const actions = await storage.getFollowupActionsForApplication(applicationId);
      res.status(200).json(actions);
    } catch (error) {
      console.error('Error fetching application followup actions:', error);
      res.status(500).json({ message: "Error fetching followup actions" });
    }
  });
  
  // Create a new follow-up action for an application
  app.post('/api/applications/:applicationId/followups', requireAuth, async (req: Request, res: Response) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid application ID" });
      }
      
      // Get current user from session
      const userId = req.session.userId as number;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get the application to verify ownership
      const application = await storage.getJobApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Check if the application belongs to the current user
      if (application.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to add followups to this application" });
      }
      
      // Parse the action data
      const actionData = {
        ...req.body,
        applicationId
      };
      
      // Create the follow-up action
      const action = await storage.createFollowupActionForApplication(applicationId, actionData);
      res.status(201).json(action);
    } catch (error) {
      console.error('Error creating application followup action:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid followup action data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating followup action" });
    }
  });
}