'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import Link from 'next/link';

export interface UpcomingItem {
  _id: string;
  type: 'session' | 'followup';
  student_id: string;
  student_name: string;
  title: string;
  date: number;
  priority?: string;
  status?: string;
}

interface UpcomingItemsProps {
  items: UpcomingItem[];
  isLoading?: boolean;
}

export function UpcomingItems({ items, isLoading }: UpcomingItemsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Upcoming This Week
          </CardTitle>
          <CardDescription>Sessions and follow-ups in the next 7 days</CardDescription>
        </CardHeader>
        <CardContent className='h-[300px] flex items-center justify-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Calendar className='h-5 w-5' />
          Upcoming This Week
        </CardTitle>
        <CardDescription>Sessions and follow-ups in the next 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        {!items || items.length === 0 ? (
          <div className='text-center py-12 text-sm text-muted-foreground'>
            <Calendar className='h-12 w-12 mx-auto mb-3 opacity-50' />
            <p>No upcoming items this week</p>
          </div>
        ) : (
          <div className='space-y-3 max-h-[400px] overflow-y-auto'>
            {items.map((item) => {
              const itemDate = new Date(item.date);

              // Validate date timestamp
              if (isNaN(itemDate.getTime())) {
                console.error(`Invalid date timestamp for item ${item._id}:`, item.date);
                return null;
              }

              const isOverdue = isPast(itemDate) && !isToday(itemDate);

              let dateLabel = format(itemDate, 'MMM d, h:mm a');
              if (isToday(itemDate)) {
                dateLabel = 'Today, ' + format(itemDate, 'h:mm a');
              } else if (isTomorrow(itemDate)) {
                dateLabel = 'Tomorrow, ' + format(itemDate, 'h:mm a');
              }

              return (
                <div
                  key={item._id}
                  className={`p-3 border rounded-lg space-y-2 ${
                    isOverdue ? 'bg-red-50 border-red-200' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <Badge
                          variant='outline'
                          className={
                            item.type === 'session'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }
                        >
                          {item.type === 'session' ? 'Session' : 'Follow-up'}
                        </Badge>
                        {item.priority === 'urgent' && (
                          <Badge variant='destructive' className='text-xs'>
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <h4 className='font-medium text-sm truncate'>{item.title}</h4>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                    <div className='flex items-center gap-1'>
                      <User className='h-3 w-3' />
                      <span className='truncate'>{item.student_name}</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Clock className='h-3 w-3' />
                      <span>{dateLabel}</span>
                    </div>
                  </div>

                  {isOverdue && (
                    <div className='flex items-center gap-1 text-xs text-red-600 font-medium'>
                      <AlertCircle className='h-3 w-3' />
                      <span>Overdue</span>
                    </div>
                  )}

                  <Link href={`/advisor/students/${item.student_id}`}>
                    <Button variant='ghost' size='sm' className='w-full mt-2'>
                      View Student
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {items && items.length > 0 && (
          <div className='mt-4 pt-4 border-t'>
            <Link href='/advisor/advising/calendar'>
              <Button variant='outline' size='sm' className='w-full'>
                View Full Calendar
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
