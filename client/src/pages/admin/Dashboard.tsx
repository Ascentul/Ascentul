import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  BarChart,
  Users,
  Building,
  Settings,
  Activity,
  BookOpen,
  CreditCard,
  HelpCircle,
  FileText,
  RefreshCw,
  TrendingUp,
  DollarSign,
  User,
  Plus,
  Search,
  FileDown,
  MoreHorizontal,
  FileEdit,
  Bell,
} from 'lucide-react';
// Import the components directly
// This avoid the need for separate imports

export default function AdminDashboard() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if not admin
  if (user && user.userType !== 'university_admin' && user.id !== 1) {
    setLocation('/dashboard');
    return null;
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-muted/40 border-r p-4">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-primary">Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground">CareerTracker.io</p>
        </div>

        <nav className="space-y-1">
          <SidebarItem 
            icon={<BarChart className="h-5 w-5" />}
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
          />
          <SidebarItem 
            icon={<Users className="h-5 w-5" />}
            label="User Management" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')}
          />
          <SidebarItem 
            icon={<Building className="h-5 w-5" />}
            label="Universities" 
            active={activeTab === 'universities'} 
            onClick={() => setActiveTab('universities')}
          />
          <SidebarItem 
            icon={<Activity className="h-5 w-5" />}
            label="Analytics" 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')}
          />
          <SidebarItem 
            icon={<BookOpen className="h-5 w-5" />}
            label="Content" 
            active={activeTab === 'content'} 
            onClick={() => setActiveTab('content')}
          />
          <SidebarItem 
            icon={<CreditCard className="h-5 w-5" />}
            label="Billing" 
            active={activeTab === 'billing'} 
            onClick={() => setActiveTab('billing')}
          />
          <SidebarItem 
            icon={<Settings className="h-5 w-5" />}
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
          />
          <SidebarItem 
            icon={<HelpCircle className="h-5 w-5" />}
            label="Help" 
            active={activeTab === 'help'} 
            onClick={() => setActiveTab('help')}
          />
        </nav>

        <div className="mt-auto pt-4">
          <Link href="/dashboard">
            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border bg-background hover:bg-accent transition-colors">
              <span>Exit Admin Mode</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="flex md:hidden items-center border-b p-4">
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
          
          {/* Mobile dropdown menu would go here */}
        </header>

        {/* Content area */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="md:hidden grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              {/* Inline AdminOverview component */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Admin Overview</h2>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Export Report
                    </Button>
                    <Button size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Data
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Users</p>
                          <h3 className="text-2xl font-bold mt-1">1,247</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex items-center mt-4 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                        <span className="text-green-500 font-medium">+12%</span>
                        <span className="text-muted-foreground ml-1">since last month</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                          <h3 className="text-2xl font-bold mt-1">845</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex items-center mt-4 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                        <span className="text-green-500 font-medium">+7%</span>
                        <span className="text-muted-foreground ml-1">since last month</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Universities</p>
                          <h3 className="text-2xl font-bold mt-1">24</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex items-center mt-4 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                        <span className="text-green-500 font-medium">+2</span>
                        <span className="text-muted-foreground ml-1">new this month</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Revenue (Monthly)</p>
                          <h3 className="text-2xl font-bold mt-1">$28,459</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex items-center mt-4 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                        <span className="text-green-500 font-medium">+18%</span>
                        <span className="text-muted-foreground ml-1">since last month</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 mt-6 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>User Growth</CardTitle>
                      <CardDescription>
                        New user registrations over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">Chart visualization would go here</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Top Universities</CardTitle>
                      <CardDescription>
                        By number of active students
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium mr-3">
                              M
                            </div>
                            <div>
                              <p className="font-medium">MIT</p>
                              <p className="text-sm text-muted-foreground">Massachusetts, USA</p>
                            </div>
                          </div>
                          <p className="font-medium">287 students</p>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-medium mr-3">
                              S
                            </div>
                            <div>
                              <p className="font-medium">Stanford</p>
                              <p className="text-sm text-muted-foreground">California, USA</p>
                            </div>
                          </div>
                          <p className="font-medium">245 students</p>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium mr-3">
                              H
                            </div>
                            <div>
                              <p className="font-medium">Harvard</p>
                              <p className="text-sm text-muted-foreground">Massachusetts, USA</p>
                            </div>
                          </div>
                          <p className="font-medium">214 students</p>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium mr-3">
                              B
                            </div>
                            <div>
                              <p className="font-medium">Berkeley</p>
                              <p className="text-sm text-muted-foreground">California, USA</p>
                            </div>
                          </div>
                          <p className="font-medium">198 students</p>
                        </div>
                        
                        <div className="text-center mt-2">
                          <Button variant="link" size="sm">View all universities</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Latest user actions in the system
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex">
                          <div className="mr-4">
                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-700" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">New user registration</p>
                            <p className="text-xs text-muted-foreground">Jane Cooper signed up as a new user</p>
                            <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex">
                          <div className="mr-4">
                            <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-green-700" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Subscription upgraded</p>
                            <p className="text-xs text-muted-foreground">Alex Johnson upgraded to Premium plan</p>
                            <p className="text-xs text-muted-foreground mt-1">15 minutes ago</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex">
                          <div className="mr-4">
                            <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
                              <Building className="h-5 w-5 text-amber-700" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">University added</p>
                            <p className="text-xs text-muted-foreground">University of Washington joined the platform</p>
                            <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <Button variant="link" size="sm">View all activity</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Feature Usage</CardTitle>
                      <CardDescription>
                        Most used features in the platform
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Resume Builder</span>
                            <span className="text-sm font-medium">87%</span>
                          </div>
                          <Progress value={87} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Interview Prep</span>
                            <span className="text-sm font-medium">76%</span>
                          </div>
                          <Progress value={76} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">AI Coach</span>
                            <span className="text-sm font-medium">63%</span>
                          </div>
                          <Progress value={63} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Cover Letters</span>
                            <span className="text-sm font-medium">59%</span>
                          </div>
                          <Progress value={59} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Work History</span>
                            <span className="text-sm font-medium">45%</span>
                          </div>
                          <Progress value={45} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>
                        Manage your platform efficiently
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Button className="w-full justify-start" variant="outline">
                          <Users className="mr-2 h-4 w-4" />
                          Add New User
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <Building className="mr-2 h-4 w-4" />
                          Add University
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <FileEdit className="mr-2 h-4 w-4" />
                          Edit Content
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <Bell className="mr-2 h-4 w-4" />
                          Send Notification
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Reports
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              {/* Simple wrapper for UserManagement */}
              <div>
                <h2 className="text-2xl font-bold mb-4">User Management</h2>
                <p className="text-muted-foreground mb-4">View and manage all users on the platform.</p>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                      <div className="relative w-full md:w-96">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search users..."
                          className="w-full bg-background pl-8"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline">
                          <FileDown className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add User
                        </Button>
                      </div>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">User {i + 1}</TableCell>
                              <TableCell>user{i + 1}@example.com</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {i % 3 === 0 ? 'Regular' : i % 3 === 1 ? 'University Student' : 'University Admin'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${i % 4 === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                  {i % 4 === 0 ? 'Inactive' : 'Active'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="flex items-center justify-end space-x-2 py-4">
                      <Button variant="outline" size="sm">
                        Previous
                      </Button>
                      <Button variant="outline" size="sm">
                        Next
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="universities" className="mt-0">
              <h2 className="text-2xl font-bold mb-4">Universities</h2>
              <p className="text-muted-foreground">This section is under development.</p>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <h2 className="text-2xl font-bold mb-4">Analytics</h2>
              <p className="text-muted-foreground">This section is under development.</p>
            </TabsContent>

            <TabsContent value="content" className="mt-0">
              <h2 className="text-2xl font-bold mb-4">Content Management</h2>
              <p className="text-muted-foreground">This section is under development.</p>
            </TabsContent>

            <TabsContent value="billing" className="mt-0">
              <h2 className="text-2xl font-bold mb-4">Billing</h2>
              <p className="text-muted-foreground">This section is under development.</p>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <h2 className="text-2xl font-bold mb-4">Settings</h2>
              <p className="text-muted-foreground">This section is under development.</p>
            </TabsContent>

            <TabsContent value="help" className="mt-0">
              <h2 className="text-2xl font-bold mb-4">Help & Documentation</h2>
              <p className="text-muted-foreground">This section is under development.</p>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// Sidebar item component
function SidebarItem({ 
  icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        active 
          ? 'bg-primary text-primary-foreground' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </button>
  );
}