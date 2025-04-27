/**
 * Utility functions for working with interview stages
 * This centralizes all operations for interview stages to ensure consistency
 */

import { InterviewStage, JobApplication } from '@shared/schema';

// Constants for localStorage keys
export const MOCK_STAGES_PREFIX = 'mockStages_';
export const MOCK_INTERVIEW_STAGES_PREFIX = 'mockInterviewStages_';

// Constants for event names - keep these consistent across the application
export const INTERVIEW_DATA_CHANGED_EVENT = 'interviewDataChanged';
export const INTERVIEW_STAGE_ADDED_EVENT = 'interviewStageAdded';
export const INTERVIEW_STAGE_UPDATED_EVENT = 'interviewStageUpdated';
export const INTERVIEW_COUNT_UPDATE_EVENT = 'interviewCountUpdate';

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
  
  // Convert back to array and sort by date
  const result = Array.from(uniqueStages.values());
  return result.sort((a, b) => {
    if (!a.scheduledDate) return 1;
    if (!b.scheduledDate) return -1;
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
  });
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
  
  // Save to both storage patterns for maximum compatibility
  localStorage.setItem(stagesKey, stagesJson);
  localStorage.setItem(interviewStagesKey, stagesJson);
  
  // Trigger events to notify components of the change
  notifyInterviewDataChanged();
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
    status: stage.status || 'scheduled',
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
  
  // Trigger specific event for stage addition
  const stageAddedEvent = new CustomEvent(INTERVIEW_STAGE_ADDED_EVENT, {
    detail: { 
      stage: newStage,
      applicationId: applicationId 
    }
  });
  window.dispatchEvent(stageAddedEvent);
  
  // Also notify the interview count to update
  const countUpdateEvent = new Event(INTERVIEW_COUNT_UPDATE_EVENT);
  window.dispatchEvent(countUpdateEvent);
  
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
  
  // Trigger specific event for stage update
  const stageUpdatedEvent = new CustomEvent(INTERVIEW_STAGE_UPDATED_EVENT, {
    detail: { 
      stage: stage,
      applicationId: stage.applicationId 
    }
  });
  window.dispatchEvent(stageUpdatedEvent);
  
  return stage;
}

/**
 * Loads all interview stages for all applications
 */
export function loadAllInterviewStages(): Record<number, InterviewStage[]> {
  const allStages: Record<number, InterviewStage[]> = {};
  
  // First check for application data from localStorage
  const applications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
  
  // For debugging, scan for ALL potential interview stage entries
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    // Only process storage keys that match our patterns
    if (!key.includes(MOCK_STAGES_PREFIX) && !key.includes(MOCK_INTERVIEW_STAGES_PREFIX)) {
      continue;
    }
    
    try {
      // Extract the application ID from the key
      const prefix = key.includes(MOCK_STAGES_PREFIX) ? MOCK_STAGES_PREFIX : MOCK_INTERVIEW_STAGES_PREFIX;
      const appId = Number(key.replace(prefix, ''));
      
      if (!isNaN(appId) && appId > 0) {
        // Load stages for this application
        const stages = loadInterviewStagesForApplication(appId);
        if (stages.length > 0) {
          // If we found stages, look up the application info
          const app = applications.find((a: any) => a.id === appId);
          
          // Add application metadata to each stage if available
          const stagesWithMeta = stages.map(stage => ({
            ...stage,
            companyName: app?.company || app?.companyName || 'Unknown Company',
            jobTitle: app?.title || app?.jobTitle || app?.position || 'Unknown Position'
          }));
          
          // Store in our result map
          allStages[appId] = stagesWithMeta;
          
          // If the application exists but isn't in Interviewing status, update it
          if (app && app.status !== 'Interviewing') {
            updateApplicationInterviewStatus(appId);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing stages for key ${key}:`, error);
    }
  }
  
  return allStages;
}

/**
 * Helper to ensure application status is set to "Interviewing" if it has interview stages
 */
function updateApplicationInterviewStatus(applicationId: number | string): void {
  const applications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
  const appIndex = applications.findIndex((app: any) => app.id.toString() === applicationId.toString());
  
  if (appIndex !== -1) {
    // Only update if needed
    if (applications[appIndex].status !== 'Interviewing') {
      applications[appIndex].status = 'Interviewing';
      applications[appIndex].updatedAt = new Date().toISOString();
      localStorage.setItem('mockJobApplications', JSON.stringify(applications));
      
      // Also notify that application status changed
      const event = new Event('applicationStatusChange');
      window.dispatchEvent(event);
    }
  }
}

/**
 * Get all applications in "Interviewing" status
 */
export function getInterviewingApplications(): JobApplication[] {
  const applications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
  return applications.filter((app: JobApplication) => app.status === 'Interviewing');
}

/**
 * Trigger an event to notify components that interview data has changed
 * This will cause all components that listen for this event to update
 */
export function notifyInterviewDataChanged(): void {
  // General interview data changed event
  const dataChangedEvent = new Event(INTERVIEW_DATA_CHANGED_EVENT);
  window.dispatchEvent(dataChangedEvent);
  
  // Also dispatch a generic 'storage' event to trigger localStorage listeners
  try {
    // Create a StorageEvent-like object
    const storageEvent = new StorageEvent('storage', {
      key: 'mockInterviewStages',
      newValue: '{}',
      oldValue: '{}',
      storageArea: localStorage
    });
    window.dispatchEvent(storageEvent);
  } catch (e) {
    // Some browsers may not support creating StorageEvent this way
    // The primary interviewDataChanged event should still work
  }
  
  // Count update event
  const countEvent = new Event(INTERVIEW_COUNT_UPDATE_EVENT);
  window.dispatchEvent(countEvent);
}