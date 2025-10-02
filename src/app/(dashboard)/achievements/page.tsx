'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Award } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Achievement {
  _id: string
  name: string
  description?: string
  icon?: string
  category: string
  points: number
  created_at: number
}

interface UserAchievement {
  _id?: string
  achievement_id: string
  earned_at: number
  progress?: number
  achievement?: Achievement
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [awarding, setAwarding] = useState<string | null>(null)
  const { toast } = useToast()

  const earnedMap = useMemo(() => {
    const m = new Map<string, UserAchievement>()
    userAchievements.forEach(ua => m.set(ua.achievement_id, ua))
    return m
  }, [userAchievements])

  const load = async () => {
    setLoading(true)
    try {
      const [aRes, uaRes] = await Promise.all([
        fetch('/api/achievements'),
        fetch('/api/achievements/user'),
      ])
      let aJson: any = {}
      let uaJson: any = {}
      try {
        if (aRes.headers.get('content-type')?.includes('application/json')) {
          aJson = await aRes.json()
        }
      } catch (e) {
        // ignore JSON parse errors, will handle via ok checks below
      }
      try {
        if (uaRes.headers.get('content-type')?.includes('application/json')) {
          uaJson = await uaRes.json()
        }
      } catch (e) {
        // ignore JSON parse errors, will handle via ok checks below
      }
      if (aRes.ok && Array.isArray(aJson?.achievements)) setAchievements(aJson.achievements || [])
      if (uaRes.ok && Array.isArray(uaJson?.userAchievements)) setUserAchievements(uaJson.userAchievements || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const testAward = async (achievement_id: string) => {
    setAwarding(achievement_id)
    try {
      const res = await fetch('/api/achievements/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievement_id })
      })
      if (res.ok) {
        await load()
        toast({
          title: 'Achievement awarded',
          description: 'Great job! You just earned an achievement.',
          variant: 'success',
        })
      } else {
        let msg = 'Failed to award achievement'
        try {
          const data = await res.json()
          msg = data?.error || msg
        } catch {}
        toast({
          title: 'Award failed',
          description: msg,
          variant: 'destructive',
        })
      }
    } finally {
      setAwarding(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB] flex items-center gap-2">
          <Award className="h-7 w-7 text-yellow-500" /> Achievements
        </h1>
        <p className="text-muted-foreground">Complete actions in Ascentful to earn badges and XP.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => {
            const earned = earnedMap.get(a._id)
            return (
              <Card key={a._id} className={earned ? 'border-green-500/40' : ''}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100 text-yellow-700 text-sm">
                      {a.icon || '🏆'}
                    </span>
                    {a.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={earned ? 'default' : 'outline'}>{earned ? 'Earned' : 'Locked'}</Badge>
                    <Badge variant="outline">+{a.points} XP</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {a.description ? (
                    <p className="text-sm text-muted-foreground">{a.description}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Category: <span className="font-medium">{a.category}</span>
                  </p>
                  {earned && (
                    <p className="text-xs text-green-600">Earned {new Date(earned.earned_at).toLocaleString()}</p>
                  )}
                  {!earned && (
                    <div className="pt-1">
                      <Button size="sm" variant="outline" disabled={awarding === a._id} onClick={() => testAward(a._id)}>
                        {awarding === a._id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Test Award
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
