import { jsx as _jsx } from "react/jsx-runtime";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
export const InterviewProcessStatusBadge = ({ status, className }) => {
    // Determine appropriate variant based on status
    let variant = 'outline';
    let customClass = '';
    switch (status) {
        case 'Application Submitted':
            customClass = 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
            break;
        case 'Application Received':
            customClass = 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200';
            break;
        case 'Phone Screen':
            customClass = 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200';
            break;
        case 'Technical Interview':
            customClass = 'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200';
            break;
        case 'Onsite Interview':
            customClass = 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
            break;
        case 'Final Round':
            customClass = 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200';
            break;
        case 'Offer Received':
            customClass = 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
            break;
        case 'Hired':
            customClass = 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 font-semibold';
            break;
        case 'Not Selected':
        case 'Rejected':
            variant = 'destructive';
            break;
        case 'Completed':
            customClass = 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200';
            break;
        case 'Waiting for Response':
            customClass = 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200';
            break;
        case 'In Progress':
            customClass = 'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200';
            break;
        default:
            // Default styling
            break;
    }
    return (_jsx(Badge, { variant: variant, className: cn("whitespace-nowrap text-xs font-medium", customClass, className), children: status }));
};
export default InterviewProcessStatusBadge;
