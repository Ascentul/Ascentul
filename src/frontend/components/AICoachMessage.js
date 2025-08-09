import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BrainCircuit, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
export default function AICoachMessage({ isUser, message, timestamp, userName = 'You', }) {
    return (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, className: cn('rounded-2xl max-w-[85%] shadow-sm', isUser
            ? 'ml-auto bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10 border border-blue-200/50 dark:border-blue-800/50'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'), children: _jsxs("div", { className: "flex items-start gap-3 p-4", children: [!isUser ? (_jsx(Avatar, { className: "w-9 h-9 border-2 border-primary/20 bg-gradient-to-br from-primary/20 to-blue-100 dark:to-blue-900/30 text-primary shadow-sm", children: _jsx(AvatarFallback, { children: _jsx(BrainCircuit, { className: "h-5 w-5" }) }) })) : (_jsx(Avatar, { className: "w-9 h-9 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-800", children: _jsx(AvatarFallback, { children: _jsx(User, { className: "h-5 w-5" }) }) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-gray-100", children: isUser ? userName : 'Career Coach' }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: format(timestamp, 'h:mm a') })] }), _jsx("div", { className: "text-sm space-y-2 text-gray-700 dark:text-gray-300", children: _jsx("div", { className: "prose prose-sm max-w-none prose-p:my-1 prose-headings:mt-3 prose-headings:mb-1", children: message.split('\n').map((paragraph, i) => (paragraph.trim() ? (_jsx("p", { children: paragraph.replace(/\*/g, '') }, i)) : (_jsx("div", { className: "h-2" }, i)))) }) })] })] }) }));
}
