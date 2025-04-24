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
      
      // Check for stages with status "scheduled"
      interviewingApps.forEach((app: any) => {
        try {
          const stagesJson = localStorage.getItem(`mockStages_${app.id}`);
          if (!stagesJson) return;
          
          const appStages = JSON.parse(stagesJson);
          if (!Array.isArray(appStages)) return;
          
          // Count scheduled stages with future dates
          const now = new Date();
          const scheduledStages = appStages.filter((stage: any) => 
            stage && 
            stage.status === 'scheduled' && 
            new Date(stage.scheduledDate) > now
          );
          
          scheduledInterviewsCount += scheduledStages.length;
        } catch (error) {
          console.error(`Error counting stages for application ${app.id}:`, error);
        }
      });
      
      console.log(`Local count: ${appCount} interviewing applications, ${scheduledInterviewsCount} scheduled interviews`);
      
      // For this stat card, we want to count the applications, not individual interviews
      // We could use Math.max(appCount, scheduledInterviewsCount) to avoid double counting
      // Or we could use appCount + scheduledInterviewsCount to count both
      // For now, let's just count the applications as requested
      const totalCount = appCount;
      
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
          const apiCount = apiInterviewingApps.length;
          
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
    // Initial count
    updateInterviewCount();
    
    // Listen for localStorage changes relevant to interviews
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === 'mockJobApplications' || 
        (event.key && event.key.startsWith('mockStages_'))
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
      
      // Clear the interval
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