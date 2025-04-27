import React, { createContext, useState, useContext, useCallback, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

// Event name constants for updates
export const INTERVIEW_COUNT_UPDATE_EVENT = 'interviewCountUpdate';
export const APPLICATION_STATUS_CHANGE_EVENT = 'applicationStatusChange';
export const INTERVIEW_STAGE_CHANGE_EVENT = 'interviewStageChange';

// Context type definition
type UpcomingInterviewsContextType = {
  upcomingInterviewCount: number;
  updateInterviewCount: () => Promise<number>;
};

// Create the context
const UpcomingInterviewsContext = createContext<UpcomingInterviewsContextType | undefined>(undefined);

export function UpcomingInterviewsProvider({ children }: { children: ReactNode }) {
  // Start with 0 and immediately fetch accurate count
  const [upcomingInterviewCount, setUpcomingInterviewCount] = useState(0);
  
  // Function to count applications in interview stage and upcoming interviews
  const updateInterviewCount = useCallback(async (): Promise<number> => {
    try {
      // First try to load from localStorage
      let localApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
      if (!Array.isArray(localApplications)) {
        localApplications = [];
      }
      
      // Filter applications with status "Interviewing"
      const interviewingApps = localApplications.filter((app: any) => app.status === 'Interviewing');
      
      // Count interviewing applications
      const appCount = interviewingApps.length;
      
      // Count upcoming interviews from stages
      let scheduledInterviewsCount = 0;
      
      // Check for stages with status "scheduled" or "pending" from both patterns
      // Define a helper to check stages for a single app using a specific pattern
      const checkAppStagesWithPattern = (app: any, keyPattern: string): number => {
        try {
          const stagesJson = localStorage.getItem(`${keyPattern}${app.id}`);
          if (!stagesJson) return 0;
          
          const appStages = JSON.parse(stagesJson);
          if (!Array.isArray(appStages)) return 0;
          
          // Count scheduled or pending stages with future dates
          const now = new Date();
          const scheduledStages = appStages.filter((stage: any) => {
            // Ensure we have a valid stage with scheduledDate
            if (!stage || !stage.scheduledDate) return false;
            
            // Check if it has status or outcome of 'scheduled' or 'pending'
            const isScheduledOrPending = (
              stage.status === 'scheduled' || 
              stage.status === 'pending' || 
              stage.outcome === 'scheduled' || 
              stage.outcome === 'pending'
            );
            
            // Check if the date is in the future
            const isInFuture = new Date(stage.scheduledDate) > now;
            
            return isScheduledOrPending && isInFuture;
          });
          
          return scheduledStages.length;
        } catch (error) {
          console.error(`Error counting stages for application ${app.id} with pattern ${keyPattern}:`, error);
          return 0;
        }
      };
      
      // A set to track seen stage IDs and avoid double-counting
      const processedStageIds = new Set<number>();
      
      // First check all interviewing applications for stages in both patterns
      interviewingApps.forEach((app: any) => {
        // Check both key patterns for each application
        scheduledInterviewsCount += checkAppStagesWithPattern(app, 'mockStages_');
        scheduledInterviewsCount += checkAppStagesWithPattern(app, 'mockInterviewStages_');
      });
      
      // Also scan all localStorage keys for any interview stages regardless of application status
      // This catches any interviews where the application status might be inconsistent
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // Only process interview stage keys
        if (!key.includes('mockStages_') && !key.includes('mockInterviewStages_')) continue;
        
        try {
          const stagesJson = localStorage.getItem(key);
          if (!stagesJson) continue;
          
          const stages = JSON.parse(stagesJson);
          if (!Array.isArray(stages)) continue;
          
          // Check each stage for scheduled/pending status with future dates
          const now = new Date();
          
          stages.forEach((stage: any) => {
            // Skip if we've already counted this stage ID
            if (processedStageIds.has(stage.id)) return;
            
            // Check if it's a valid interview with a future date
            if (!stage || !stage.scheduledDate) return;
            
            const isScheduledOrPending = (
              stage.status === 'scheduled' || 
              stage.status === 'pending' || 
              stage.outcome === 'scheduled' || 
              stage.outcome === 'pending'
            );
            
            const isInFuture = new Date(stage.scheduledDate) > now;
            
            if (isScheduledOrPending && isInFuture) {
              // Count this stage and mark it as processed
              processedStageIds.add(stage.id);
              scheduledInterviewsCount++;
            }
          });
        } catch (error) {
          console.error(`Error processing stages from key ${key}:`, error);
        }
      }
      
      console.log(`Local count: ${appCount} interviewing applications, ${scheduledInterviewsCount} scheduled interviews`);
      
      // For this stat card, we want to include both applications in interviewing status
      // and those with scheduled interviews
      // If an application has scheduled interviews, we'll count that instead of just the app status
      // This ensures the count reflects actual upcoming interviews
      const totalCount = scheduledInterviewsCount > 0 ? scheduledInterviewsCount : appCount;
      
      // Always prioritize API count if available
      try {
        const response = await apiRequest('GET', '/api/job-applications');
        if (!response.ok) {
          console.error(`API error fetching applications: ${response.status}`);
          return totalCount; // Return local count on API error
        }
        
        const apiApplications = await response.json();
        
        if (Array.isArray(apiApplications)) {
          // Count applications with status "Interviewing" from API
          const apiInterviewingApps = apiApplications.filter((app: any) => app.status === 'Interviewing');
          
          // Also check for scheduled interviews from API (if available)
          // For now, we'll continue to use the localStorage count for scheduled interviews
          // since that's more reliable than the API data at this point
          let apiScheduledInterviewCount = 0;
          
          // Prefer scheduled interviews count if available, otherwise use interviewing apps count
          const apiCount = scheduledInterviewsCount > 0 ? scheduledInterviewsCount : apiInterviewingApps.length;
          
          // Always use API count as source of truth - don't store in localStorage to avoid conflicts
          setUpcomingInterviewCount(apiCount);
          
          // Remove localStorage entry to prevent conflicts
          try {
            localStorage.removeItem('upcomingInterviewCount');
          } catch (e) {
            // Ignore localStorage errors
          }
          
          return apiCount;
        }
      } catch (apiError) {
        console.error('Error fetching applications from API:', apiError);
      }
      
      return totalCount;
    } catch (error) {
      console.error('Error updating interview count:', error);
      return upcomingInterviewCount; // Return current count on error
    }
  }, [upcomingInterviewCount]);
  
  // Initialize and set up listeners
  useEffect(() => {
    // Run initial count immediately 
    updateInterviewCount();
    
    // Also run a delayed update to ensure we get accurate data
    // This helps when components mount in inconsistent order
    const initialTimer = setTimeout(() => {
      updateInterviewCount();
    }, 300);
    
    // Listen for localStorage changes relevant to interviews
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === 'mockJobApplications' || 
        (event.key && (event.key.startsWith('mockStages_') || event.key.startsWith('mockInterviewStages_')))
      ) {
        updateInterviewCount();
      }
    };
    
    // Set up custom events for components to trigger updates
    
    // Generic interview count update event
    const handleInterviewUpdate = () => {
      updateInterviewCount();
    };
    
    // Application status change event (like when moving to "Interviewing" status)
    const handleApplicationStatusChange = () => {
      updateInterviewCount();
    };
    
    // Interview stage change event (scheduled, completed, etc.)
    const handleInterviewStageChange = () => {
      updateInterviewCount();
    };
    
    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(INTERVIEW_COUNT_UPDATE_EVENT, handleInterviewUpdate as EventListener);
    window.addEventListener(APPLICATION_STATUS_CHANGE_EVENT, handleApplicationStatusChange as EventListener);
    window.addEventListener(INTERVIEW_STAGE_CHANGE_EVENT, handleInterviewStageChange as EventListener);
    
    // Also add simple, generic event names that don't require importing constants
    window.addEventListener('applicationStatusChange', handleApplicationStatusChange as EventListener);
    window.addEventListener('interviewStageChange', handleInterviewStageChange as EventListener);
    
    // Refresh every 2 seconds for much faster updates
    const interval = setInterval(() => {
      updateInterviewCount();
    }, 2000);
    
    return () => {
      // Clean up all event listeners
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(INTERVIEW_COUNT_UPDATE_EVENT, handleInterviewUpdate as EventListener);
      window.removeEventListener(APPLICATION_STATUS_CHANGE_EVENT, handleApplicationStatusChange as EventListener);
      window.removeEventListener(INTERVIEW_STAGE_CHANGE_EVENT, handleInterviewStageChange as EventListener);
      window.removeEventListener('applicationStatusChange', handleApplicationStatusChange as EventListener);
      window.removeEventListener('interviewStageChange', handleInterviewStageChange as EventListener);
      
      // Clear the timers
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [updateInterviewCount]);
  
  // Create context value
  const contextValue: UpcomingInterviewsContextType = {
    upcomingInterviewCount,
    updateInterviewCount,
  };
  
  return (
    <UpcomingInterviewsContext.Provider value={contextValue}>
      {children}
    </UpcomingInterviewsContext.Provider>
  );
}

// Hook for accessing the context
export function useUpcomingInterviews() {
  const context = useContext(UpcomingInterviewsContext);
  if (context === undefined) {
    throw new Error('useUpcomingInterviews must be used within an UpcomingInterviewsProvider');
  }
  return context;
}