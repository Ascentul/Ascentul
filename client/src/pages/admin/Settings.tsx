import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminApiClient } from '@/lib/adminApiClient';
import { adminEndpoints } from '@/config/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export function Settings() {
  const { toast } = useToast();
  const [systemSettings, setSystemSettings] = useState({
    maintenance: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    defaultUserRole: 'regular',
    systemEmailAddress: 'noreply@careertracker.io',
    maxUploadSize: 5,
    sessionTimeout: 60,
    enableCaching: true,
    debugMode: false,
  });
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: typeof systemSettings) => 
      adminApiClient.updateSystemConfig(settings),
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'System settings have been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [adminEndpoints.systemConfig] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update settings',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Handle form changes
  const handleChange = (key: keyof typeof systemSettings, value: any) => {
    setSystemSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(systemSettings);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <Tabs defaultValue="system">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="customization">Customization</TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit}>
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Manage global system settings and configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Put the system in maintenance mode to prevent user access
                    </p>
                  </div>
                  <Switch
                    id="maintenance"
                    checked={systemSettings.maintenance}
                    onCheckedChange={(checked) => handleChange('maintenance', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="registrationEnabled">Enable Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register on the platform
                    </p>
                  </div>
                  <Switch
                    id="registrationEnabled"
                    checked={systemSettings.registrationEnabled}
                    onCheckedChange={(checked) => handleChange('registrationEnabled', checked)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="systemEmailAddress">System Email Address</Label>
                  <Input
                    id="systemEmailAddress"
                    type="email"
                    value={systemSettings.systemEmailAddress}
                    onChange={(e) => handleChange('systemEmailAddress', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Email address used for system notifications
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableCaching">Enable Caching</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable caching for improved performance
                    </p>
                  </div>
                  <Switch
                    id="enableCaching"
                    checked={systemSettings.enableCaching}
                    onCheckedChange={(checked) => handleChange('enableCaching', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="debugMode">Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable debug mode for detailed logging (not recommended in production)
                    </p>
                  </div>
                  <Switch
                    id="debugMode"
                    checked={systemSettings.debugMode}
                    onCheckedChange={(checked) => handleChange('debugMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security settings and user access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailVerificationRequired">Email Verification Required</Label>
                    <p className="text-sm text-muted-foreground">
                      Require users to verify their email address before accessing the platform
                    </p>
                  </div>
                  <Switch
                    id="emailVerificationRequired"
                    checked={systemSettings.emailVerificationRequired}
                    onCheckedChange={(checked) => handleChange('emailVerificationRequired', checked)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="defaultUserRole">Default User Role</Label>
                  <Select
                    value={systemSettings.defaultUserRole}
                    onValueChange={(value) => handleChange('defaultUserRole', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular User</SelectItem>
                      <SelectItem value="premium">Premium User</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Default role assigned to new users
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min={5}
                    max={1440}
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Time in minutes before an inactive user session expires
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customization Settings</CardTitle>
                <CardDescription>
                  Customize the appearance and behavior of the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
                  <Input
                    id="maxUploadSize"
                    type="number"
                    min={1}
                    max={100}
                    value={systemSettings.maxUploadSize}
                    onChange={(e) => handleChange('maxUploadSize', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum file upload size in megabytes
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="themeColor">Theme Color</Label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-[#0C29AB] border border-gray-200"
                      onClick={() => {/* Update theme color */}}
                    />
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-[#8884D8] border border-gray-200"
                      onClick={() => {/* Update theme color */}}
                    />
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-[#00C49F] border border-gray-200"
                      onClick={() => {/* Update theme color */}}
                    />
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-[#FFBB28] border border-gray-200"
                      onClick={() => {/* Update theme color */}}
                    />
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-[#FF8042] border border-gray-200"
                      onClick={() => {/* Update theme color */}}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}