import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { ExternalLink, CheckCircle, Circle } from 'lucide-react';

interface Recommendation {
  id: number;
  text: string;
  type: string;
  completed: boolean;
  completedAt: string | null;
  relatedEntityId: number | null;
  relatedEntityType: string | null;
  createdAt: string;
}

// Function to determine correct link for recommendation type
function getRecommendationLink(recommendation: Recommendation): string | null {
  if (!recommendation.relatedEntityId || !recommendation.relatedEntityType) {
    return null;
  }

  switch (recommendation.relatedEntityType) {
    case 'resume':
      return `/resumes/${recommendation.relatedEntityId}`;
    case 'job_application':
      return `/job-applications/${recommendation.relatedEntityId}`;
    case 'contact':
      return `/networking/${recommendation.relatedEntityId}`;
    case 'followup_action':
      return `/job-applications`; // Could be improved with specific ID
    case 'interview_stage':
      return `/application-tracker`; // Could be improved with specific ID
    case 'goal':
      return `/goals/${recommendation.relatedEntityId}`;
    default:
      return null;
  }
}

export default function TodaysRecommendations() {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch all recommendations
  const { 
    data: recommendations = [], 
    isLoading,
    error,
    refetch 
  } = useQuery<Recommendation[]>({
    queryKey: ['/api/recommendations/daily'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/recommendations/daily');
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        return await response.json();
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Sort recommendations by completion status
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    // Incomplete first, then by type
    return a.completed === b.completed
      ? a.type.localeCompare(b.type)
      : a.completed ? 1 : -1;
  });
  
  // Mutation to mark recommendation as complete
  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/recommendations/${id}/complete`);
      if (!res.ok) throw new Error('Failed to complete recommendation');
      return await res.json();
    },
    onMutate: async (recommendationId: number) => {
      // Cancel any outgoing refetches 
      await queryClient.cancelQueries({ queryKey: ['/api/recommendations/daily'] });
      
      // Snapshot the previous value
      const previousRecommendations = queryClient.getQueryData<Recommendation[]>(['/api/recommendations/daily']);
      
      // Optimistically update to the new value
      if (previousRecommendations) {
        queryClient.setQueryData<Recommendation[]>(['/api/recommendations/daily'], 
          previousRecommendations.map(rec => 
            rec.id === recommendationId
              ? { ...rec, completed: true, completedAt: new Date().toISOString() }
              : rec
          )
        );
      }
      
      return { previousRecommendations };
    },
    onSuccess: (data) => {
      // Show success toast
      toast({
        title: "Recommendation completed!",
        description: "You've earned 15 XP for completing this recommendation.",
      });
    },
    onError: (error: Error, recommendationId, context: any) => {
      // If the mutation fails, roll back to the previous value
      if (context?.previousRecommendations) {
        queryClient.setQueryData(['/api/recommendations/daily'], context.previousRecommendations);
      }
      
      toast({
        title: "Failed to complete recommendation",
        description: error.message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      // Always invalidate the query to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations/daily'] });
    }
  });
  
  // Handle recommendation completion toggle
  const handleToggleComplete = (recommendation: Recommendation) => {
    if (!recommendation.completed) {
      completeMutation.mutate(recommendation.id);
    }
  };
  
  // Handle refresh recommendations
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      // First invalidate and remove existing recommendations
      await queryClient.invalidateQueries({ queryKey: ['/api/recommendations/daily'] });
      await queryClient.removeQueries({ queryKey: ['/api/recommendations/daily'] });
      
      // Get new recommendations with refresh flag
      const res = await apiRequest('GET', '/api/recommendations/daily?refresh=true');
      if (!res.ok) {
        throw new Error('Failed to refresh recommendations');
      }
      
      // Get fresh data
      const newRecommendations = await res.json();
      
      // Force update cache and trigger rerender
      queryClient.setQueryData(['/api/recommendations/daily'], newRecommendations);
      
      toast({
        title: "Recommendations refreshed",
        description: "New recommendations have been generated for you.",
      });
    } catch (error) {
      toast({
        title: "Failed to refresh recommendations",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-poppins">Today's Recommendations</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="h-8 px-2"
          >
            <span className="sr-only">Refresh</span>
            <svg 
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
          </Button>
        </div>
        
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start p-3 bg-background rounded-lg border border-border">
                <Skeleton className="h-5 w-5 mr-3 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <div className="flex">
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="p-5 text-center">
            <p className="text-red-500 mb-2">Failed to load recommendations</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : sortedRecommendations.length === 0 ? (
          // Empty state
          <div className="text-center p-6 border border-dashed rounded-lg flex flex-col items-center">
            <p className="text-muted-foreground mb-2">No recommendations for today</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Generate Recommendations
            </Button>
          </div>
        ) : (
          // Recommendations list
          <ul className="space-y-3">
            {sortedRecommendations.map((recommendation) => {
              const link = getRecommendationLink(recommendation);
              
              return (
                <li
                  key={recommendation.id}
                  className={`flex items-start p-3 rounded-lg border transition-all duration-300 ${
                    recommendation.completed
                      ? 'bg-green-50/50 text-muted-foreground border-border/50'
                      : 'bg-background border-border hover:border-primary/30'
                  }`}
                >
                  <div 
                    className="mt-0.5 mr-3 flex-shrink-0 cursor-pointer" 
                    onClick={() => handleToggleComplete(recommendation)}
                  >
                    {recommendation.completed ? (
                      <CheckCircle className="text-green-500 h-5 w-5" />
                    ) : (
                      <Circle className="text-muted-foreground h-5 w-5 hover:text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start">
                      <span 
                        className={`text-sm ${recommendation.completed ? 'line-through' : ''}`}
                      >
                        {recommendation.text}
                      </span>
                      
                      {link && !recommendation.completed && (
                        <Link to={link} className="ml-2 inline-flex">
                          <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1" title="Go to related item">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}