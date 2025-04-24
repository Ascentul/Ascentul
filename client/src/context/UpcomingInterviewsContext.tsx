import React, { createContext, useState, useContext, useCallback, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

// Event name constant for interview count updates
export const INTERVIEW_COUNT_UPDATE_EVENT = 'interviewCountUpdate';

// Context type definition
type UpcomingInterviewsContextType = {
  upcomingInterviewCount: number;
  updateInterviewCount: () => Promise<number>;
};

// Create the context
const UpcomingInterviewsContext = createContext<UpcomingInterviewsContextType | undefined>(undefined);

export function UpcomingInterviewsProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage if available
  const initialCount = (() => {
    try {
      const storedCount = localStorage.getItem('upcomingInterviewCount');
      if (storedCount) {
        const count = parseInt(storedCount, 10);
        if (!isNaN(count)) {
          console.log(`Initialized upcoming interview count from localStorage: ${count}`);
          return count;
        }
      }
    } catch (e) {
      console.error('Error reading upcomingInterviewCount from localStorage:', e);
    }
    return 0;
  })();
  
  const [upcomingInterviewCount, setUpcomingInterviewCount] = useState(initialCount);
  
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
      
      // Update state
      setUpcomingInterviewCount(totalCount);
      
      // Store in localStorage for persistence
      localStorage.setItem('upcomingInterviewCount', String(totalCount));
      
      // Try to get applications from API as a backup
      try {
        const response = await apiRequest('GET', '/api/job-applications');
        if (!response.ok) {
          console.error(`API error fetching applications: ${response.status}`);
          return totalCount; // Return local count on API error
        }
        
        const apiApplications = await response.json();
        
        if (Array.isArray(apiApplications) && apiApplications.length > 0) {
          // Count applications with status "Interviewing" from API
          const apiInterviewingApps = apiApplications.filter((app: any) => app.status === 'Interviewing');
          const apiCount = apiInterviewingApps.length;
          
          if (apiCount !== totalCount) {
            console.log(`API count (${apiCount}) differs from local count (${totalCount}), updating to API count`);
            setUpcomingInterviewCount(apiCount);
            localStorage.setItem('upcomingInterviewCount', String(apiCount));
            return apiCount;
          }
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
    
    // Set up a custom event for other components to trigger updates
    const handleInterviewUpdate = () => {
      updateInterviewCount();
    };
    
    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(INTERVIEW_COUNT_UPDATE_EVENT, handleInterviewUpdate as EventListener);
    
    // Refresh every 30 seconds to catch any changes
    const interval = setInterval(() => {
      updateInterviewCount();
    }, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(INTERVIEW_COUNT_UPDATE_EVENT, handleInterviewUpdate as EventListener);
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