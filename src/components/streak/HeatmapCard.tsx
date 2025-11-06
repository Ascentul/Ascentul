'use client'

import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Heatmap } from './Heatmap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function HeatmapCard() {
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])

  const activityData = useQuery(api.activity.getActivityYear, {
    timezone,
  })

  const isLoading = activityData === undefined

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Streak</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle empty or error state
  if (!activityData || activityData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No activity data available yet. Start tracking your progress!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Streak</CardTitle>
      </CardHeader>
      <CardContent>
        <Heatmap data={activityData} startOnMonday={true} />
      </CardContent>
    </Card>
  )
}
