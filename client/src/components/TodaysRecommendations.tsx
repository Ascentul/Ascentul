import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle, Circle, ExternalLink } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

interface Recommendation {
  id: number;
  text: string;
  type: string;
  completed: boolean;
  completedAt: string | null;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  expiresAt: string | null;
  createdAt: string;
}

// Utility function to get badge color by recommendation type
const getTypeColor = (type: string) => {
  switch (type) {
    case 'goal':
      return 'bg-blue-500';
    case 'interview':
      return 'bg-purple-500';
    case 'followup':
      return 'bg-amber-500';
    case 'system':
    default:
      return 'bg-green-500';
  }
};

// Utility function to get the pretty type label
const getTypeLabel = (type: string) => {
  switch (type) {
    case 'goal':
      return 'Goal';
    case 'interview':
      return 'Interview';
    case 'followup':
      return 'Follow-up';
    case 'system':
    default:
      return 'Tip';
  }
};

// Utility function to determine if the recommendation should link somewhere
const getRecommendationLink = (recommendation: Recommendation) => {
  if (!recommendation.relatedEntityType || !recommendation.relatedEntityId) return null;
  
  switch (recommendation.relatedEntityType) {
    case 'goal':
      return `/goals?highlight=${recommendation.relatedEntityId}`;
    case 'interview_process':
      return `/interviews/${recommendation.relatedEntityId}`;
    case 'interview_stage':
      return `/interviews?stageId=${recommendation.relatedEntityId}`;
    case 'followup_action':
      return `/interviews?actionId=${recommendation.relatedEntityId}`;
    default:
      return null;
  }
};

export default function TodaysRecommendations() {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch all recommendations
  const { 
    data: recommendations = [], 
    isLoading,
    error,
    refetch 
  } = useQuery<Recommendation[]>({
    queryKey: ['/api/recommendations/daily'],
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
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate the recommendations query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations/daily'] });
      
      // Show success toast
      toast({
        title: "Recommendation completed!",
        description: "You've earned 15 XP for completing this recommendation.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete recommendation",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle recommendation completion toggle
  const handleToggleComplete = (recommendation: Recommendation) => {
    if (!recommendation.completed) {
      completeMutation.mutate(recommendation.id);
    }
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    
    // First, get a new set of recommendations by calling the API directly
    try {
      // This will trigger the server to generate new recommendations
      const res = await apiRequest('GET', '/api/recommendations/daily?refresh=true');
      if (res.ok) {
        // Then, refetch to update the UI
        await refetch(); 
        toast({
          title: "Recommendations refreshed",
          description: "New recommendations have been generated for you.",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to refresh recommendations",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
    
    setRefreshing(false);
  };
  
  // If there was an error fetching recommendations
  if (error) {
    return (
      <div className="p-5 text-center">
        <p className="text-red-500 mb-2">Failed to load recommendations</p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
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
                    ? 'bg-muted/30 text-muted-foreground border-border/50'
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
                  <div className="flex flex-wrap items-start justify-between">
                    <span className={`text-sm ${recommendation.completed ? 'line-through' : ''}`}>
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
                  
                  <div className="mt-1 flex items-center space-x-2">
                    <Badge
                      className={`px-2 py-0 h-5 text-xs text-white ${getTypeColor(recommendation.type)}`}
                    >
                      {getTypeLabel(recommendation.type)}
                    </Badge>
                    
                    {recommendation.completed && recommendation.completedAt && (
                      <span className="text-xs text-muted-foreground">
                        Completed {new Date(recommendation.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}