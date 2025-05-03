import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, RotateCcw } from 'lucide-react';
import { Link } from 'wouter';
import { useUpcomingInterviews } from '@/context/UpcomingInterviewsContext';
import { useToast } from '@/hooks/use-toast';
import { cleanupOrphanedInterviewStages } from '@/lib/utils';

interface InterviewsStatCardProps {
  isLoading?: boolean;
}

export function InterviewsStatCard({ isLoading = false }: InterviewsStatCardProps) {
  const { upcomingInterviewCount, updateInterviewCount } = useUpcomingInterviews();
  const [isCleaning, setIsCleaning] = useState(false);
  const { toast } = useToast();
  
  const handleCleanup = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsCleaning(true);
    
    try {
      // Run the cleanup function
      cleanupOrphanedInterviewStages();
      
      // Update the count
      updateInterviewCount();
      
      // Show success toast
      toast({
        title: "Cleanup Complete",
        description: "Successfully cleaned up orphaned interview data",
        variant: "default"
      });
      
      // Force a page reload to ensure UI is updated
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error during cleanup:", error);
      toast({
        title: "Cleanup Failed",
        description: "There was an error cleaning up orphaned data",
        variant: "destructive"
      });
    } finally {
      setIsCleaning(false);
    }
  };

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
    <Link href="/job-applications?filter=interviewing">
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-full bg-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-4">
                <h3 className="text-neutral-500 text-sm">Next Interview</h3>
                <p className="text-2xl font-semibold">{upcomingInterviewCount}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleCleanup}
              disabled={isCleaning}
              title="Clean up orphaned interviews"
            >
              <RotateCcw className={`h-4 w-4 ${isCleaning ? 'animate-spin' : ''}`} />
              <span className="sr-only">Clean up orphaned interviews</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}