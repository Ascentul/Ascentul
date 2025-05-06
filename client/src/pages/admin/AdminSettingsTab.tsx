import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Save, AlertTriangle, Shield, Upload, Globe, Mail, Key, Users, Building, Bell } from 'lucide-react';

// Default settings structure
type PlatformSettings = {
  general: {
    platformName: string;
    supportEmail: string;
    defaultTimezone: string;
    maintenanceMode: boolean;
  };
  features: {
    enableReviews: boolean;
    enableAICoach: boolean;
    enableResumeStudio: boolean;
    enableVoicePractice: boolean;
    enableCareerGoals: boolean;
  };
  userRoles: {
    defaultUserRole: string;
    freeFeatures: string[];
    proFeatures: string[];
  };
  university: {
    defaultSeatCount: number;
    trialDurationDays: number;
    defaultAdminPermissions: string[];
  };
  email: {
    notifyOnReviews: boolean;
    notifyOnSignups: boolean;
    notifyOnErrors: boolean;
    defaultReplyToEmail: string;
    enableMarketingEmails: boolean;
  };
  api: {
    openaiModel: string;
    maxTokensPerRequest: number;
    webhookUrls: string[];
  };
  security: {
    requireMfaForAdmins: boolean;
    sessionTimeoutMinutes: number;
    allowedIpAddresses: string[];
  };
};

