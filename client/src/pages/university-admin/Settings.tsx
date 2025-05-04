import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/useUserData';
import { 
  Settings, 
  Upload, 
  Shield, 
  Bell, 
  Palette, 
  Mail, 
  Key, 
  Users, 
  School, 
  CreditCard,
  Calendar
} from 'lucide-react';

export default function UniversitySettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  
  // University profile state
  const [universityName, setUniversityName] = useState(user?.universityName || 'Demo University');
  const [websiteUrl, setWebsiteUrl] = useState('https://university.edu');
  const [description, setDescription] = useState('A leading institution dedicated to preparing students for successful careers in a rapidly evolving global marketplace.');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1333c2');
  const [isSaving, setIsSaving] = useState(false);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState({
    studentActivity: true,
    weeklyReports: true,
    systemUpdates: true,
    accountAlerts: true,
  });
  
  // License information
  const licenseInfo = {
    plan: 'Enterprise',
    seatsAllocated: 150,
    contractStart: '2024-09-01',
    contractEnd: '2025-08-31',
    contactEmail: 'licensing@ascentul.com',
    accountManager: 'Sarah Johnson',
  };
  
  // Handle saving university profile
  const handleSaveProfile = () => {
    setIsSaving(true);
    
    // Simulate API call to save university profile
    setTimeout(() => {
      setIsSaving(false);
      
      toast({
        title: 'Settings saved',
        description: 'Your university profile has been updated successfully.',
      });
    }, 1500);
  };
  
  // Handle file upload for university logo
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // In a real implementation, you would upload the file to a server
      // and get back a URL to the uploaded image
      
      // Simulate file upload
      toast({
        title: 'Logo uploaded',
        description: 'Your university logo has been updated.',
      });
      
      // Create a temporary URL for the preview
      const tempUrl = URL.createObjectURL(file);
      setLogoUrl(tempUrl);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">University Settings</h1>
        <p className="text-muted-foreground">
          Manage your university's profile, branding, and platform configuration.
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-card border">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white">
            <School className="h-4 w-4 mr-2" />
            University Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="admins" className="data-[state=active]:bg-white">
            <Users className="h-4 w-4 mr-2" />
            Admin Users
          </TabsTrigger>
          <TabsTrigger value="subscription" className="data-[state=active]:bg-white">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscription
          </TabsTrigger>
        </TabsList>
        
        {/* University Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>University Profile</CardTitle>
              <CardDescription>
                Manage your university's information and branding as it appears to students.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="university-name">University Name</Label>
                  <Input 
                    id="university-name" 
                    value={universityName}
                    onChange={(e) => setUniversityName(e.target.value)}
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <Label htmlFor="website">University Website</Label>
                  <Input 
                    id="website" 
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  This description will be displayed to students in the university portal.
                </p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>University Logo</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 rounded-md">
                      {logoUrl ? (
                        <AvatarImage src={logoUrl} alt="University logo" />
                      ) : (
                        <AvatarFallback className="rounded-md bg-primary/10 text-primary text-xl">
                          {universityName.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        id="logo-upload"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        className="mb-2"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG or SVG, recommended size 512x512px
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="primary-color">Brand Color</Label>
                  <div className="flex gap-2">
                    <div 
                      className="h-10 w-10 rounded border"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <Input 
                      id="primary-color" 
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full h-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This color will be used as the primary accent throughout the platform.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Student Portal Features</Label>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Resume Studio</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow students to create and edit resumes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>AI Coach</Label>
                      <p className="text-sm text-muted-foreground">
                        Provide AI-powered career guidance and interview practice
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Career Path Explorer</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable exploration of potential career paths
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Job Application Tracker</Label>
                      <p className="text-sm text-muted-foreground">
                        Track job applications and interview progress
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button 
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>Save Changes</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications about platform activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Notifications</h3>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Student Activity</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates when students complete important tasks
                      </p>
                    </div>
                    <Switch 
                      checked={emailNotifications.studentActivity}
                      onCheckedChange={(checked) => 
                        setEmailNotifications({ ...emailNotifications, studentActivity: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Weekly Summary Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Get a weekly summary of platform usage and student engagement
                      </p>
                    </div>
                    <Switch 
                      checked={emailNotifications.weeklyReports}
                      onCheckedChange={(checked) => 
                        setEmailNotifications({ ...emailNotifications, weeklyReports: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>System Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Be notified about new features and platform updates
                      </p>
                    </div>
                    <Switch 
                      checked={emailNotifications.systemUpdates}
                      onCheckedChange={(checked) => 
                        setEmailNotifications({ ...emailNotifications, systemUpdates: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Account Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts about account status and subscription changes
                      </p>
                    </div>
                    <Switch 
                      checked={emailNotifications.accountAlerts}
                      onCheckedChange={(checked) => 
                        setEmailNotifications({ ...emailNotifications, accountAlerts: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Emails</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="primary-email">Primary Contact Email</Label>
                    <Input id="primary-email" type="email" defaultValue="admin@university.edu" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="secondary-email">Secondary Contact Email (Optional)</Label>
                    <Input id="secondary-email" type="email" placeholder="Enter secondary email" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Student Notifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Allow Custom Announcements</Label>
                      <p className="text-sm text-muted-foreground">
                        Send custom announcements to all students
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Career Event Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Send reminders to students about upcoming career events
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Save Notification Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Admin Users Tab */}
        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle>Admin User Management</CardTitle>
              <CardDescription>
                Manage administrators who have access to the university portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Current Administrators</h3>
                <Button size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
              </div>
              
              <div className="border rounded-lg divide-y">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-muted-foreground">john.doe@university.edu</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Primary Admin</Badge>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                </div>
                
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>JC</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Jane Cooper</p>
                      <p className="text-sm text-muted-foreground">j.cooper@university.edu</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Admin</Badge>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                </div>
                
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>RM</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Robert Miller</p>
                      <p className="text-sm text-muted-foreground">r.miller@university.edu</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Admin</Badge>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Admin Permissions</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Student Data Access</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow admins to view and manage student data
                      </p>
                    </div>
                    <Select defaultValue="full">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select permission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Access</SelectItem>
                        <SelectItem value="limited">Limited Access</SelectItem>
                        <SelectItem value="none">No Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>University Settings</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow admins to modify university settings
                      </p>
                    </div>
                    <Select defaultValue="primary_only">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select permission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">All Admins</SelectItem>
                        <SelectItem value="primary_only">Primary Admin Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Invite Students</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow admins to invite new students to the platform
                      </p>
                    </div>
                    <Select defaultValue="full">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select permission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">All Admins</SelectItem>
                        <SelectItem value="primary_only">Primary Admin Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Save Admin Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Subscription & Billing</CardTitle>
              <CardDescription>
                Manage your subscription plan, billing information, and seat allocation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <Badge className="mb-2 bg-primary/20 text-primary border-primary/20 hover:bg-primary/20">
                      {licenseInfo.plan}
                    </Badge>
                    <h3 className="text-xl font-bold">University Enterprise Plan</h3>
                    <p className="text-muted-foreground">
                      {licenseInfo.seatsAllocated} seat license • Renewed annually
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">View Invoice</Button>
                    <Button>Manage Subscription</Button>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Contract Period</h3>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium">{new Date(licenseInfo.contractStart).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <p className="font-medium">{new Date(licenseInfo.contractEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Time Remaining</p>
                      <p className="font-medium">{Math.ceil((new Date(licenseInfo.contractEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Seat Allocation</h3>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <p className="text-sm font-medium">Used Seats</p>
                          <p className="text-sm">98 / {licenseInfo.seatsAllocated}</p>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200">
                          <div 
                            className="h-2 rounded-full bg-primary" 
                            style={{ width: `${(98 / licenseInfo.seatsAllocated) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <Button variant="link" className="p-0 h-auto text-sm">Request More Seats</Button>
                        <Button variant="link" className="p-0 h-auto text-sm">View Usage History</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Billing & Contact Information</h3>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Account Manager</p>
                      <p className="font-medium">{licenseInfo.accountManager}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Billing Contact Email</p>
                      <p className="font-medium">{licenseInfo.contactEmail}</p>
                    </div>
                  </div>
                  <Button variant="link" className="p-0 h-auto text-sm mt-4">Update Billing Information</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}