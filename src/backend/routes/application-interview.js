import { requireLoginFallback } from '../auth';
import { z } from 'zod';
export function registerApplicationInterviewRoutes(app, storage) {
    // Get interview stages for an application
    app.get('/applications/:applicationId/stages', requireLoginFallback, async (req, res) => {
        try {
            const applicationId = parseInt(req.params.applicationId);
            if (isNaN(applicationId)) {
                return res.status(400).json({ message: "Invalid application ID" });
            }
            // Get current user from session
            const userId = req.userId;
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
        }
        catch (error) {
            console.error('Error fetching application interview stages:', error);
            res.status(500).json({ message: "Error fetching interview stages" });
        }
    });
    // Create a new interview stage for an application
    app.post('/applications/:applicationId/stages', requireLoginFallback, async (req, res) => {
        try {
            const applicationId = parseInt(req.params.applicationId);
            if (isNaN(applicationId)) {
                return res.status(400).json({ message: "Invalid application ID" });
            }
            // Get current user from session
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            // Debug logging
            console.log(`Attempting to get application with ID: ${applicationId} for user ${userId}`);
            // Note: We don't need to get all applications as we'll check the specific one below
            console.log(`Checking if application ${applicationId} belongs to user ${userId}`);
            // Get the application to verify ownership
            const application = await storage.getJobApplication(applicationId);
            if (!application) {
                console.log(`ERROR: Application with ID ${applicationId} not found`);
                // For debugging, if application not found, check if there's a mismatch in ID type
                console.log(`Debug: Checking all application IDs to match ${applicationId} (${typeof applicationId})`);
                const allApps = [];
                for (let testId = 1; testId <= 10; testId++) {
                    const testApp = await storage.getJobApplication(testId);
                    if (testApp)
                        allApps.push({ id: testId, userId: testApp.userId });
                }
                console.log(`Found these applications:`, allApps);
            }
            else {
                console.log(`Application found:`, {
                    id: application.id,
                    userId: application.userId,
                    jobTitle: application.jobTitle || application.title,
                    company: application.company,
                    status: application.status
                });
            }
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
        }
        catch (error) {
            console.error('Error creating application interview stage:', error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Invalid stage data", errors: error.errors });
            }
            res.status(500).json({ message: "Error creating interview stage" });
        }
    });
    // Get follow-up actions for an application
    app.get('/applications/:applicationId/followups', requireLoginFallback, async (req, res) => {
        try {
            const applicationId = parseInt(req.params.applicationId);
            if (isNaN(applicationId)) {
                return res.status(400).json({ message: "Invalid application ID" });
            }
            // Get current user from session
            const userId = req.userId;
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
        }
        catch (error) {
            console.error('Error fetching application followup actions:', error);
            res.status(500).json({ message: "Error fetching followup actions" });
        }
    });
    // Create a new follow-up action for an application
    app.post('/applications/:applicationId/followups', requireLoginFallback, async (req, res) => {
        try {
            const applicationId = parseInt(req.params.applicationId);
            if (isNaN(applicationId)) {
                return res.status(400).json({ message: "Invalid application ID" });
            }
            // Get current user from session
            const userId = req.userId;
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
        }
        catch (error) {
            console.error('Error creating application followup action:', error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Invalid followup action data", errors: error.errors });
            }
            res.status(500).json({ message: "Error creating followup action" });
        }
    });
}
