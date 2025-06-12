import { useState } from "react"
import { useUser } from "@/lib/useUserData"
import { useQuery, useMutation } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Shield,
  Lock,
  Eye,
  AlertTriangle,
  Users,
  Key,
  Activity,
  RefreshCw,
  Settings,
  Database,
  Server,
  Bell
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

interface SecurityEvent {
  id: string
  type: "login_attempt" | "permission_change" | "data_access" | "system_change"
  severity: "low" | "medium" | "high" | "critical"
  description: string
  user: string
  ip: string
  timestamp: string
  status: "blocked" | "allowed" | "flagged"
}

interface SecuritySettings {
  mfaRequired: boolean
  sessionTimeout: number
  maxLoginAttempts: number
  ipWhitelisting: boolean
  auditLogging: boolean
  dataEncryption: boolean
  apiRateLimit: number
}

export default function SystemSecurity() {
  const { user } = useUser()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")

  // Check if user is super admin
  const isSuperAdmin = user?.role === "super_admin"

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Shield className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Access Restricted
        </h2>
        <p className="text-gray-600">
          Super Administrator privileges required to access security settings.
        </p>
      </div>
    )
  }

  // Mock data for security events
  const securityEvents: SecurityEvent[] = [
    {
      id: "1",
      type: "login_attempt",
      severity: "high",
      description: "Multiple failed login attempts from suspicious IP",
      user: "unknown",
      ip: "192.168.1.100",
      timestamp: "2024-01-15 14:30:22",
      status: "blocked"
    },
    {
      id: "2",
      type: "permission_change",
      severity: "medium",
      description: "Admin privileges granted to user",
      user: "admin@university.edu",
      ip: "10.0.0.15",
      timestamp: "2024-01-15 13:15:10",
      status: "allowed"
    },
    {
      id: "3",
      type: "data_access",
      severity: "low",
      description: "Bulk data export requested",
      user: "staff@ascentul.com",
      ip: "203.0.113.0",
      timestamp: "2024-01-15 12:45:33",
      status: "flagged"
    }
  ]

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    mfaRequired: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    ipWhitelisting: false,
    auditLogging: true,
    dataEncryption: true,
    apiRateLimit: 1000
  })

  const updateSecuritySetting = (
    key: keyof SecuritySettings,
    value: boolean | number
  ) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [key]: value
    }))

    toast({
      title: "Security Setting Updated",
      description: `${key} has been updated successfully.`
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "blocked":
        return "bg-red-100 text-red-800"
      case "allowed":
        return "bg-green-100 text-green-800"
      case "flagged":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            System Security
          </h1>
          <p className="text-muted-foreground">
            Monitor and configure security settings for the entire platform
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Security Score
                </CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">94%</div>
                <p className="text-xs text-muted-foreground">
                  Excellent security posture
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Threats
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  2 blocked, 1 monitoring
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Failed Logins
                </CardTitle>
                <Lock className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Uptime
                </CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.9%</div>
                <p className="text-xs text-muted-foreground">30-day average</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>
                  Latest security incidents and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityEvents.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {event.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.user} • {event.timestamp}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getStatusColor(event.status)}
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Configuration</CardTitle>
                <CardDescription>
                  Current security settings status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <span className="text-sm">Multi-Factor Authentication</span>
                  </div>
                  <Badge
                    variant={
                      securitySettings.mfaRequired ? "default" : "secondary"
                    }
                  >
                    {securitySettings.mfaRequired ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="text-sm">Data Encryption</span>
                  </div>
                  <Badge
                    variant={
                      securitySettings.dataEncryption ? "default" : "secondary"
                    }
                  >
                    {securitySettings.dataEncryption ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Audit Logging</span>
                  </div>
                  <Badge
                    variant={
                      securitySettings.auditLogging ? "default" : "secondary"
                    }
                  >
                    {securitySettings.auditLogging ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <span className="text-sm">Session Timeout</span>
                  </div>
                  <Badge variant="outline">
                    {securitySettings.sessionTimeout} minutes
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Security Events Log</CardTitle>
              <CardDescription>
                Comprehensive log of all security-related events and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono text-xs">
                        {event.timestamp}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {event.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{event.description}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.user}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.ip}
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Settings</CardTitle>
                <CardDescription>
                  Configure login and authentication requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="mfa-required">
                      Require Multi-Factor Authentication
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Force MFA for all admin accounts
                    </p>
                  </div>
                  <Switch
                    id="mfa-required"
                    checked={securitySettings.mfaRequired}
                    onCheckedChange={(checked) =>
                      updateSecuritySetting("mfaRequired", checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      updateSecuritySetting(
                        "sessionTimeout",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-32"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input
                    id="max-login-attempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) =>
                      updateSecuritySetting(
                        "maxLoginAttempts",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-32"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Monitoring</CardTitle>
                <CardDescription>
                  Configure monitoring and logging settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="audit-logging">Enable Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all admin actions and data access
                    </p>
                  </div>
                  <Switch
                    id="audit-logging"
                    checked={securitySettings.auditLogging}
                    onCheckedChange={(checked) =>
                      updateSecuritySetting("auditLogging", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ip-whitelisting">IP Whitelisting</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict admin access by IP address
                    </p>
                  </div>
                  <Switch
                    id="ip-whitelisting"
                    checked={securitySettings.ipWhitelisting}
                    onCheckedChange={(checked) =>
                      updateSecuritySetting("ipWhitelisting", checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-rate-limit">
                    API Rate Limit (requests/hour)
                  </Label>
                  <Input
                    id="api-rate-limit"
                    type="number"
                    value={securitySettings.apiRateLimit}
                    onChange={(e) =>
                      updateSecuritySetting(
                        "apiRateLimit",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-32"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Alerts</CardTitle>
                <CardDescription>
                  Active security monitoring alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">
                        Suspicious Login Activity
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Multiple failed attempts detected
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg border-blue-200 bg-blue-50">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">
                        System Update Available
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Security patch ready for deployment
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Current system security status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Security</span>
                  <Badge className="bg-green-100 text-green-800">Optimal</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Network Security</span>
                  <Badge className="bg-green-100 text-green-800">Secure</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Application Security</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Monitoring
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Encryption</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Emergency security controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Lock All Sessions
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset API Keys
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Generate Audit Report
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency Lockdown
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
