import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
export const LoadingState = ({ message = 'Loading...', size = 'md', variant = 'inline', mascotAction = 'thinking', className, }) => {
    // Size configuration
    const sizeConfig = {
        sm: {
            spinner: 'h-4 w-4',
            text: 'text-sm',
            padding: 'p-3',
        },
        md: {
            spinner: 'h-6 w-6',
            text: 'text-base',
            padding: 'p-4',
        },
        lg: {
            spinner: 'h-8 w-8',
            text: 'text-lg',
            padding: 'p-6',
        },
    };
    const { spinner, text, padding } = sizeConfig[size];
    // Inline variant - simpler version
    if (variant === 'inline') {
        return (_jsxs("div", { className: cn('flex flex-col items-center justify-center gap-3', className), children: [_jsx("div", { className: "relative", children: _jsx(Loader2, { className: cn('animate-spin text-primary', spinner) }) }), message && _jsx("p", { className: cn('text-muted-foreground text-center', text), children: message })] }));
    }
    // Card variant - more pronounced with animation
    return (_jsx(Card, { className: cn('overflow-hidden', className), children: _jsxs(CardContent, { className: cn('flex items-center justify-center gap-4', padding), children: [_jsx(AnimatePresence, { mode: "wait", children: _jsx(motion.div, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.8, opacity: 0 }, transition: { duration: 0.2 }, className: "relative", children: _jsx(Loader2, { className: cn('animate-spin text-primary', spinner) }) }, "loader") }), message && (_jsx(motion.p, { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, delay: 0.1 }, className: cn('text-muted-foreground', text), children: message }))] }) }));
};
export default LoadingState;
