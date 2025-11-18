'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, FileEdit, Search, Filter, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Review {
  _id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  asset_id: string;
  asset_type: string;
  asset_name: string;
  status: string;
  priority: string;
  requested_at: number;
  reviewer_id?: string | null;
  reviewed_at?: number | null;
}

interface ReviewQueueProps {
  reviews: Review[];
  isLoading?: boolean;
}

export function ReviewQueue({ reviews, isLoading }: ReviewQueueProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Filter reviews (memoized for performance)
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        review.student_name.toLowerCase().includes(search) ||
        review.asset_name.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === 'all' || review.status === statusFilter;

      const matchesType =
        typeFilter === 'all' || review.asset_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [reviews, searchTerm, statusFilter, typeFilter]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-3'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search by student or document name...'
            aria-label='Search reviews by student or document name'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-full sm:w-[180px]' aria-label='Filter by status'>
            <Filter className='h-4 w-4 mr-2' />
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='waiting'>Waiting</SelectItem>
            <SelectItem value='in_progress'>In Progress</SelectItem>
            <SelectItem value='completed'>Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className='w-full sm:w-[180px]' aria-label='Filter by type'>
            <Filter className='h-4 w-4 mr-2' />
            <SelectValue placeholder='Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Types</SelectItem>
            <SelectItem value='resume'>Resumes</SelectItem>
            <SelectItem value='cover_letter'>Cover Letters</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Review count */}
      <div className='text-sm text-muted-foreground'>
        Showing {filteredReviews.length} of {reviews.length} reviews
      </div>

      {/* Review list */}
      {filteredReviews.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center h-64 text-center'>
            <FileEdit className='h-12 w-12 text-muted-foreground mb-4' />
            <p className='text-muted-foreground mb-2'>
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No reviews match your filters'
                : 'No reviews in queue'}
            </p>
            <p className='text-sm text-muted-foreground'>
              Reviews will appear here when students submit documents
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {filteredReviews.map((review) => {
            const isUrgent = review.priority === 'urgent';
            const isWaiting = review.status === 'waiting';
            const isInProgress = review.status === 'in_progress';
            const isCompleted = review.status === 'completed';

            const statusColors = {
              waiting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
              in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
              completed: 'bg-green-100 text-green-800 border-green-200',
              default: 'bg-gray-100 text-gray-800 border-gray-200',
            };

            // Defensive: fallback to default if status is unexpected
            const statusColor = statusColors[review.status as keyof typeof statusColors] || statusColors.default;

            return (
              <Card
                key={review._id}
                className={`${isUrgent && isWaiting ? 'border-red-300 bg-red-50' : ''}`}
              >
                <CardContent className='p-4'>
                  <div className='flex items-start gap-4'>
                    {/* Icon */}
                    <div className='flex-shrink-0 mt-1'>
                      {review.asset_type === 'resume' ? (
                        <FileText className='h-6 w-6 text-primary' />
                      ) : (
                        <FileEdit className='h-6 w-6 text-primary' />
                      )}
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2 mb-2'>
                        <div>
                          <h3 className='font-medium text-sm'>
                            {review.asset_name}
                          </h3>
                          <div className='flex items-center gap-2 mt-1'>
                            <User className='h-3 w-3 text-muted-foreground' />
                            <span className='text-sm text-muted-foreground'>
                              {review.student_name}
                            </span>
                          </div>
                        </div>

                        <div className='flex flex-col items-end gap-2'>
                          <Badge
                            variant='secondary'
                            className={statusColor}
                          >
                            {review.status === 'waiting'
                              ? 'Waiting'
                              : review.status === 'in_progress'
                              ? 'In Progress'
                              : review.status === 'completed'
                              ? 'Completed'
                              : review.status}
                          </Badge>

                          {isUrgent && (
                            <Badge variant='destructive' className='text-xs'>
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className='flex items-center gap-4 text-xs text-muted-foreground mb-3'>
                        <div className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          Requested {format(new Date(review.requested_at), 'MMM d, h:mm a')}
                        </div>
                        {review.reviewed_at != null && (
                          <div className='flex items-center gap-1'>
                            Reviewed {format(new Date(review.reviewed_at), 'MMM d, h:mm a')}
                          </div>
                        )}
                      </div>

                      <div className='flex gap-2'>
                        <Link href={`/advisor/advising/reviews/${review._id}`}>
                          <Button variant='default' size='sm'>
                            {isCompleted
                              ? 'View Review'
                              : isInProgress
                              ? 'Continue Review'
                              : 'Start Review'}
                          </Button>
                        </Link>

                        <Link href={`/advisor/students/${review.student_id}`}>
                          <Button variant='outline' size='sm'>
                            View Student
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
