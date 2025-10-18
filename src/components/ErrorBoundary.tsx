'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Normalize any error-like value to a proper Error instance
 * Preserves error message from objects with a 'message' property
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  // Extract message from error-like objects
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message: unknown }).message);
    const normalized = new Error(message);

    // Preserve stack if available
    if ('stack' in error && typeof (error as { stack?: unknown }).stack === 'string') {
      normalized.stack = (error as { stack: string }).stack;
    }

    return normalized;
  }

  // Fallback for primitives and other types
  return new Error(String(error));
}

export interface ErrorFallbackProps {
  reset: () => void;
  reload: () => void;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /**
   * Show detailed error messages and stack traces
   * @default false
   * @security Only enabled in development mode to prevent information leakage in production
   */
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorBoundaryKey: number;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire app
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorBoundaryKey: 0,
    };
  }

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    // Normalize the error to ensure it's a proper Error instance
    // JavaScript allows throwing any value (strings, numbers, objects, etc.)
    const normalizedError = normalizeError(error);

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', normalizedError, errorInfo);
    }

    // Update state with error details
    this.setState({
      error: normalizedError,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(normalizedError, errorInfo);

    // In production, you could send this to an error reporting service
    // Example: Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorBoundaryKey: this.state.errorBoundaryKey + 1,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({
              reset: this.handleReset,
              reload: this.handleReload,
              error: this.state.error,
              errorInfo: this.state.errorInfo,
            })
          : this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen p-4" role="alert" aria-live="assertive">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <CardDescription>
                    An unexpected error occurred. You can try refreshing the page or go back.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Only show error details in development to prevent information leakage */}
              {this.props.showDetails && process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-4 rounded-lg bg-gray-100 border border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">Error Details:</p>
                  <p className="text-sm text-gray-700 font-mono">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-3">
                      <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                        Component Stack
                      </summary>
                      <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={this.handleReset} variant="outline">
                  Try Again
                </Button>
                <Button onClick={this.handleReload} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-gray-500">
                  💡 Tip: Check the browser console for more details
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    // Fragment key forces remount of entire child tree on reset, clearing all child state
    return <React.Fragment key={this.state.errorBoundaryKey}>{this.props.children}</React.Fragment>;
  }
}

/**
 * Simplified Error Boundary for specific sections
 * Shows an inline error message instead of full-page
 */
export function InlineErrorBoundary({
  children,
  fallbackMessage = 'Failed to load this section',
}: {
  children: ReactNode;
  fallbackMessage?: string;
}) {
  return (
    <ErrorBoundary
      fallback={({ reset }) => (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50" role="alert" aria-live="polite">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <p className="text-sm font-medium">{fallbackMessage}</p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xs text-red-600 flex-1">
              Try again or refresh the page if the issue persists.
            </p>
            <Button
              onClick={reset}
              variant="outline"
              size="sm"
              className="text-xs h-7"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
