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
      
      // DETAILED DEBUGGING APPROACH
      // Count ALL stages regardless of status or date
      const allStages: any[] = [];
      const allStagesSet = new Set<number>();
      
      // Directly count ALL interview stages from localStorage regardless of status
      console.log("=========== ALL INTERVIEW STAGES DEBUGGING ===========");
      
      // Scan all localStorage for interview stages - get a complete picture
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // Only process interview stage keys
        if (!key.includes('mockStages_') && !key.includes('mockInterviewStages_')) continue;
        
        console.log(`Checking key: ${key}`);
        
        try {
          const stagesJson = localStorage.getItem(key);
          if (!stagesJson) {
            console.log(`  Key ${key} has no content`);
            continue;
          }
          
          const stages = JSON.parse(stagesJson);
          if (!Array.isArray(stages)) {
            console.log(`  Key ${key} content is not an array`);
            continue;
          }
          
          if (stages.length === 0) {
            console.log(`  Key ${key} has empty array`);
            continue;
          }
          
          console.log(`  Key ${key} has ${stages.length} stages`);
          
          // Log ALL stages regardless of status or date
          stages.forEach((stage: any) => {
            if (!stage) {
              console.log(`  Stage is null/undefined`);
              return;
            }
            
            if (!stage.id) {
              console.log(`  Stage has no ID`, stage);
              return;
            }
            
            // Add to collection of ALL stages
            if (!allStagesSet.has(stage.id)) {
              allStagesSet.add(stage.id);
              allStages.push(stage);
              
              // Log EVERY stage for debugging
              const date = stage.scheduledDate ? new Date(stage.scheduledDate) : null;
              const isInFuture = date ? date > new Date() : false;
              const statusInfo = `status=${stage.status || 'unset'}, outcome=${stage.outcome || 'unset'}`;
              const dateInfo = stage.scheduledDate ? 
                `date=${stage.scheduledDate}, in future=${isInFuture}` : 
                'no date';
              
              console.log(`  Stage ID ${stage.id}: ${statusInfo}, ${dateInfo}`);
            }
          });
          
        } catch (error) {
          console.error(`Error processing stages from key ${key}:`, error);
        }
      }
      
      // NOW count the valid upcoming interview stages
      
      // A set to track seen stage IDs and avoid double-counting
      const processedStageIds = new Set<number>();
      const scheduledStageIds = new Set<number>();
      const validStages: any[] = [];
      
      // Check each stage from our complete collection
      const now = new Date();
      
      allStages.forEach((stage: any) => {
        // Check if it's a valid interview with a future date
        if (!stage || !stage.scheduledDate) return;
        
        // Consider a stage valid if it:
        // 1. Has a status or outcome of scheduled/pending
        // 2. Has a date in the future
        const isScheduledOrPending = (
          stage.status === 'scheduled' || 
          stage.status === 'pending' || 
          stage.outcome === 'scheduled' || 
          stage.outcome === 'pending'
        );
        
        const isInFuture = new Date(stage.scheduledDate) > now;
        
        if (isScheduledOrPending && isInFuture) {
          // Count this stage and add it to our valid stages list
          scheduledStageIds.add(stage.id);
          validStages.push(stage);
        }
      });
      
      // Set the count to the number of valid unique stage IDs we found
      scheduledInterviewsCount = scheduledStageIds.size;
      
      // Debug information
      console.log(`Found ${allStages.length} total stages in ALL storages`);
      console.log(`Found ${scheduledStageIds.size} upcoming scheduled interviews`);
      
      if (validStages.length > 0) {
        console.log("Valid upcoming interviews:", validStages.map(stage => ({
          id: stage.id,
          date: stage.scheduledDate,
          status: stage.status || stage.outcome
        })));
      }
      
      console.log("============== END DEBUGGING ==============");
      
      console.log(`Local count: ${appCount} interviewing applications, ${scheduledInterviewsCount} scheduled interviews`);
      
      // For this stat card, we always want to show the total number of scheduled interviews
      // This ensures the count reflects the actual number of upcoming interviews 
      // rather than just the number of applications
      const totalCount = scheduledInterviewsCount;
      
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
          
          // Always use the scheduled interviews count to ensure consistency
          // This matches our totalCount value from above
          const apiCount = scheduledInterviewsCount;
          
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