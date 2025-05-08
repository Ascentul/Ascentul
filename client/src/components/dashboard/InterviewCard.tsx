import { Calendar, MapPin, Users, Edit, ExternalLink, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { type InterviewStage, type Application } from '@/types/application';

interface InterviewCardProps {
  stage: InterviewStage;
  onEdit?: (stageId: number, applicationId: number) => void;
}

export default function InterviewCard({ stage, onEdit }: InterviewCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  // Format the date
  const formattedDate = stage.scheduledDate 
    ? format(new Date(stage.scheduledDate), 'MMM d, yyyy h:mm a') 
    : 'Not scheduled';

  // Calculate time from now to interview
  const timeFromNow = stage.scheduledDate
    ? formatDistanceToNow(new Date(stage.scheduledDate), { addSuffix: true })
    : '';

  // Get application info
  const application = stage.application;
  
  // Handle editing the interview
  const handleEdit = () => {
    if (onEdit && stage.applicationId) {
      onEdit(stage.id, stage.applicationId);
    } else {
      toast({
        title: "Cannot edit interview",
        description: "Application ID is missing",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full mb-4 overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-base truncate">
                {application?.company || application?.companyName || 'Company'}
              </h3>
              <Badge variant="outline" className="text-xs font-normal">
                {stage.type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {application?.position || application?.jobTitle || 'Position'}
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2 mt-3">
          {stage.scheduledDate && (
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <div className="flex flex-col">
                <span>{formattedDate}</span>
                <span className="text-xs text-muted-foreground">{timeFromNow}</span>
              </div>
            </div>
          )}
          
          {stage.location && (
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{stage.location}</span>
            </div>
          )}
          
          {stage.interviewers && stage.interviewers.length > 0 && (
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {stage.interviewers.slice(0, 2).join(', ')}
                {stage.interviewers.length > 2 && ` +${stage.interviewers.length - 2} more`}
              </span>
            </div>
          )}
          
          {stage.notes && (
            <div className={`mt-3 text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>
              <p>{stage.notes}</p>
            </div>
          )}
          
          {stage.notes && stage.notes.length > 100 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs mt-1 h-6 px-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t flex justify-between">
          <Link href={`/job-applications/${stage.applicationId}`}>
            <Button variant="outline" size="sm" className="text-xs">
              View Application
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}