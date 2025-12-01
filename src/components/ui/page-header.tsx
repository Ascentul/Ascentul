import * as React from 'react';

import { cn } from '@/lib/utils';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * PageHeader - Standardized page header component
 *
 * Provides consistent header styling across all authenticated pages with:
 * - Title and optional description on the left
 * - Optional action buttons on the right
 * - Responsive layout that stacks on mobile
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Dashboard"
 *   description="Welcome back! Here's what's happening today."
 *   action={<Button>New Item</Button>}
 * />
 * ```
 */
function PageHeader({ title, description, action, className, ...props }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6',
        className,
      )}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export { PageHeader };
