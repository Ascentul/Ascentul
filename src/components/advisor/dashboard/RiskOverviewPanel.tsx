'use client';

/**
 * Risk Overview Panel
 *
 * A 2x2 grid of risk categories helping advisors identify students who might
 * be slipping through the cracks. Each tile shows a count and is clickable
 * to view the filtered list of at-risk students.
 *
 * Business meaning: This answers "Who might quietly be slipping through the cracks?" by surfacing:
 * - Low Engagement: Students who haven't logged in or had sessions recently
 * - Stalled Search: Students with applications but no progress
 * - Priority Population: At-risk students in designated priority groups (seniors, first-gen)
 * - High Volume No Offers: Students with many applications but no success yet
 */

import { AlertCircle, Search, TrendingDown, Users } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Base item type for risk category items - all items have an ID and name
 */
interface RiskCategoryItem {
  _id: string;
  name: string;
}

/**
 * Risk category data structure returned by the backend
 * The `items` array is included in the response but not currently displayed -
 * it provides details for potential drill-down views.
 */
interface RiskCategory {
  count: number;
  items?: RiskCategoryItem[];
  config?: { days?: number };
  subtitle: string;
}

interface RiskOverviewData {
  lowEngagement: RiskCategory;
  stalledSearch: RiskCategory;
  priorityPopulation: RiskCategory;
  atRiskNoOffer: RiskCategory;
}

interface RiskOverviewPanelProps {
  data: RiskOverviewData | undefined;
  isLoading?: boolean;
}

interface RiskTileProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  subtitle: string;
  href: string;
  variant?: 'warning' | 'danger' | 'info';
}

function RiskTile({ icon, title, count, subtitle, href, variant = 'warning' }: RiskTileProps) {
  const variantStyles = {
    warning: {
      bg: 'hover:bg-amber-50/50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      countColor: count > 0 ? 'text-amber-700' : 'text-slate-400',
    },
    danger: {
      bg: 'hover:bg-orange-50/50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      countColor: count > 0 ? 'text-orange-700' : 'text-slate-400',
    },
    info: {
      bg: 'hover:bg-slate-50/50',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      countColor: count > 0 ? 'text-slate-700' : 'text-slate-400',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Link
      href={href}
      className={cn(
        'block p-4 rounded-lg border border-slate-200 transition-all',
        'hover:border-slate-300 hover:shadow-sm',
        styles.bg,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', styles.iconBg)}>
          <div className={styles.iconColor}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={cn('text-2xl font-bold', styles.countColor)}>{count}</span>
          </div>
          <h3 className="text-sm font-medium text-slate-900 truncate">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

function LoadingTile() {
  return (
    <div className="p-4 rounded-lg border border-slate-200 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-12 bg-slate-200 rounded" />
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-3 w-32 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function RiskOverviewPanel({ data, isLoading }: RiskOverviewPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Risk Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <LoadingTile />
            <LoadingTile />
            <LoadingTile />
            <LoadingTile />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const totalAtRisk =
    data.lowEngagement.count + data.stalledSearch.count + data.priorityPopulation.count;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Risk Overview
          </CardTitle>
          {totalAtRisk > 0 && (
            <span className="text-sm text-slate-500">{totalAtRisk} students at risk</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <RiskTile
            icon={<TrendingDown className="h-4 w-4" />}
            title="Low Engagement"
            count={data.lowEngagement.count}
            subtitle={data.lowEngagement.subtitle}
            href="/advisor/students?filter=low-engagement"
            variant="warning"
          />
          <RiskTile
            icon={<Search className="h-4 w-4" />}
            title="Stalled Search"
            count={data.stalledSearch.count}
            subtitle={data.stalledSearch.subtitle}
            href="/advisor/students?filter=stalled-search"
            variant="warning"
          />
          <RiskTile
            icon={<Users className="h-4 w-4" />}
            title="Priority Population"
            count={data.priorityPopulation.count}
            subtitle={data.priorityPopulation.subtitle}
            href="/advisor/students?filter=priority-at-risk"
            variant="danger"
          />
          <RiskTile
            icon={<AlertCircle className="h-4 w-4" />}
            title="High Volume, No Offers"
            count={data.atRiskNoOffer.count}
            subtitle={data.atRiskNoOffer.subtitle}
            href="/advisor/students?filter=no-offers"
            variant="info"
          />
        </div>
      </CardContent>
    </Card>
  );
}
