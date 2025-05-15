import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

type MascotAction = 'thinking' | 'searching' | 'processing';

interface LoadingContextValue {
  isLoading: boolean;
  message: string;
  mascotAction: MascotAction;
  showGlobalLoading: (message?: string, mascotAction?: MascotAction) => void;
  hideGlobalLoading: () => void;
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

export const useLoading = (): LoadingContextValue => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Loading...');
  const [mascotAction, setMascotAction] = useState<MascotAction>('thinking');
  const { toast } = useToast();

  const showGlobalLoading = (
    newMessage: string = 'Loading...',
    newMascotAction: MascotAction = 'thinking'
  ) => {
    setMessage(newMessage);
    setMascotAction(newMascotAction);
    setIsLoading(true);
  };

  const hideGlobalLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        message,
        mascotAction,
        showGlobalLoading,
        hideGlobalLoading,
      }}
    >
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-card border rounded-lg shadow-lg p-8 max-w-md w-full mx-4 flex flex-col items-center justify-center gap-4"
            >
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <p className="text-center text-lg text-muted-foreground">{message}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
};

export default LoadingProvider;