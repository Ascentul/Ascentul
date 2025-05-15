import React from 'react';
import { LoadingState } from './loading-state';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';

interface QueryWrapperProps<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  loadingMessage?: string;
  loadingVariant?: 'default' | 'overlay' | 'inline' | 'card';
  loadingSize?: 'sm' | 'md' | 'lg' | 'full';
  mascotAction?: 'loading' | 'thinking' | 'success' | 'achievement';
  isEmpty?: (data: T) => boolean;
  children: (data: T) => React.ReactNode;
}

export function QueryWrapper<T>({
  data,
  isLoading,
  isError,
  errorComponent,
  emptyComponent,
  loadingMessage = 'Loading data...',
  loadingVariant = 'default',
  loadingSize = 'md',
  mascotAction = 'loading',
  isEmpty = (data: T) => Array.isArray(data) && data.length === 0,
  children
}: QueryWrapperProps<T>) {
  // Handle loading state
  if (isLoading) {
    return (
      <LoadingState
        message={loadingMessage}
        variant={loadingVariant}
        size={loadingSize}
        mascotAction={mascotAction}
      />
    );
  }

  // Handle error state
  if (isError) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          There was an error loading the data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  // Handle undefined data
  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>
          No data was found. This might be unexpected behavior.
        </AlertDescription>
      </Alert>
    );
  }

  // Handle empty data (if the data is empty according to the provided isEmpty function)
  if (isEmpty(data)) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">No items found.</p>
      </div>
    );
  }

  // Render the children with the data
  return <>{children(data)}</>;
}