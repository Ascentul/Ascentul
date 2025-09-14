'use client'

import React from 'react'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export default function UniversityCoursesPage() {
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
            <p className="text-muted-foreground">You do not have access to University Courses.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Courses
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Courses Management (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">This page will allow university admins to create, edit, and manage courses tied to their institution. For now, this placeholder exists to prevent 404s and validate navigation.</p>
        </CardContent>
      </Card>
    </div>
  )
}
