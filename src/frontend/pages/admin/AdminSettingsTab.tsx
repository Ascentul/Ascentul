import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Save, RotateCcw, Check, Loader2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { apiRequest } from "@/lib/queryClient"

// Define the platform settings type
type PlatformSettings = {
  general: {
    platformName: string
    supportEmail: string
    defaultTimezone: string
    maintenanceMode: boolean
  }
  features: {
    enableReviews: boolean
    enableAICoach: boolean
    enableResumeStudio: boolean
    enableVoicePractice: boolean
    enableCareerGoals: boolean
    enableApplicationTracker?: boolean
    enableNetworkHub?: boolean
    enableCareerPathExplorer?: boolean
    enableProjectPortfolio?: boolean
    enableCoverLetterStudio?: boolean
  }
  userRoles: {
    defaultUserRole: string
    freeFeatures: string[]
    proFeatures: string[]
  }
  university: {
    defaultSeatCount: number
    trialDurationDays: number
    defaultAdminPermissions: string[]
    defaultLicenseSeats: number
  }
  email: {
    notifyOnReviews: boolean
    notifyOnSignups: boolean
    notifyOnErrors: boolean
    defaultReplyToEmail: string
    enableMarketingEmails: boolean
  }
  api: {
    openaiModel: string
    maxTokensPerRequest: number
    webhookUrls: string[]
  }
  security: {
    requireMfaForAdmins: boolean
    sessionTimeoutMinutes: number
    allowedIpAddresses: string[]
  }
  xpSystem: {
    goalCompletionReward: number
    goalCreationReward: number
    personalAchievementValue: number
    personalAchievementCreationReward: number
    resumeCreationReward: number
    achievementEarnedReward: number
  }
  admin: {
    bulkThreshold: number
    defaultHealthValue: number
  }
}

