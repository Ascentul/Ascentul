'use client'

/**
 * Agent Preferences Page
 *
 * Allows users to configure:
 * - Agent enable/disable
 * - Proactive nudges toggle
 * - Quiet hours
 * - Notification channels
 * - Playbook-specific toggles
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { logError } from '@/lib/logger'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import { Loader2, Bell, BellOff, Moon, Mail, Smartphone, MessageSquare } from 'lucide-react'

export default function AgentPreferencesPage() {
  const { user } = useUser()
  const clerkId = user?.id

  // Get Convex user ID from Clerk ID
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : 'skip'
  )
  const userId = convexUser?._id

  // Query preferences
  const preferences = useQuery(
    api.agent_preferences.getUserPreferences,
    userId ? { userId } : 'skip'
  )

  // Mutations
  const upsertPrefs = useMutation(api.agent_preferences.upsertPreferences)
  const toggleAgentMutation = useMutation(api.agent_preferences.toggleAgent)
  const toggleProactiveMutation = useMutation(api.agent_preferences.toggleProactiveNudges)
  const resetPreferencesMutation = useMutation(api.agent_preferences.resetPreferences)

  // Local state for form
  const [formData, setFormData] = useState({
    agent_enabled: true,
    proactive_enabled: true,
    quiet_hours_start: 22,
    quiet_hours_end: 8,
    channels: {
      inApp: true,
      email: false,
      push: false,
    },
    playbook_toggles: {
      jobSearch: true,
      resumeHelp: true,
      interviewPrep: true,
      networking: true,
      careerPath: true,
      applicationTracking: true,
    },
  })

  const [isSaving, setIsSaving] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)

  // Update form when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        agent_enabled: preferences.agent_enabled,
        proactive_enabled: preferences.proactive_enabled,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        channels: preferences.channels,
        playbook_toggles: preferences.playbook_toggles,
      })
    }
  }, [preferences])

  const handleToggleAgent = async (enabled: boolean) => {
    if (!userId) return

    try {
      await toggleAgentMutation({ userId, enabled })
      setFormData((prev) => ({ ...prev, agent_enabled: enabled }))
      toast({
        title: enabled ? 'Agent Enabled' : 'Agent Disabled',
        description: enabled
          ? 'Your AI career agent is now active'
          : 'Your AI career agent has been disabled',
      })
    } catch (error) {
      logError('Failed to toggle agent', error, { userId, enabled })
      toast({
        title: 'Error',
        description: 'Failed to update agent settings',
        variant: 'destructive',
      })
    }
  }

  const handleToggleProactive = async (enabled: boolean) => {
    if (!userId) return

    try {
      await toggleProactiveMutation({ userId, enabled })
      setFormData((prev) => ({ ...prev, proactive_enabled: enabled }))
      toast({
        title: enabled ? 'Proactive Nudges Enabled' : 'Proactive Nudges Disabled',
        description: enabled
          ? 'You will receive proactive career suggestions'
          : 'You will only receive responses to direct questions',
      })
    } catch (error) {
      logError('Failed to toggle proactive nudges', error, { userId, enabled })
      toast({
        title: 'Error',
        description: 'Failed to update nudge settings',
        variant: 'destructive',
      })
    }
  }

  const handleSavePreferences = async () => {
    if (!userId) return

    // Validate quiet hours range
    if (formData.quiet_hours_start === formData.quiet_hours_end) {
      toast({
        title: 'Invalid Quiet Hours',
        description: 'Start and end time cannot be the same',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      await upsertPrefs({
        userId,
        agent_enabled: formData.agent_enabled,
        proactive_enabled: formData.proactive_enabled,
        quiet_hours_start: formData.quiet_hours_start,
        quiet_hours_end: formData.quiet_hours_end,
        channels: formData.channels,
        playbook_toggles: formData.playbook_toggles,
      })

      toast({
        title: 'Preferences Saved',
        description: 'Your agent preferences have been updated successfully',
      })
    } catch (error) {
      logError('Failed to save preferences', error, { userId })
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetPreferences = async () => {
    if (!userId) return

    try {
      await resetPreferencesMutation({ userId })
      setShowResetDialog(false)
      toast({
        title: 'Preferences Reset',
        description: 'All preferences have been reset to defaults',
      })
    } catch (error) {
      logError('Failed to reset preferences', error, { userId })
      toast({
        title: 'Error',
        description: 'Failed to reset preferences',
        variant: 'destructive',
      })
    }
  }

  // Show loading spinner while query is pending
  if (clerkId && convexUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show error if user not found after query completes
  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Unable to load user preferences</p>
      </div>
    )
  }

  // Show loading spinner while preferences are loading
  if (preferences === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agent Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize how your AI career agent works for you
        </p>
      </div>

      {/* Main Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {formData.agent_enabled ? (
                  <Bell className="h-5 w-5" />
                ) : (
                  <BellOff className="h-5 w-5" />
                )}
                AI Career Agent
              </CardTitle>
              <CardDescription>
                Enable or disable the AI career agent completely
              </CardDescription>
            </div>
            <Switch
              checked={formData.agent_enabled}
              onCheckedChange={handleToggleAgent}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Proactive Nudges */}
      {formData.agent_enabled && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Proactive Suggestions</CardTitle>
                  <CardDescription>
                    Get proactive career tips and reminders (or only respond to direct questions)
                  </CardDescription>
                </div>
                <Switch
                  checked={formData.proactive_enabled}
                  onCheckedChange={handleToggleProactive}
                />
              </div>
            </CardHeader>
          </Card>

          {/* Quiet Hours */}
          {formData.proactive_enabled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  Quiet Hours
                </CardTitle>
                <CardDescription>
                  Set when you don't want to receive proactive nudges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time (24h)</Label>
                    <Select
                      value={formData.quiet_hours_start.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          quiet_hours_start: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Time (24h)</Label>
                    <Select
                      value={formData.quiet_hours_end.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          quiet_hours_end: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Channels */}
          {formData.proactive_enabled && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>
                  Choose how you want to receive proactive suggestions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show nudges in your dashboard
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.channels.inApp}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, inApp: checked },
                      }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive nudges via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.channels.email}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, email: checked },
                      }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get mobile push notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.channels.push}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, push: checked },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Playbook Toggles */}
          {formData.proactive_enabled && (
            <Card>
              <CardHeader>
                <CardTitle>Career Playbooks</CardTitle>
                <CardDescription>
                  Enable or disable specific types of career assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries({
                  jobSearch: 'Job Search Assistance',
                  resumeHelp: 'Resume Optimization',
                  interviewPrep: 'Interview Preparation',
                  networking: 'Networking Suggestions',
                  careerPath: 'Career Path Planning',
                  applicationTracking: 'Application Follow-ups',
                }).map(([key, label], index, array) => (
                  <div key={key}>
                    <div className="flex items-center justify-between">
                      <Label>{label}</Label>
                      <Switch
                        checked={formData.playbook_toggles[key as keyof typeof formData.playbook_toggles]}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            playbook_toggles: {
                              ...prev.playbook_toggles,
                              [key]: checked,
                            },
                          }))
                        }
                      />
                    </div>
                    {index < array.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleSavePreferences} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
        <Button variant="outline" onClick={() => setShowResetDialog(true)}>
          Reset to Defaults
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all your agent preferences to their default values. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPreferences} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset Preferences
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
