/**
 * Utility functions for working with interview stages
 * This centralizes all operations for interview stages to ensure consistency
 */

import { InterviewStage, JobApplication } from '@shared/schema';

// Constants for localStorage keys
export const MOCK_STAGES_PREFIX = 'mockStages_';
export const MOCK_INTERVIEW_STAGES_PREFIX = 'mockInterviewStages_';

/**
 * Loads all interview stages for a specific application from localStorage
 * Checks both storage patterns for maximum compatibility
 */
export function loadInterviewStagesForApplication(applicationId: number | string): InterviewStage[] {
  if (!applicationId) return [];
  
  const stagesKey = `${MOCK_STAGES_PREFIX}${applicationId}`;
  const interviewStagesKey = `${MOCK_INTERVIEW_STAGES_PREFIX}${applicationId}`;
  
  // Try to load from both storage patterns
  const stagesJson = localStorage.getItem(stagesKey);
  const interviewStagesJson = localStorage.getItem(interviewStagesKey);
  
  // Parse stages from both sources
  const stages: InterviewStage[] = stagesJson ? JSON.parse(stagesJson) : [];
  const interviewStages: InterviewStage[] = interviewStagesJson ? JSON.parse(interviewStagesJson) : [];
  
  // Deduplicate stages by ID
  const uniqueStages = new Map<number, InterviewStage>();
  
  // Add stages from first source
  stages.forEach(stage => {
    if (stage && stage.id) {
      uniqueStages.set(stage.id, stage);
    }
  });
  
  // Add stages from second source, overwriting duplicates
  interviewStages.forEach(stage => {
    if (stage && stage.id) {
      uniqueStages.set(stage.id, stage);
    }
  });
  
  // Convert back to array
  return Array.from(uniqueStages.values());
}

/**
 * Saves interview stages for an application to localStorage
 * Ensures stages are saved to both storage patterns for compatibility
 */
export function saveInterviewStagesForApplication(applicationId: number | string, stages: InterviewStage[]): void {
  if (!applicationId || !stages) return;
  
  const stagesKey = `${MOCK_STAGES_PREFIX}${applicationId}`;
  const interviewStagesKey = `${MOCK_INTERVIEW_STAGES_PREFIX}${applicationId}`;
  
  const stagesJson = JSON.stringify(stages);
  
  // Save to both storage patterns
  localStorage.setItem(stagesKey, stagesJson);
  localStorage.setItem(interviewStagesKey, stagesJson);
}

/**
 * Adds a new interview stage for an application
 * Ensures it's saved to both storage patterns
 */
export function addInterviewStageForApplication(applicationId: number | string, stage: InterviewStage): InterviewStage {
  if (!applicationId || !stage) throw new Error('Application ID and stage are required');
  
  // Ensure stage has required properties
  const now = new Date().toISOString();
  const newStage: any = {
    ...stage,
    id: stage.id || Date.now(), // Use provided ID or generate timestamp ID
    applicationId: Number(applicationId),
    outcome: stage.outcome || 'scheduled', // For consistency with dashboard display
    createdAt: stage.createdAt || now,
    updatedAt: now
  };
  
  // Load existing stages
  const existingStages = loadInterviewStagesForApplication(applicationId);
  
  // Add new stage
  const updatedStages = [...existingStages, newStage];
  
  // Save updated stages
  saveInterviewStagesForApplication(applicationId, updatedStages);
  
  // Update application status if needed
  updateApplicationInterviewStatus(applicationId);
  
  return newStage;
}

/**
 * Updates an existing interview stage
 */
export function updateInterviewStage(stage: InterviewStage): InterviewStage {
  if (!stage || !stage.id || !stage.applicationId) {
    throw new Error('Stage ID and Application ID are required');
  }
  
  // Load existing stages
  const existingStages = loadInterviewStagesForApplication(stage.applicationId);
  
  // Find and update the stage
  const updatedStages = existingStages.map(existingStage => {
    if (existingStage.id === stage.id) {
      // Create a proper copy with updatedAt consistently handled
      return {
        ...stage,
        // Store updatedAt as ISO string (consistent with localStorage format)
        updatedAt: typeof stage.updatedAt === 'object' && stage.updatedAt instanceof Date
          ? stage.updatedAt.toISOString() 
          : typeof stage.updatedAt === 'string'
            ? stage.updatedAt
            : new Date().toISOString()
      };
    }
    return existingStage;
  });
  
  // Save updated stages
  saveInterviewStagesForApplication(stage.applicationId, updatedStages);
  
  return stage;
}

/**
 * Loads all interview stages for all applications
 */
export function loadAllInterviewStages(): Record<number, InterviewStage[]> {
  const allStages: Record<number, InterviewStage[]> = {};
  
  // Get all applications
  const applications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
  
  // Load stages for each application
  applications.forEach((app: JobApplication) => {
    if (app && app.id) {
      allStages[app.id] = loadInterviewStagesForApplication(app.id);
    }
  });
  
  return allStages;
}

/**
 * Helper to ensure application status is set to "Interviewing" if it has interview stages
 */
function updateApplicationInterviewStatus(applicationId: number | string): void {
  const applications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
  const appIndex = applications.findIndex((app: any) => app.id.toString() === applicationId.toString());
  
  if (appIndex !== -1) {
    applications[appIndex].status = 'Interviewing';
    applications[appIndex].updatedAt = new Date().toISOString();
    localStorage.setItem('mockJobApplications', JSON.stringify(applications));
  }
}

/**
 * Get all applications in "Interviewing" status
 */
export function getInterviewingApplications(): JobApplication[] {
  const applications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
  return applications.filter((app: JobApplication) => app.status === 'Interviewing');
}

// Trigger an event to notify components that interview data has changed
export function notifyInterviewDataChanged(): void {
  const event = new Event('interviewDataChanged');
  window.dispatchEvent(event);
}