import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Application {
  id: number;
  status: string;
  company: string;
  companyName?: string;
  position: string;
  jobTitle?: string;
}

export function ActiveApplicationsCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);

  const fetchActiveApplications = async () => {
    setIsLoading(true);
    try {
      // Try to fetch applications from the API
      try {
        const response = await apiRequest('GET', '/api/job-applications');
        if (!response.ok) {
          throw new Error('Failed to fetch applications from API');
        }
        
        const applications = await response.json();
        if (Array.isArray(applications)) {
          // Filter for active applications (not rejected, closed, or withdrawn)
          const activeApps = applications.filter(app => 
            app.status !== 'Rejected' && 
            app.status !== 'Closed' && 
            app.status !== 'Withdrawn'
          );
          
          setActiveCount(activeApps.length);
        }
      } catch (apiError) {
        console.error('Error fetching applications from API:', apiError);
        
        // Fallback to localStorage if API fails
        try {
          const localAppsString = localStorage.getItem('mockJobApplications');
          if (localAppsString) {
            const localApps = JSON.parse(localAppsString);
            if (Array.isArray(localApps)) {
              // Filter for active applications (not rejected, closed, or withdrawn)
              const activeLocalApps = localApps.filter(app => 
                app.status !== 'Rejected' && 
                app.status !== 'Closed' && 
                app.status !== 'Withdrawn'
              );
              
              setActiveCount(activeLocalApps.length);
            }
          }
        } catch (localError) {
          console.error('Error processing local applications:', localError);
        }
      }
    } catch (error) {
      console.error('Error fetching or processing applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and setup refresh
  useEffect(() => {
    fetchActiveApplications();
    
    // Set up interval to refresh data
    const interval = setInterval(() => {
      fetchActiveApplications();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex justify-center items-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href="/job-applications">
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-full bg-indigo-500/20">
              <Briefcase className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-neutral-500 text-sm">Active Applications</h3>
              <p className="text-2xl font-semibold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">
                {activeCount === 0 ? 'No current applications' : 
                 activeCount === 1 ? '1 application in progress' : 
                 `${activeCount} applications in progress`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}