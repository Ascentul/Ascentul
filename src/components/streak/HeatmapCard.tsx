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
      <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-900">Activity Streak</CardTitle>
        </div>
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center justify-center py-6 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        </div>
      </section>
    )
  }

  // Handle empty or error state
  if (!activityData || activityData.length === 0) {
    return (
      <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-900">Activity Streak</CardTitle>
        </div>
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-col items-center justify-center py-6 text-center text-sm text-slate-600">
            <p>No activity data available yet. Start tracking your progress!</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-semibold text-slate-900">Activity Streak</CardTitle>
      </div>
      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <Heatmap data={activityData} startOnMonday={true} />
      </div>
    </section>
  )
}
