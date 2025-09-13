import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
const LoadingContext = createContext(undefined);
export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};
export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('Loading...');
    const [mascotAction, setMascotAction] = useState('thinking');
    const { toast } = useToast();
    const showGlobalLoading = (newMessage = 'Loading...', newMascotAction = 'thinking') => {
        setMessage(newMessage);
        setMascotAction(newMascotAction);
        setIsLoading(true);
    };
    const hideGlobalLoading = () => {
        setIsLoading(false);
    };
    return (_jsxs(LoadingContext.Provider, { value: {
            isLoading,
            message,
            mascotAction,
            showGlobalLoading,
            hideGlobalLoading,
        }, children: [children, _jsx(AnimatePresence, { children: isLoading && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 }, className: "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center", children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, transition: { duration: 0.2 }, className: "bg-card border rounded-lg shadow-lg p-8 max-w-md w-full mx-4 flex flex-col items-center justify-center gap-4", children: [_jsx("div", { className: "relative", children: _jsx(Loader2, { className: "h-12 w-12 animate-spin text-primary" }) }), _jsx("p", { className: "text-center text-lg text-muted-foreground", children: message })] }) })) })] }));
};
export default LoadingProvider;
