import React from 'react';
import { format } from 'date-fns';
import { 
  Check, 
  Clock,
  Calendar,
  X,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  PhoneCall,
  Users,
  Video,
  BookOpen,
  Award,
  Briefcase
} from 'lucide-react';
import { type InterviewStage } from "@/utils/schema";
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type InterviewTimelineProps = {
  stages: InterviewStage[];
  className?: string;
};

// Helper function to get the icon for a stage type
const getStageIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'phone_screen':
      return <PhoneCall className="h-4 w-4" />;
    case 'technical':
      return <BookOpen className="h-4 w-4" />;
    case 'behavioral':
      return <Users className="h-4 w-4" />;
    case 'onsite':
      return <Briefcase className="h-4 w-4" />;
    case 'final':
      return <Award className="h-4 w-4" />;
    case 'video':
      return <Video className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
};

// Helper function to get status color
const getStatusColor = (stage: InterviewStage) => {
  if (stage.completedDate) {
    return stage.outcome === 'passed' 
      ? 'bg-green-500 border-green-600' 
      : stage.outcome === 'failed' 
        ? 'bg-red-500 border-red-600'
        : 'bg-blue-500 border-blue-600';
  }
  
  if (stage.scheduledDate && new Date(stage.scheduledDate) < new Date()) {
    return 'bg-amber-500 border-amber-600'; // Past due date
  }
  
  return 'bg-gray-500 border-gray-600'; // Upcoming
};

// Helper function to get status icon
const getStatusIcon = (stage: InterviewStage) => {
  if (stage.completedDate) {
    return stage.outcome === 'passed' 
      ? <CheckCircle className="h-4 w-4 text-green-500" /> 
      : stage.outcome === 'failed' 
        ? <X className="h-4 w-4 text-red-500" />
        : <Check className="h-4 w-4 text-blue-500" />;
  }
  
  if (stage.scheduledDate && new Date(stage.scheduledDate) < new Date()) {
    return <AlertCircle className="h-4 w-4 text-amber-500" />;
  }
  
  return <Clock className="h-4 w-4 text-gray-500" />;
};

// Helper function to get stage label
const getStageLabel = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const InterviewTimeline = ({ stages, className }: InterviewTimelineProps) => {
  // Sort stages by scheduledDate (if available)
  const sortedStages = [...stages].sort((a, b) => {
    if (!a.scheduledDate) return 1;
    if (!b.scheduledDate) return -1;
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
  });

  return (
    <div className={cn("py-4", className)}>
      <div className="relative">
        {/* Timeline center line */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-gray-300 transform -translate-x-1/2"></div>
        
        {/* Timeline stages */}
        <div className="space-y-12">
          {sortedStages.map((stage, index) => (
            <div key={stage.id} className={cn(
              "relative flex items-center",
              index % 2 === 0 ? "justify-end" : "justify-start",
              "pb-8"
            )}>
              {/* Stage content - alternating left/right */}
              <div className={cn(
                "w-5/12",
                "bg-background p-4 rounded-lg border shadow-sm",
                index % 2 === 0 ? "mr-6 text-right" : "ml-6"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("flex items-center", index % 2 === 0 ? "justify-end" : "justify-start")}>
                    {index % 2 === 0 && (
                      <h4 className="font-semibold text-md mr-2">{getStageLabel(stage.type)}</h4>
                    )}
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted">
                      {getStageIcon(stage.type)}
                    </div>
                    {index % 2 !== 0 && (
                      <h4 className="font-semibold text-md ml-2">{getStageLabel(stage.type)}</h4>
                    )}
                  </div>
                  <div>
                    {getStatusIcon(stage)}
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {stage.scheduledDate && (
                    <div className="flex items-center justify-start gap-1 mb-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(stage.scheduledDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  
                  {stage.location && (
                    <div className="text-xs mb-1">
                      {stage.location}
                    </div>
                  )}
                  
                  {stage.notes && (
                    <div className="text-xs italic">
                      {stage.notes.length > 60 ? `${stage.notes.substring(0, 60)}...` : stage.notes}
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
                      getStatusColor(stage)
                    )}></div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      {stage.completedDate ? (
                        <p>Completed: {format(new Date(stage.completedDate), 'MMM d, yyyy')}</p>
                      ) : stage.scheduledDate ? (
                        <p>Scheduled: {format(new Date(stage.scheduledDate), 'MMM d, yyyy')}</p>
                      ) : (
                        <p>Not scheduled</p>
                      )}
                      {stage.outcome && <p>Outcome: {stage.outcome}</p>}
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

export default InterviewTimeline;