export interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"
          aria-hidden="true"
        ></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
