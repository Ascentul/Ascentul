import React, { useState, useRef } from 'react';
import { format, differenceInDays, isAfter, isBefore, startOfToday } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  User, 
  Paperclip, 
  Check, 
  X, 
  Clock, 
  HourglassIcon,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { InterviewProcessStatusBadge } from './InterviewProcessStatusBadge';

// Types from the schema
import { 
  type InterviewProcess,
  type InterviewStage, 
} from "@/utils/schema";

interface HorizontalTimelineProps {
  processes: InterviewProcess[];
  stages: Record<number, InterviewStage[]>;
  onStageClick: (processId: number, stageId: number) => void;
  onEditProcess: (processId: number) => void;
  className?: string;
}

// Stage status types
type StageStatus = 'passed' | 'failed' | 'upcoming' | 'awaiting';

// Get stage status based on properties
const getStageStatus = (stage: InterviewStage): StageStatus => {
  const today = new Date();
  
  if (stage.outcome === 'passed') return 'passed';
  if (stage.outcome === 'not_selected') return 'failed';
  
  if (stage.scheduledDate) {
    const stageDate = new Date(stage.scheduledDate || 0);
    if (isAfter(stageDate, today)) return 'upcoming';
    if (isBefore(stageDate, today)) return 'awaiting';
  }
  
  return 'upcoming';
};

