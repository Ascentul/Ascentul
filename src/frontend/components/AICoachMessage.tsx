import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bot, BrainCircuit, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-2xl max-w-[85%] shadow-sm',
        isUser 
          ? 'ml-auto bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10 border border-blue-200/50 dark:border-blue-800/50' 
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {!isUser ? (
          <Avatar className="w-9 h-9 border-2 border-primary/20 bg-gradient-to-br from-primary/20 to-blue-100 dark:to-blue-900/30 text-primary shadow-sm">
            <AvatarFallback>
              <BrainCircuit className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <Avatar className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-800">
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {isUser ? userName : 'Career Coach'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {format(timestamp, 'h:mm a')}
            </p>
          </div>
          <div className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:mt-3 prose-headings:mb-1">
              {message.split('\n').map((paragraph, i) => (
                paragraph.trim() ? (
                  <p key={i}>{paragraph.replace(/\*/g, '')}</p>
                ) : (
                  <div key={i} className="h-2"></div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
