import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Save, RotateCcw, Check, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
export default function AdminSettingsTab() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [currentTab, setCurrentTab] = useState("general");
    const [settings, setSettings] = useState(null);
    const [webhookUrl, setWebhookUrl] = useState("");
    const [allowedIp, setAllowedIp] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    // Get authentication state
    const { user, isLoading: authLoading } = useAuth();
    // Only fetch settings when user is authenticated
    const { data: settingsData, isLoading, error } = useQuery({
        queryKey: ["/api/settings"],
        queryFn: async () => {
            console.log("🔧 Frontend: Fetching settings from /api/settings");
            try {
                const response = await apiRequest("GET", "/api/settings");
                const data = await response.json();
                console.log("🔧 Frontend: Settings data received:", !!data);
                return data;
            }
            catch (error) {
                console.error("🔧 Frontend: Settings fetch error:", error);
                throw error;
            }
        },
        retry: 1,
        staleTime: 0,
        enabled: !!user && !authLoading // Only run when user is authenticated
    });
    // Update settings mutation
    const updateSettingsMutation = useMutation({
        mutationFn: async (updatedSettings) => {
            console.log('🔧 Frontend: Starting settings mutation with data:', updatedSettings);
            try {
                const res = await apiRequest("PUT", "/api/settings", updatedSettings);
                console.log('🔧 Frontend: API request completed, status:', res.status);
                if (!res.ok) {
                    throw new Error(`API request failed with status ${res.status}`);
                }
                const responseData = await res.json();
                console.log('🔧 Frontend: Response data received:', responseData);
                return responseData;
            }
            catch (error) {
                console.error('🔧 Frontend: API request failed:', error);
                throw error;
            }
        },
        onSuccess: (data) => {
            console.log('🔧 Frontend: Mutation successful, response:', data);
            queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
            toast({
                title: "Settings Updated",
                description: "Platform settings have been updated successfully.",
                variant: "success"
            });
            setIsDirty(false);
        },
        onError: (error, variables) => {
            console.error('🔧 Frontend: Mutation failed:', error);
            console.error("Error updating settings:", error);
            toast({
                title: "Update Failed",
                description: "There was an error updating the settings. Please try again.",
                variant: "destructive"
            });
        }
    });
    // Reset settings mutation
    const resetSettingsMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/settings/reset", {});
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
            toast({
                title: "Settings Reset",
                description: "Platform settings have been reset to defaults.",
                variant: "success"
            });
            setIsDirty(false);
        },
        onError: (error) => {
            console.error("Error resetting settings:", error);
            toast({
                title: "Reset Failed",
                description: "There was an error resetting the settings. Please try again.",
                variant: "destructive"
            });
        }
    });
    // Initialize settings state with data from API
    useEffect(() => {
        if (settingsData) {
            setSettings(settingsData);
        }
    }, [settingsData]);
    // Handler for input changes
    const handleInputChange = (section, field, value) => {
        if (!settings)
            return;
        setSettings({
            ...settings,
            [section]: {
                ...settings[section],
                [field]: value
            }
        });
        setIsDirty(true);
    };
    // Handler for array field additions
    const handleAddToArray = (section, field, value) => {
        if (!settings || !value.trim())
            return;
        // Type assertion to help TypeScript understand this is a string array
        const currentArray = settings[section][field];
        if (!currentArray.includes(value)) {
            setSettings({
                ...settings,
                [section]: {
                    ...settings[section],
                    [field]: [...currentArray, value]
                }
            });
            setIsDirty(true);
        }
        // Clear the input field
        if (field === "webhookUrls") {
            setWebhookUrl("");
        }
        else if (field === "allowedIpAddresses") {
            setAllowedIp("");
        }
    };
    // Handler for array field removals
    const handleRemoveFromArray = (section, field, index) => {
        if (!settings)
            return;
        // Type assertion to help TypeScript understand this is a string array
        const currentArray = settings[section][field];
        const updatedArray = [...currentArray];
        updatedArray.splice(index, 1);
        setSettings({
            ...settings,
            [section]: {
                ...settings[section],
                [field]: updatedArray
            }
        });
        setIsDirty(true);
    };
    // Handler for saving settings
    const handleSaveSettings = () => {
        if (!user || authLoading) {
            console.log('🔧 Frontend: Cannot save settings - user not authenticated');
            toast({
                title: "Authentication Required",
                description: "Please ensure you are logged in before saving settings.",
                variant: "destructive"
            });
            return;
        }
        if (settings && settingsData) {
            // Ensure we send complete settings by merging current changes with original data
            const completeSettings = {
                ...settingsData, // Start with the original complete data
                ...settings // Override with any local changes
            };
            console.log('🔧 Frontend: Saving complete settings for authenticated user:', user.email);
            console.log('🔧 Frontend: Complete settings object:', completeSettings);
            updateSettingsMutation.mutate(completeSettings);
        }
        else {
            console.log('🔧 Frontend: Cannot save - settings or settingsData not available');
            toast({
                title: "Settings Not Ready",
                description: "Settings data is not yet loaded. Please wait and try again.",
                variant: "destructive"
            });
        }
    };
    // Handler for resetting settings
    const handleResetSettings = () => {
        if (confirm("Are you sure you want to reset all settings to defaults? This action cannot be undone.")) {
            resetSettingsMutation.mutate();
        }
    };
    // Default settings values if none are loaded yet
    const defaultSettings = {
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
    };
    if (isLoading) {
        return (_jsxs("div", { className: "flex justify-center items-center h-64", children: [_jsx(Loader2, { className: "w-10 h-10 animate-spin text-primary" }), _jsx("span", { className: "ml-4 text-lg", children: "Loading settings..." })] }));
    }
    if (error) {
        console.error("🔧 Frontend: Settings error details:", error);
        return (_jsxs("div", { className: "flex flex-col justify-center items-center h-64 space-y-4", children: [_jsx(AlertCircle, { className: "w-10 h-10 text-destructive" }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-lg mb-2", children: "Failed to load settings. Please try again later." }), _jsxs("div", { className: "text-sm text-muted-foreground", children: ["Error: ", error?.message || "Unknown error"] }), _jsx(Button, { variant: "outline", size: "sm", className: "mt-4", onClick: () => window.location.reload(), children: "Reload Page" })] })] }));
    }
    // Use fetched settings or defaults if not available
    const displaySettings = settings || defaultSettings;
    return (_jsxs("div", { className: "container py-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Platform Settings" }), _jsx("p", { className: "text-muted-foreground", children: "Manage global platform settings and configurations" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { variant: "outline", onClick: handleResetSettings, disabled: resetSettingsMutation.isPending, children: [resetSettingsMutation.isPending ? (_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" })) : (_jsx(RotateCcw, { className: "w-4 h-4 mr-2" })), "Reset to Defaults"] }), _jsxs(Button, { onClick: handleSaveSettings, disabled: !isDirty || updateSettingsMutation.isPending, children: [updateSettingsMutation.isPending ? (_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" })) : (_jsx(Save, { className: "w-4 h-4 mr-2" })), "Save Changes"] })] })] }), _jsxs(Tabs, { value: currentTab, onValueChange: setCurrentTab, children: [_jsxs(TabsList, { className: "grid grid-cols-9 mb-8", children: [_jsx(TabsTrigger, { value: "general", children: "General" }), _jsx(TabsTrigger, { value: "features", children: "Features" }), _jsx(TabsTrigger, { value: "userRoles", children: "User Roles" }), _jsx(TabsTrigger, { value: "university", children: "University" }), _jsx(TabsTrigger, { value: "email", children: "Email" }), _jsx(TabsTrigger, { value: "api", children: "API & Integrations" }), _jsx(TabsTrigger, { value: "security", children: "Security" }), _jsx(TabsTrigger, { value: "xpSystem", children: "XP System" }), _jsx(TabsTrigger, { value: "admin", children: "Admin" })] }), _jsx(TabsContent, { value: "general", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "General Settings" }), _jsx(CardDescription, { children: "Basic platform settings that affect the entire application" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "platformName", children: "Platform Name" }), _jsx(Input, { id: "platformName", value: displaySettings.general.platformName, onChange: (e) => handleInputChange("general", "platformName", e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "supportEmail", children: "Support Email" }), _jsx(Input, { id: "supportEmail", type: "email", value: displaySettings.general.supportEmail, onChange: (e) => handleInputChange("general", "supportEmail", e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "defaultTimezone", children: "Default Timezone" }), _jsxs(Select, { value: displaySettings.general.defaultTimezone, onValueChange: (value) => handleInputChange("general", "defaultTimezone", value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select timezone" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "America/New_York", children: "Eastern Time (ET)" }), _jsx(SelectItem, { value: "America/Chicago", children: "Central Time (CT)" }), _jsx(SelectItem, { value: "America/Denver", children: "Mountain Time (MT)" }), _jsx(SelectItem, { value: "America/Los_Angeles", children: "Pacific Time (PT)" }), _jsx(SelectItem, { value: "America/Anchorage", children: "Alaska Time (AKT)" }), _jsx(SelectItem, { value: "Pacific/Honolulu", children: "Hawaii Time (HT)" }), _jsx(SelectItem, { value: "UTC", children: "UTC" })] })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { htmlFor: "maintenanceMode", children: "Maintenance Mode" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "When enabled, all users will be shown a maintenance page" })] }), _jsx(Switch, { id: "maintenanceMode", checked: displaySettings.general.maintenanceMode, onCheckedChange: (checked) => handleInputChange("general", "maintenanceMode", checked) })] })] })] }) }), _jsx(TabsContent, { value: "features", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Feature Settings" }), _jsx(CardDescription, { children: "Toggle platform features on or off globally and manage feature links" })] }), _jsx(CardContent, { className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "font-medium text-base", children: "Application Tracker" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Track job applications and interview progress" })] }), _jsx("div", { className: "flex items-center", children: _jsx(Switch, { className: "data-[state=checked]:bg-blue-600", id: "enableApplicationTracker", checked: displaySettings.features.enableApplicationTracker, onCheckedChange: (checked) => handleInputChange("features", "enableApplicationTracker", checked) }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200", children: _jsx("a", { href: "/applications", target: "_blank", rel: "noopener noreferrer", children: "View Feature" }) }), _jsx(Badge, { className: "bg-blue-100 text-blue-800 hover:bg-blue-200", children: "Core Feature" })] })] }), _jsxs("div", { className: "border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "font-medium text-base", children: "Career Goal Tracker" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Set and track career milestones and goals" })] }), _jsx("div", { className: "flex items-center", children: _jsx(Switch, { className: "data-[state=checked]:bg-blue-600", id: "enableCareerGoals", checked: displaySettings.features.enableCareerGoals, onCheckedChange: (checked) => handleInputChange("features", "enableCareerGoals", checked) }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200", children: _jsx("a", { href: "/goals", target: "_blank", rel: "noopener noreferrer", children: "View Feature" }) }), _jsx(Badge, { className: "bg-purple-100 text-purple-800 hover:bg-purple-200", children: "Premium" })] })] }), _jsxs("div", { className: "border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "font-medium text-base", children: "Network Hub" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Manage professional connections and interactions" })] }), _jsx("div", { className: "flex items-center", children: _jsx(Switch, { className: "data-[state=checked]:bg-blue-600", id: "enableNetworkHub", checked: displaySettings.features.enableNetworkHub, onCheckedChange: (checked) => handleInputChange("features", "enableNetworkHub", checked) }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200", children: _jsx("a", { href: "/network", target: "_blank", rel: "noopener noreferrer", children: "View Feature" }) }), _jsx(Badge, { className: "bg-blue-100 text-blue-800 hover:bg-blue-200", children: "Core Feature" })] })] }), _jsxs("div", { className: "border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "font-medium text-base", children: "CareerPath Explorer" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Discover potential career paths and opportunities" })] }), _jsx("div", { className: "flex items-center", children: _jsx(Switch, { className: "data-[state=checked]:bg-blue-600", id: "enableCareerPathExplorer", checked: displaySettings.features.enableCareerPathExplorer, onCheckedChange: (checked) => handleInputChange("features", "enableCareerPathExplorer", checked) }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200", children: _jsx("a", { href: "/career-paths", target: "_blank", rel: "noopener noreferrer", children: "View Feature" }) }), _jsx(Badge, { className: "bg-purple-100 text-purple-800 hover:bg-purple-200", children: "Premium" })] })] }), _jsxs("div", { className: "border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "font-medium text-base", children: "Project Portfolio" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Showcase professional projects and achievements" })] }), _jsx("div", { className: "flex items-center", children: _jsx(Switch, { className: "data-[state=checked]:bg-blue-600", id: "enableProjectPortfolio", checked: displaySettings.features.enableProjectPortfolio, onCheckedChange: (checked) => handleInputChange("features", "enableProjectPortfolio", checked) }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200", children: _jsx("a", { href: "/projects", target: "_blank", rel: "noopener noreferrer", children: "View Feature" }) }), _jsx(Badge, { className: "bg-blue-100 text-blue-800 hover:bg-blue-200", children: "Core Feature" })] })] }), _jsxs("div", { className: "border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "font-medium text-base", children: "Resume Studio" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Create, edit and optimize professional resumes" })] }), _jsx("div", { className: "flex items-center", children: _jsx(Switch, { className: "data-[state=checked]:bg-blue-600", id: "enableResumeStudio", checked: displaySettings.features.enableResumeStudio, onCheckedChange: (checked) => handleInputChange("features", "enableResumeStudio", checked) }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200", children: _jsx("a", { href: "/resume", target: "_blank", rel: "noopener noreferrer", children: "View Feature" }) }), _jsx(Badge, { className: "bg-blue-100 text-blue-800 hover:bg-blue-200", children: "Core Feature" })] })] }), _jsxs("div", { className: "border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "font-medium text-base", children: "Cover Letter Studio" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Generate and customize targeted cover letters" })] }), _jsx("div", { className: "flex items-center", children: _jsx(Switch, { className: "data-[state=checked]:bg-blue-600", id: "enableCoverLetterStudio", checked: displaySettings.features.enableCoverLetterStudio, onCheckedChange: (checked) => handleInputChange("features", "enableCoverLetterStudio", checked) }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200", children: _jsx("a", { href: "/cover-letter", target: "_blank", rel: "noopener noreferrer", children: "View Feature" }) }), _jsx(Badge, { className: "bg-purple-100 text-purple-800 hover:bg-purple-200", children: "Premium" })] })] }), _jsxs("div", { className: "border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "font-medium text-base", children: "AI Career Coach" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Get personalized career guidance and advice" })] }), _jsx("div", { className: "flex items-center", children: _jsx(Switch, { className: "data-[state=checked]:bg-blue-600", id: "enableAICoach", checked: displaySettings.features.enableAICoach, onCheckedChange: (checked) => handleInputChange("features", "enableAICoach", checked) }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200", children: _jsx("a", { href: "/ai-coach", target: "_blank", rel: "noopener noreferrer", children: "View Feature" }) }), _jsx(Badge, { className: "bg-purple-100 text-purple-800 hover:bg-purple-200", children: "Premium" })] })] }), _jsxs("div", { className: "border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "font-medium text-base", children: "Voice Practice" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Interactive interview practice with feedback" })] }), _jsx("div", { className: "flex items-center", children: _jsx(Switch, { className: "data-[state=checked]:bg-blue-600", id: "enableVoicePractice", checked: displaySettings.features.enableVoicePractice, onCheckedChange: (checked) => handleInputChange("features", "enableVoicePractice", checked) }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200", children: _jsx("a", { href: "/interview/practice", target: "_blank", rel: "noopener noreferrer", children: "View Feature" }) }), _jsx(Badge, { className: "bg-purple-100 text-purple-800 hover:bg-purple-200", children: "Premium" })] })] }), _jsxs("div", { className: "border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "font-medium text-base", children: "User Reviews" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Allow users to submit reviews and feedback" })] }), _jsx("div", { className: "flex items-center", children: _jsx(Switch, { className: "data-[state=checked]:bg-blue-600", id: "enableReviews", checked: displaySettings.features.enableReviews, onCheckedChange: (checked) => handleInputChange("features", "enableReviews", checked) }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200", children: _jsx("a", { href: "/reviews", target: "_blank", rel: "noopener noreferrer", children: "View Feature" }) }), _jsx(Badge, { className: "bg-blue-100 text-blue-800 hover:bg-blue-200", children: "Core Feature" })] })] })] }) })] }) }), _jsx(TabsContent, { value: "userRoles", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "User Role Settings" }), _jsx(CardDescription, { children: "Configure default user roles and permissions" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "defaultUserRole", children: "Default User Role" }), _jsxs(Select, { value: displaySettings.userRoles.defaultUserRole, onValueChange: (value) => handleInputChange("userRoles", "defaultUserRole", value), children: [_jsx(SelectTrigger, { id: "defaultUserRole", children: _jsx(SelectValue, { placeholder: "Select default role" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "regular", children: "Regular User" }), _jsx(SelectItem, { value: "university_student", children: "University Student" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Free Features" }), _jsx("div", { className: "flex flex-wrap gap-2", children: displaySettings.userRoles.freeFeatures.map((feature, index) => (_jsxs("div", { className: "bg-muted px-3 py-1 rounded-full flex items-center", children: [_jsx("span", { className: "text-sm", children: feature }), _jsx("button", { type: "button", className: "ml-2 text-muted-foreground hover:text-destructive", onClick: () => handleRemoveFromArray("userRoles", "freeFeatures", index), children: "\u00D7" })] }, index))) }), _jsxs("div", { className: "flex mt-2", children: [_jsx(Input, { placeholder: "Add a free feature", className: "mr-2", onKeyDown: (e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    handleAddToArray("userRoles", "freeFeatures", e.target.value);
                                                                    e.target.value = "";
                                                                }
                                                            } }), _jsx(Button, { type: "button", size: "icon", onClick: (e) => {
                                                                const input = e.currentTarget
                                                                    .previousSibling;
                                                                handleAddToArray("userRoles", "freeFeatures", input.value);
                                                                input.value = "";
                                                            }, children: "+" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Pro Features" }), _jsx("div", { className: "flex flex-wrap gap-2", children: displaySettings.userRoles.proFeatures.map((feature, index) => (_jsxs("div", { className: "bg-muted px-3 py-1 rounded-full flex items-center", children: [_jsx("span", { className: "text-sm", children: feature }), _jsx("button", { type: "button", className: "ml-2 text-muted-foreground hover:text-destructive", onClick: () => handleRemoveFromArray("userRoles", "proFeatures", index), children: "\u00D7" })] }, index))) }), _jsxs("div", { className: "flex mt-2", children: [_jsx(Input, { placeholder: "Add a pro feature", className: "mr-2", onKeyDown: (e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    handleAddToArray("userRoles", "proFeatures", e.target.value);
                                                                    e.target.value = "";
                                                                }
                                                            } }), _jsx(Button, { type: "button", size: "icon", onClick: (e) => {
                                                                const input = e.currentTarget
                                                                    .previousSibling;
                                                                handleAddToArray("userRoles", "proFeatures", input.value);
                                                                input.value = "";
                                                            }, children: "+" })] })] })] })] }) }), _jsx(TabsContent, { value: "university", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "University Settings" }), _jsx(CardDescription, { children: "Configure university-specific settings" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "defaultSeatCount", children: "Default Seat Count" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [displaySettings.university.defaultSeatCount, " seats"] })] }), _jsx(Slider, { id: "defaultSeatCount", min: 10, max: 1000, step: 10, value: [displaySettings.university.defaultSeatCount], onValueChange: (values) => handleInputChange("university", "defaultSeatCount", values[0]), className: "py-4" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "trialDurationDays", children: "Trial Duration" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [displaySettings.university.trialDurationDays, " days"] })] }), _jsx(Slider, { id: "trialDurationDays", min: 7, max: 90, step: 1, value: [displaySettings.university.trialDurationDays], onValueChange: (values) => handleInputChange("university", "trialDurationDays", values[0]), className: "py-4" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "defaultLicenseSeats", children: "Default License Seats" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [displaySettings.university.defaultLicenseSeats, " seats"] })] }), _jsx(Slider, { id: "defaultLicenseSeats", min: 10, max: 500, step: 10, value: [displaySettings.university.defaultLicenseSeats], onValueChange: (values) => handleInputChange("university", "defaultLicenseSeats", values[0]), className: "py-4" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Default Admin Permissions" }), _jsx("div", { className: "flex flex-wrap gap-2", children: displaySettings.university.defaultAdminPermissions.map((permission, index) => (_jsxs("div", { className: "bg-muted px-3 py-1 rounded-full flex items-center", children: [_jsx("span", { className: "text-sm", children: permission }), _jsx("button", { type: "button", className: "ml-2 text-muted-foreground hover:text-destructive", onClick: () => handleRemoveFromArray("university", "defaultAdminPermissions", index), children: "\u00D7" })] }, index))) }), _jsxs("div", { className: "flex mt-2", children: [_jsx(Input, { placeholder: "Add a permission", className: "mr-2", onKeyDown: (e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    handleAddToArray("university", "defaultAdminPermissions", e.target.value);
                                                                    e.target.value = "";
                                                                }
                                                            } }), _jsx(Button, { type: "button", size: "icon", onClick: (e) => {
                                                                const input = e.currentTarget
                                                                    .previousSibling;
                                                                handleAddToArray("university", "defaultAdminPermissions", input.value);
                                                                input.value = "";
                                                            }, children: "+" })] })] })] })] }) }), _jsx(TabsContent, { value: "email", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Email Settings" }), _jsx(CardDescription, { children: "Configure email notifications and settings" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "defaultReplyToEmail", children: "Default Reply-To Email" }), _jsx(Input, { id: "defaultReplyToEmail", type: "email", value: displaySettings.email.defaultReplyToEmail, onChange: (e) => handleInputChange("email", "defaultReplyToEmail", e.target.value) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { htmlFor: "notifyOnReviews", children: "Reviews Notifications" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Receive email notifications for new reviews" })] }), _jsx(Switch, { id: "notifyOnReviews", checked: displaySettings.email.notifyOnReviews, onCheckedChange: (checked) => handleInputChange("email", "notifyOnReviews", checked) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { htmlFor: "notifyOnSignups", children: "Signup Notifications" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Receive email notifications for new user registrations" })] }), _jsx(Switch, { id: "notifyOnSignups", checked: displaySettings.email.notifyOnSignups, onCheckedChange: (checked) => handleInputChange("email", "notifyOnSignups", checked) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { htmlFor: "notifyOnErrors", children: "Error Notifications" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Receive email notifications for critical system errors" })] }), _jsx(Switch, { id: "notifyOnErrors", checked: displaySettings.email.notifyOnErrors, onCheckedChange: (checked) => handleInputChange("email", "notifyOnErrors", checked) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { htmlFor: "enableMarketingEmails", children: "Marketing Emails" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Allow sending marketing emails to users who opted in" })] }), _jsx(Switch, { id: "enableMarketingEmails", checked: displaySettings.email.enableMarketingEmails, onCheckedChange: (checked) => handleInputChange("email", "enableMarketingEmails", checked) })] })] })] }) }), _jsx(TabsContent, { value: "api", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "API & Integrations" }), _jsx(CardDescription, { children: "Configure external API settings and integrations" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "openaiModel", children: "OpenAI Model" }), _jsxs(Select, { value: displaySettings.api.openaiModel, onValueChange: (value) => handleInputChange("api", "openaiModel", value), children: [_jsx(SelectTrigger, { id: "openaiModel", children: _jsx(SelectValue, { placeholder: "Select OpenAI model" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "gpt-4o", children: "GPT-4o (Latest)" }), _jsx(SelectItem, { value: "gpt-4", children: "GPT-4" }), _jsx(SelectItem, { value: "gpt-3.5-turbo", children: "GPT-3.5 Turbo" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "maxTokensPerRequest", children: "Max Tokens Per Request" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [displaySettings.api.maxTokensPerRequest, " tokens"] })] }), _jsx(Slider, { id: "maxTokensPerRequest", min: 1000, max: 8000, step: 100, value: [displaySettings.api.maxTokensPerRequest], onValueChange: (values) => handleInputChange("api", "maxTokensPerRequest", values[0]), className: "py-4" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Webhook URLs" }), _jsx("div", { className: "flex flex-wrap gap-2", children: displaySettings.api.webhookUrls.map((url, index) => (_jsxs("div", { className: "bg-muted px-3 py-1 rounded-full flex items-center max-w-full", children: [_jsx("span", { className: "text-sm truncate", children: url }), _jsx("button", { type: "button", className: "ml-2 text-muted-foreground hover:text-destructive flex-shrink-0", onClick: () => handleRemoveFromArray("api", "webhookUrls", index), children: "\u00D7" })] }, index))) }), _jsxs("div", { className: "flex mt-2", children: [_jsx(Input, { placeholder: "https://example.com/webhook", className: "mr-2", value: webhookUrl, onChange: (e) => setWebhookUrl(e.target.value), onKeyDown: (e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    handleAddToArray("api", "webhookUrls", webhookUrl);
                                                                }
                                                            } }), _jsx(Button, { type: "button", onClick: () => handleAddToArray("api", "webhookUrls", webhookUrl), children: "Add" })] })] })] })] }) }), _jsx(TabsContent, { value: "security", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Security Settings" }), _jsx(CardDescription, { children: "Configure platform security settings" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { htmlFor: "requireMfaForAdmins", children: "Require MFA for Admins" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Require multi-factor authentication for admin accounts" })] }), _jsx(Switch, { id: "requireMfaForAdmins", checked: displaySettings.security.requireMfaForAdmins, onCheckedChange: (checked) => handleInputChange("security", "requireMfaForAdmins", checked) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "sessionTimeoutMinutes", children: "Session Timeout" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [displaySettings.security.sessionTimeoutMinutes, " minutes"] })] }), _jsx(Slider, { id: "sessionTimeoutMinutes", min: 15, max: 240, step: 15, value: [displaySettings.security.sessionTimeoutMinutes], onValueChange: (values) => handleInputChange("security", "sessionTimeoutMinutes", values[0]), className: "py-4" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Allowed IP Addresses" }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { className: "text-sm text-muted-foreground hover:cursor-help", children: "Leave empty to allow all IPs" }), _jsxs(TooltipContent, { children: [_jsx("p", { children: "Add IP addresses to restrict admin dashboard access." }), _jsx("p", { children: "If empty, all IPs will be allowed to access the dashboard." })] })] }) }), _jsx("div", { className: "flex flex-wrap gap-2", children: displaySettings.security.allowedIpAddresses.map((ip, index) => (_jsxs("div", { className: "bg-muted px-3 py-1 rounded-full flex items-center", children: [_jsx("span", { className: "text-sm", children: ip }), _jsx("button", { type: "button", className: "ml-2 text-muted-foreground hover:text-destructive", onClick: () => handleRemoveFromArray("security", "allowedIpAddresses", index), children: "\u00D7" })] }, index))) }), _jsxs("div", { className: "flex mt-2", children: [_jsx(Input, { placeholder: "192.168.1.1", className: "mr-2", value: allowedIp, onChange: (e) => setAllowedIp(e.target.value), onKeyDown: (e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    handleAddToArray("security", "allowedIpAddresses", allowedIp);
                                                                }
                                                            } }), _jsx(Button, { type: "button", onClick: () => handleAddToArray("security", "allowedIpAddresses", allowedIp), children: "Add" })] })] })] })] }) }), _jsx(TabsContent, { value: "xpSystem", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "XP System Settings" }), _jsx(CardDescription, { children: "Configure experience point rewards for user actions" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "goalCompletionReward", children: "Goal Completion Reward" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [displaySettings.xpSystem.goalCompletionReward, " XP"] })] }), _jsx(Slider, { id: "goalCompletionReward", min: 10, max: 500, step: 10, value: [displaySettings.xpSystem.goalCompletionReward], onValueChange: (values) => handleInputChange("xpSystem", "goalCompletionReward", values[0]), className: "py-4" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "goalCreationReward", children: "Goal Creation Reward" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [displaySettings.xpSystem.goalCreationReward, " XP"] })] }), _jsx(Slider, { id: "goalCreationReward", min: 5, max: 200, step: 5, value: [displaySettings.xpSystem.goalCreationReward], onValueChange: (values) => handleInputChange("xpSystem", "goalCreationReward", values[0]), className: "py-4" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "personalAchievementValue", children: "Personal Achievement Value" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [displaySettings.xpSystem.personalAchievementValue, " XP"] })] }), _jsx(Slider, { id: "personalAchievementValue", min: 10, max: 300, step: 10, value: [displaySettings.xpSystem.personalAchievementValue], onValueChange: (values) => handleInputChange("xpSystem", "personalAchievementValue", values[0]), className: "py-4" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "personalAchievementCreationReward", children: "Achievement Creation Reward" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [displaySettings.xpSystem.personalAchievementCreationReward, " ", "XP"] })] }), _jsx(Slider, { id: "personalAchievementCreationReward", min: 5, max: 200, step: 5, value: [
                                                        displaySettings.xpSystem.personalAchievementCreationReward
                                                    ], onValueChange: (values) => handleInputChange("xpSystem", "personalAchievementCreationReward", values[0]), className: "py-4" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "resumeCreationReward", children: "Resume Creation Reward" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [displaySettings.xpSystem.resumeCreationReward, " XP"] })] }), _jsx(Slider, { id: "resumeCreationReward", min: 50, max: 500, step: 25, value: [displaySettings.xpSystem.resumeCreationReward], onValueChange: (values) => handleInputChange("xpSystem", "resumeCreationReward", values[0]), className: "py-4" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "achievementEarnedReward", children: "Achievement Earned Reward" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [displaySettings.xpSystem.achievementEarnedReward, " XP"] })] }), _jsx(Slider, { id: "achievementEarnedReward", min: 25, max: 500, step: 25, value: [displaySettings.xpSystem.achievementEarnedReward], onValueChange: (values) => handleInputChange("xpSystem", "achievementEarnedReward", values[0]), className: "py-4" })] })] })] }) }), _jsx(TabsContent, { value: "admin", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Admin Settings" }), _jsx(CardDescription, { children: "Configure administrative defaults and thresholds" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "bulkThreshold", children: "Bulk Operation Threshold" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [displaySettings.admin.bulkThreshold, " items"] })] }), _jsx(Slider, { id: "bulkThreshold", min: 10, max: 1000, step: 10, value: [displaySettings.admin.bulkThreshold], onValueChange: (values) => handleInputChange("admin", "bulkThreshold", values[0]), className: "py-4" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Number of items required to trigger bulk operation confirmation dialogs" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "defaultHealthValue", children: "Default Health Value" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [displaySettings.admin.defaultHealthValue, "%"] })] }), _jsx(Slider, { id: "defaultHealthValue", min: 50, max: 100, step: 5, value: [displaySettings.admin.defaultHealthValue], onValueChange: (values) => handleInputChange("admin", "defaultHealthValue", values[0]), className: "py-4" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Default health value for new user accounts" })] })] })] }) })] }), isDirty && (_jsxs("div", { className: "fixed bottom-8 right-8 flex items-center shadow-lg bg-primary text-primary-foreground px-4 py-2 rounded-lg border border-primary/20", children: [_jsx("span", { className: "mr-2 text-sm", children: "Unsaved changes" }), _jsxs(Button, { size: "sm", onClick: handleSaveSettings, disabled: updateSettingsMutation.isPending, children: [updateSettingsMutation.isPending ? (_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" })) : (_jsx(Check, { className: "w-4 h-4 mr-2" })), "Save"] })] }))] }));
}
