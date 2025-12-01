'use client';

import { Calendar, CalendarDays, Clock, Loader2, Target } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  type UpcomingItem,
  type UpcomingItemType,
  useUpcomingItems,
} from '@/hooks/useUpcomingItems';
import { cn } from '@/lib/utils';

const typeStyles: Record<UpcomingItemType, { iconBg: string; iconColor: string }> = {
  interview: { iconBg: 'bg-[#EEF1FF]', iconColor: 'text-[#5371FF]' },
  followUp: { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  goal: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
};

const typeIcons: Record<UpcomingItemType, React.ReactNode> = {
  interview: <Calendar className="h-3.5 w-3.5" />,
  followUp: <Clock className="h-3.5 w-3.5" />,
  goal: <Target className="h-3.5 w-3.5" />,
};

const typeLabels: Record<UpcomingItemType, string> = {
  interview: 'Interview',
  followUp: 'Follow-up',
  goal: 'Goal',
};

function UpcomingItemRow({ item }: { item: UpcomingItem }) {
  const styles = typeStyles[item.type];
  const icon = typeIcons[item.type];
  const label = typeLabels[item.type];

  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors group"
      aria-label={`${label}: ${item.title}, ${item.displayDate}`}
    >
      {/* Icon pill */}
      <span
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0',
          styles.iconBg,
          styles.iconColor,
        )}
      >
        {icon}
      </span>

      {/* Type label */}
      <span className="text-xs font-medium text-slate-500 w-16 flex-shrink-0">{label}</span>

      {/* Title */}
      <span className="flex-1 text-sm text-slate-900 truncate group-hover:text-[#5371FF] transition-colors">
        {item.title}
      </span>

      {/* Date pill */}
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium flex-shrink-0',
          item.isOverdue
            ? 'border-red-200 bg-red-50 text-red-600'
            : 'border-slate-200 text-slate-600',
        )}
      >
        {item.displayDate}
      </span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <CalendarDays className="h-10 w-10 text-slate-300 mb-3" />
      <p className="text-sm font-medium text-slate-600">Nothing scheduled for this week</p>
      <p className="text-xs text-slate-500 mt-1">
        As you add applications, interviews, and goals, they'll show up here.
      </p>
      <div className="flex gap-2 mt-4">
        <Link href="/applications">
          <Button variant="outline" size="sm" className="text-xs">
            Add application
          </Button>
        </Link>
        <Link href="/goals">
          <Button variant="outline" size="sm" className="text-xs">
            Create goal
          </Button>
        </Link>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  );
}

export function UpcomingSection() {
  const { items, totalCount, isLoading } = useUpcomingItems();

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm"
      aria-labelledby="upcoming-heading"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 id="upcoming-heading" className="text-sm font-semibold text-slate-900">
            Upcoming
          </h2>
          <p className="text-xs text-slate-500">Next 7 days</p>
        </div>
        {totalCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {totalCount} item{totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col divide-y divide-slate-100">
          {items.map((item) => (
            <UpcomingItemRow key={item.id} item={item} />
          ))}
          {totalCount > 5 && (
            <div className="pt-3 text-center">
              <span className="text-xs text-slate-500">
                +{totalCount - 5} more item{totalCount - 5 !== 1 ? 's' : ''} this week
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
