'use client';

/**
 * Progress and Outcomes Card
 *
 * Compact summary of student career outcomes to help advisors track
 * whether students are making real progress toward their goals.
 *
 * Business meaning: This answers "Are my students making progress toward real paths?" by showing:
 * - Seniors with interviews (key milestone for graduating students)
 * - Students with offers (ultimate success metric)
 * - Average applications per active job seeker (effort indicator)
 */

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Briefcase, Award, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutcomeMetric {
  count: number;
  total?: number;
  percentage?: number;
  subtitle: string;
}

interface AvgMetric {
  value: number;
  activeStudents: number;
  subtitle: string;
}

interface ProgressOutcomesData {
  seniorsWithInterview: OutcomeMetric;
  studentsWithOffer: OutcomeMetric;
  avgAppsPerStudent: AvgMetric;
  totalActiveApps: number;
}

interface ProgressOutcomesCardProps {
  data: ProgressOutcomesData | undefined;
  isLoading?: boolean;
}

interface MetricTileProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  subtitle: string;
  href?: string;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
}

function MetricTile({ icon, value, label, subtitle, href, highlight }: MetricTileProps) {
  const content = (
    <div
      className={cn(
        'p-3 rounded-lg border transition-colors',
        href && 'hover:bg-slate-50 hover:border-slate-300 cursor-pointer',
        highlight ? 'bg-primary/5 border-primary/20' : 'bg-white border-slate-200'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            highlight ? 'bg-primary/10' : 'bg-slate-100'
          )}
        >
          <div className={highlight ? 'text-primary' : 'text-slate-500'}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                'text-2xl font-bold',
                highlight ? 'text-primary' : 'text-slate-900'
              )}
            >
              {value}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-700 truncate">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function LoadingTile() {
  return (
    <div className="p-3 rounded-lg border border-slate-200 animate-pulse">
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

export function ProgressOutcomesCard({ data, isLoading }: ProgressOutcomesCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Progress & Outcomes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <LoadingTile />
            <LoadingTile />
            <LoadingTile />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // Format seniors with interview as fraction if we have totals
  const seniorsLabel =
    data.seniorsWithInterview.total !== undefined && data.seniorsWithInterview.total > 0
      ? `${data.seniorsWithInterview.count}/${data.seniorsWithInterview.total}`
      : String(data.seniorsWithInterview.count);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Progress & Outcomes
          </CardTitle>
          <Link
            href="/advisor/applications"
            className="text-sm text-primary hover:underline font-medium"
          >
            View all applications
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <MetricTile
            icon={<Briefcase className="h-4 w-4" />}
            value={seniorsLabel}
            label="Seniors with Interviews"
            subtitle={data.seniorsWithInterview.subtitle}
            href="/advisor/students?filter=seniors-interviewed"
          />
          <MetricTile
            icon={<Award className="h-4 w-4" />}
            value={data.studentsWithOffer.count}
            label="Students with Offers"
            subtitle={data.studentsWithOffer.subtitle}
            href="/advisor/students?filter=has-offer"
            highlight={data.studentsWithOffer.count > 0}
          />
          <MetricTile
            icon={<BarChart3 className="h-4 w-4" />}
            value={(data.avgAppsPerStudent.value ?? 0).toFixed(1)}
            label="Avg Apps/Student"
            subtitle={data.avgAppsPerStudent.subtitle}
          />
        </div>

        {/* Summary row */}
        <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
          <span className="text-slate-500">Total active applications</span>
          <span className="font-semibold text-slate-900">{data.totalActiveApps}</span>
        </div>
      </CardContent>
    </Card>
  );
}
