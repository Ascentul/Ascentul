import { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/useUserData';
import { 
  Users, 
  GraduationCap,
  Calendar,
  BarChart,
  Activity,
  Clock,
  User,
  UserPlus,
  Bell,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';

// Define types for university data
interface UniversityStats {
  totalStudents: number;
  activeStudents: number;
  totalSeats: number;
  contractExpirationDate: string;
  avgEngagementScore: number;
  recentLogins: RecentLogin[];
}

interface RecentLogin {
  id: number;
  studentName: string;
  email: string;
  lastLoginTime: string;
  profileImage?: string;
}

export default function UniversityAdminDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UniversityStats | null>(null);
  
  useEffect(() => {
    // Simulate fetching university stats from API
    const fetchStats = async () => {
      try {
        // In a real implementation, this would be an API call
        // Hardcoded data for now based on admin user's university
        const universityName = user?.universityName || 'Demo University';
        
        // Demo data
        const mockStats: UniversityStats = {
          totalStudents: 120,
          activeStudents: 98,
          totalSeats: 150,
          contractExpirationDate: '2025-08-31',
          avgEngagementScore: 76,
          recentLogins: [
            {
              id: 1,
              studentName: 'Emma Thompson',
              email: 'emma.t@university.edu',
              lastLoginTime: '2025-05-04T09:42:15',
            },
            {
              id: 2,
              studentName: 'Marcus Chen',
              email: 'mchen@university.edu',
              lastLoginTime: '2025-05-03T16:23:47',
            },
            {
              id: 3,
              studentName: 'Sofia Rodriguez',
              email: 's.rodriguez@university.edu',
              lastLoginTime: '2025-05-03T14:05:22',
            },
            {
              id: 4,
              studentName: 'James Wilson',
              email: 'jwilson@university.edu',
              lastLoginTime: '2025-05-02T10:31:08',
            },
            {
              id: 5,
              studentName: 'Priya Patel',
              email: 'ppatel@university.edu',
              lastLoginTime: '2025-05-01T08:15:33',
            }
          ]
        };
        
        setStats(mockStats);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch university stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load university statistics. Please try again later.',
          variant: 'destructive'
        });
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [user, toast]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Error state if stats couldn't be loaded
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="mb-4">
          <Activity className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Unable to Load Dashboard Data</h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          We encountered an issue while loading your university statistics. Please try refreshing the page.
        </p>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Refresh Page
        </Button>
      </div>
    );
  }
  
  // Calculate seat usage percentage
  const seatUsagePercentage = Math.round((stats.activeStudents / stats.totalSeats) * 100);
  
  // Format expiration date for display
  const formattedExpirationDate = new Date(stats.contractExpirationDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Calculate days until expiration
  const today = new Date();
  const expirationDate = new Date(stats.contractExpirationDate);
  const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your university's Ascentul platform usage and student activity.
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeStudents} active this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Seat Usage</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStudents} / {stats.totalSeats}</div>
            <div className="mt-2 space-y-1">
              <Progress value={seatUsagePercentage} />
              <p className="text-xs text-muted-foreground">{seatUsagePercentage}% of allocated seats</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contract Expiration</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedExpirationDate}</div>
            <p className="text-xs text-muted-foreground">
              {daysUntilExpiration} days remaining
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement Score</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgEngagementScore}/100</div>
            <div className="mt-2 space-y-1">
              <Progress value={stats.avgEngagementScore} className="bg-muted" />
              <p className="text-xs text-muted-foreground">Based on platform activity</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs Section */}
      <Tabs defaultValue="recent-activity" className="space-y-4">
        <TabsList className="bg-card border">
          <TabsTrigger value="recent-activity" className="data-[state=active]:bg-white">Recent Activity</TabsTrigger>
          <TabsTrigger value="student-stats" className="data-[state=active]:bg-white">Student Statistics</TabsTrigger>
          <TabsTrigger value="resources" className="data-[state=active]:bg-white">Popular Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent-activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Student Logins</CardTitle>
              <CardDescription>
                The latest platform activity from your students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentLogins.map((login) => (
                  <div key={login.id} className="flex items-center">
                    <div className="mr-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">{login.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          <Clock className="inline-block h-3 w-3 mr-1" />
                          {format(new Date(login.lastLoginTime), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{login.email}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Button variant="outline" size="sm">
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="student-stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Usage Statistics</CardTitle>
              <CardDescription>
                Detailed metrics on how students are using the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BarChart className="mx-auto h-10 w-10 mb-2" />
                <p>Detailed student statistics will be displayed here.</p>
                <p className="text-sm">This section is under development.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Accessed Resources</CardTitle>
              <CardDescription>
                The learning materials and tools your students use most.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Activity className="mx-auto h-10 w-10 mb-2" />
                <p>Resource usage analytics will be displayed here.</p>
                <p className="text-sm">This section is under development.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="justify-start h-auto py-3"
            onClick={() => window.location.href = '/university-admin/invite'}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Invite Students</div>
              <div className="text-xs text-muted-foreground">Add new students to the platform</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="justify-start h-auto py-3"
            onClick={() => window.location.href = '/university-admin/announcements'}
          >
            <Bell className="mr-2 h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Create Announcement</div>
              <div className="text-xs text-muted-foreground">Send notifications to all students</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="justify-start h-auto py-3"
            onClick={() => window.location.href = '/university-admin/settings'}
          >
            <Settings className="mr-2 h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">University Settings</div>
              <div className="text-xs text-muted-foreground">Manage account preferences</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}