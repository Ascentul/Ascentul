import React from 'react';
import { format } from 'date-fns';
import { 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  Star 
} from 'lucide-react';
import { type InterviewProcess } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InterviewProcessStatusBadge } from './InterviewProcessStatusBadge';


type InterviewDashboardTimelineProps = {
  processes: InterviewProcess[];
  className?: string;
};

const InterviewDashboardTimeline = ({ processes, className }: InterviewDashboardTimelineProps) => {
  // Sort processes by created date
  const sortedProcesses = [...processes].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Determine status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'bg-blue-500 border-blue-600';
      case 'phone screen':
        return 'bg-indigo-500 border-indigo-600';
      case 'technical interview':
        return 'bg-purple-500 border-purple-600';
      case 'onsite':
        return 'bg-amber-500 border-amber-600';
      case 'offer':
        return 'bg-green-500 border-green-600';
      case 'hired':
        return 'bg-emerald-500 border-emerald-600';
      case 'rejected':
      case 'not selected':
        return 'bg-red-500 border-red-600';
      case 'completed':
        return 'bg-neutral-500 border-neutral-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  // Determine status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'phone screen':
      case 'technical interview':
      case 'onsite':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'offer':
      case 'hired':
        return <Star className="h-4 w-4 text-green-500" />;
      case 'rejected':
      case 'not selected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Briefcase className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={cn("relative", className)}>
      {processes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Briefcase className="h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">No interview processes found. Start by creating a new interview process.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline center line */}
          <div className="absolute left-1/2 top-0 h-full w-px bg-gray-300 transform -translate-x-1/2"></div>
          
          {/* Timeline processes */}
          <div className="space-y-12 pb-8">
            {sortedProcesses.map((process, index) => (
              <div key={process.id} className={cn(
                "relative flex items-center",
                index % 2 === 0 ? "justify-end" : "justify-start",
                "pb-8"
              )}>
                {/* Process content - alternating left/right */}
                <div className={cn(
                  "w-5/12",
                  "bg-background p-4 rounded-lg border shadow-sm",
                  index % 2 === 0 ? "mr-6 text-right" : "ml-6"
                )}>
                  <div className={cn("flex items-center justify-between mb-2")}>
                    <div className={cn("flex items-center", index % 2 === 0 ? "flex-row-reverse" : "flex-row")}>
                      <Briefcase className={cn("h-4 w-4", index % 2 === 0 ? "ml-2" : "mr-2")} />
                      <h4 className="font-semibold text-md">{process.companyName}</h4>
                    </div>
                    <InterviewProcessStatusBadge status={process.status} />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>{process.position}</p>
                    <div className={cn("flex items-center gap-1 mb-1 mt-2", index % 2 === 0 ? "justify-end" : "justify-start")}>
                      <Calendar className="h-3 w-3" />
                      <span>Created: {format(new Date(process.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    
                    {process.notes && (
                      <div className={cn("text-xs italic mt-2", index % 2 === 0 ? "text-right" : "text-left")}>
                        {process.notes.length > 40 ? `${process.notes.substring(0, 40)}...` : process.notes}
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
                        getStatusColor(process.status)
                      )}></div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p>{process.companyName}</p>
                        <p>Status: {process.status}</p>
                        <p>Created: {format(new Date(process.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { InterviewDashboardTimeline };