import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import Dashboard from '@/pages/Dashboard';

/**
 * This is a special component that handles login and immediately renders the dashboard
 * in a single page, bypassing all routing and authentication checks.
 */
export default function QuickLogin() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Immediately try to auto-login on mount
  useEffect(() => {
    const login = async () => {
      try {
        console.log('QuickLogin: Starting login process...');
        
        // Credentials hardcoded for development/testing
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'testpassword'
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Login request failed');
        }
        
        const userData = await response.json();
        console.log('QuickLogin: Authentication successful');
        
        // Update query client cache with user data
        if (userData && (userData.id || (userData.user && userData.user.id))) {
          queryClient.setQueryData(['/api/users/me'], userData.user || userData);
          
          // Save to localStorage as well
          localStorage.setItem('auth-user', JSON.stringify({
            id: userData.id || (userData.user && userData.user.id),
            username: userData.username || (userData.user && userData.user.username),
            authenticated: true,
            timestamp: new Date().toISOString()
          }));
          
          // Set state to show dashboard
          setIsAuthenticated(true);
          toast({
            title: "Login successful",
            description: "Rendering dashboard..."
          });
        }
      } catch (error) {
        console.error('QuickLogin error:', error);
        toast({
          title: "Login failed",
          description: "Could not automatically log you in",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    login();
  }, [toast]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="h-16 w-16 mx-auto border-4 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium">Logging in...</p>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }
  
  // If authenticated, render the dashboard directly in this component
  // This bypasses all routing protection
  if (isAuthenticated) {
    return <Dashboard />;
  }
  
  // If login failed, show error
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 max-w-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Login failed</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Could not automatically log you in. Please check your network connection and try again.</p>
            </div>
            <div className="mt-4">
              <a href="/direct-login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                Try manually
              </a>
              <button
                onClick={() => window.location.reload()}
                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}