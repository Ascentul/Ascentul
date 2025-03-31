import React from 'react';
import { Loader2 } from 'lucide-react';
import { CareerMascot } from './career-mascot';

type LoadingSize = 'sm' | 'md' | 'lg' | 'full';
type LoadingVariant = 'default' | 'overlay' | 'inline' | 'card';

// Default sizing constants
const sizeClasses = {
  sm: 'p-3 max-w-md',
  md: 'p-4 max-w-xl',
  lg: 'p-6 max-w-2xl',
  full: 'p-6 w-full h-full'
};

// Variant styling
const variantClasses = {
  default: 'bg-background/80 rounded-lg shadow-md',
  overlay: 'bg-background/90 backdrop-blur-sm shadow-lg rounded-xl',
  inline: 'bg-transparent',
  card: 'bg-card rounded-lg border shadow-sm'
};

interface LoadingStateProps {
  message?: string;
  size?: LoadingSize;
  variant?: LoadingVariant;
  className?: string;
  mascotAction?: 'loading' | 'thinking' | 'success' | 'achievement';
}

export function LoadingState({
  message = 'Loading...',
  size = 'md',
  variant = 'default',
  className = '',
  mascotAction = 'loading'
}: LoadingStateProps) {
  const containerClasses = `${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  
  const getMascotSize = (): 'sm' | 'md' | 'lg' => {
    switch (size) {
      case 'sm': return 'sm';
      case 'md': return 'md';
      case 'lg': 
      case 'full': return 'lg';
      default: return 'md';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses}`}>
      <div className="flex flex-col items-center justify-center">
        <CareerMascot 
          action={mascotAction}
          size={getMascotSize()}
          className="mb-3" 
        />
        
        <div className="text-center">
          <p className="text-sm md:text-base font-medium text-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}