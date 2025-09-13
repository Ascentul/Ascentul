'use client'

import React from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function AdminDashboardPage() {
  const { user: clerkUser } = useUser()
  const { isAdmin } = useAuth()

  const users = useQuery(api.users.getAllUsers, clerkUser?.id ? { clerkId: clerkUser.id, limit: 50 } : 'skip')

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> Admin Dashboard</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          {!users ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : users.page.length === 0 ? (
            <p className="text-muted-foreground">No users found.</p>
          ) : (
            <div className="divide-y">
              {users.page.map((u) => (
                <div key={u._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <div className="text-xs uppercase text-muted-foreground">{u.role}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