// Component for settings section
const SettingsSection = ({ 
  title, 
  description, 
  children,
  onSave,
  saving = false
}: { 
  title: string;
  description: string;
  children: React.ReactNode;
  onSave: () => void;
  saving?: boolean;
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function AdminSettingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch settings
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching settings:', error);
        // Return default settings if the API call fails
        return defaultSettings;
      }
    }
  });

  // State for form values (initialized with settings or defaults)
  const [formValues, setFormValues] = useState<PlatformSettings | null>(null);
  const [activeSection, setActiveSection] = useState('general');
  
  // Set form values when settings are loaded
  useState(() => {
    if (settings && !formValues) {
      setFormValues(settings);
    }
  });

  // Track which sections are being saved
  const [savingSections, setSavingSections] = useState<Record<string, boolean>>({
    general: false,
    features: false,
    userRoles: false,
    university: false,
    email: false,
    api: false,
    security: false,
  });

  // Mutation to update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { section: string; values: any }) => {
      setSavingSections(prev => ({ ...prev, [data.section]: true }));
      
      const response = await apiRequest('PUT', `/api/settings/${data.section}`, data.values);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Settings updated',
        description: `${variables.section.charAt(0).toUpperCase() + variables.section.slice(1)} settings have been updated successfully.`,
      });
      setSavingSections(prev => ({ ...prev, [variables.section]: false }));
    },
    onError: (error: Error, variables) => {
      toast({
        title: 'Error updating settings',
        description: error.message,
        variant: 'destructive',
      });
      setSavingSections(prev => ({ ...prev, [variables.section]: false }));
    },
  });

  // Handle form field changes
  const handleChange = (section: string, field: string, value: any) => {
    if (!formValues) return;
    
    setFormValues({
      ...formValues,
      [section]: {
        ...formValues[section as keyof PlatformSettings],
        [field]: value
      }
    });
  };

  // Handle nested field changes (for arrays and objects)
  const handleNestedChange = (section: string, field: string, subField: string, value: any) => {
    if (!formValues) return;
    
    setFormValues({
      ...formValues,
      [section]: {
        ...formValues[section as keyof PlatformSettings],
        [field]: {
          ...formValues[section as keyof PlatformSettings][field],
          [subField]: value
        }
      }
    });
  };

  // Handle saving a section
  const handleSaveSection = (section: string) => {
    if (!formValues) return;
    
    updateSettingsMutation.mutate({
      section,
      values: formValues[section as keyof PlatformSettings]
    });
  };

  // Default settings in case the API is not yet implemented
  const defaultSettings: PlatformSettings = {
    general: {
      platformName: 'Ascentul',
      supportEmail: 'support@ascentul.io',
      defaultTimezone: 'America/New_York',
      maintenanceMode: false,
    },
    features: {
      enableReviews: true,
      enableAICoach: true,
      enableResumeStudio: true,
      enableVoicePractice: true,
      enableCareerGoals: true,
    },
    userRoles: {
      defaultUserRole: 'regular',
      freeFeatures: ['basic_resume', 'job_search', 'application_tracking'],
      proFeatures: ['ai_coach', 'voice_practice', 'advanced_analytics'],
    },
    university: {
      defaultSeatCount: 50,
      trialDurationDays: 30,
      defaultAdminPermissions: ['manage_students', 'view_analytics'],
    },
    email: {
      notifyOnReviews: true,
      notifyOnSignups: true,
      notifyOnErrors: true,
      defaultReplyToEmail: 'no-reply@ascentul.io',
      enableMarketingEmails: true,
    },
    api: {
      openaiModel: 'gpt-4o',
      maxTokensPerRequest: 4096,
      webhookUrls: [],
    },
    security: {
      requireMfaForAdmins: false,
      sessionTimeoutMinutes: 120,
      allowedIpAddresses: [],
    },
  };

  // Use default settings if loading or there's an error
  const displayValues = formValues || defaultSettings;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to load settings</h3>
        <p className="text-muted-foreground">There was an error loading the platform settings.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/settings'] })}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4">
          <Tabs 
            orientation="vertical" 
            value={activeSection} 
            onValueChange={setActiveSection}
            className="w-full"
          >
            <TabsList className="flex flex-col h-auto w-full bg-muted/50 p-1 rounded-md">
              <TabsTrigger 
                value="general" 
                className="flex items-center justify-start px-4 py-2 w-full"
              >
                <Globe className="h-4 w-4 mr-2" />
                <span>Platform Settings</span>
              </TabsTrigger>
              <TabsTrigger 
                value="features" 
                className="flex items-center justify-start px-4 py-2 w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                <span>Feature Toggles</span>
              </TabsTrigger>
              <TabsTrigger 
                value="userRoles" 
                className="flex items-center justify-start px-4 py-2 w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                <span>User & Role Config</span>
              </TabsTrigger>
              <TabsTrigger 
                value="university" 
                className="flex items-center justify-start px-4 py-2 w-full"
              >
                <Building className="h-4 w-4 mr-2" />
                <span>University Defaults</span>
              </TabsTrigger>
              <TabsTrigger 
                value="email" 
                className="flex items-center justify-start px-4 py-2 w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                <span>Email Settings</span>
              </TabsTrigger>
              <TabsTrigger 
                value="api" 
                className="flex items-center justify-start px-4 py-2 w-full"
              >
                <Key className="h-4 w-4 mr-2" />
                <span>API Settings</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="flex items-center justify-start px-4 py-2 w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                <span>Security</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="md:w-3/4">
          <TabsContent value="general" className="mt-0">
            <SettingsSection
              title="Platform Settings"
              description="Configure global platform settings and branding"
              onSave={() => handleSaveSection('general')}
              saving={savingSections.general}
            >
              <div className="grid gap-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={displayValues.general.platformName}
                    onChange={(e) => handleChange('general', 'platformName', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={displayValues.general.supportEmail}
                    onChange={(e) => handleChange('general', 'supportEmail', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="defaultTimezone">Default Timezone</Label>
                  <Select 
                    value={displayValues.general.defaultTimezone}
                    onValueChange={(value) => handleChange('general', 'defaultTimezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="maintenanceMode"
                    checked={displayValues.general.maintenanceMode}
                    onCheckedChange={(checked) => handleChange('general', 'maintenanceMode', checked)}
                  />
                  <Label htmlFor="maintenanceMode">Enable Maintenance Mode</Label>
                </div>
                
                <div className="text-sm text-muted-foreground mt-2">
                  <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                  Enabling maintenance mode will prevent users from accessing the platform.
                </div>
              </div>
            </SettingsSection>
          </TabsContent>
          
          <TabsContent value="features" className="mt-0">
            <SettingsSection
              title="Feature Toggles"
              description="Enable or disable platform features"
              onSave={() => handleSaveSection('features')}
              saving={savingSections.features}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="enableReviews" className="font-medium">Customer Reviews</Label>
                    <p className="text-sm text-muted-foreground">Allow users to submit reviews about their experience</p>
                  </div>
                  <Switch
                    id="enableReviews"
                    checked={displayValues.features.enableReviews}
                    onCheckedChange={(checked) => handleChange('features', 'enableReviews', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="enableAICoach" className="font-medium">AI Career Coach</Label>
                    <p className="text-sm text-muted-foreground">Enable AI-powered career coaching features</p>
                  </div>
                  <Switch
                    id="enableAICoach"
                    checked={displayValues.features.enableAICoach}
                    onCheckedChange={(checked) => handleChange('features', 'enableAICoach', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="enableResumeStudio" className="font-medium">Resume Studio</Label>
                    <p className="text-sm text-muted-foreground">Allow users to create and manage resumes</p>
                  </div>
                  <Switch
                    id="enableResumeStudio"
                    checked={displayValues.features.enableResumeStudio}
                    onCheckedChange={(checked) => handleChange('features', 'enableResumeStudio', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="enableVoicePractice" className="font-medium">Voice Practice</Label>
                    <p className="text-sm text-muted-foreground">Enable voice-based interview practice features</p>
                  </div>
                  <Switch
                    id="enableVoicePractice"
                    checked={displayValues.features.enableVoicePractice}
                    onCheckedChange={(checked) => handleChange('features', 'enableVoicePractice', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="enableCareerGoals" className="font-medium">Career Goals</Label>
                    <p className="text-sm text-muted-foreground">Allow users to set and track career goals</p>
                  </div>
                  <Switch
                    id="enableCareerGoals"
                    checked={displayValues.features.enableCareerGoals}
                    onCheckedChange={(checked) => handleChange('features', 'enableCareerGoals', checked)}
                  />
                </div>
              </div>
            </SettingsSection>
          </TabsContent>
          
          <TabsContent value="userRoles" className="mt-0">
            <SettingsSection
              title="User & Role Configuration"
              description="Configure user roles and permissions"
              onSave={() => handleSaveSection('userRoles')}
              saving={savingSections.userRoles}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="defaultUserRole">Default User Role</Label>
                  <Select
                    value={displayValues.userRoles.defaultUserRole}
                    onValueChange={(value) => handleChange('userRoles', 'defaultUserRole', value)}
                  >
                    <SelectTrigger id="defaultUserRole">
                      <SelectValue placeholder="Select default role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="university_student">University Student</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 gap-2 mt-4">
                  <Label htmlFor="freeFeatures">Free Tier Features</Label>
                  <p className="text-sm text-muted-foreground mb-2">Enter features separated by commas</p>
                  <Textarea
                    id="freeFeatures"
                    value={displayValues.userRoles.freeFeatures.join(', ')}
                    onChange={(e) => handleChange('userRoles', 'freeFeatures', e.target.value.split(',').map(item => item.trim()))}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2 mt-4">
                  <Label htmlFor="proFeatures">Pro Tier Features</Label>
                  <p className="text-sm text-muted-foreground mb-2">Enter features separated by commas</p>
                  <Textarea
                    id="proFeatures"
                    value={displayValues.userRoles.proFeatures.join(', ')}
                    onChange={(e) => handleChange('userRoles', 'proFeatures', e.target.value.split(',').map(item => item.trim()))}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </SettingsSection>
          </TabsContent>
          
          <TabsContent value="university" className="mt-0">
            <SettingsSection
              title="University Plan Defaults"
              description="Configure default settings for university plans"
              onSave={() => handleSaveSection('university')}
              saving={savingSections.university}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="defaultSeatCount">Default Seat Count</Label>
                  <Input
                    id="defaultSeatCount"
                    type="number"
                    min={1}
                    value={displayValues.university.defaultSeatCount}
                    onChange={(e) => handleChange('university', 'defaultSeatCount', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2 mt-4">
                  <Label htmlFor="trialDurationDays">Trial Duration (Days)</Label>
                  <Input
                    id="trialDurationDays"
                    type="number"
                    min={0}
                    value={displayValues.university.trialDurationDays}
                    onChange={(e) => handleChange('university', 'trialDurationDays', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2 mt-4">
                  <Label htmlFor="defaultAdminPermissions">Default Admin Permissions</Label>
                  <p className="text-sm text-muted-foreground mb-2">Enter permissions separated by commas</p>
                  <Textarea
                    id="defaultAdminPermissions"
                    value={displayValues.university.defaultAdminPermissions.join(', ')}
                    onChange={(e) => handleChange('university', 'defaultAdminPermissions', e.target.value.split(',').map(item => item.trim()))}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </SettingsSection>
          </TabsContent>
          
          <TabsContent value="email" className="mt-0">
            <SettingsSection
              title="Email & Notification Settings"
              description="Configure email notifications and settings"
              onSave={() => handleSaveSection('email')}
              saving={savingSections.email}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="defaultReplyToEmail">Default Reply-To Email</Label>
                  <Input
                    id="defaultReplyToEmail"
                    type="email"
                    value={displayValues.email.defaultReplyToEmail}
                    onChange={(e) => handleChange('email', 'defaultReplyToEmail', e.target.value)}
                  />
                </div>
                
                <div className="flex items-center justify-between py-2 mt-4">
                  <div>
                    <Label htmlFor="notifyOnReviews" className="font-medium">Notify on New Reviews</Label>
                    <p className="text-sm text-muted-foreground">Receive email when users submit new reviews</p>
                  </div>
                  <Switch
                    id="notifyOnReviews"
                    checked={displayValues.email.notifyOnReviews}
                    onCheckedChange={(checked) => handleChange('email', 'notifyOnReviews', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="notifyOnSignups" className="font-medium">Notify on New Signups</Label>
                    <p className="text-sm text-muted-foreground">Receive email when new users register</p>
                  </div>
                  <Switch
                    id="notifyOnSignups"
                    checked={displayValues.email.notifyOnSignups}
                    onCheckedChange={(checked) => handleChange('email', 'notifyOnSignups', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="notifyOnErrors" className="font-medium">Notify on System Errors</Label>
                    <p className="text-sm text-muted-foreground">Receive email on critical system errors</p>
                  </div>
                  <Switch
                    id="notifyOnErrors"
                    checked={displayValues.email.notifyOnErrors}
                    onCheckedChange={(checked) => handleChange('email', 'notifyOnErrors', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="enableMarketingEmails" className="font-medium">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">Enable automated marketing email sequences</p>
                  </div>
                  <Switch
                    id="enableMarketingEmails"
                    checked={displayValues.email.enableMarketingEmails}
                    onCheckedChange={(checked) => handleChange('email', 'enableMarketingEmails', checked)}
                  />
                </div>
              </div>
            </SettingsSection>
          </TabsContent>
          
          <TabsContent value="api" className="mt-0">
            <SettingsSection
              title="API & System Settings"
              description="Configure API keys and system defaults"
              onSave={() => handleSaveSection('api')}
              saving={savingSections.api}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="openaiModel">Default OpenAI Model</Label>
                  <Select
                    value={displayValues.api.openaiModel}
                    onValueChange={(value) => handleChange('api', 'openaiModel', value)}
                  >
                    <SelectTrigger id="openaiModel">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 gap-2 mt-4">
                  <Label htmlFor="maxTokensPerRequest">Max Tokens Per Request</Label>
                  <Input
                    id="maxTokensPerRequest"
                    type="number"
                    min={1}
                    max={16384}
                    value={displayValues.api.maxTokensPerRequest}
                    onChange={(e) => handleChange('api', 'maxTokensPerRequest', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2 mt-4">
                  <Label htmlFor="webhookUrls">Webhook URLs</Label>
                  <p className="text-sm text-muted-foreground mb-2">Enter URLs separated by new lines</p>
                  <Textarea
                    id="webhookUrls"
                    value={displayValues.api.webhookUrls.join('\n')}
                    onChange={(e) => handleChange('api', 'webhookUrls', e.target.value.split('\n').map(url => url.trim()).filter(url => url))}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="rounded-md bg-muted p-4 mt-4">
                  <div className="font-medium mb-2">API Keys</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage API keys in the separate section. For security reasons, API keys cannot be viewed here.
                  </p>
                  <Button variant="outline" size="sm">
                    <Key className="h-4 w-4 mr-2" />
                    Manage API Keys
                  </Button>
                </div>
              </div>
            </SettingsSection>
          </TabsContent>
          
          <TabsContent value="security" className="mt-0">
            <SettingsSection
              title="Security & Access Control"
              description="Configure security settings and access controls"
              onSave={() => handleSaveSection('security')}
              saving={savingSections.security}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="requireMfaForAdmins" className="font-medium">Require MFA for Admins</Label>
                    <p className="text-sm text-muted-foreground">Force admin accounts to use Multi-Factor Authentication</p>
                  </div>
                  <Switch
                    id="requireMfaForAdmins"
                    checked={displayValues.security.requireMfaForAdmins}
                    onCheckedChange={(checked) => handleChange('security', 'requireMfaForAdmins', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 gap-2 mt-4">
                  <Label htmlFor="sessionTimeoutMinutes">Session Timeout (Minutes)</Label>
                  <Input
                    id="sessionTimeoutMinutes"
                    type="number"
                    min={5}
                    max={1440}
                    value={displayValues.security.sessionTimeoutMinutes}
                    onChange={(e) => handleChange('security', 'sessionTimeoutMinutes', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Time in minutes before inactive users are logged out
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-2 mt-4">
                  <Label htmlFor="allowedIpAddresses">IP Allowlist</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Enter IP addresses or CIDR blocks, one per line. Leave empty to allow all.
                  </p>
                  <Textarea
                    id="allowedIpAddresses"
                    value={displayValues.security.allowedIpAddresses.join('\n')}
                    onChange={(e) => handleChange('security', 'allowedIpAddresses', e.target.value.split('\n').map(ip => ip.trim()).filter(ip => ip))}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="rounded-md bg-amber-50 border border-amber-200 p-4 mt-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800">Security Warning</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Changes to security settings may affect all users and may require system restart.
                        Make sure you understand the implications before saving changes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SettingsSection>
          </TabsContent>
        </div>
      </div>
    </div>
  );
}