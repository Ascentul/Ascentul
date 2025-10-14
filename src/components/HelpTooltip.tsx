'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, Info, Lightbulb } from 'lucide-react';

interface HelpTooltipProps {
  content: string;
  icon?: 'help' | 'info' | 'lightbulb';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  iconClassName?: string;
  ariaLabel?: string;
}

/**
 * HelpTooltip Component
 * Shows contextual help information on hover
 */
export function HelpTooltip({
  content,
  icon = 'help',
  side = 'top',
  className,
  iconClassName,
  ariaLabel,
}: HelpTooltipProps) {
  const Icon = icon === 'info' ? Info : icon === 'lightbulb' ? Lightbulb : HelpCircle;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${className}`}
            aria-label={ariaLabel || 'Help information'}
          >
            <Icon className={`h-4 w-4 ${iconClassName}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs text-sm"
          sideOffset={5}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Feature Badge
 * Highlights new or beta features
 */
export function FeatureBadge({
  label = 'New',
  variant = 'new',
}: {
  label?: string;
  variant?: 'new' | 'beta' | 'improved';
}) {
  const colors = {
    new: 'bg-blue-100 text-blue-700 border-blue-200',
    beta: 'bg-purple-100 text-purple-700 border-purple-200',
    improved: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[variant]}`}
    >
      {label}
    </span>
  );
}

/**
 * Keyboard Shortcut Display
 * Shows keyboard shortcuts in a styled format
 */
export function KeyboardShortcut({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((key, index) => (
        <span key={index}>
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md">
            {key}
          </kbd>
          {index < keys.length - 1 && (
            <span className="text-gray-500 mx-1">+</span>
          )}
        </span>
      ))}
    </span>
  );
}
