import { ExternalLink, Calendar, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { formatDistanceToNow } from 'date-fns';

interface ApplicationCardProps {
  application: any;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ApplicationCard({ 
  application, 
  isSelected = false, 
  onClick,
  className
}: ApplicationCardProps) {
  // Extract job details with multiple property name support for compatibility
  const jobTitle = application.jobTitle || application.title || application.position || "";
  const companyName = application.companyName || application.company || "";
  const jobLocation = application.jobLocation || application.location || "Remote";
  
  const viewMode = application.jobId ? 'compact' : 'full';
  
  // Calculate time ago for application date
  const timeAgo = application.applicationDate 
    ? formatDistanceToNow(new Date(application.applicationDate), { addSuffix: true })
    : formatDistanceToNow(new Date(application.createdAt), { addSuffix: true });

  return (
    <Card 
      className={cn(
        "transition-colors cursor-pointer hover:border-primary/50",
        isSelected && "border-primary/80 shadow-sm bg-primary/5",
        className
      )}
      onClick={onClick}
    >
      <CardContent className={cn("p-3 sm:p-4", className)}>
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-base text-foreground">{jobTitle}</h3>
              <p className="text-muted-foreground text-sm">{companyName}</p>
            </div>
            <ApplicationStatusBadge status={application.status} size="sm" />
          </div>
          
          <div className="flex flex-col gap-1.5">
            {jobLocation && (
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1.5" />
                <span>{jobLocation}</span>
              </div>
            )}
            
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1.5" />
              <span>{timeAgo}</span>
            </div>
            
            {application.jobLink && (
              <div className="flex items-center text-xs">
                <ExternalLink className="h-3 w-3 mr-1.5 text-blue-500" />
                <a href={application.jobLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Original Job Posting
                </a>
              </div>
            )}
          </div>

          {application.notes && viewMode === 'full' && (
            <div className="mt-1 text-xs text-muted-foreground">
              <p className="line-clamp-2">{application.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}