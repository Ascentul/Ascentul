import { Badge } from "@/components/ui/badge";

interface InterviewProcessStatusBadgeProps {
  status: string;
}

export function InterviewProcessStatusBadge({ status }: InterviewProcessStatusBadgeProps) {
  // Map status to appropriate color scheme
  const getBadgeClasses = (status: string) => {
    switch (status) {
      case 'Application Submitted':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'In Progress':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'Offer Extended':
        return 'bg-green-300 hover:bg-green-400 text-green-800';
      case 'Hired':
        return 'bg-green-600 hover:bg-green-700';
      case 'Not Selected':
        return 'bg-red-500 hover:bg-red-600';
      case 'Completed':
        return 'bg-green-500 hover:bg-green-600';
      case 'Rejected':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return '';
    }
  };

  return (
    <Badge className={getBadgeClasses(status)}>
      {status}
    </Badge>
  );
}