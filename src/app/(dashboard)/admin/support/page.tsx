'use client'

import React from 'react'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, HelpCircle } from 'lucide-react'

export default function AdminSupportPage() {
  const { user } = useAuth()
  const role = user?.role
  const canAccess = role === 'super_admin' || role === 'admin'

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to support management.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <HelpCircle className="h-7 w-7" />
            Support Management
          </h1>
          <p className="text-muted-foreground">Manage support tickets and user assistance</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading support tickets...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}