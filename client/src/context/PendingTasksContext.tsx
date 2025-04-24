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
      // Get all applications
      let applications = [];
      try {
        const response = await apiRequest('GET', '/api/job-applications');
        applications = await response.json();
      } catch (error) {
        // Fallback to localStorage
        applications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
      }
      
      if (!Array.isArray(applications)) {
        applications = [];
      }
      
      // Count pending followups for each application
      let count = 0;
      for (const app of applications) {
        try {
          const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${app.id}`) || '[]');
          const pendingCount = mockFollowups.filter((f: any) => !f.completed).length;
          count += pendingCount;
        } catch (error) {
          console.error(`Error counting followups for application ${app.id}:`, error);
        }
      }
      
      setPendingFollowupCount(count);
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