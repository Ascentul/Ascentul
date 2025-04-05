import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { adminApiClient } from '@/lib/adminApiClient';
import { useToast } from '@/hooks/use-toast';

// Define the Admin Context type
interface AdminContextType {
  isLoading: boolean;
  error: Error | null;
  dashboardData: {
    userStats: {
      totalUsers: number;
      activeUsers: number;
      premiumUsers: number;
      newUsersToday: number;
    } | null;
    systemStatus: {
      status: 'healthy' | 'degraded' | 'down';
      uptime: number;
      version: string;
      services: Record<string, {
        status: 'healthy' | 'degraded' | 'down';
        details?: string;
      }>;
    } | null;
    databaseHealth: {
      status: 'healthy' | 'down' | 'error';
      connection: 'active' | 'failed' | 'unknown';
      message: string;
    } | null;
    unreadMessages: number;
  };
  refreshDashboard: () => Promise<void>;
}

// Create the context with default values
const AdminContext = createContext<AdminContextType>({
  isLoading: true,
  error: null,
  dashboardData: {
    userStats: null,
    systemStatus: null,
    databaseHealth: null,
    unreadMessages: 0,
  },
  refreshDashboard: async () => {},
});

// Provider component that wraps admin pages
export function AdminProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Initialize dashboard data
  const [dashboardData, setDashboardData] = useState({
    userStats: null,
    systemStatus: null,
    databaseHealth: null,
    unreadMessages: 0,
  });
  
  // Function to refresh dashboard data
  const refreshDashboard = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch user stats
      const userStats = await adminApiClient.getUserStats();
      
      // Fetch system status
      const systemStatus = await adminApiClient.getSystemStatus();
      
      // Fetch database health
      const databaseHealth = await adminApiClient.checkDatabaseHealth();
      
      // Fetch support messages (unread)
      const supportMessages = await adminApiClient.getSupportMessages(1, 1, 'unread');
      
      // Update dashboard data
      setDashboardData({
        userStats,
        systemStatus,
        databaseHealth,
        unreadMessages: supportMessages.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
      toast({
        title: 'Error loading dashboard data',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load initial data when the provider mounts
  useEffect(() => {
    refreshDashboard();
  }, []);
  
  // Provide the context value
  return (
    <AdminContext.Provider
      value={{
        isLoading,
        error,
        dashboardData,
        refreshDashboard,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

// Hook to use the admin context
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}