export default function AdminSettingsTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [currentTab, setCurrentTab] = useState("general")
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [allowedIp, setAllowedIp] = useState("")
  const [isDirty, setIsDirty] = useState(false)

  // Get authentication state
  const { user, isLoading: authLoading } = useAuth()
  
  // Only fetch settings when user is authenticated
  const {
    data: settingsData,
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      console.log("🔧 Frontend: Fetching settings from /api/settings")
      try {
        const response = await apiRequest("GET", "/api/settings")
        const data = await response.json()
        console.log("🔧 Frontend: Settings data received:", !!data)
        return data
      } catch (error) {
        console.error("🔧 Frontend: Settings fetch error:", error)
        throw error
      }
    },
    retry: 1,
    staleTime: 0,
    enabled: !!user && !authLoading // Only run when user is authenticated
  })

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: PlatformSettings) => {
      console.log('🔧 Frontend: Starting settings mutation with data:', updatedSettings)
      try {
        const res = await apiRequest("PUT", "/api/settings", updatedSettings) as Response
        console.log('🔧 Frontend: API request completed, status:', res.status)
        
        if (!res.ok) {
          throw new Error(`API request failed with status ${res.status}`)
        }
        
        const responseData = await res.json()
        console.log('🔧 Frontend: Response data received:', responseData)
        return responseData
      } catch (error) {
        console.error('🔧 Frontend: API request failed:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      console.log('🔧 Frontend: Mutation successful, response:', data)
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] })
      toast({
        title: "Settings Updated",
        description: "Platform settings have been updated successfully.",
        variant: "success"
      })
      setIsDirty(false)
    },
    onError: (error: Error, variables) => {
      console.error('🔧 Frontend: Mutation failed:', error)
      console.error("Error updating settings:", error)
      toast({
        title: "Update Failed",
        description:
          "There was an error updating the settings. Please try again.",
        variant: "destructive"
      })
    }
  })

  // Reset settings mutation
  const resetSettingsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/settings/reset", {})
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] })
      toast({
        title: "Settings Reset",
        description: "Platform settings have been reset to defaults.",
        variant: "success"
      })
      setIsDirty(false)
    },
    onError: (error: Error) => {
      console.error("Error resetting settings:", error)
      toast({
        title: "Reset Failed",
        description:
          "There was an error resetting the settings. Please try again.",
        variant: "destructive"
      })
    }
  })

  // Initialize settings state with data from API
  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData)
    }
  }, [settingsData])

  // Handler for input changes
  const handleInputChange = (
    section: keyof PlatformSettings,
    field: string,
    value: any
  ) => {
    if (!settings) return

    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    })
    setIsDirty(true)
  }

  // Handler for array field additions
  const handleAddToArray = (
    section: keyof PlatformSettings,
    field: string,
    value: string
  ) => {
    if (!settings || !value.trim()) return

    // Type assertion to help TypeScript understand this is a string array
    const currentArray = settings[section][field] as string[]

    if (!currentArray.includes(value)) {
      setSettings({
        ...settings,
        [section]: {
          ...settings[section],
          [field]: [...currentArray, value]
        }
      })
      setIsDirty(true)
    }

    // Clear the input field
    if (field === "webhookUrls") {
      setWebhookUrl("")
    } else if (field === "allowedIpAddresses") {
      setAllowedIp("")
    }
  }

  // Handler for array field removals
  const handleRemoveFromArray = (
    section: keyof PlatformSettings,
    field: string,
    index: number
  ) => {
    if (!settings) return

    // Type assertion to help TypeScript understand this is a string array
    const currentArray = settings[section][field] as string[]

    const updatedArray = [...currentArray]
    updatedArray.splice(index, 1)

    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: updatedArray
      }
    })
    setIsDirty(true)
  }

  // Handler for saving settings
  const handleSaveSettings = () => {
    if (!user || authLoading) {
      console.log('🔧 Frontend: Cannot save settings - user not authenticated')
      toast({
        title: "Authentication Required",
        description: "Please ensure you are logged in before saving settings.",
        variant: "destructive"
      })
      return
    }
    
    if (settings && settingsData) {
      // Ensure we send complete settings by merging current changes with original data
      const completeSettings = {
        ...settingsData, // Start with the original complete data
        ...settings      // Override with any local changes
      }
      
      console.log('🔧 Frontend: Saving complete settings for authenticated user:', user.email)
      console.log('🔧 Frontend: Complete settings object:', completeSettings)
      updateSettingsMutation.mutate(completeSettings)
    } else {
      console.log('🔧 Frontend: Cannot save - settings or settingsData not available')
      toast({
        title: "Settings Not Ready",
        description: "Settings data is not yet loaded. Please wait and try again.",
        variant: "destructive"
      })
    }
  }

  // Handler for resetting settings
  const handleResetSettings = () => {
    if (
      confirm(
        "Are you sure you want to reset all settings to defaults? This action cannot be undone."
      )
    ) {
      resetSettingsMutation.mutate()
    }
  }

  // Default settings values if none are loaded yet
  const defaultSettings: PlatformSettings = {
    general: {
      platformName: "Ascentul",
      supportEmail: "support@ascentul.io",
      defaultTimezone: "America/New_York",
      maintenanceMode: false
    },
    features: {
      enableReviews: true,
      enableAICoach: true,
      enableResumeStudio: true,
      enableVoicePractice: true,
      enableCareerGoals: true,
      enableApplicationTracker: true,
      enableNetworkHub: true,
      enableCareerPathExplorer: true,
      enableProjectPortfolio: true,
      enableCoverLetterStudio: true
    },
    userRoles: {
      defaultUserRole: "regular",
      freeFeatures: ["resume-builder", "job-search", "basic-interview"],
      proFeatures: ["ai-coach", "voice-practice", "unlimited-storage"]
    },
    university: {
      defaultSeatCount: 100,
      trialDurationDays: 30,
      defaultAdminPermissions: ["manage-users", "view-analytics"],
      defaultLicenseSeats: 100
    },
    email: {
      notifyOnReviews: true,
      notifyOnSignups: true,
      notifyOnErrors: true,
      defaultReplyToEmail: "noreply@ascentul.io",
      enableMarketingEmails: false
    },
    api: {
      openaiModel: "gpt-4o",
      maxTokensPerRequest: 4000,
      webhookUrls: []
    },
    security: {
      requireMfaForAdmins: false,
      sessionTimeoutMinutes: 60,
      allowedIpAddresses: []
    },
    xpSystem: {
      goalCompletionReward: 100,
      goalCreationReward: 50,
      personalAchievementValue: 100,
      personalAchievementCreationReward: 50,
      resumeCreationReward: 100,
      achievementEarnedReward: 100
    },
    admin: {
      bulkThreshold: 100,
      defaultHealthValue: 100
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="ml-4 text-lg">Loading settings...</span>
      </div>
    )
  }

  if (error) {
    console.error("🔧 Frontend: Settings error details:", error)
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <div className="text-center">
          <div className="text-lg mb-2">
            Failed to load settings. Please try again later.
          </div>
          <div className="text-sm text-muted-foreground">
            Error: {error?.message || "Unknown error"}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      </div>
    )
  }

  // Use fetched settings or defaults if not available
  const displaySettings = settings || defaultSettings

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Platform Settings
          </h1>
          <p className="text-muted-foreground">
            Manage global platform settings and configurations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleResetSettings}
            disabled={resetSettingsMutation.isPending}
          >
            {resetSettingsMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={!isDirty || updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-9 mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="userRoles">User Roles</TabsTrigger>
          <TabsTrigger value="university">University</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="api">API & Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="xpSystem">XP System</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic platform settings that affect the entire application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={displaySettings.general.platformName}
                  onChange={(e) =>
                    handleInputChange("general", "platformName", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={displaySettings.general.supportEmail}
                  onChange={(e) =>
                    handleInputChange("general", "supportEmail", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultTimezone">Default Timezone</Label>
                <Select
                  value={displaySettings.general.defaultTimezone}
                  onValueChange={(value) =>
                    handleInputChange("general", "defaultTimezone", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">
                      Eastern Time (ET)
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      Central Time (CT)
                    </SelectItem>
                    <SelectItem value="America/Denver">
                      Mountain Time (MT)
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      Pacific Time (PT)
                    </SelectItem>
                    <SelectItem value="America/Anchorage">
                      Alaska Time (AKT)
                    </SelectItem>
                    <SelectItem value="Pacific/Honolulu">
                      Hawaii Time (HT)
                    </SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, all users will be shown a maintenance page
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={displaySettings.general.maintenanceMode}
                  onCheckedChange={(checked) =>
                    handleInputChange("general", "maintenanceMode", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Settings</CardTitle>
              <CardDescription>
                Toggle platform features on or off globally and manage feature
                links
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Application Tracker */}
                <div className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base">
                        Application Tracker
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Track job applications and interview progress
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        className="data-[state=checked]:bg-blue-600"
                        id="enableApplicationTracker"
                        checked={
                          displaySettings.features.enableApplicationTracker
                        }
                        onCheckedChange={(checked) =>
                          handleInputChange(
                            "features",
                            "enableApplicationTracker",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      <a
                        href="/applications"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Feature
                      </a>
                    </Button>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      Core Feature
                    </Badge>
                  </div>
                </div>

                {/* Career Goal Tracker */}
                <div className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base">
                        Career Goal Tracker
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Set and track career milestones and goals
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        className="data-[state=checked]:bg-blue-600"
                        id="enableCareerGoals"
                        checked={displaySettings.features.enableCareerGoals}
                        onCheckedChange={(checked) =>
                          handleInputChange(
                            "features",
                            "enableCareerGoals",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      <a
                        href="/goals"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Feature
                      </a>
                    </Button>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                      Premium
                    </Badge>
                  </div>
                </div>

                {/* Network Hub */}
                <div className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base">Network Hub</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage professional connections and interactions
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        className="data-[state=checked]:bg-blue-600"
                        id="enableNetworkHub"
                        checked={displaySettings.features.enableNetworkHub}
                        onCheckedChange={(checked) =>
                          handleInputChange(
                            "features",
                            "enableNetworkHub",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      <a
                        href="/network"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Feature
                      </a>
                    </Button>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      Core Feature
                    </Badge>
                  </div>
                </div>

                {/* CareerPath Explorer */}
                <div className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base">
                        CareerPath Explorer
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Discover potential career paths and opportunities
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        className="data-[state=checked]:bg-blue-600"
                        id="enableCareerPathExplorer"
                        checked={
                          displaySettings.features.enableCareerPathExplorer
                        }
                        onCheckedChange={(checked) =>
                          handleInputChange(
                            "features",
                            "enableCareerPathExplorer",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      <a
                        href="/career-paths"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Feature
                      </a>
                    </Button>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                      Premium
                    </Badge>
                  </div>
                </div>

                {/* Project Portfolio */}
                <div className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base">
                        Project Portfolio
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Showcase professional projects and achievements
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        className="data-[state=checked]:bg-blue-600"
                        id="enableProjectPortfolio"
                        checked={
                          displaySettings.features.enableProjectPortfolio
                        }
                        onCheckedChange={(checked) =>
                          handleInputChange(
                            "features",
                            "enableProjectPortfolio",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      <a
                        href="/projects"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Feature
                      </a>
                    </Button>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      Core Feature
                    </Badge>
                  </div>
                </div>

                {/* Resume Studio */}
                <div className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base">Resume Studio</h3>
                      <p className="text-sm text-muted-foreground">
                        Create, edit and optimize professional resumes
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        className="data-[state=checked]:bg-blue-600"
                        id="enableResumeStudio"
                        checked={displaySettings.features.enableResumeStudio}
                        onCheckedChange={(checked) =>
                          handleInputChange(
                            "features",
                            "enableResumeStudio",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      <a
                        href="/resume"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Feature
                      </a>
                    </Button>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      Core Feature
                    </Badge>
                  </div>
                </div>

                {/* Cover Letter Studio */}
                <div className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base">
                        Cover Letter Studio
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Generate and customize targeted cover letters
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        className="data-[state=checked]:bg-blue-600"
                        id="enableCoverLetterStudio"
                        checked={
                          displaySettings.features.enableCoverLetterStudio
                        }
                        onCheckedChange={(checked) =>
                          handleInputChange(
                            "features",
                            "enableCoverLetterStudio",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      <a
                        href="/cover-letter"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Feature
                      </a>
                    </Button>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                      Premium
                    </Badge>
                  </div>
                </div>

                {/* AI Career Coach */}
                <div className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base">AI Career Coach</h3>
                      <p className="text-sm text-muted-foreground">
                        Get personalized career guidance and advice
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        className="data-[state=checked]:bg-blue-600"
                        id="enableAICoach"
                        checked={displaySettings.features.enableAICoach}
                        onCheckedChange={(checked) =>
                          handleInputChange(
                            "features",
                            "enableAICoach",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      <a
                        href="/ai-coach"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Feature
                      </a>
                    </Button>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                      Premium
                    </Badge>
                  </div>
                </div>

                {/* Voice Practice */}
                <div className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base">Voice Practice</h3>
                      <p className="text-sm text-muted-foreground">
                        Interactive interview practice with feedback
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        className="data-[state=checked]:bg-blue-600"
                        id="enableVoicePractice"
                        checked={displaySettings.features.enableVoicePractice}
                        onCheckedChange={(checked) =>
                          handleInputChange(
                            "features",
                            "enableVoicePractice",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      <a
                        href="/interview/practice"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Feature
                      </a>
                    </Button>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                      Premium
                    </Badge>
                  </div>
                </div>

                {/* User Reviews */}
                <div className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base">User Reviews</h3>
                      <p className="text-sm text-muted-foreground">
                        Allow users to submit reviews and feedback
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        className="data-[state=checked]:bg-blue-600"
                        id="enableReviews"
                        checked={displaySettings.features.enableReviews}
                        onCheckedChange={(checked) =>
                          handleInputChange(
                            "features",
                            "enableReviews",
                            checked
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      <a
                        href="/reviews"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Feature
                      </a>
                    </Button>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      Core Feature
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Roles Tab */}
        <TabsContent value="userRoles">
          <Card>
            <CardHeader>
              <CardTitle>User Role Settings</CardTitle>
              <CardDescription>
                Configure default user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="defaultUserRole">Default User Role</Label>
                <Select
                  value={displaySettings.userRoles.defaultUserRole}
                  onValueChange={(value) =>
                    handleInputChange("userRoles", "defaultUserRole", value)
                  }
                >
                  <SelectTrigger id="defaultUserRole">
                    <SelectValue placeholder="Select default role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular User</SelectItem>
                    <SelectItem value="university_student">
                      University Student
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Free Features</Label>
                <div className="flex flex-wrap gap-2">
                  {displaySettings.userRoles.freeFeatures.map(
                    (feature, index) => (
                      <div
                        key={index}
                        className="bg-muted px-3 py-1 rounded-full flex items-center"
                      >
                        <span className="text-sm">{feature}</span>
                        <button
                          type="button"
                          className="ml-2 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            handleRemoveFromArray(
                              "userRoles",
                              "freeFeatures",
                              index
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>
                <div className="flex mt-2">
                  <Input
                    placeholder="Add a free feature"
                    className="mr-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddToArray(
                          "userRoles",
                          "freeFeatures",
                          (e.target as HTMLInputElement).value
                        )
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={(e) => {
                      const input = e.currentTarget
                        .previousSibling as HTMLInputElement
                      handleAddToArray("userRoles", "freeFeatures", input.value)
                      input.value = ""
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pro Features</Label>
                <div className="flex flex-wrap gap-2">
                  {displaySettings.userRoles.proFeatures.map(
                    (feature, index) => (
                      <div
                        key={index}
                        className="bg-muted px-3 py-1 rounded-full flex items-center"
                      >
                        <span className="text-sm">{feature}</span>
                        <button
                          type="button"
                          className="ml-2 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            handleRemoveFromArray(
                              "userRoles",
                              "proFeatures",
                              index
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>
                <div className="flex mt-2">
                  <Input
                    placeholder="Add a pro feature"
                    className="mr-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddToArray(
                          "userRoles",
                          "proFeatures",
                          (e.target as HTMLInputElement).value
                        )
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={(e) => {
                      const input = e.currentTarget
                        .previousSibling as HTMLInputElement
                      handleAddToArray("userRoles", "proFeatures", input.value)
                      input.value = ""
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* University Tab */}
        <TabsContent value="university">
          <Card>
            <CardHeader>
              <CardTitle>University Settings</CardTitle>
              <CardDescription>
                Configure university-specific settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="defaultSeatCount">Default Seat Count</Label>
                  <span className="text-sm text-muted-foreground">
                    {displaySettings.university.defaultSeatCount} seats
                  </span>
                </div>
                <Slider
                  id="defaultSeatCount"
                  min={10}
                  max={1000}
                  step={10}
                  value={[displaySettings.university.defaultSeatCount]}
                  onValueChange={(values) =>
                    handleInputChange(
                      "university",
                      "defaultSeatCount",
                      values[0]
                    )
                  }
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="trialDurationDays">Trial Duration</Label>
                  <span className="text-sm text-muted-foreground">
                    {displaySettings.university.trialDurationDays} days
                  </span>
                </div>
                <Slider
                  id="trialDurationDays"
                  min={7}
                  max={90}
                  step={1}
                  value={[displaySettings.university.trialDurationDays]}
                  onValueChange={(values) =>
                    handleInputChange(
                      "university",
                      "trialDurationDays",
                      values[0]
                    )
                  }
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="defaultLicenseSeats">
                    Default License Seats
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {displaySettings.university.defaultLicenseSeats} seats
                  </span>
                </div>
                <Slider
                  id="defaultLicenseSeats"
                  min={10}
                  max={500}
                  step={10}
                  value={[displaySettings.university.defaultLicenseSeats]}
                  onValueChange={(values) =>
                    handleInputChange(
                      "university",
                      "defaultLicenseSeats",
                      values[0]
                    )
                  }
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <Label>Default Admin Permissions</Label>
                <div className="flex flex-wrap gap-2">
                  {displaySettings.university.defaultAdminPermissions.map(
                    (permission, index) => (
                      <div
                        key={index}
                        className="bg-muted px-3 py-1 rounded-full flex items-center"
                      >
                        <span className="text-sm">{permission}</span>
                        <button
                          type="button"
                          className="ml-2 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            handleRemoveFromArray(
                              "university",
                              "defaultAdminPermissions",
                              index
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>
                <div className="flex mt-2">
                  <Input
                    placeholder="Add a permission"
                    className="mr-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddToArray(
                          "university",
                          "defaultAdminPermissions",
                          (e.target as HTMLInputElement).value
                        )
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={(e) => {
                      const input = e.currentTarget
                        .previousSibling as HTMLInputElement
                      handleAddToArray(
                        "university",
                        "defaultAdminPermissions",
                        input.value
                      )
                      input.value = ""
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure email notifications and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="defaultReplyToEmail">
                  Default Reply-To Email
                </Label>
                <Input
                  id="defaultReplyToEmail"
                  type="email"
                  value={displaySettings.email.defaultReplyToEmail}
                  onChange={(e) =>
                    handleInputChange(
                      "email",
                      "defaultReplyToEmail",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifyOnReviews">Reviews Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for new reviews
                  </p>
                </div>
                <Switch
                  id="notifyOnReviews"
                  checked={displaySettings.email.notifyOnReviews}
                  onCheckedChange={(checked) =>
                    handleInputChange("email", "notifyOnReviews", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifyOnSignups">Signup Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for new user registrations
                  </p>
                </div>
                <Switch
                  id="notifyOnSignups"
                  checked={displaySettings.email.notifyOnSignups}
                  onCheckedChange={(checked) =>
                    handleInputChange("email", "notifyOnSignups", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifyOnErrors">Error Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for critical system errors
                  </p>
                </div>
                <Switch
                  id="notifyOnErrors"
                  checked={displaySettings.email.notifyOnErrors}
                  onCheckedChange={(checked) =>
                    handleInputChange("email", "notifyOnErrors", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableMarketingEmails">
                    Marketing Emails
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow sending marketing emails to users who opted in
                  </p>
                </div>
                <Switch
                  id="enableMarketingEmails"
                  checked={displaySettings.email.enableMarketingEmails}
                  onCheckedChange={(checked) =>
                    handleInputChange("email", "enableMarketingEmails", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API & Integrations Tab */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API & Integrations</CardTitle>
              <CardDescription>
                Configure external API settings and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="openaiModel">OpenAI Model</Label>
                <Select
                  value={displaySettings.api.openaiModel}
                  onValueChange={(value) =>
                    handleInputChange("api", "openaiModel", value)
                  }
                >
                  <SelectTrigger id="openaiModel">
                    <SelectValue placeholder="Select OpenAI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maxTokensPerRequest">
                    Max Tokens Per Request
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {displaySettings.api.maxTokensPerRequest} tokens
                  </span>
                </div>
                <Slider
                  id="maxTokensPerRequest"
                  min={1000}
                  max={8000}
                  step={100}
                  value={[displaySettings.api.maxTokensPerRequest]}
                  onValueChange={(values) =>
                    handleInputChange("api", "maxTokensPerRequest", values[0])
                  }
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <Label>Webhook URLs</Label>
                <div className="flex flex-wrap gap-2">
                  {displaySettings.api.webhookUrls.map((url, index) => (
                    <div
                      key={index}
                      className="bg-muted px-3 py-1 rounded-full flex items-center max-w-full"
                    >
                      <span className="text-sm truncate">{url}</span>
                      <button
                        type="button"
                        className="ml-2 text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={() =>
                          handleRemoveFromArray("api", "webhookUrls", index)
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex mt-2">
                  <Input
                    placeholder="https://example.com/webhook"
                    className="mr-2"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddToArray("api", "webhookUrls", webhookUrl)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() =>
                      handleAddToArray("api", "webhookUrls", webhookUrl)
                    }
                  >
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure platform security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requireMfaForAdmins">
                    Require MFA for Admins
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Require multi-factor authentication for admin accounts
                  </p>
                </div>
                <Switch
                  id="requireMfaForAdmins"
                  checked={displaySettings.security.requireMfaForAdmins}
                  onCheckedChange={(checked) =>
                    handleInputChange(
                      "security",
                      "requireMfaForAdmins",
                      checked
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sessionTimeoutMinutes">Session Timeout</Label>
                  <span className="text-sm text-muted-foreground">
                    {displaySettings.security.sessionTimeoutMinutes} minutes
                  </span>
                </div>
                <Slider
                  id="sessionTimeoutMinutes"
                  min={15}
                  max={240}
                  step={15}
                  value={[displaySettings.security.sessionTimeoutMinutes]}
                  onValueChange={(values) =>
                    handleInputChange(
                      "security",
                      "sessionTimeoutMinutes",
                      values[0]
                    )
                  }
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <Label>Allowed IP Addresses</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-sm text-muted-foreground hover:cursor-help">
                      Leave empty to allow all IPs
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Add IP addresses to restrict admin dashboard access.
                      </p>
                      <p>
                        If empty, all IPs will be allowed to access the
                        dashboard.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex flex-wrap gap-2">
                  {displaySettings.security.allowedIpAddresses.map(
                    (ip, index) => (
                      <div
                        key={index}
                        className="bg-muted px-3 py-1 rounded-full flex items-center"
                      >
                        <span className="text-sm">{ip}</span>
                        <button
                          type="button"
                          className="ml-2 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            handleRemoveFromArray(
                              "security",
                              "allowedIpAddresses",
                              index
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>
                <div className="flex mt-2">
                  <Input
                    placeholder="192.168.1.1"
                    className="mr-2"
                    value={allowedIp}
                    onChange={(e) => setAllowedIp(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddToArray(
                          "security",
                          "allowedIpAddresses",
                          allowedIp
                        )
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() =>
                      handleAddToArray(
                        "security",
                        "allowedIpAddresses",
                        allowedIp
                      )
                    }
                  >
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* XP System Tab */}
        <TabsContent value="xpSystem">
          <Card>
            <CardHeader>
              <CardTitle>XP System Settings</CardTitle>
              <CardDescription>
                Configure experience point rewards for user actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="goalCompletionReward">
                    Goal Completion Reward
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {displaySettings.xpSystem.goalCompletionReward} XP
                  </span>
                </div>
                <Slider
                  id="goalCompletionReward"
                  min={10}
                  max={500}
                  step={10}
                  value={[displaySettings.xpSystem.goalCompletionReward]}
                  onValueChange={(values) =>
                    handleInputChange(
                      "xpSystem",
                      "goalCompletionReward",
                      values[0]
                    )
                  }
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="goalCreationReward">
                    Goal Creation Reward
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {displaySettings.xpSystem.goalCreationReward} XP
                  </span>
                </div>
                <Slider
                  id="goalCreationReward"
                  min={5}
                  max={200}
                  step={5}
                  value={[displaySettings.xpSystem.goalCreationReward]}
                  onValueChange={(values) =>
                    handleInputChange(
                      "xpSystem",
                      "goalCreationReward",
                      values[0]
                    )
                  }
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="personalAchievementValue">
                    Personal Achievement Value
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {displaySettings.xpSystem.personalAchievementValue} XP
                  </span>
                </div>
                <Slider
                  id="personalAchievementValue"
                  min={10}
                  max={300}
                  step={10}
                  value={[displaySettings.xpSystem.personalAchievementValue]}
                  onValueChange={(values) =>
                    handleInputChange(
                      "xpSystem",
                      "personalAchievementValue",
                      values[0]
                    )
                  }
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="personalAchievementCreationReward">
                    Achievement Creation Reward
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {displaySettings.xpSystem.personalAchievementCreationReward}{" "}
                    XP
                  </span>
                </div>
                <Slider
                  id="personalAchievementCreationReward"
                  min={5}
                  max={200}
                  step={5}
                  value={[
                    displaySettings.xpSystem.personalAchievementCreationReward
                  ]}
                  onValueChange={(values) =>
                    handleInputChange(
                      "xpSystem",
                      "personalAchievementCreationReward",
                      values[0]
                    )
                  }
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="resumeCreationReward">
                    Resume Creation Reward
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {displaySettings.xpSystem.resumeCreationReward} XP
                  </span>
                </div>
                <Slider
                  id="resumeCreationReward"
                  min={50}
                  max={500}
                  step={25}
                  value={[displaySettings.xpSystem.resumeCreationReward]}
                  onValueChange={(values) =>
                    handleInputChange(
                      "xpSystem",
                      "resumeCreationReward",
                      values[0]
                    )
                  }
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="achievementEarnedReward">
                    Achievement Earned Reward
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {displaySettings.xpSystem.achievementEarnedReward} XP
                  </span>
                </div>
                <Slider
                  id="achievementEarnedReward"
                  min={25}
                  max={500}
                  step={25}
                  value={[displaySettings.xpSystem.achievementEarnedReward]}
                  onValueChange={(values) =>
                    handleInputChange(
                      "xpSystem",
                      "achievementEarnedReward",
                      values[0]
                    )
                  }
                  className="py-4"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tab */}
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
              <CardDescription>
                Configure administrative defaults and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bulkThreshold">
                    Bulk Operation Threshold
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {displaySettings.admin.bulkThreshold} items
                  </span>
                </div>
                <Slider
                  id="bulkThreshold"
                  min={10}
                  max={1000}
                  step={10}
                  value={[displaySettings.admin.bulkThreshold]}
                  onValueChange={(values) =>
                    handleInputChange("admin", "bulkThreshold", values[0])
                  }
                  className="py-4"
                />
                <p className="text-sm text-muted-foreground">
                  Number of items required to trigger bulk operation
                  confirmation dialogs
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="defaultHealthValue">
                    Default Health Value
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {displaySettings.admin.defaultHealthValue}%
                  </span>
                </div>
                <Slider
                  id="defaultHealthValue"
                  min={50}
                  max={100}
                  step={5}
                  value={[displaySettings.admin.defaultHealthValue]}
                  onValueChange={(values) =>
                    handleInputChange("admin", "defaultHealthValue", values[0])
                  }
                  className="py-4"
                />
                <p className="text-sm text-muted-foreground">
                  Default health value for new user accounts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fixed save button at the bottom */}
      {isDirty && (
        <div className="fixed bottom-8 right-8 flex items-center shadow-lg bg-primary text-primary-foreground px-4 py-2 rounded-lg border border-primary/20">
          <span className="mr-2 text-sm">Unsaved changes</span>
          <Button
            size="sm"
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      )}
    </div>
  )
}
