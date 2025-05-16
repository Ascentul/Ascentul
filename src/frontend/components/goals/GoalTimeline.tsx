import React from 'react';
import { format } from 'date-fns';
import { 
  Check, 
  Clock,
  Calendar,
  Target,
  Award,
  BadgeCheck,
  CheckCircle,
  Star,
  Zap,
  AlertTriangle,
  Tag
} from 'lucide-react';
import { type Goal } from "@/utils/schema";
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type GoalTimelineProps = {
  goals: Goal[];
  className?: string;
};

// Helper function to get goal status color
const getStatusColor = (goal: Goal) => {
  if (goal.completed) {
    return 'bg-green-500 border-green-600';
  }
  
  if (goal.dueDate && new Date(goal.dueDate) < new Date()) {
    return 'bg-amber-500 border-amber-600'; // Past due date
  }
  
  return 'bg-blue-500 border-blue-600'; // Active
};

// Helper function to get goal status icon
const getStatusIcon = (goal: Goal) => {
  if (goal.completed) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  
  if (goal.dueDate && new Date(goal.dueDate) < new Date()) {
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  }
  
  return <Clock className="h-4 w-4 text-blue-500" />;
};

// Helper to format time periods
const formatTimePeriod = (date: Date) => {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 1) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};

const GoalTimeline = ({ goals, className }: GoalTimelineProps) => {
  // Sort goals by completedAt (if completed) or createdAt
  const sortedGoals = [...goals].sort((a, b) => {
    const dateA = a.completedAt || a.createdAt;
    const dateB = b.completedAt || b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <div className={cn("py-4", className)}>
      <div className="relative">
        {/* Timeline center line */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-gray-300 transform -translate-x-1/2"></div>
        
        {/* Timeline goals */}
        <div className="space-y-12">
          {sortedGoals.map((goal, index) => (
            <div key={goal.id} className={cn(
              "relative flex items-center",
              index % 2 === 0 ? "justify-end" : "justify-start",
              "pb-8"
            )}>
              {/* Goal content - alternating left/right */}
              <div className={cn(
                "w-5/12",
                "bg-background p-4 rounded-lg border shadow-sm",
                index % 2 === 0 ? "mr-6 text-right" : "ml-6"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("flex items-center", index % 2 === 0 ? "justify-end" : "justify-start")}>
                    {index % 2 === 0 && (
                      <h4 className="font-semibold text-md mr-2">{goal.title}</h4>
                    )}
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted">
                      <Target className="h-4 w-4" />
                    </div>
                    {index % 2 !== 0 && (
                      <h4 className="font-semibold text-md ml-2">{goal.title}</h4>
                    )}
                  </div>
                  <div>
                    {getStatusIcon(goal)}
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {goal.completedAt ? (
                    <div className="flex items-center justify-start gap-1 mb-1">
                      <Calendar className="h-3 w-3" />
                      <span>Completed: {format(new Date(goal.completedAt), 'MMM d, yyyy')}</span>
                    </div>
                  ) : goal.dueDate ? (
                    <div className="flex items-center justify-start gap-1 mb-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {format(new Date(goal.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-start gap-1 mb-1">
                      <Calendar className="h-3 w-3" />
                      <span>Created: {format(new Date(goal.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  
                  
                  
                  
                </div>
              </div>
              
              {/* Center timeline point */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className={cn(
                      "absolute left-1/2 transform -translate-x-1/2",
                      "h-4 w-4 rounded-full border-2",
                      getStatusColor(goal)
                    )}></div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      {goal.completedAt ? (
                        <p>Completed {formatTimePeriod(new Date(goal.completedAt))}</p>
                      ) : goal.dueDate ? (
                        <p>Due {format(new Date(goal.dueDate), 'MMM d, yyyy')}</p>
                      ) : (
                        <p>Created {formatTimePeriod(new Date(goal.createdAt))}</p>
                      )}
                      <p>Status: {goal.status}</p>
                      <p>Progress: {goal.progress}%</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoalTimeline;