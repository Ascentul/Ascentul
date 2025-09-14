'use client'

import React from 'react'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { User as UserIcon } from 'lucide-react'

export default function UniversityStudentsPage() {
  const { user, isAdmin } = useAuth()

  const canAccess = !!user && (isAdmin || user.subscription_plan === 'university' || user.role === 'university_admin')

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to University Student Progress.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserIcon className="h-6 w-6" /> Student Progress
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Progress (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">This page will show student progress and metrics for institutions. Placeholder added to prevent 404s and validate navigation.</p>
        </CardContent>
      </Card>
    </div>
  )
}
