import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';

interface AICoachMessageProps {
  isUser: boolean;
  message: string;
  timestamp: Date;
  userName?: string;
}

export default function AICoachMessage({
  isUser,
  message,
  timestamp,
  userName = 'You',
}: AICoachMessageProps) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg max-w-[80%]',
        isUser 
          ? 'ml-auto border-r-3 border-secondary/50 bg-secondary/10' 
          : 'border-l-3 border-primary/50 bg-primary/10'
      )}
    >
      <div className="flex items-start gap-3">
        {!isUser && (
          <Avatar className="w-8 h-8 bg-primary/10 text-primary">
            <AvatarFallback>
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">
            {isUser ? userName : 'Career Coach'}
          </p>
          <div className="text-sm space-y-2">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>
                {message}
              </ReactMarkdown>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {format(timestamp, 'h:mm a')}
          </p>
        </div>
      </div>
    </div>
  );
}
