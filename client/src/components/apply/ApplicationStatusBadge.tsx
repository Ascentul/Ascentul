import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  CalendarClock, 
  CheckCircle2, 
  ClipboardCheck, 
  UserCheck, 
  XCircle,
  CircleDashed
} from 'lucide-react';

interface ApplicationStatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({
  status,
  className,
  showIcon = true
}) => {
  // Determine appropriate styling based on status
  let customClass = '';
  let Icon = CircleDashed;

  switch (status) {
    case 'Not Started':
      customClass = 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200';
      Icon = CalendarClock;
      break;
    case 'Applied':
      customClass = 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      Icon = ClipboardCheck;
      break;
    case 'Interviewing':
      customClass = 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200';
      Icon = UserCheck;
      break;
    case 'Offer':
      customClass = 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 font-semibold';
      Icon = CheckCircle2;
      break;
    case 'Rejected':
      customClass = 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      Icon = XCircle;
      break;
    default:
      // Default styling
      customClass = 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200';
      Icon = CircleDashed;
      break;
  }

  return (
    <Badge 
      variant="outline" 
      className={cn("whitespace-nowrap text-xs font-medium", customClass, className)}
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {status}
    </Badge>
  );
};

export default ApplicationStatusBadge;