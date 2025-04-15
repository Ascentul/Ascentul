import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useUser, useIsAdminUser } from '@/lib/useUserData';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest } from '@/lib/queryClient';
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
  TrendingDown,
  DollarSign,
  User,
  Plus,
  Search,
  FileDown,
  MoreHorizontal,
  FileEdit,
  Bell,
  Download,
  Eye,
  Trash2,
} from 'lucide-react';
// Import the components directly
// This avoid the need for separate imports

// Staff user creation form component
const addStaffUserSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type AddStaffUserFormValues = z.infer<typeof addStaffUserSchema>;

function AddStaffUserDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<AddStaffUserFormValues>({
    resolver: zodResolver(addStaffUserSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
    },
  });

  const createStaffUserMutation = useMutation({
    mutationFn: async (values: AddStaffUserFormValues) => {
      const res = await apiRequest('POST', '/admin/create-staff', values);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create staff user');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Staff user created",
        description: `${data.user.name} was added as a staff member.`,
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating staff user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: AddStaffUserFormValues) {
    createStaffUserMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Staff User</DialogTitle>
          <DialogDescription>
            Create a new staff user account. Staff users will have access to the staff dashboard.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="staffuser" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Staff Member Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="staff@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Set a strong temporary password for this staff user.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createStaffUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createStaffUserMutation.isPending}
              >
                {createStaffUserMutation.isPending ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Staff User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Placeholder for SupportAnalytics component
import { SupportAnalytics } from "@/components/admin/SupportAnalytics";

function SupportSection() {
  const [source, setSource] = useState<string>("all");
  const [issueType, setIssueType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['supportTickets', source, issueType, status, search],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        ...(source !== 'all' && { source }),
        ...(issueType !== 'all' && { issueType }),
        ...(status !== 'all' && { status }),
        ...(search && { search })
      });
      const response = await fetch(`/api/admin/support-tickets?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch tickets');
      return response.json();
    }
  });

  return (
    <div className="space-y-8">
      <SupportAnalytics />
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="in-app">In-App</SelectItem>
                  <SelectItem value="marketing-site">Marketing Site</SelectItem>
                </SelectContent>
              </Select>

              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {["Bug", "Billing", "Feedback", "Feature Request", "Other"].map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {["Open", "In Progress", "Resolved"].map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Search by email or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>User Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Loading tickets...</TableCell>
                  </TableRow>
                ) : tickets?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">No tickets found</TableCell>
                  </TableRow>
                ) : (
                  tickets?.map((ticket: any) => (
                    <TableRow key={ticket.id}>
                      <TableCell>#{ticket.id}</TableCell>
                      <TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{ticket.userEmail || "Guest Submission"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ticket.source === 'in-app' ? 'In-App' : 'Marketing Site'}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.issueType}</TableCell>
                      <TableCell>{ticket.description.slice(0, 100)}...</TableCell>
                      <TableCell>
                        <Badge className={
                          ticket.status === 'Open' ? 'bg-red-100 text-red-800' :
                          ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* Handle view details */}}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


export default function AdminDashboard() {
  const { user } = useUser();
  const isAdmin = useIsAdminUser();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  // Add support tab content
  const TabContent = () => {
    switch(activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'support':
        return <SupportSection />;
      default:
        return <AdminOverview />;
    }
  };
  const [proPricing, setProPricing] = useState({
    monthly: 15,
    quarterly: 30,
    annual: 72
  });
  const [universityPricing, setUniversityPricing] = useState({
    basePrice: 10,
    bulkThreshold: 100,
    bulkDiscount: 20
  });
  const [stats] = useState({
    proMonthlyUsers: 245,
    proMonthlyRevenue: 3675,
    proAnnualUsers: 876,
    proAnnualRevenue: 63072,
    universityUsers: 1250,
    universityRevenue: 12500
  });

  const updatePricing = (interval: string, value: string) => {
    setProPricing(prev => ({
      ...prev,
      [interval]: parseFloat(value)
    }));
  };

  const updateUniversityPricing = (field: string, value: string) => {
    setUniversityPricing(prev => ({
      ...prev,
      [field]: parseFloat(value)
    }));
  };

  const savePricingChanges = () => {
    // TODO: Implement API call to save pricing changes
    toast({
      title: "Pricing Updated",
      description: "The new pricing has been saved successfully."
    });
  };

  const saveUniversityPricing = () => {
    // TODO: Implement API call to save university pricing changes
    toast({
      title: "University Pricing Updated",
      description: "The new university pricing has been saved successfully."
    });
  };

  // Redirect if not admin
  if (user && !isAdmin) {
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
            icon={<HelpCircle className="h-5 w-5" />}
            label="Support"
            active={activeTab === 'support'}
            onClick={() => setActiveTab('support')}
          /> {/* Added Support Sidebar Item */}
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
                        <AddStaffUserDialog />
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
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Universities</h2>
                    <p className="text-muted-foreground">Manage university accounts and access</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline">
                      <FileDown className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add University
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle>Active Universities</CardTitle>
                        <CardDescription>Overview of all participating institutions</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Search universities..."
                          className="w-[250px]"
                        />
                        <Select defaultValue="all">
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Universities</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>University</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>License Usage</TableHead>
                          <TableHead>Modules</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                                M
                              </div>
                              <div>
                                <p className="font-medium">MIT</p>
                                <p className="text-sm text-muted-foreground">Massachusetts, USA</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>287</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={78} className="h-2 w-20" />
                              <span className="text-sm">78%</span>
                            </div>
                          </TableCell>
                          <TableCell>42</TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">View</Button>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-medium">
                                S
                              </div>
                              <div>
                                <p className="font-medium">Stanford University</p>
                                <p className="text-sm text-muted-foreground">California, USA</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>245</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={65} className="h-2 w-20" />
                              <span className="text-sm">65%</span>
                            </div>
                          </TableCell>
                          <TableCell>38</TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">View</Button>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing 2 of 15 universities
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" disabled>Previous</Button>
                      <Button variant="outline" size="sm">Next</Button>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <FileDown className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                    <Select defaultValue="30days">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Last 7 days</SelectItem>
                        <SelectItem value="30days">Last 30 days</SelectItem>
                        <SelectItem value="90days">Last 90 days</SelectItem>
                        <SelectItem value="year">Last year</SelectItem>
                        <SelectItem value="alltime">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium">Engagement Rate</h3>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">68.7%</span>
                        <span className="ml-2 text-sm text-green-500 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          4.3%
                        </span>
                      </div>
                      <div className="h-[80px] my-4 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Chart would go here</p>
                      </div>
                      <div className="flex text-sm text-muted-foreground">
                        <div>Across <span className="font-medium text-foreground">1,247</span> users</div>
                        <div className="ml-auto">Updated today</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium">Retention Rate</h3>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">76.2%</span>
                        <span className="ml-2 text-sm text-green-500 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          2.1%
                        </span>
                      </div>
                      <div className="h-[80px] my-4 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Chart would go here</p>
                      </div>
                      <div className="flex text-sm text-muted-foreground">
                        <div>30-day retention</div>
                        <div className="ml-auto">Updated today</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium">Avg. Session Time</h3>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">12:24</span>
                        <span className="ml-2 text-sm text-green-500 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          1:08
                        </span>
                      </div>
                      <div className="h-[80px] my-4 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Chart would go here</p>
                      </div>
                      <div className="flex text-sm text-muted-foreground">
                        <div>Per active user</div>
                        <div className="ml-auto">Updated today</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium">Conversion Rate</h3>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">21.8%</span>
                        <span className="ml-2 text-sm text-red-500 flex items-center">
                          <TrendingDown className="h-4 w-4 mr-1" />
                          1.2%
                        </span>
                      </div>
                      <div className="h-[80px] my-4 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Chart would go here</p>
                      </div>
                      <div className="flex text-sm text-muted-foreground">
                        <div>Free to paid conversion</div>
                        <div className="ml-auto">Updated today</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 mb-8 md:grid-cols-2">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>User Growth by Segment</CardTitle>
                      <CardDescription>
                        Growth pattern across different user segments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Stacked area chart visualization would go here</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Feature Usage Distribution</CardTitle>
                      <CardDescription>
                        Most used platform features
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Resume Builder</span>
                            <span className="text-sm font-medium">87%</span>
                          </div>
                          <Progress value={87} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Most popular feature with 87% of users utilizing it regularly
                          </p>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Interview Prep</span>
                            <span className="text-sm font-medium">76%</span>
                          </div>
                          <Progress value={76} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Second most popular feature with strong weekly engagement
                          </p>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">AI Coach</span>
                            <span className="text-sm font-medium">63%</span>
                          </div>
                          <Progress value={63} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Gaining popularity quickly with high retention rate
                          </p>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Work History</span>
                            <span className="text-sm font-medium">45%</span>
                          </div>
                          <Progress value={45} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Used primarily by active job seekers (45% of user base)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" size="sm" className="w-full">
                        View detailed usage metrics
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Satisfaction</CardTitle>
                      <CardDescription>
                        Based on feedback surveys
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center">
                        <div className="relative h-40 w-40">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <p className="text-5xl font-bold">4.7</p>
                              <p className="text-sm text-muted-foreground">out of 5</p>
                            </div>
                          </div>
                          <div className="h-full w-full rounded-full border-8 border-primary/30">
                            <div className="h-full w-full rounded-full border-8 border-t-primary border-r-primary border-b-primary border-l-transparent" style={{ transform: 'rotate(-45deg)' }}>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 space-y-1">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                              <span className="text-sm">Very Satisfied</span>
                            </div>
                            <span className="text-sm font-medium">78%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                              <span className="text-sm">Satisfied</span>
                            </div>
                            <span className="text-sm font-medium">16%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                              <span className="text-sm">Neutral</span>
                            </div>
                            <span className="text-sm font-medium">4%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                              <span className="text-sm">Unsatisfied</span>
                            </div>
                            <span className="text-sm font-medium">2%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>User Demographics</CardTitle>
                      <CardDescription>
                        Key user segments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Age Distribution</h4>
                          <div className="flex items-center">
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
                              <div className="flex h-full">
                                <div className="bg-blue-400 h-full" style={{ width: '15%' }}></div>
                                <div className="bg-blue-500 h-full" style={{ width: '35%' }}></div>
                                <div className="bg-blue-600 h-full" style={{ width: '28%' }}></div>
                                <div className="bg-blue-700 h-full" style={{ width: '17%' }}></div>
                                <div className="bg-blue-800 h-full" style={{ width: '5%' }}></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            <span>18-24</span>
                            <span>25-34</span>
                            <span>35-44</span>
                            <span>45-54</span>
                            <span>55+</span>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-sm font-medium mb-2">User Type</h4>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="border rounded-md p-2">
                              <p className="text-2xl font-bold">64%</p>
                              <p className="text-xs text-muted-foreground">Regular</p>
                            </div>
                            <div className="border rounded-md p-2">
                              <p className="text-2xl font-bold">28%</p>
                              <p className="text-xs text-muted-foreground">University Students</p>
                            </div>
                            <div className="border rounded-md p-2">
                              <p className="text-2xl font-bold">8%</p>
                              <p className="text-xs text-muted-foreground">University Admins</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-sm font-medium mb-2">Top Locations</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">United States</span>
                              <span className="text-sm font-medium">42%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Canada</span>
                              <span className="text-sm font-medium">18%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">United Kingdom</span>
                              <span className="text-sm font-medium">14%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Australia</span>
                              <span className="text-sm font-medium">8%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Key Metrics Trends</CardTitle>
                      <CardDescription>
                        30-day performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-1">
                            <h4 className="text-sm font-medium">Daily Active Users</h4>
                            <div className="flex items-center text-sm text-green-500">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              <span>+12%</span>
                            </div>
                          </div>
                          <div className="h-[60px] flex items-center justify-center">
                            <p className="text-xs text-muted-foreground">Area chart would go here</p>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="flex justify-between mb-1">
                            <h4 className="text-sm font-medium">New Sign-ups</h4>
                            <div className="flex items-center text-sm text-green-500">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              <span>+8%</span>
                            </div>
                          </div>
                          <div className="h-[60px] flex items-center justify-center">
                            <p className="text-xs text-muted-foreground">Bar chart would go here</p>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <div className="flex justify-between mb-1">
                            <h4 className="text-sm font-medium">Premium Conversions</h4>
                            <div className="flex items-center text-sm text-red-500">
                              <TrendingDown className="h-4 w-4 mr-1" />
                              <span>-2%</span>
                            </div>
                          </div>
                          <div className="h-[60px] flex items-center justify-center">
                            <p className="text-xs text-muted-foreground">Line chart would go here</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download full report
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="mt-0">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Content Management</h2>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Import Content
                    </Button>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="learning" className="mb-6">
                  <TabsList className="mb-4">
                    <TabsTrigger value="learning">Learning Resources</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="guides">Guides & Tutorials</TabsTrigger>
                    <TabsTrigger value="faqs">FAQs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="learning">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {/* Learning resource cards */}
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <div className="aspect-video bg-muted relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <FileText className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <div className="absolute top-2 right-2">
                              <Badge variant={i % 3 === 0 ? "default" : i % 3 === 1 ? "secondary" : "outline"}>
                                {i % 3 === 0 ? "New" : i % 3 === 1 ? "Popular" : "Draft"}
                              </Badge>
                            </div>
                          </div>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">
                                {["Resume Writing Tips", "Interview Preparation", "Networking Strategies",
                                  "Career Transition Guide", "Salary Negotiation", "LinkedIn Optimization"][i]}
                              </CardTitle>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                            <CardDescription>
                              {["For beginners", "Advanced techniques", "Interactive guide",
                                "Step-by-step tutorial", "Expert strategies", "Quick tips"][i]}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between text-sm text-muted-foreground mb-4">
                              <div>Views: {[1452, 982, 2103, 764, 1289, 542][i]}</div>
                              <div>Completion: {[92, 78, 84, 65, 87, 56][i]}%</div>
                            </div>
                            <Progress value={[92, 78, 84, 65, 87, 56][i]} className="h-1 mb-4" />
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-sm">Created by Admin</div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Updated {[2, 5, 1, 7, 3, 10][i]} days ago
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="border-t px-6 py-4">
                            <div className="flex justify-between w-full">
                              <Button variant="ghost" size="sm">
                                <FileEdit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-center">
                      <Button variant="outline">Load More</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="templates">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {/* Template cards */}
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <CardTitle>
                                {["Modern Resume", "Cover Letter", "Thank You Note",
                                  "Reference List", "Professional Bio", "Job Application"][i]}
                              </CardTitle>
                              <Badge>{["Popular", "New", "Featured", "Standard", "Basic", "Premium"][i]}</Badge>
                            </div>
                            <CardDescription>
                              {i % 2 === 0 ? "Professional template" : "Creative design"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="border rounded-md aspect-[3/4] bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                              <FileText className="h-12 w-12 text-primary/20" />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Downloads: {[420, 256, 189, 344, 127, 205][i]}</span>
                              <span>Rating: {[4.8, 4.5, 4.2, 4.7, 4.1, 4.6][i]}/5</span>
                            </div>
                          </CardContent>
                          <CardFooter className="border-t px-6 py-4">
                            <div className="flex justify-between w-full">
                              <Button variant="ghost" size="sm">
                                <FileEdit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="guides">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[300px]">Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.from({ length: 8 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">
                                {["How to Ace Your Interview", "Resume Best Practices", "LinkedIn Profile Optimization",
                                  "Networking for Introverts", "Career Change Roadmap", "Remote Work Success",
                                  "Salary Negotiation Tactics", "Building a Personal Brand"][i]}
                              </TableCell>
                              <TableCell>
                                {["Interview", "Resume", "Social Media", "Networking", "Career Planning",
                                  "Remote Work", "Negotiation", "Branding"][i]}
                              </TableCell>
                              <TableCell>Admin</TableCell>
                              <TableCell>
                                <Badge variant={i % 3 === 0 ? "default" : i % 3 === 1 ? "outline" : "secondary"}>
                                  {i % 3 === 0 ? "Published" : i % 3 === 1 ? "Draft" : "Reviewing"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <FileEdit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Previous</Button>
                        <Button variant="outline" size="sm">Next</Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="faqs">
                    <Card>
                      <CardHeader>
                        <CardTitle>Frequently Asked Questions</CardTitle>
                        <CardDescription>
                          Manage questions and answers that users commonly ask
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-medium">
                                  {["How do I create a new resume?",
                                    "Can I export my data?",
                                    "How do I prepare for an interview?",
                                    "Is my data secure?",
                                    "How do I cancel my subscription?"][i]}
                                </div>
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <FileEdit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {["Go to the Resume Builder section and click 'Create New Resume'. Follow the step-by-step guide to build your professional resume.",
                                  "Yes, you can export your data in PDF, DOCX, or JSON formats from your profile settings.",
                                  "Our Interview Prep section offers practice questions, mock interviews, and personalized feedback to help you prepare.",
                                  "Yes, we use industry-standard encryption and security practices to protect all user data.",
                                  "Go to Account Settings > Subscription and click 'Cancel Subscription'. You'll still have access until the end of your billing period."][i]}
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <div className="text-xs text-muted-foreground">
                                  Category: {["Getting Started", "Data & Privacy", "Interview Prep", "Security", "Billing"][i]}
                                </div>
                                <div className="flex items-center">
                                  <Badge variant={i % 2 === 0 ? "outline" : "secondary"} className="mr-2">
                                    {i % 2 === 0 ? "Common" : "Featured"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add New FAQ
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            <TabsContent value="billing" className="mt-0">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Billing Management</h2>
                  <Button onClick={() => setShowPriceModal(true)}>
                    Update Pricing
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Plan Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Pro Plan Pricing</CardTitle>
                      <CardDescription>Manage subscription plan pricing</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label>Monthly Price</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={proPricing.monthly}
                              onChange={(e) => updatePricing('monthly', e.target.value)}
                            />
                            <span>USD</span>
                          </div>
                        </div>
                        <div>
                          <Label>Quarterly Price</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={proPricing.quarterly}
                              onChange={(e) => updatePricing('quarterly', e.target.value)}
                            />
                            <span>USD</span>
                          </div>
                        </div>
                        <div>
                          <Label>Annual Price</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={proPricing.annual}
                              onChange={(e) => updatePricing('annual', e.target.value)}
                            />
                            <span>USD</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={savePricingChanges} className="w-full">
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* University Licensing */}
                  <Card>
                    <CardHeader>
                      <CardTitle>University Licensing</CardTitle>
                      <CardDescription>Manage university subscriptions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label>Base License Price (per user/year)</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={universityPricing.basePrice}
                              onChange={(e) => updateUniversityPricing('basePrice', e.target.value)}
                            />
                            <span>USD</span>
                          </div>
                        </div>
                        <div>
                          <Label>Bulk Discount Threshold</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={universityPricing.bulkThreshold}
                              onChange={(e) => updateUniversityPricing('bulkThreshold', e.target.value)}
                            />
                            <span>users</span>
                          </div>
                        </div>
                        <div>
                          <Label>Bulk Discount Rate</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={universityPricing.bulkDiscount}
                              onChange={(e) => updateUniversityPricing('bulkDiscount', e.target.value)}
                            />
                            <span>%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={saveUniversityPricing} className="w-full">
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Active Subscriptions */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Active Subscriptions</CardTitle>
                      <CardDescription>Monitor current subscriptions and revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Active Users</TableHead>
                            <TableHead>Monthly Revenue</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Pro Plan (Monthly)</TableCell>
                            <TableCell>{stats.proMonthlyUsers}</TableCell>
                            <TableCell>${stats.proMonthlyRevenue}</TableCell>
                            <TableCell>
                              <Badge>Active</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Pro Plan (Annual)</TableCell>
                            <TableCell>{stats.proAnnualUsers}</TableCell>
                            <TableCell>${stats.proAnnualRevenue}</TableCell>
                            <TableCell>
                              <Badge>Active</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>University Licenses</TableCell>
                            <TableCell>{stats.universityUsers}</TableCell>
                            <TableCell>${stats.universityRevenue}</TableCell>
                            <TableCell>
                              <Badge>Active</Badge>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">System Settings</h2>
                  <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Settings
                  </Button>
                </div>

                <div className="grid gap-6">
                  {/* General Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                      <CardDescription>Configure basic system settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Site Name</Label>
                        <Input defaultValue="CareerTracker.io" />
                      </div>
                      <div className="space-y-2">
                        <Label>Support Email</Label>
                        <Input type="email" defaultValue="support@careertracker.io" />
                      </div>
                      <div className="space-y-2">
                        <Label>Default Time Zone</Label>
                        <Select defaultValue="UTC">
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="EST">Eastern Time</SelectItem>
                            <SelectItem value="PST">Pacific Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button>Save General Settings</Button>
                    </CardFooter>
                  </Card>

                  {/* Email Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Email Settings</CardTitle>
                      <CardDescription>Configure email notifications and templates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Welcome Email</Label>
                          <p className="text-sm text-muted-foreground">Sent to new users upon registration</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Weekly Digest</Label>
                          <p className="text-sm text-muted-foreground">Weekly summary of user activity</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>System Alerts</Label>
                          <p className="text-sm text-muted-foreground">Important system notifications</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button>Update Email Settings</Button>
                    </CardFooter>
                  </Card>

                  {/* Security Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>Configure security and access controls</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Session Timeout (minutes)</Label>
                        <Input type="number" defaultValue="60" />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Login Attempts</Label>
                        <Input type="number" defaultValue="5" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Two-Factor Authentication</Label>
                          <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>IP Whitelisting</Label>
                          <p className="text-sm text-muted-foreground">Restrict admin access by IP</p>
                        </div>
                        <Switch />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button>Save Security Settings</Button>
                    </CardFooter>
                  </Card>

                  {/* Backup & Maintenance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Backup & Maintenance</CardTitle>
                      <CardDescription>System maintenance and backup settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Automatic Backup Frequency</Label>
                        <Select defaultValue="daily">
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Backup Retention (days)</Label>
                        <Input type="number" defaultValue="30" />
                      </div>
                      <div className="space-y-2">
                        <Label>Maintenance Window</Label>
                        <Select defaultValue="midnight">
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="midnight">12:00 AM - 2:00 AM</SelectItem>
                            <SelectItem value="morning">4:00 AM - 6:00 AM</SelectItem>
                            <SelectItem value="evening">10:00 PM - 12:00 AM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">
                        Run Backup Now
                      </Button>
                      <Button>
                        Save Maintenance Settings
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
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