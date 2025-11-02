/**
 * NudgeList Component
 *
 * Container for displaying all pending nudges
 * Can be embedded in the dashboard or shown in a dedicated section
 */

'use client'

import { useNudges } from '@/hooks/useNudges'
import { NudgeCard } from './NudgeCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2, Settings } from 'lucide-react'
import Link from 'next/link'

interface NudgeListProps {
  maxDisplay?: number // Optional: limit number of nudges shown
  showHeader?: boolean // Optional: show/hide header
  compact?: boolean // Optional: compact mode for smaller spaces
}

export function NudgeList({ maxDisplay, showHeader = true, compact = false }: NudgeListProps) {
  const { nudges, stats, isLoading, actions } = useNudges()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  const displayNudges = maxDisplay ? nudges.slice(0, maxDisplay) : nudges

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Career Suggestions
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {stats?.today.count || 0} suggestions today
              {stats?.today.limit && ` (${stats.today.remaining} remaining)`}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/account/agent-preferences">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Link>
          </Button>
        </div>
      )}

      {nudges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">All caught up!</CardTitle>
            <CardDescription>
              You have no pending career suggestions right now.
              <br />
              Check back later or adjust your preferences to get more tips.
            </CardDescription>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/account/agent-preferences">
                <Settings className="h-4 w-4 mr-2" />
                Agent Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className={`space-y-${compact ? '2' : '4'}`}>
            {displayNudges.map((nudge) => (
              <NudgeCard
                key={nudge._id}
                nudge={nudge}
                onAccept={actions.accept}
                onSnooze={actions.snooze}
                onDismiss={actions.dismiss}
              />
            ))}
          </div>

          {maxDisplay && nudges.length > maxDisplay && (
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <p className="text-sm text-muted-foreground">
                  {nudges.length - maxDisplay} more suggestions available
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard?tab=nudges">View All</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {stats && nudges.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {stats.acceptanceRate}% acceptance rate this week
        </div>
      )}
    </div>
  )
}
