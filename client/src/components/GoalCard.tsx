import { Edit, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';

interface GoalCardProps {
  id: number;
  title: string;
  description: string;
  progress: number;
  status: string;
  dueDate?: Date;
  onEdit: (id: number) => void;
}

export default function GoalCard({
  id,
  title,
  description,
  progress,
  status,
  dueDate,
  onEdit,
}: GoalCardProps) {
  // Convert status to badge styling
  const getBadgeStyles = () => {
    switch (status.toLowerCase()) {
      case 'in-progress':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-primary/10 text-primary';
      case 'on-track':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format due date display
  const formatDueDate = () => {
    if (!dueDate) return 'No due date';
    
    const now = new Date();
    const dueTime = new Date(dueDate).getTime();
    
    if (dueTime < now.getTime()) {
      return `Overdue by ${formatDistanceToNow(dueTime)}`;
    }
    
    return `Due in ${formatDistanceToNow(dueTime)}`;
  };

  return (
    <Card className="border border-neutral-200 shadow-none">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-neutral-500 mt-1">{description}</p>
          </div>
          <Badge variant="outline" className={getBadgeStyles()}>
            {status}
          </Badge>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <div className="text-xs text-neutral-500 flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDueDate()}
          </div>
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 p-1 h-auto"
              onClick={() => onEdit(id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