// This renders each stage node in the timeline
const StageNode: React.FC<{
  stage: InterviewStage;
  onClick: () => void;
  isNext?: boolean;
  isOverdue?: boolean;
}> = ({ stage, onClick, isNext = false, isOverdue = false }) => {
  const stageStatus = getStageStatus(stage);
  
  // Determine icon based on status
  let StatusIcon = Clock;
  let statusClass = 'text-yellow-500 bg-yellow-100';
  
  if (stageStatus === 'passed') {
    StatusIcon = Check;
    statusClass = 'text-green-600 bg-green-100';
  } else if (stageStatus === 'failed') {
    StatusIcon = X;
    statusClass = 'text-red-600 bg-red-100';
  } else if (stageStatus === 'upcoming') {
    StatusIcon = Clock;
    statusClass = 'text-blue-600 bg-blue-100';
  } else if (stageStatus === 'awaiting') {
    StatusIcon = HourglassIcon;
    statusClass = 'text-amber-600 bg-amber-100';
  }
  
  // Calculate border style for next or overdue nodes
  const nodeBorderClass = isNext 
    ? 'border-primary border-2' 
    : isOverdue 
      ? 'border-destructive border-2' 
      : 'border-border';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
              "group cursor-pointer flex flex-col items-center min-w-[100px] max-w-[120px] bg-card border rounded-md p-2 shadow-sm hover:shadow-md transition-all",
              nodeBorderClass
            )}
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mb-1", statusClass)}>
              <StatusIcon className="h-4 w-4" />
            </div>
            
            <span className="text-xs font-medium text-center line-clamp-2">{stage.type}</span>
            
            {stage.scheduledDate && (
              <span className="text-[10px] text-muted-foreground mt-1">
                {format(new Date(stage.scheduledDate), 'MMM d, yyyy')}
              </span>
            )}
            
            <div className="flex mt-1 gap-1">
              {stage.location && (
                <div className="text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                </div>
              )}
              {stage.interviewers && stage.interviewers.length > 0 && (
                <div className="text-muted-foreground">
                  <User className="h-3 w-3" />
                </div>
              )}
              {/* You can add a check for attachments here when we add that feature */}
              {stage.notes && (
                <div className="text-muted-foreground">
                  <Paperclip className="h-3 w-3" />
                </div>
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">{stage.type}</div>
            {stage.scheduledDate && (
              <div className="flex items-center text-xs">
                <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                {format(new Date(stage.scheduledDate), 'MMMM d, yyyy')}
              </div>
            )}
            {stage.location && (
              <div className="text-xs">
                Location: {stage.location}
              </div>
            )}
            {stage.interviewers && stage.interviewers.length > 0 && (
              <div className="text-xs">
                Interviewers: {stage.interviewers.join(', ')}
              </div>
            )}
            {stage.notes && (
              <div className="text-xs">
                <div className="font-medium">Notes:</div>
                <p className="text-muted-foreground">{stage.notes}</p>
              </div>
            )}
            <div className="text-xs italic text-muted-foreground">
              Click to view or edit details
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Main horizontal timeline component
export const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({
  processes,
  stages,
  onStageClick,
  onEditProcess,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [stageFilter, setStageFilter] = useState<string | undefined>(undefined);
  const [expandedProcessIds, setExpandedProcessIds] = useState<number[]>([]);
  
  const scrollContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  
  // Filter processes
  const filteredProcesses = processes.filter(process => {
    const matchesSearch = !searchQuery || 
      process.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      process.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || process.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Toggle expanded state for a process
  const toggleProcessExpanded = (processId: number) => {
    if (expandedProcessIds.includes(processId)) {
      setExpandedProcessIds(expandedProcessIds.filter(id => id !== processId));
    } else {
      setExpandedProcessIds([...expandedProcessIds, processId]);
    }
  };
  
  // Check if a process is expanded
  const isProcessExpanded = (processId: number) => {
    return expandedProcessIds.includes(processId) || expandedProcessIds.length === 0;
  };
  
  // Scroll timeline horizontally
  const scrollTimeline = (processId: number, direction: 'left' | 'right') => {
    const container = scrollContainerRefs.current[processId];
    if (container) {
      container.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <div className={cn("w-full flex flex-col gap-4", className)}>
      {/* Filter Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4 flex flex-col lg:flex-row gap-2 items-center">
        <div className="relative w-full lg:w-64 flex-shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search company or position..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? undefined : value)}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Application Submitted">Application Submitted</SelectItem>
              <SelectItem value="Phone Screen">Phone Screen</SelectItem>
              <SelectItem value="Technical Interview">Technical Interview</SelectItem>
              <SelectItem value="Onsite Interview">Onsite Interview</SelectItem>
              <SelectItem value="Final Round">Final Round</SelectItem>
              <SelectItem value="Offer Received">Offer Received</SelectItem>
              <SelectItem value="Hired">Hired</SelectItem>
              <SelectItem value="Not Selected">Not Selected</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={stageFilter || 'all_outcomes'} onValueChange={(value) => setStageFilter(value === 'all_outcomes' ? undefined : value)}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Filter by stage outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_outcomes">All outcomes</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed/Rejected</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="awaiting">Awaiting Feedback</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter(undefined);
              setStageFilter(undefined);
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>
      
      {/* Timeline Container */}
      <div className="space-y-6">
        {filteredProcesses.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-card">
            <h3 className="text-lg font-medium mb-2">No interview processes found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting the search or filters above.</p>
          </div>
        ) : (
          filteredProcesses.map(process => (
            <motion.div
              key={process.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "border rounded-lg shadow-sm bg-card overflow-hidden",
                "transition-all duration-300 ease-in-out",
                isProcessExpanded(process.id) ? "max-h-[300px]" : "max-h-[80px]"
              )}
            >
              {/* Company Header */}
              <div 
                className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer"
                onClick={() => toggleProcessExpanded(process.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                  <h3 className="font-semibold truncate">{process.companyName}</h3>
                  <div className="text-sm text-muted-foreground">{process.position}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <InterviewProcessStatusBadge status={process.status} />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProcess(process.id);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View details</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleProcessExpanded(process.id);
                    }}
                  >
                    <ChevronRight 
                      className={cn(
                        "h-5 w-5 transition-transform", 
                        isProcessExpanded(process.id) ? "rotate-90" : ""
                      )} 
                    />
                    <span className="sr-only">Toggle timeline</span>
                  </Button>
                </div>
              </div>
              
              {/* Timeline Track */}
              {isProcessExpanded(process.id) && (
                <div className="p-4">
                  <div className="relative">
                    {/* Scroll Controls */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full"
                      onClick={() => scrollTimeline(process.id, 'left')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full"
                      onClick={() => scrollTimeline(process.id, 'right')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {/* Timeline Track */}
                    <div 
                      ref={ref => scrollContainerRefs.current[process.id] = ref}
                      className="overflow-x-auto py-4 px-10 scrollbar-thin scrollbar-thumb-rounded-md scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 scrollbar-track-muted/10"
                    >
                      <div className="relative min-w-max">
                        {/* Timeline Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0"></div>
                        
                        {/* Stage Nodes */}
                        <div className="flex items-center gap-4 relative z-10">
                          {stages[process.id]?.length > 0 ? (
                            stages[process.id]
                              .filter(stage => {
                                if (!stageFilter) return true;
                                return getStageStatus(stage) === stageFilter;
                              })
                              .sort((a, b) => {
                                const dateA = new Date(a.scheduledDate || 0);
                                const dateB = new Date(b.scheduledDate || 0);
                                return dateA.getTime() - dateB.getTime();
                              })
                              .map((stage, index, filteredStages) => {
                                // Calculate spacing between nodes based on time
                                const today = startOfToday();
                                let marginLeft = '0px';
                                
                                if (index > 0 && stage.scheduledDate && filteredStages[index - 1].scheduledDate) {
                                  const prevDate = new Date(filteredStages[index - 1].scheduledDate || 0);
                                  const currDate = new Date(stage.scheduledDate || 0);
                                  const daysDiff = differenceInDays(currDate, prevDate);
                                  
                                  // Add more space for longer gaps
                                  if (daysDiff > 14) {
                                    marginLeft = `${Math.min(daysDiff * 2, 200)}px`;
                                  } else if (daysDiff > 7) {
                                    marginLeft = `${Math.min(daysDiff * 1.5, 120)}px`;
                                  } else if (daysDiff > 0) {
                                    marginLeft = `${Math.min(daysDiff * 1, 80)}px`;
                                  }
                                }
                                
                                // Determine if this is the next upcoming stage
                                const isNext = stage.scheduledDate && 
                                  isAfter(new Date(stage.scheduledDate || 0), today) && 
                                  !filteredStages.slice(0, index).some(s => 
                                    s.scheduledDate && isAfter(new Date(s.scheduledDate || 0), today)
                                  );
                                
                                // Determine if this stage is overdue
                                const isOverdue = stage.scheduledDate && 
                                  isBefore(new Date(stage.scheduledDate || 0), today) && 
                                  getStageStatus(stage) === 'awaiting';
                                
                                return (
                                  <div 
                                    key={stage.id}
                                    style={{ marginLeft }}
                                    className="flex flex-col items-center"
                                  >
                                    <StageNode 
                                      stage={stage}
                                      onClick={() => onStageClick(process.id, stage.id)}
                                      isNext={isNext || undefined}
                                      isOverdue={isOverdue || undefined}
                                    />
                                  </div>
                                );
                              })
                          ) : (
                            <div className="w-full py-4 text-center text-muted-foreground">
                              No interview stages found for this process.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

// Stage details dialog/modal
// Define a custom type for the edited stage that allows scheduledDate to be a string
type EditableStage = Omit<Partial<InterviewStage>, 'scheduledDate'> & {
  scheduledDate?: string | Date | null;
};

export const StageDetailsDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  stage?: InterviewStage | null;
  onSave: (updatedStage: Partial<InterviewStage>) => void;
}> = ({ isOpen, onClose, stage, onSave }) => {
  const [editedStage, setEditedStage] = useState<EditableStage>({});
  
  React.useEffect(() => {
    if (stage) {
      // For proper date handling, we convert to string format for input[type="date"]
      setEditedStage({
        ...stage,
        scheduledDate: stage.scheduledDate 
          ? new Date(stage.scheduledDate || 0).toISOString().split('T')[0]
          : '',
      });
    } else {
      setEditedStage({});
    }
  }, [stage]);
  
  const handleSave = () => {
    // Create a new object without the scheduledDate to avoid type conflicts
    const { scheduledDate, ...rest } = editedStage;
    
    // Convert string date back to Date object before saving
    const formattedStage: Partial<InterviewStage> = {
      ...rest,
    };
    
    // Handle date conversion if needed
    if (typeof scheduledDate === 'string') {
      if (scheduledDate) {
        formattedStage.scheduledDate = new Date(scheduledDate);
      } else {
        formattedStage.scheduledDate = null;
      }
    } else {
      formattedStage.scheduledDate = scheduledDate as Date | null | undefined;
    }
    
    onSave(formattedStage);
    onClose();
  };
  
  if (!stage) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{stage.type}</DialogTitle>
          <DialogDescription>
            View and edit this interview stage's details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-2">
          <div className="grid w-full items-center gap-1.5">
            <label htmlFor="stage-type" className="text-sm font-medium">Stage Name</label>
            <Input
              id="stage-type"
              value={editedStage.type || ''}
              onChange={(e) => setEditedStage({ ...editedStage, type: e.target.value })}
            />
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <label htmlFor="stage-date" className="text-sm font-medium">Date</label>
            <Input
              id="stage-date"
              type="date"
              value={editedStage.scheduledDate ? String(editedStage.scheduledDate) : ''}
              onChange={(e) => setEditedStage({ ...editedStage, scheduledDate: e.target.value })}
            />
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <label htmlFor="stage-location" className="text-sm font-medium">Location</label>
            <Input
              id="stage-location"
              value={editedStage.location || ''}
              onChange={(e) => setEditedStage({ ...editedStage, location: e.target.value })}
              placeholder="Video call, on-site, etc."
            />
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <label htmlFor="stage-interviewers" className="text-sm font-medium">Interviewers</label>
            <Input
              id="stage-interviewers"
              value={editedStage.interviewers?.join(', ') || ''}
              onChange={(e) => setEditedStage({ 
                ...editedStage, 
                interviewers: e.target.value.split(',').map(i => i.trim()).filter(Boolean) 
              })}
              placeholder="Separate multiple interviewers with commas"
            />
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <label htmlFor="stage-outcome" className="text-sm font-medium">Outcome</label>
            <Select 
              value={editedStage.outcome || 'pending'} 
              onValueChange={(value) => setEditedStage({ ...editedStage, outcome: value === 'pending' ? undefined : value })}
            >
              <SelectTrigger id="stage-outcome">
                <SelectValue placeholder="Select an outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="not_selected">Not Selected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <label htmlFor="stage-notes" className="text-sm font-medium">Notes</label>
            <Textarea
              id="stage-notes"
              value={editedStage.notes || ''}
              onChange={(e) => setEditedStage({ ...editedStage, notes: e.target.value })}
              placeholder="Interview notes, preparation, follow-up items, etc."
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HorizontalTimeline;