'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, TrendingUp } from 'lucide-react';

interface ActivityChartProps {
  data: Array<{ date: string; count: number }>;
  isLoading?: boolean;
}

export function ActivityChart({ data, isLoading }: ActivityChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart className='h-5 w-5' />
            Session Activity
          </CardTitle>
          <CardDescription>Sessions conducted over the last 4 weeks</CardDescription>
        </CardHeader>
        <CardContent className='h-[200px] flex items-center justify-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </CardContent>
      </Card>
    );
  }

  // Filter out entries with invalid dates upfront
  const validData = (data || []).filter((week) => {
    const isValid = !isNaN(new Date(week.date).getTime());
    if (!isValid) {
      console.error(`Invalid date string for week:`, week.date);
    }
    return isValid;
  });

  if (validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart className='h-5 w-5' />
            Session Activity
          </CardTitle>
          <CardDescription>Sessions conducted over the last 4 weeks</CardDescription>
        </CardHeader>
        <CardContent className='h-[200px] flex items-center justify-center'>
          <p className='text-sm text-muted-foreground'>No session data available</p>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...validData.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <BarChart className='h-5 w-5' />
          Session Activity
        </CardTitle>
        <CardDescription>Sessions conducted over the last 4 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {validData.map((week) => {
            const weekDate = new Date(week.date);
            const percentage = (week.count / maxCount) * 100;
            const weekLabel = weekDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={week.date} className='space-y-1'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground'>Week of {weekLabel}</span>
                  <span className='font-medium'>
                    {week.count} session{week.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div
                  className='h-2 bg-muted rounded-full overflow-hidden'
                  role='progressbar'
                  aria-valuenow={Math.round(percentage)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Week of ${weekLabel}: ${week.count} session${week.count !== 1 ? 's' : ''}`}
                >
                  <div
                    className='h-full bg-primary rounded-full transition-all'
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className='mt-4 pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground'>
          <TrendingUp className='h-3 w-3' />
          <span>
            Total: {validData.reduce((sum, week) => sum + week.count, 0)} sessions in {validData.length} {validData.length === 1 ? 'week' : 'weeks'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
