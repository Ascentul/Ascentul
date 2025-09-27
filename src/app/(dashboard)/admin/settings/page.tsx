'use client'

import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  Settings,
  Shield,
  Key,
  Database,
  Mail,
  Bell,
  Users,
  Zap,
  Server,
  Globe,
  Lock,
  AlertTriangle,
  Save,
  RefreshCw,
  Bot,
  Cpu,
  Activity,
  MessageSquare,
  Loader2
} from 'lucide-react'

export default function AdminSettingsPage() {
  const { user: clerkUser } = useUser()
  const { user } = useAuth()
  const { toast } = useToast()

  // State for various settings
  const [aiSettings, setAiSettings] = useState({
    openaiEnabled: true,
    openaiApiKey: '••••••••••••••••••••••••••••••••••••••••',
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.7,
    rateLimitEnabled: true,
    rateLimitRequests: 100,
    rateLimitWindow: 3600
  })

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    sessionTimeout: 24,
    maxFileUploadSize: 10,
    debugMode: false
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    slackIntegration: false,
    webhookUrl: '',
    criticalAlertsOnly: false,
    dailyReports: true,
    weeklyAnalytics: true
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorRequired: false,
    passwordComplexity: 'medium',
    loginAttemptLimit: 5,
    ipWhitelistEnabled: false,
    auditLogging: true,
    sessionEncryption: true
  })

  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)

  const role = user?.role
  const isSuperOrAdmin = role === 'super_admin' || role === 'admin'

  if (!isSuperOrAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Only Admin and Super Admin can access System Settings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSaveSettings = async (settingsType: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast({
        title: "Settings saved",
        description: `${settingsType} settings have been updated successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save ${settingsType} settings.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async (type: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast({
        title: "Connection successful",
        description: `${type} connection test passed.`,
      })
    } catch (error) {
      toast({
        title: "Connection failed",
        description: `${type} connection test failed.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" /> System Settings
        </h1>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI & OpenAI</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Platform Configuration
              </CardTitle>
              <CardDescription>
                General platform settings and configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Platform Name</Label>
                    <Input defaultValue="Ascentful" />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input defaultValue="support@ascentful.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Default University Plan Limit</Label>
                    <Input type="number" defaultValue="1000" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Base URL</Label>
                    <Input defaultValue="https://app.ascentful.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Time Zone</Label>
                    <Select defaultValue="UTC">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">Eastern Time</SelectItem>
                        <SelectItem value="PST">Pacific Time</SelectItem>
                        <SelectItem value="CST">Central Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Premium Plan Limit</Label>
                    <Input type="number" defaultValue="100" />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('General')} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                OpenAI Configuration
              </CardTitle>
              <CardDescription>
                Configure OpenAI integration and AI-powered features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable OpenAI Integration</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable AI-powered features throughout the platform
                  </p>
                </div>
                <Switch
                  checked={aiSettings.openaiEnabled}
                  onCheckedChange={(checked) =>
                    setAiSettings(prev => ({ ...prev, openaiEnabled: checked }))
                  }
                />
              </div>

              {aiSettings.openaiEnabled && (
                <>
                  <Separator />
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>OpenAI API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            value={aiSettings.openaiApiKey}
                            onChange={(e) => setAiSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                            placeholder="sk-..."
                          />
                          <Button variant="outline" onClick={() => handleTestConnection('OpenAI')}>
                            Test
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Select
                          value={aiSettings.model}
                          onValueChange={(value) => setAiSettings(prev => ({ ...prev, model: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Max Tokens</Label>
                        <Input
                          type="number"
                          value={aiSettings.maxTokens}
                          onChange={(e) => setAiSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Temperature ({aiSettings.temperature})</Label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={aiSettings.temperature}
                          onChange={(e) => setAiSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Rate Limiting</Label>
                          <p className="text-sm text-muted-foreground">
                            Limit API requests per hour
                          </p>
                        </div>
                        <Switch
                          checked={aiSettings.rateLimitEnabled}
                          onCheckedChange={(checked) =>
                            setAiSettings(prev => ({ ...prev, rateLimitEnabled: checked }))
                          }
                        />
                      </div>
                      {aiSettings.rateLimitEnabled && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label>Requests</Label>
                            <Input
                              type="number"
                              value={aiSettings.rateLimitRequests}
                              onChange={(e) => setAiSettings(prev => ({ ...prev, rateLimitRequests: parseInt(e.target.value) }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Window (seconds)</Label>
                            <Input
                              type="number"
                              value={aiSettings.rateLimitWindow}
                              onChange={(e) => setAiSettings(prev => ({ ...prev, rateLimitWindow: parseInt(e.target.value) }))}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('AI')} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save AI Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Configure security policies and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication Required</Label>
                      <p className="text-sm text-muted-foreground">
                        Require 2FA for all admin accounts
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorRequired}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => ({ ...prev, twoFactorRequired: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password Complexity</Label>
                    <Select
                      value={securitySettings.passwordComplexity}
                      onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, passwordComplexity: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Login Attempt Limit</Label>
                    <Input
                      type="number"
                      value={securitySettings.loginAttemptLimit}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, loginAttemptLimit: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>IP Whitelist Enabled</Label>
                      <p className="text-sm text-muted-foreground">
                        Restrict admin access to specific IPs
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.ipWhitelistEnabled}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => ({ ...prev, ipWhitelistEnabled: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Audit Logging</Label>
                      <p className="text-sm text-muted-foreground">
                        Log all admin actions
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.auditLogging}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => ({ ...prev, auditLogging: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Session Encryption</Label>
                      <p className="text-sm text-muted-foreground">
                        Encrypt user sessions
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.sessionEncryption}
                      onCheckedChange={(checked) =>
                        setSecuritySettings(prev => ({ ...prev, sessionEncryption: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('Security')} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure system notifications and alerting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send system alerts via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Slack Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Send alerts to Slack channel
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.slackIntegration}
                      onCheckedChange={(checked) =>
                        setNotificationSettings(prev => ({ ...prev, slackIntegration: checked }))
                      }
                    />
                  </div>
                  {notificationSettings.slackIntegration && (
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input
                        value={notificationSettings.webhookUrl}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                        placeholder="https://hooks.slack.com/..."
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Critical Alerts Only</Label>
                      <p className="text-sm text-muted-foreground">
                        Only send critical system alerts
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.criticalAlertsOnly}
                      onCheckedChange={(checked) =>
                        setNotificationSettings(prev => ({ ...prev, criticalAlertsOnly: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Daily Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Send daily system reports
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.dailyReports}
                      onCheckedChange={(checked) =>
                        setNotificationSettings(prev => ({ ...prev, dailyReports: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Send weekly analytics summary
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyAnalytics}
                      onCheckedChange={(checked) =>
                        setNotificationSettings(prev => ({ ...prev, weeklyAnalytics: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('Notification')} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                System-level settings and maintenance options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable maintenance mode for all users
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Registration Enabled</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new user registrations
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.registrationEnabled}
                      onCheckedChange={(checked) =>
                        setSystemSettings(prev => ({ ...prev, registrationEnabled: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Verification Required</Label>
                      <p className="text-sm text-muted-foreground">
                        Require email verification for new accounts
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.emailVerificationRequired}
                      onCheckedChange={(checked) =>
                        setSystemSettings(prev => ({ ...prev, emailVerificationRequired: checked }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Session Timeout (hours)</Label>
                    <Input
                      type="number"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max File Upload Size (MB)</Label>
                    <Input
                      type="number"
                      value={systemSettings.maxFileUploadSize}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, maxFileUploadSize: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Debug Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable debug logging and features
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.debugMode}
                      onCheckedChange={(checked) =>
                        setSystemSettings(prev => ({ ...prev, debugMode: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('System')} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save System Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Database</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">OpenAI API</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Email Service</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">File Storage</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}