'use client';

/**
 * Caseload and Readiness Gaps Card
 *
 * Shows the advisor's total caseload alongside gaps in career readiness,
 * helping advisors identify students who are missing fundamental preparation.
 *
 * Business meaning: This helps advisors ensure basic career readiness by showing:
 * - Total caseload size for context
 * - Students missing career goals or direction
 * - Seniors/near-grads with zero applications (urgent gap)
 * - Students without resumes on file
 */

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, GraduationCap, FileText, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GapCategory {
  count: number;
  items?: Array<{
    _id: string;
    name?: string;
    email?: string;
    graduation_year?: string;
  }>;
  subtitle: string;
}

interface CaseloadGapsData {
  totalStudents: number;
  noGoal: GapCategory;
  seniorsNoApps: GapCategory;
  noResume: GapCategory;
}

interface CaseloadGapsCardProps {
  data: CaseloadGapsData | undefined;
  isLoading?: boolean;
}

interface GapRowProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  href: string;
  variant?: 'warning' | 'danger' | 'info';
}

function GapRow({ icon, label, count, total, href, variant = 'warning' }: GapRowProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  const variantStyles = {
    warning: {
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      bar: 'bg-amber-400',
    },
    danger: {
      badge: 'bg-orange-100 text-orange-700 border-orange-200',
      bar: 'bg-orange-400',
    },
    info: {
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      bar: 'bg-slate-400',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors group"
    >
      <div className="text-slate-400 group-hover:text-slate-600">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-700 truncate">{label}</span>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={cn('text-xs font-semibold', styles.badge)}>
              {count}
            </Badge>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
          </div>
        </div>
        {count > 0 && total > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', styles.bar)}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 w-8 text-right">{percentage}%</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center gap-3 p-2 animate-pulse">
      <div className="h-5 w-5 rounded bg-slate-200" />
      <div className="flex-1 space-y-1.5">
        <div className="flex justify-between">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-5 w-8 bg-slate-200 rounded" />
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full" />
      </div>
    </div>
  );
}

export function CaseloadGapsCard({ data, isLoading }: CaseloadGapsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            My Caseload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <div className="h-8 w-12 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const totalGaps = data.noGoal.count + data.seniorsNoApps.count + data.noResume.count;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            My Caseload
          </CardTitle>
          {totalGaps > 0 && (
            <span className="text-xs text-slate-500">
              {totalGaps} readiness gaps
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Total caseload header */}
        <Link
          href="/advisor/students"
          className="flex items-center justify-between mb-4 pb-3 border-b group"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {data.totalStudents}
            </span>
            <span className="text-sm text-slate-500">students</span>
          </div>
          <span className="text-sm text-primary font-medium group-hover:underline flex items-center gap-1">
            View all
            <ChevronRight className="h-4 w-4" />
          </span>
        </Link>

        {/* Readiness gaps */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Readiness Gaps
          </p>

          <GapRow
            icon={<Target className="h-4 w-4" />}
            label="No career goal defined"
            count={data.noGoal.count}
            total={data.totalStudents}
            href="/advisor/students?filter=no-goal"
            variant="warning"
          />

          <GapRow
            icon={<GraduationCap className="h-4 w-4" />}
            label="Seniors with zero apps"
            count={data.seniorsNoApps.count}
            total={data.totalStudents}
            href="/advisor/students?filter=seniors-no-apps"
            variant="danger"
          />

          <GapRow
            icon={<FileText className="h-4 w-4" />}
            label="No resume on file"
            count={data.noResume.count}
            total={data.totalStudents}
            href="/advisor/students?filter=no-resume"
            variant="info"
          />
        </div>

        {totalGaps === 0 && data.totalStudents > 0 && (
          <div className="text-center py-4 text-sm text-green-600 bg-green-50 rounded-lg">
            All students have basic readiness items in place
          </div>
        )}
      </CardContent>
    </Card>
  );
}
