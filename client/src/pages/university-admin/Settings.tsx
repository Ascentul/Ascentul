import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/useUserData';
import { 
  AlertCircle, 
  Check, 
  Trash2, 
  Upload, 
  Lock, 
  Globe, 
  Mail, 
  BellRing, 
  Users,
  Building,
  GraduationCap
} from 'lucide-react';

// Form schema for university profile
const universityProfileSchema = z.object({
  universityName: z.string().min(1, 'University name is required'),
  description: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  contactEmail: z.string().email('Please enter a valid email address'),
  logo: z.any().optional(),
  primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Please enter a valid hex color code'),
  secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Please enter a valid hex color code').optional(),
});

// Schema for integration settings
const integrationSettingsSchema = z.object({
  lmsEnabled: z.boolean().default(false),
  lmsApiKey: z.string().optional(),
  lmsUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  ssoEnabled: z.boolean().default(false),
  ssoProvider: z.string().optional(),
  ssoClientId: z.string().optional(),
  ssoClientSecret: z.string().optional(),
});

// Schema for notification settings
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  studentActivityDigest: z.boolean().default(true),
  usageReports: z.boolean().default(true),
  sendCopyToAdmin: z.boolean().default(false),
  adminEmail: z.string().email('Please enter a valid email address').optional(),
});

export default function Settings() {
  const { toast } = useToast();
  const { user } = useUser();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // University profile form
  const profileForm = useForm<z.infer<typeof universityProfileSchema>>({
    resolver: zodResolver(universityProfileSchema),
    defaultValues: {
      universityName: user?.universityName || 'Stanford University',
      description: 'Stanford University is a leading research and teaching institution located in Stanford, California. Established in 1885, Stanford is dedicated to providing an innovative and transformational education that prepares students to be creative citizens and leaders.',
      website: 'https://www.stanford.edu',
      contactEmail: 'career-services@stanford.edu',
      primaryColor: '#8C1515',
      secondaryColor: '#2F2424',
    },
  });

  // Integration settings form
  const integrationForm = useForm<z.infer<typeof integrationSettingsSchema>>({
    resolver: zodResolver(integrationSettingsSchema),
    defaultValues: {
      lmsEnabled: true,
      lmsApiKey: 'lms_api_key_123456789',
      lmsUrl: 'https://canvas.stanford.edu',
      ssoEnabled: true,
      ssoProvider: 'SAML',
      ssoClientId: 'stanford_sso_client_123',
      ssoClientSecret: '••••••••••••••••',
    },
  });

  // Notification settings form
  const notificationForm = useForm<z.infer<typeof notificationSettingsSchema>>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      studentActivityDigest: true,
      usageReports: true,
      sendCopyToAdmin: true,
      adminEmail: 'admin@stanford.edu',
    },
  });

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission handlers
  const onProfileSubmit = (data: z.infer<typeof universityProfileSchema>) => {
    console.log('Profile data:', data);
    toast({
      title: 'Profile updated',
      description: 'University profile settings have been saved.',
    });
  };

  const onIntegrationSubmit = (data: z.infer<typeof integrationSettingsSchema>) => {
    console.log('Integration data:', data);
    toast({
      title: 'Integration settings updated',
      description: 'Integration settings have been saved.',
    });
  };

  const onNotificationSubmit = (data: z.infer<typeof notificationSettingsSchema>) => {
    console.log('Notification data:', data);
    toast({
      title: 'Notification settings updated',
      description: 'Notification preferences have been saved.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">University Settings</h1>
        <p className="text-muted-foreground">
          Manage your university's profile, integrations, and notification preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center">
            <Building className="mr-2 h-4 w-4" />
            University Profile
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <BellRing className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* University Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>University Profile</CardTitle>
              <CardDescription>
                Manage your university's profile information and branding.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* University Name */}
                    <FormField
                      control={profileForm.control}
                      name="universityName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>University Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter university name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Contact Email */}
                    <FormField
                      control={profileForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Website */}
                    <FormField
                      control={profileForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.example.edu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Logo Upload */}
                    <div className="space-y-2">
                      <FormLabel>University Logo</FormLabel>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                          {logoPreview ? (
                            <img src={logoPreview} alt="University logo" className="w-full h-full object-contain" />
                          ) : (
                            <GraduationCap className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <Button type="button" variant="outline" size="sm" asChild>
                            <label className="cursor-pointer">
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Logo
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleLogoUpload}
                              />
                            </label>
                          </Button>
                          <FormDescription className="text-xs mt-1">
                            PNG, JPG or SVG (max. 2MB)
                          </FormDescription>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* University Description */}
                  <FormField
                    control={profileForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter a brief description of your university"
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Color Theme */}
                  <div className="space-y-2">
                    <FormLabel>Brand Colors</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border" 
                                style={{ backgroundColor: field.value }}
                              />
                              <FormControl>
                                <Input placeholder="#000000" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>Primary Color</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border" 
                                style={{ backgroundColor: field.value }}
                              />
                              <FormControl>
                                <Input placeholder="#000000" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>Secondary Color</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button type="submit">Save University Profile</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LMS Integration</CardTitle>
              <CardDescription>
                Connect with your Learning Management System (Canvas, Blackboard, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...integrationForm}>
                <form onSubmit={integrationForm.handleSubmit(onIntegrationSubmit)} className="space-y-6">
                  <FormField
                    control={integrationForm.control}
                    name="lmsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable LMS Integration</FormLabel>
                          <FormDescription>
                            Sync student data with your Learning Management System
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {integrationForm.watch('lmsEnabled') && (
                    <div className="space-y-4">
                      <FormField
                        control={integrationForm.control}
                        name="lmsUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LMS URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://canvas.yourschool.edu" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={integrationForm.control}
                        name="lmsApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LMS API Key</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter API key" {...field} />
                            </FormControl>
                            <FormDescription>
                              This key will be used to authenticate with your LMS
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={integrationForm.control}
                    name="ssoEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Single Sign-On</FormLabel>
                          <FormDescription>
                            Allow students to login with your university's authentication system
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {integrationForm.watch('ssoEnabled') && (
                    <div className="space-y-4">
                      <FormField
                        control={integrationForm.control}
                        name="ssoProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SSO Provider</FormLabel>
                            <FormControl>
                              <Input placeholder="SAML, OAuth, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={integrationForm.control}
                          name="ssoClientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client ID</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter client ID" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={integrationForm.control}
                          name="ssoClientSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client Secret</FormLabel>
                              <FormControl>
                                <div className="flex">
                                  <Input
                                    type="password"
                                    placeholder="••••••••••••••••"
                                    {...field}
                                    className="rounded-r-none"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-l-none"
                                  >
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <Button type="submit">Save Integration Settings</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage email notifications and reports for your university
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive email notifications about important updates
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="studentActivityDigest"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Student Activity Digest</FormLabel>
                          <FormDescription>
                            Receive weekly summaries of student activity
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="usageReports"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Monthly Usage Reports</FormLabel>
                          <FormDescription>
                            Receive monthly reports on platform usage and student engagement
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="sendCopyToAdmin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Send Copy to Administrator</FormLabel>
                          <FormDescription>
                            Send a copy of all notifications to the administrator email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {notificationForm.watch('sendCopyToAdmin') && (
                    <FormField
                      control={notificationForm.control}
                      name="adminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Administrator Email</FormLabel>
                          <FormControl>
                            <Input placeholder="admin@example.edu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button type="submit">Save Notification Settings</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}