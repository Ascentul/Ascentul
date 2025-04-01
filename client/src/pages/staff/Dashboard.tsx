import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import StaffLayout from '@/components/StaffLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/lib/useUserData';
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  Activity,
  TicketCheck,
  CalendarClock,
  TrendingUp,
  AlertTriangle,
  Zap,
  Shield
} from 'lucide-react';
import SystemStatusModal from '@/components/staff/SystemStatusModal';
import QuickActionsModal from '@/components/staff/QuickActionsModal';

export default function StaffDashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatusOpen, setSystemStatusOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  const { data: systemStatus } = useQuery({
    queryKey: ['systemStatus'],
    queryFn: async () => {
      const response = await fetch('/api/system/status');
      return response.json();
    }
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const response = await fetch('/api/users/statistics');
      return response.json();
    }
  });

  const dashboardData = {
    activeUsers: userStats?.totalUsers || 0,
    supportTickets: userStats?.activeTickets || 0,
    revenue: userStats?.monthlyRevenue || 0,
    conversionRate: userStats?.conversionRate || 0,
    newSignups: userStats?.newSignups24h || 0,
    sessions: userStats?.activeSessions || 0,
    premiumUsers: userStats?.premiumUsers || 0,
    universityUsers: userStats?.universityUsers || 0,
    systemHealth: systemStatus?.overall?.uptime || 0,
    alertsCount: systemStatus?.alerts?.length || 0
  };

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
            <p className="text-muted-foreground">
              Here's what's happening with CareerTracker.io today
            </p>
          </div>
          <div className="flex items-center mt-4 gap-4 md:mt-0">
            <Button 
              className="flex items-center" 
              variant="outline"
              onClick={() => setSystemStatusOpen(true)}
            >
              <Shield className="mr-2 h-4 w-4" />
              System Status
            </Button>
            <Button 
              className="flex items-center"
              onClick={() => setQuickActionsOpen(true)}
            >
              <Zap className="mr-2 h-4 w-4" />
              Quick Actions
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="tickets">Support</TabsTrigger>
            </TabsList>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.activeUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +{dashboardData.newSignups} in the last 24 hours
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
                  <TicketCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.supportTickets}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.supportTickets > 0 ? 'Requires attention' : 'All tickets resolved'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${dashboardData.revenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.conversionRate}% conversion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.sessions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Current active user sessions
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of user types across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[200px] flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                          <span>Free Users</span>
                        </div>
                        <span>{dashboardData.activeUsers - dashboardData.premiumUsers - dashboardData.universityUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span>Premium Users</span>
                        </div>
                        <span>{dashboardData.premiumUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          <span>University Users</span>
                        </div>
                        <span>{dashboardData.universityUsers}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-4">
                        {((dashboardData.premiumUsers + dashboardData.universityUsers) / dashboardData.activeUsers * 100).toFixed(1)}% paid conversion
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    Current platform health and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${dashboardData.systemHealth > 99 ? 'bg-green-500' : 'bg-yellow-500'} mr-2`}></div>
                        <span>System Uptime</span>
                      </div>
                      <span>{dashboardData.systemHealth}%</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${dashboardData.alertsCount === 0 ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                        <span>Active Alerts</span>
                      </div>
                      <span>{dashboardData.alertsCount}</span>
                    </div>

                    {dashboardData.alertsCount > 0 && (
                      <div className="bg-red-50 p-3 rounded-md mt-2">
                        <div className="flex">
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Payment processor slowdown</p>
                            <p className="text-xs text-red-700">Stripe payments processing with 2-5 second delay</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button variant="outline" className="w-full mt-2">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Detailed Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest platform events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { 
                        icon: <Users className="h-4 w-4" />, 
                        text: "New university admin registered from Stanford University",
                        time: "10 minutes ago" 
                      },
                      { 
                        icon: <CreditCard className="h-4 w-4" />, 
                        text: "Successful payment of $72.00 for annual premium plan",
                        time: "35 minutes ago" 
                      },
                      { 
                        icon: <TicketCheck className="h-4 w-4" />, 
                        text: "Support ticket #283 closed: 'Resume template issue'",
                        time: "1 hour ago" 
                      },
                      { 
                        icon: <TrendingUp className="h-4 w-4" />, 
                        text: "Spike in AI Coach usage detected - 205% increase",
                        time: "3 hours ago" 
                      },
                      { 
                        icon: <CalendarClock className="h-4 w-4" />, 
                        text: "Content update scheduled: New interview questions database",
                        time: "Yesterday at 4:30 PM" 
                      }
                    ].map((activity, index) => (
                      <div key={index} className="flex">
                        <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-primary">{activity.icon}</span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">{activity.text}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>This section is under construction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">User management tools will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>This section is under construction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">Revenue charts and reports will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>This section is under construction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">Support ticket management will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Modals */}
      <SystemStatusModal 
        open={systemStatusOpen} 
        onOpenChange={setSystemStatusOpen}
      />
      <QuickActionsModal 
        open={quickActionsOpen} 
        onOpenChange={setQuickActionsOpen}
      />
    </StaffLayout>
  );
}