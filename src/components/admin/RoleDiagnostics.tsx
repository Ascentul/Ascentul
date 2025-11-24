'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Info,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import { User } from '@clerk/nextjs/server'
import { Doc } from 'convex/_generated/dataModel'

interface DiagnosticResult {
  user: Doc<"users"> | null
  clerkData: User
  mismatch: boolean
  clerkRole: string | null
  convexRole: string | null
  lastSync: number | null
  issues: string[]
  suggestions: string[]
}

export function RoleDiagnostics() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  const runDiagnostic = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter a user email',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setDiagnosticResult(null)

    try {
      // Call API to check role sync status
      const response = await fetch('/api/admin/users/check-role-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to run diagnostic')
      }

      setDiagnosticResult(result)
    } catch (error) {
      toast({
        title: 'Diagnostic Failed',
        description: error instanceof Error ? error.message : 'Failed to run diagnostic',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const syncRoleToClerk = async () => {
    if (!diagnosticResult?.user) return

    setLoading(true)

    try {
      const response = await fetch('/api/admin/users/sync-role-to-clerk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: diagnosticResult.clerkData.id,
          role: diagnosticResult.convexRole,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync role')
      }

      toast({
        title: 'Role Synced',
        description: 'Successfully synced role from Convex to Clerk. Re-checking in 2 seconds...',
      })

      // Clear any existing timeout to prevent stale callbacks
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }

      // Wait for webhook to process before re-checking (webhook takes ~500ms-1s)
      syncTimeoutRef.current = setTimeout(async () => {
        if (isMountedRef.current) {
          await runDiagnostic()
          setLoading(false)
        }
      }, 2000)
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync role',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  const syncRoleToConvex = async () => {
    if (!diagnosticResult?.user) return

    setLoading(true)

    try {
      const response = await fetch('/api/admin/users/sync-role-to-convex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: diagnosticResult.clerkData.id,
          role: diagnosticResult.clerkRole,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync role')
      }

      toast({
        title: 'Role Synced',
        description: 'Successfully synced role from Clerk to Convex. Re-checking in 2 seconds...',
      })

      // Clear any existing timeout to prevent stale callbacks
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }

      // Wait for webhook to process before re-checking (webhook takes ~500ms-1s)
      syncTimeoutRef.current = setTimeout(async () => {
        if (isMountedRef.current) {
          await runDiagnostic()
          setLoading(false)
        }
      }, 2000)
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync role',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Diagnostics</CardTitle>
        <CardDescription>
          Check and fix role synchronization issues between Clerk and Convex
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Diagnostic Tool */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How to Use</AlertTitle>
          <AlertDescription>
            Enter a user's email to check if their Clerk role (authentication) matches their Convex
            role (database). Clerk is the source of truth for authorization.
          </AlertDescription>
        </Alert>

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter user email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runDiagnostic()}
              className="pl-10"
            />
          </div>
          <Button onClick={runDiagnostic} disabled={loading || !email}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Run Diagnostic
              </>
            )}
          </Button>
        </div>

        {/* Diagnostic Results */}
        {diagnosticResult && (
          <div className="space-y-4 mt-6">
            {/* User Info */}
            {diagnosticResult.user ? (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="font-semibold mb-2">User Information</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Name:</div>
                  <div className="font-medium">{diagnosticResult.user.name}</div>
                  <div className="text-muted-foreground">Email:</div>
                  <div className="font-medium">{diagnosticResult.user.email}</div>
                  <div className="text-muted-foreground">Clerk ID:</div>
                  <div className="font-mono text-xs">{diagnosticResult.clerkData.id}</div>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>User Not Found in Convex</AlertTitle>
                <AlertDescription>
                  This user exists in Clerk ({diagnosticResult.clerkData.emailAddresses?.[0]?.emailAddress || diagnosticResult.clerkData.id}) but has not been synced to the Convex database yet. This may indicate a webhook configuration issue.
                </AlertDescription>
              </Alert>
            )}

            {/* Sync Status */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold">Sync Status</div>
                {diagnosticResult.mismatch ? (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Mismatch Detected
                  </Badge>
                ) : (
                  <Badge variant="default" className="gap-1 bg-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Synced
                  </Badge>
                )}
              </div>

              {/* Role Comparison */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-muted-foreground mb-2">Clerk Role</div>
                  <div className="text-sm font-medium">
                    (Source of Truth)
                  </div>
                  <Badge variant="outline" className="mt-2 capitalize">
                    {diagnosticResult.clerkRole || 'None'}
                  </Badge>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className={`h-6 w-6 ${diagnosticResult.mismatch ? 'text-red-500' : 'text-green-500'}`} />
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-muted-foreground mb-2">Convex Role</div>
                  <div className="text-sm font-medium">
                    (Cached Display)
                  </div>
                  <Badge variant="outline" className="mt-2 capitalize">
                    {diagnosticResult.convexRole || 'None'}
                  </Badge>
                </div>
              </div>

              {diagnosticResult.lastSync && (
                <div className="text-xs text-muted-foreground">
                  Last webhook sync: {new Date(diagnosticResult.lastSync).toLocaleString()}
                </div>
              )}
            </div>

            {/* Issues */}
            {diagnosticResult.issues.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Issues Found</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {diagnosticResult.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Suggestions */}
            {diagnosticResult.suggestions.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Recommendations</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {diagnosticResult.suggestions.map((suggestion, i) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Quick Fix Actions */}
            {diagnosticResult.mismatch && (
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <div className="font-semibold mb-3">Quick Fix Options</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-medium">Sync Convex → Clerk (Recommended)</div>
                      <div className="text-xs text-muted-foreground">
                        Update Clerk metadata with Convex role
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={syncRoleToClerk} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync to Clerk
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-medium">Sync Clerk → Convex</div>
                      <div className="text-xs text-muted-foreground">
                        Update Convex database with Clerk role
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={syncRoleToConvex} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync to Convex
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <Alert className="mt-6">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Important:</strong> Clerk `publicMetadata.role` is the source of truth for
            authorization. The Convex role is cached for display purposes. Normal role changes
            flow: Update Clerk → Webhook → Convex. If there's a mismatch, use sync tools to
            resolve inconsistencies, then investigate why the webhook failed to sync properly.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
