import { 
  UserPlus, 
  Users, 
  CreditCard, 
  Activity, 
  BarChart4, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center text-xs mt-1">
            <span
              className={
                trend.isPositive
                  ? 'text-green-500 flex items-center'
                  : 'text-red-500 flex items-center'
              }
            >
              {trend.isPositive ? (
                <BarChart4 className="h-3 w-3 mr-1" />
              ) : (
                <BarChart4 className="h-3 w-3 mr-1 transform rotate-180" />
              )}
              {trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusIndicator({ status }: { status: 'healthy' | 'degraded' | 'down' }) {
  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-50',
      text: 'All systems operational',
    },
    degraded: {
      icon: AlertCircle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
      text: 'Some systems degraded',
    },
    down: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
      text: 'Systems experiencing issues',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`rounded-full p-2 ${config.bg} ${config.color} inline-flex items-center`}>
      <Icon className="h-4 w-4 mr-2" />
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
}

export function OverviewCards() {
  const { isLoading, dashboardData } = useAdmin();
  
  // Format uptime from seconds to days, hours, minutes
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px] mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Users"
        value={dashboardData.userStats?.totalUsers || 0}
        description="Total registered users"
        icon={<Users className="h-4 w-4 text-primary" />}
        trend={{ value: 12, label: "from last month", isPositive: true }}
      />
      
      <StatCard
        title="New Users"
        value={dashboardData.userStats?.newUsersToday || 0}
        description="New users today"
        icon={<UserPlus className="h-4 w-4 text-primary" />}
      />
      
      <StatCard
        title="Premium Users"
        value={dashboardData.userStats?.premiumUsers || 0}
        description="Users with active subscriptions"
        icon={<CreditCard className="h-4 w-4 text-primary" />}
        trend={{ value: 8, label: "from last month", isPositive: true }}
      />
      
      <StatCard
        title="Active Users"
        value={dashboardData.userStats?.activeUsers || 0}
        description="Users active in the last 7 days"
        icon={<Activity className="h-4 w-4 text-primary" />}
        trend={{ value: 5, label: "from last week", isPositive: true }}
      />
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current platform health and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Current Status</h3>
                {dashboardData.systemStatus && (
                  <StatusIndicator status={dashboardData.systemStatus.status} />
                )}
              </div>
              <div className="text-right">
                <h3 className="font-medium">Uptime</h3>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {dashboardData.systemStatus ? 
                    formatUptime(dashboardData.systemStatus.uptime) : 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <h3 className="font-medium mb-2">Database Status</h3>
              {dashboardData.databaseHealth ? (
                <div className="flex justify-between items-center">
                  <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm
                    ${dashboardData.databaseHealth.status === 'healthy' 
                      ? 'bg-green-100 text-green-800' 
                      : dashboardData.databaseHealth.status === 'error'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 
                      ${dashboardData.databaseHealth.status === 'healthy' 
                        ? 'bg-green-500' 
                        : dashboardData.databaseHealth.status === 'error'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`} />
                    {dashboardData.databaseHealth.connection === 'active' 
                      ? 'Connected' 
                      : 'Disconnected'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {dashboardData.databaseHealth.message}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Checking database status...</div>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Version</h3>
              <div className="inline-flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm">
                {dashboardData.systemStatus?.version || 'Unknown'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Support</CardTitle>
          <CardDescription>Recent customer support messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Unread Messages</h3>
                <div className="flex items-center">
                  <span className="text-2xl font-bold">{dashboardData.unreadMessages}</span>
                  {dashboardData.unreadMessages > 0 && (
                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      Requires Attention
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <a 
                  href="/admin/support"
                  className="text-primary text-sm hover:underline"
                >
                  View all support messages &rarr;
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}