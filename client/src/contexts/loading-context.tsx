import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LoadingState } from '@/components/ui/loading-state';

type LoadingMascotAction = 'loading' | 'thinking' | 'success' | 'achievement';

interface LoadingContextProps {
  showGlobalLoading: (message?: string, action?: LoadingMascotAction) => void;
  hideGlobalLoading: () => void;
}

const LoadingContext = createContext<LoadingContextProps | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [mascotAction, setMascotAction] = useState<LoadingMascotAction>('loading');

  const showGlobalLoading = (
    message = 'Loading...',
    action: LoadingMascotAction = 'loading'
  ) => {
    setLoadingMessage(message);
    setMascotAction(action);
    setIsLoading(true);
  };

  const hideGlobalLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ showGlobalLoading, hideGlobalLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <LoadingState
            message={loadingMessage}
            mascotAction={mascotAction}
            size="lg"
            variant="overlay"
          />
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}