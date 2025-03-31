import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  UsersRound, 
  BarChart3, 
  Settings, 
  FileText, 
  Mail, 
  MessagesSquare, 
  Bell,
  Search,
  ShieldAlert,
  HelpCircle,
  TicketCheck,
  BookOpen
} from 'lucide-react';

export default function StaffDashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [, navigate] = useLocation();
  
  // Guard against non-staff access
  if (user && user.userType !== 'staff' && user.userType !== 'admin') {
    navigate('/dashboard');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/staff" className="flex items-center space-x-2">
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <span className="font-bold">Staff Portal</span>
            </Link>

            <nav className="flex items-center gap-4 md:gap-6 text-sm">
              <Link 
                href="/staff" 
                className="font-medium transition-colors hover:text-primary"
              >
                Dashboard
              </Link>
              <Link 
                href="/staff/users" 
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Users
              </Link>
              <Link 
                href="/staff/support" 
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Support
              </Link>
              <Link 
                href="/staff/content" 
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Content
              </Link>
              <Link 
                href="/staff/settings" 
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Settings
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                3
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {user?.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.userType}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">Staff Dashboard</h1>
            <p className="text-muted-foreground">
              Manage the platform and monitor key metrics from this central dashboard.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-4">
            <StatsCard 
              title="Total Users" 
              value="6,427" 
              change="+12.5%" 
              icon={<UsersRound className="h-4 w-4" />} 
            />
            <StatsCard 
              title="Active Subscriptions" 
              value="1,849" 
              change="+7.2%" 
              icon={<BarChart3 className="h-4 w-4" />} 
            />
            <StatsCard 
              title="Support Tickets" 
              value="23" 
              change="-3" 
              icon={<TicketCheck className="h-4 w-4" />} 
            />
            <StatsCard 
              title="Content Views" 
              value="24.5k" 
              change="+18.3%" 
              icon={<BookOpen className="h-4 w-4" />} 
            />
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Track system-wide activity across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ActivityItem 
                    title="New user registered" 
                    description="johndoe@example.com registered a new account"
                    time="5 minutes ago"
                  />
                  <ActivityItem 
                    title="New subscription" 
                    description="User #5829 upgraded to Pro Plan (Annual)"
                    time="12 minutes ago"
                  />
                  <ActivityItem 
                    title="Support ticket updated" 
                    description="Ticket #842 status changed to 'Resolved'"
                    time="24 minutes ago"
                  />
                  <ActivityItem 
                    title="Content updated" 
                    description="Interview Questions module has been updated"
                    time="45 minutes ago"
                  />
                  <ActivityItem 
                    title="System alert" 
                    description="Database backup completed successfully"
                    time="1 hour ago"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Tools</CardTitle>
                <CardDescription>
                  Frequently used administrative tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start">
                    <UsersRound className="mr-2 h-4 w-4" /> Manage Users
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TicketCheck className="mr-2 h-4 w-4" /> View Support Tickets
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" /> Content Management
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Mail className="mr-2 h-4 w-4" /> Send Email Notification
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="mr-2 h-4 w-4" /> System Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>
                  Latest open support tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <SupportTicket 
                    id="842"
                    title="Cannot access interview module"
                    priority="High"
                    status="Open"
                    time="2 hours ago"
                  />
                  <SupportTicket 
                    id="841"
                    title="Payment issue with subscription"
                    priority="Medium"
                    status="In Progress"
                    time="3 hours ago"
                  />
                  <SupportTicket 
                    id="840"
                    title="Request for feature"
                    priority="Low"
                    status="Open"
                    time="5 hours ago"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
                <CardDescription>
                  Latest communications from users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <UserMessage 
                    name="Sarah Johnson"
                    message="Thank you for your quick response to my support ticket!"
                    time="1 hour ago"
                  />
                  <UserMessage 
                    name="David Smith"
                    message="When will the new resume templates be available?"
                    time="3 hours ago"
                  />
                  <UserMessage 
                    name="Emily Chen"
                    message="I'm having trouble with my subscription renewal."
                    time="5 hours ago"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Current system status and health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <SystemMetric 
                    name="API Response Time"
                    value="124ms"
                    status="good"
                  />
                  <SystemMetric 
                    name="Database Load"
                    value="23%"
                    status="good"
                  />
                  <SystemMetric 
                    name="Storage Usage"
                    value="68%"
                    status="warning"
                  />
                  <SystemMetric 
                    name="Memory Usage"
                    value="42%"
                    status="good"
                  />
                  <SystemMetric 
                    name="Cache Hit Rate"
                    value="96%"
                    status="good"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatsCard({ title, value, change, icon }: { title: string; value: string; change: string; icon: React.ReactNode }) {
  const isPositive = change.startsWith('+');
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'} mt-1`}>
          {change} from last month
        </p>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ title, description, time }: { title: string; description: string; time: string }) {
  return (
    <div className="flex items-start pb-4 border-b border-border last:border-0 last:pb-0">
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center mr-3 mt-0.5">
        <Bell className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

function SupportTicket({ id, title, priority, status, time }: { id: string, title: string, priority: string, status: string, time: string }) {
  return (
    <div className="flex flex-col space-y-1 pb-3 border-b border-border last:border-0 last:pb-0">
      <div className="flex justify-between">
        <span className="text-sm font-medium">#{id}: {title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          priority === 'High' ? 'bg-red-100 text-red-800' : 
          priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
          'bg-green-100 text-green-800'
        }`}>
          {priority}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-xs ${
          status === 'Open' ? 'text-blue-600' : 
          status === 'In Progress' ? 'text-yellow-600' : 
          'text-green-600'
        }`}>
          {status}
        </span>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
    </div>
  );
}

function UserMessage({ name, message, time }: { name: string; message: string; time: string }) {
  return (
    <div className="flex items-start pb-4 border-b border-border last:border-0 last:pb-0">
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center mr-3 mt-0.5">
        <span className="text-sm font-medium">{name.charAt(0)}</span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

function SystemMetric({ name, value, status }: { name: string; value: string; status: 'good' | 'warning' | 'error' }) {
  return (
    <div className="flex justify-between items-center pb-2 border-b border-border last:border-0 last:pb-0">
      <span className="text-sm">{name}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{value}</span>
        <span className={`w-2 h-2 rounded-full ${
          status === 'good' ? 'bg-green-500' : 
          status === 'warning' ? 'bg-yellow-500' : 
          'bg-red-500'
        }`} />
      </div>
    </div>
  );
}