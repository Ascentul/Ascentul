import { PenSquare, Clock, CalendarClock, ThumbsUp, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Status types
export type ApplicationStatus = 
  | 'Not Started' 
  | 'Applied' 
  | 'Interviewing' 
  | 'Offer' 
  | 'Rejected';

// Props for the status badge
interface ApplicationStatusBadgeProps {
  status: ApplicationStatus | string;
  size?: 'sm' | 'default';
  className?: string;
}

// Configuration for styling and icons based on status
const statusConfig: Record<string, { color: string; icon: React.ReactNode; label?: string }> = {
  'Not Started': {
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: <PenSquare className="h-3 w-3 mr-1" />,
  },
  'Applied': {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Clock className="h-3 w-3 mr-1" />,
  },
  'Interviewing': {
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <CalendarClock className="h-3 w-3 mr-1" />,
  },
  'Offer': {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <ThumbsUp className="h-3 w-3 mr-1" />,
  },
  'Rejected': {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <X className="h-3 w-3 mr-1" />,
  },
  'default': {
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: <PenSquare className="h-3 w-3 mr-1" />,
  },
};

export function ApplicationStatusBadge({ 
  status, 
  size = 'default',
  className
}: ApplicationStatusBadgeProps) {
  // Get configuration for the status or use default if not found
  const config = statusConfig[status] || statusConfig.default;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.color,
        size === 'sm' ? 'text-xs py-0 px-1.5' : '',
        "flex items-center",
        className
      )}
    >
      {config.icon}
      <span>{config.label || status}</span>
    </Badge>
  );
}