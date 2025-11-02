/**
 * NudgeCard Component
 *
 * Displays a single proactive nudge with actions (accept, snooze, dismiss)
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Clock,
  X,
  AlertCircle,
  Info,
  Lightbulb,
  Wrench,
  TrendingUp,
} from 'lucide-react'

interface NudgeCardProps {
  nudge: {
    _id: string
    rule_type: string
    score: number
    reason: string
    suggested_action?: string
    action_url?: string
    metadata: Record<string, unknown>
    created_at: number
  }
  onAccept: (nudgeId: string) => void
  onSnooze: (nudgeId: string, hours: number) => void
  onDismiss: (nudgeId: string) => void
}

export function NudgeCard({ nudge, onAccept, onSnooze, onDismiss }: NudgeCardProps) {
  // Determine icon and color based on rule category
  const getCategoryInfo = (ruleType: string) => {
    const urgentRules = ['interviewSoon']
    const helpfulRules = ['appRescue', 'resumeWeak', 'skillGap']
    const maintenanceRules = ['profileIncomplete']

    if (urgentRules.includes(ruleType)) {
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        color: 'destructive' as const,
        label: 'Urgent',
      }
    }
    if (helpfulRules.includes(ruleType)) {
      return {
        icon: <Lightbulb className="h-5 w-5" />,
        color: 'default' as const,
        label: 'Suggestion',
      }
    }
    if (maintenanceRules.includes(ruleType)) {
      return {
        icon: <Wrench className="h-5 w-5" />,
        color: 'secondary' as const,
        label: 'Maintenance',
      }
    }
    return {
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'outline' as const,
      label: 'Tip',
    }
  }

  const { icon, color, label } = getCategoryInfo(nudge.rule_type)

  // Format relative time
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp

    // Handle future timestamps (shouldn't happen, but defensive)
    if (diff < 0) return 'Just now'

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <Card className={`relative overflow-hidden border-l-4 ${
      color === 'destructive' ? 'border-l-destructive' : 'border-l-primary'
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">{icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={color}>{label}</Badge>
                <span className="text-xs text-muted-foreground">
                  {getRelativeTime(nudge.created_at)}
                </span>
              </div>
              <CardTitle className="text-lg">{nudge.reason}</CardTitle>
              {nudge.suggested_action && (
                <CardDescription className="mt-2">
                  {nudge.suggested_action}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onAccept(nudge._id)}
          className="flex items-center gap-1"
        >
          <CheckCircle2 className="h-4 w-4" />
          {nudge.action_url ? 'Take Action' : 'Mark Done'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Snooze
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSnooze(nudge._id, 1)}>
              1 hour
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSnooze(nudge._id, 4)}>
              4 hours
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSnooze(nudge._id, 24)}>
              Tomorrow
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSnooze(nudge._id, 24 * 7)}>
              Next week
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDismiss(nudge._id)}
          className="flex items-center gap-1 ml-auto"
        >
          <X className="h-4 w-4" />
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  )
}
