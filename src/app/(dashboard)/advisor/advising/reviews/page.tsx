'use client';

import { AdvisorGate } from '@/components/advisor/AdvisorGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewQueue } from '@/components/advisor/reviews/ReviewQueue';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { FileEdit, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdvisorReviewsPage() {
  const { user, isLoaded } = useUser();
  const clerkId = user?.id;

  if (!isLoaded) {
    return <div className='container mx-auto p-6'>Loading...</div>;
  }

  const reviews = useQuery(
    api.advisor_reviews_queries.getReviews,
    clerkId ? { clerkId } : 'skip'
  );

  const stats = useQuery(
    api.advisor_reviews_queries.getReviewQueueStats,
    clerkId ? { clerkId } : 'skip'
  );

  return (
    <ErrorBoundary>
      <AdvisorGate requiredFlag='advisor.advising'>
        <div className='container mx-auto p-6 space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>Reviews</h1>
              <p className='text-muted-foreground mt-1'>
                Review student resumes and cover letters
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className='grid gap-4 md:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Waiting</CardTitle>
                <Clock className='h-4 w-4 text-orange-500' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats?.waiting ?? '-'}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>In Progress</CardTitle>
                <FileEdit className='h-4 w-4 text-blue-500' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {stats?.inProgress ?? '-'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Completed</CardTitle>
                <CheckCircle className='h-4 w-4 text-green-500' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {stats?.completed ?? '-'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Urgent</CardTitle>
                <AlertCircle className='h-4 w-4 text-red-500' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-red-600'>
                  {stats?.urgent ?? '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Review Queue */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileEdit className='h-5 w-5' />
              <ReviewQueue
                reviews={reviews || []}
                isLoading={isLoaded && clerkId !== undefined && reviews === undefined}
              />
              <ReviewQueue
                reviews={reviews || []}
                isLoading={reviews === undefined}
              />
            </CardContent>
          </Card>
        </div>
      </AdvisorGate>
    </ErrorBoundary>
  );
}
