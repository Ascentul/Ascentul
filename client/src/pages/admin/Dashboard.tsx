import { useState } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
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
import { useToast } from '@/hooks/use-toast';
import AdminOverview from './AdminOverview';
import SupportPage from './SupportPage';
import AdminModelsPage from './ModelsPage';
import OpenAILogsPage from './OpenAILogsPage';
import EmailAdmin from './EmailAdmin';
import UserManagement from './UserManagement';
import UniversitiesPage from './Universities';
import AnalyticsPage from './AnalyticsPage';
import BillingPage from './BillingPage';
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
  Cpu,
  Mail,
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
  const [isUniversitiesRoute] = useRoute('/admin/universities');
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Add support tab content
  const TabContent = () => {
    switch(activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'users':
        return <UserManagement />;
      // Universities are now handled by a separate page at /admin/universities
      case 'analytics':
        return <AnalyticsPage />;
      case 'billing':
        return <BillingPage />;
      case 'support':
        return <SupportPage />;
      case 'ai-models':
        return <AdminModelsPage />;
      case 'openai-logs':
        return <OpenAILogsPage />;
      case 'email':
        return <EmailAdmin />;
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
          {/* Use SidebarItem like other tabs for consistency */}
          <SidebarItem
            icon={<Building className="h-5 w-5" />}
            label="Universities"
            active={isUniversitiesRoute}
            onClick={() => {
              // Navigate to the universities page using window.location.assign
              // This is more reliable than href in some cases
              window.location.assign("/admin/universities");
              
              // Add a console log for debugging
              console.log("Attempting to navigate to /admin/universities");
            }}
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
            icon={<Cpu className="h-5 w-5" />}
            label="AI Models"
            active={activeTab === 'ai-models'}
            onClick={() => setActiveTab('ai-models')}
          />
          <SidebarItem
            icon={<Activity className="h-5 w-5" />}
            label="OpenAI Logs"
            active={activeTab === 'openai-logs'}
            onClick={() => setActiveTab('openai-logs')}
          />
          <SidebarItem
            icon={<Mail className="h-5 w-5" />}
            label="Email Management"
            active={activeTab === 'email'}
            onClick={() => setActiveTab('email')}
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
          <div className="mx-auto max-w-1440 w-full px-6 md:px-8 lg:px-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="md:hidden grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <TabContent />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

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
      className={`flex items-center w-full py-2 px-3 rounded-md text-sm ${
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-foreground/70 hover:bg-muted/80"
      }`}
      onClick={onClick}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </button>
  );
}