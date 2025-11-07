'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, FileEdit, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Review {
  _id: string;
  student_id: string;
  student_name: string;
  asset_type: string;
  asset_id: string;
  status: string;
  submitted_at: number;
}

interface ReviewQueueSnapshotProps {
  reviews: Review[];
  isLoading?: boolean;
}

export function ReviewQueueSnapshot({ reviews, isLoading }: ReviewQueueSnapshotProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileEdit className='h-5 w-5' />
            Pending Reviews
          </CardTitle>
          <CardDescription>Documents waiting for your review</CardDescription>
        </CardHeader>
        <CardContent className='h-[300px] flex items-center justify-center' aria-live='polite' aria-busy='true'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' role='status' aria-label='Loading pending reviews'></div>
        </CardContent>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileEdit className='h-5 w-5' />
          Pending Reviews
          {reviews && reviews.length > 0 && (
            <Badge variant='secondary' className='ml-2'>
              {reviews.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Documents waiting for your review</CardDescription>
      </CardHeader>
        {reviews.length === 0 ? (
          <div className='text-center py-12 text-sm text-muted-foreground'>
            <FileEdit className='h-12 w-12 mx-auto mb-3 opacity-50' aria-hidden='true' />
            <p>No pending reviews</p>
            <p className='text-xs mt-1'>All caught up!</p>
          </div>
          </div>
        ) : (
          <div className='space-y-3 max-h-[400px] overflow-y-auto'>
            {reviews.map((review) => {
              const timeAgo = formatDistanceToNow(new Date(review.submitted_at), {
                addSuffix: true,
              });

              return (
                <div key={review._id} className='p-3 border rounded-lg hover:bg-muted/50 space-y-2'>
                  <div className='flex items-start gap-3'>
                    <div className='mt-1'>
                      {review.asset_type === 'resume' ? (
                        <FileText className='h-5 w-5 text-primary' />
                      ) : (
                        <FileEdit className='h-5 w-5 text-primary' />
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
                          {review.asset_type === 'resume' ? 'Resume' : 'Cover Letter'}
                        </Badge>
                      </div>
                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <User className='h-3 w-3' />
                        <span className='truncate'>{review.student_name}</span>
                      </div>
                      <div className='flex items-center gap-2 text-xs text-muted-foreground mt-1'>
                        <Clock className='h-3 w-3' />
                        <span>Submitted {timeAgo}</span>
                      </div>
                    </div>
                  </div>
                  <Link 
                    href={`/advisor/advising/reviews/${review._id}`}
                    className='inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 w-full'
                  >
                    Start Review
                  </Link>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {reviews && reviews.length > 0 && (
          <div className='mt-4 pt-4 border-t'>
            <Link href='/advisor/advising/reviews'>
              <Button variant='outline' size='sm' className='w-full'>
                View All Reviews
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
