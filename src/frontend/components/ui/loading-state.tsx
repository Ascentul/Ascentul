import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'card' | 'inline';
  mascotAction?: 'thinking' | 'searching' | 'processing';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  variant = 'inline',
  mascotAction = 'thinking',
  className,
}) => {
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
    return (
      <div className={cn(
        'flex flex-col items-center justify-center gap-3',
        className
      )}>
        <div className="relative">
          <Loader2 className={cn('animate-spin text-primary', spinner)} />
        </div>
        {message && <p className={cn('text-muted-foreground text-center', text)}>{message}</p>}
      </div>
    );
  }

  // Card variant - more pronounced with animation
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className={cn('flex items-center justify-center gap-4', padding)}>
        <AnimatePresence mode="wait">
          <motion.div
            key="loader"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <Loader2 className={cn('animate-spin text-primary', spinner)} />
          </motion.div>
        </AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className={cn('text-muted-foreground', text)}
          >
            {message}
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
};

export default LoadingState;