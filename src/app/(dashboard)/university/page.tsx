'use client'

import React from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'

export default function UniversityDashboardPage() {
  const { user: clerkUser } = useUser()
  const { user, isAdmin } = useAuth()

  const canAccess = !!user && (isAdmin || user.subscription_plan === 'university' || user.role === 'university_admin')
  const universityId = user?.university_id as any

  const university = useQuery(
    api.universities.getUniversityBySlug as any,
    // If user has no university_id but isAdmin, skip fetch and show placeholder
    'skip'
  )

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to the University Dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6" /> University Dashboard
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Welcome to the University Dashboard. Use the sidebar to manage courses and view student progress.</p>
          {!user?.university_id && !isAdmin && (
            <p className="mt-2 text-xs text-amber-600">No university is associated with your account yet. Please contact support.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
