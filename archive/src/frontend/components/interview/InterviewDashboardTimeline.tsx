import React from 'react';
import { format } from 'date-fns';
import { ChevronRightCircle, Briefcase, CircleCheck, CheckCircle2, XCircle, PieChart } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { InterviewProcessStatusBadge } from './InterviewProcessStatusBadge';
import { type InterviewProcess } from "@/utils/schema";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InterviewDashboardTimelineProps {
  processes: InterviewProcess[];
  className?: string;
}

export const InterviewDashboardTimeline: React.FC<InterviewDashboardTimelineProps> = ({ 
  processes,
  className 
}) => {
  // Sort processes by date (newest first)
  const sortedProcesses = [...processes].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (processes.length === 0) {
    return (
      <div className={cn("text-center py-10", className)}>
        <p className="text-muted-foreground">No interview processes to display.</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Timeline line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -ml-0.5 z-0"></div>
      
      {/* Timeline items */}
      <div className="relative z-10">
        {sortedProcesses.map((process, index) => {
          // Determine if item should be on left or right side (alternating)
          const isLeft = index % 2 === 0;
          
          // Determine icon based on status
          let StatusIcon = ChevronRightCircle;
          let iconColor = "text-primary";
          
          if (process.status === 'Hired') {
            StatusIcon = CheckCircle2;
            iconColor = "text-green-600";
          } else if (process.status === 'Not Selected' || process.status === 'Rejected') {
            StatusIcon = XCircle;
            iconColor = "text-red-500";
          } else if (process.status === 'Completed') {
            StatusIcon = CircleCheck;
            iconColor = "text-blue-500";
          } else if (process.status === 'Application Submitted') {
            StatusIcon = PieChart;
            iconColor = "text-orange-500";
          }

          // Animation variants
          const fadeSlide = {
            hidden: { 
              opacity: 0, 
              x: isLeft ? -20 : 20 
            },
            visible: { 
              opacity: 1, 
              x: 0,
              transition: { 
                duration: 0.5,
                delay: index * 0.1 // Stagger effect
              }
            }
          };

          return (
            <motion.div 
              key={process.id}
              variants={fadeSlide}
              initial="hidden"
              animate="visible"
              className={`flex items-center mb-12 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
            >
              {/* Content */}
              <div className={`w-5/12 px-4 ${isLeft ? 'text-right' : 'text-left'}`}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`p-4 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isLeft ? 'ml-auto' : 'mr-auto'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`font-semibold text-lg ${isLeft ? 'ml-auto' : ''}`}>
                            {process.companyName}
                          </div>
                          <InterviewProcessStatusBadge status={process.status} />
                        </div>
                        <div className="text-sm">{process.position}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {format(new Date(process.createdAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side={isLeft ? "left" : "right"} className="max-w-sm">
                      <div className="space-y-2">
                        <p className="font-medium">{process.companyName} - {process.position}</p>
                        <p className="text-sm">{process.jobDescription || 'No job description available.'}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {process.contactName || 'No contact'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Updated: {new Date(process.updatedAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Center icon */}
              <div className="w-2/12 flex justify-center">
                <div className={`w-10 h-10 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10 ${iconColor}`}>
                  <StatusIcon className="h-5 w-5" />
                </div>
              </div>

              {/* Empty space for the other side */}
              <div className="w-5/12"></div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default InterviewDashboardTimeline;