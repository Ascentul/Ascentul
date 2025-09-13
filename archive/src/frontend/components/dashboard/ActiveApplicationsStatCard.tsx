import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface ActiveApplicationsStatCardProps {
  isLoading?: boolean;
}

export function ActiveApplicationsStatCard({ isLoading = false }: ActiveApplicationsStatCardProps) {
  const [activeAppCount, setActiveAppCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchActiveApplications = async () => {
      try {
        // Try to get applications from API
        const response = await apiRequest('GET', '/api/job-applications');
        if (response.ok) {
          const applications = await response.json();
          // Count applications with status 'Active' or 'Interviewing' or 'Applied'
          const activeCount = applications.filter((app: any) => 
            app.status === 'Active' || 
            app.status === 'Interviewing' || 
            app.status === 'Applied'
          ).length;
          setActiveAppCount(activeCount);
        } else {
          // Fallback to localStorage if API fails
          const localApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
          const activeCount = localApps.filter((app: any) => 
            app.status === 'Active' || 
            app.status === 'Interviewing' || 
            app.status === 'Applied'
          ).length;
          setActiveAppCount(activeCount);
        }
      } catch (error) {
        // Last resort fallback if everything fails
        console.error('Error fetching active applications:', error);
        try {
          const localApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
          const activeCount = localApps.filter((app: any) => 
            app.status === 'Active' || 
            app.status === 'Interviewing' || 
            app.status === 'Applied'
          ).length;
          setActiveAppCount(activeCount);
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError);
          setActiveAppCount(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActiveApplications();
    
    // Refresh data every minute
    const interval = setInterval(() => {
      fetchActiveApplications();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading || loading) {
    return (
      <Card>
        <CardContent className="p-4 flex justify-center items-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href="/job-applications?filter=active">
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-full bg-primary/20">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-4">
                <h3 className="text-neutral-500 text-sm">Active Applications</h3>
                <p className="text-2xl font-semibold">{activeAppCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}