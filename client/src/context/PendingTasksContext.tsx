import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface PendingTasksContextType {
  pendingFollowupCount: number;
  updatePendingFollowupCount: () => void;
  incrementPendingFollowupCount: () => void;
  decrementPendingFollowupCount: () => void;
}

const PendingTasksContext = createContext<PendingTasksContextType | undefined>(undefined);

export function PendingTasksProvider({ children }: { children: ReactNode }) {
  const [pendingFollowupCount, setPendingFollowupCount] = useState(0);
  
  // Function to count all pending followups from localStorage
  const updatePendingFollowupCount = async () => {
    try {
      // First load applications from localStorage for immediate display
      let localApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
      if (!Array.isArray(localApplications)) {
        localApplications = [];
      }
      
      // Count pending followups from localStorage applications first for immediate feedback
      let localCount = 0;
      for (const app of localApplications) {
        try {
          const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${app.id}`) || '[]');
          const pendingCount = mockFollowups.filter((f: any) => !f.completed).length;
          localCount += pendingCount;
        } catch (error) {
          console.error(`Error counting followups for local application ${app.id}:`, error);
        }
      }
      
      // Update the count immediately from localStorage data
      setPendingFollowupCount(localCount);
      
      // Then try to get applications from the API in the background
      try {
        const response = await apiRequest('GET', '/api/job-applications');
        const apiApplications = await response.json();
        
        if (Array.isArray(apiApplications) && apiApplications.length > 0) {
          // Update count with API data
          let apiCount = 0;
          for (const app of apiApplications) {
            try {
              // First check localStorage for this application's followups
              const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${app.id}`) || '[]');
              if (mockFollowups.length > 0) {
                const pendingCount = mockFollowups.filter((f: any) => !f.completed).length;
                apiCount += pendingCount;
              } else {
                // Try to fetch from API if nothing in localStorage
                try {
                  const followupResponse = await apiRequest('GET', `/api/applications/${app.id}/followups`);
                  const apiFollowups = await followupResponse.json();
                  if (Array.isArray(apiFollowups)) {
                    const pendingApiCount = apiFollowups.filter((f: any) => !f.completed).length;
                    apiCount += pendingApiCount;
                  }
                } catch (apiFollowupError) {
                  // API endpoint might not exist yet, just continue
                }
              }
            } catch (error) {
              console.error(`Error processing followups for application ${app.id}:`, error);
            }
          }
          
          // Update with the API data
          setPendingFollowupCount(apiCount);
        }
      } catch (apiError) {
        // API error, we already have local data so just log the error
        console.error('API error fetching applications:', apiError);
      }
    } catch (error) {
      console.error('Error updating pending followup count:', error);
    }
  };
  
  // Simple functions to increment or decrement the count
  const incrementPendingFollowupCount = () => {
    setPendingFollowupCount(prev => prev + 1);
  };
  
  const decrementPendingFollowupCount = () => {
    setPendingFollowupCount(prev => Math.max(0, prev - 1));
  };
  
  // Calculate initial count on mount
  useEffect(() => {
    updatePendingFollowupCount();
    
    // Set up event listener for localstorage changes from other components
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('mockFollowups_')) {
        updatePendingFollowupCount();
      }
    });
    
    // Run the counter every 30 seconds to keep it updated
    const interval = setInterval(updatePendingFollowupCount, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updatePendingFollowupCount);
    };
  }, []);
  
  // Create the context value
  const contextValue: PendingTasksContextType = {
    pendingFollowupCount,
    updatePendingFollowupCount,
    incrementPendingFollowupCount,
    decrementPendingFollowupCount
  };
  
  return (
    <PendingTasksContext.Provider value={contextValue}>
      {children}
    </PendingTasksContext.Provider>
  );
}

export function usePendingTasks() {
  const context = useContext(PendingTasksContext);
  if (context === undefined) {
    throw new Error('usePendingTasks must be used within a PendingTasksProvider');
  }
  return context;
}