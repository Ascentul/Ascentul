'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Users,
  Building,
  MapPin,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { format, isAfter } from 'date-fns'

interface Interview {
  id: string | number
  company: string
  position: string
  date: string
  time?: string
  location?: string
  type: string
  status: string
  notes?: string
  applicationId?: string | number
}

export function ActiveInterviewsSummary() {
  const { data: interviews = [], isLoading } = useQuery<Interview[]>({
    queryKey: ['/api/interviews'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/interviews')
        return await res.json()
      } catch (error) {
        console.error('Error fetching interviews:', error)
        return []
      }
    }
  })

  // Ensure interviews is an array and filter to show only upcoming and in-progress interviews
  const interviewsArray = Array.isArray(interviews) ? interviews : []
  const activeInterviews = interviewsArray.filter(interview => {
    const interviewDate = new Date(interview.date)
    const now = new Date()
    return isAfter(interviewDate, now) || interview.status === 'in_progress'
  }).slice(0, 3) // Show top 3

  const totalInterviews = interviewsArray.length
  const upcomingInterviews = interviewsArray.filter(interview => {
    const interviewDate = new Date(interview.date)
    const now = new Date()
    return isAfter(interviewDate, now)
  }).length

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'phone':
        return <Clock className="h-3 w-3" />
      case 'video':
        return <Users className="h-3 w-3" />
      case 'in-person':
        return <Building className="h-3 w-3" />
      default:
        return <Calendar className="h-3 w-3" />
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
      }}
      className="mb-6"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-medium">Active Interviews</CardTitle>
            <p className="text-sm text-muted-foreground">
              {upcomingInterviews} upcoming • {totalInterviews} total
            </p>
          </div>
          <Link href="/interviews">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                  <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : activeInterviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No upcoming interviews</p>
              <p className="text-xs">Your scheduled interviews will appear here</p>
              <Link href="/interviews">
                <Button variant="link" className="mt-2 text-sm">
                  View All Interviews
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeInterviews.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {getTypeIcon(interview.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{interview.position}</h3>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(interview.status)}`}>
                          {interview.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {interview.company}
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(interview.date), 'MMM dd, yyyy')}
                        </div>

                        {interview.time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {interview.time}
                          </div>
                        )}

                        {interview.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {interview.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {totalInterviews > 3 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    +{totalInterviews - 3} more interviews
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
