import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Sector
} from 'recharts';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Calendar, CalendarIcon, Activity, Users, BarChart as BarChartIcon, PieChart as PieChartIcon, 
  TrendingUp, Book, ListFilter, HelpCircle, Filter, Clock, MapPin
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Define types for the analytics data
interface UserGrowthData {
  date: string;
  signups: number;
  cumulative: number;
}

interface UserSegmentation {
  type: string;
  count: number;
  color: string;
}

interface FeatureUsage {
  feature: string;
  allUsers: number;
  free: number;
  pro: number;
  university: number;
}

interface UniversityLicense {
  id: number;
  name: string;
  seatsUsed: number;
  totalSeats: number;
  utilization: number;
  expiresIn: number;
}

interface ActiveUsers {
  date: string;
  dailyActive: number;
  weeklyActive: number;
  averageSessionTime: number;
}

interface TopUser {
  id: number;
  name: string;
  email: string;
  plan: string;
  lastLogin: string;
  totalSessions: number;
  averageSessionTime: string;
  featuresUsed: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function AnalyticsPage() {
  // State for filters
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '12m' | 'ytd'>('30d');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [userType, setUserType] = useState<'all' | 'free' | 'pro' | 'university'>('all');
  const [featureFilter, setFeatureFilter] = useState<'all' | 'free' | 'pro' | 'university'>('all');
  const [showCumulative, setShowCumulative] = useState(true);

  // Function to calculate date range based on selection
  const getDateRange = () => {
    const today = new Date();
    
    if (customStartDate && customEndDate) {
      return {
        start: startOfDay(customStartDate),
        end: endOfDay(customEndDate)
      };
    }
    
    switch (dateRange) {
      case '7d':
        return {
          start: startOfDay(subDays(today, 7)),
          end: endOfDay(today)
        };
      case '30d':
        return {
          start: startOfDay(subDays(today, 30)),
          end: endOfDay(today)
        };
      case '90d':
        return {
          start: startOfDay(subDays(today, 90)),
          end: endOfDay(today)
        };
      case '12m':
        return {
          start: startOfDay(subMonths(today, 12)),
          end: endOfDay(today)
        };
      case 'ytd':
        return {
          start: startOfDay(new Date(today.getFullYear(), 0, 1)),
          end: endOfDay(today)
        };
      default:
        return {
          start: startOfDay(subDays(today, 30)),
          end: endOfDay(today)
        };
    }
  };

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analyticsData', dateRange, customStartDate, customEndDate, userType],
    queryFn: () => {
      // In a real application, this would be a call to your API
      // Using mock data for demo purposes
      return Promise.resolve(generateMockAnalyticsData(getDateRange()));
    }
  });

  // Helper function to format dates for display
  const formatDateForDisplay = (date: Date) => {
    return format(date, 'MMM d, yyyy');
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Monitor your platform's performance and user activity</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          {/* Date Range Filter */}
          <div className="w-full sm:w-auto">
            <Select value={dateRange} onValueChange={(value) => setDateRange(value as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Type Filter */}
          <div className="w-full sm:w-auto">
            <Select value={userType} onValueChange={(value) => setUserType(value as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="free">Free Users</SelectItem>
                <SelectItem value="pro">Pro Users</SelectItem>
                <SelectItem value="university">University Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Summary Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.userSegmentation.reduce((total, segment) => total + segment.count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">+{analyticsData?.recentSignups || 0}</span> new in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users (DAU/WAU)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.activeUsers[analyticsData.activeUsers.length - 1].dailyActive.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">
                {analyticsData?.activeUsers[analyticsData.activeUsers.length - 1].weeklyActive.toLocaleString()}
              </span> weekly active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.activeUsers && analyticsData.activeUsers.length > 0 ? 
                `${Math.round(analyticsData.activeUsers[analyticsData.activeUsers.length - 1].averageSessionTime / 60)}m ${analyticsData.activeUsers[analyticsData.activeUsers.length - 1].averageSessionTime % 60}s` : 
                '0m 0s'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all user segments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>User Growth</CardTitle>
            <div className="flex items-center space-x-2">
              <Switch 
                id="cumulative-toggle"
                checked={showCumulative}
                onCheckedChange={setShowCumulative}
              />
              <Label htmlFor="cumulative-toggle">Cumulative</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData?.userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    return format(new Date(value), 'MMM yyyy');
                  }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value} users`, showCumulative ? 'Total Users' : 'New Signups']}
                  labelFormatter={(label) => format(new Date(label), 'MMMM yyyy')}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={showCumulative ? "cumulative" : "signups"}
                  stroke="#8884d8"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  name={showCumulative ? "Total Users" : "New Signups"}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Second Row (User Segmentation & Feature Usage) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Segmentation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>User Segmentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center h-80">
              <ResponsiveContainer width="100%" height="70%">
                <PieChart>
                  <Pie
                    data={analyticsData?.userSegmentation || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="type"
                    label={({ type, count, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData?.userSegmentation?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name, props) => [`${value.toLocaleString()} users`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full mt-4">
                {analyticsData?.userSegmentation?.map((segment, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <Badge className="px-4 py-1" style={{ backgroundColor: segment.color + '20', color: segment.color, borderColor: segment.color + '20' }}>
                      {segment.type}
                    </Badge>
                    <span className="text-lg font-semibold mt-1">{segment.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Usage */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Feature Usage</CardTitle>
              <Select value={featureFilter} onValueChange={(value) => setFeatureFilter(value as any)}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="Segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="free">Free Users</SelectItem>
                  <SelectItem value="pro">Pro Users</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={analyticsData?.featureUsage || []}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="feature" width={150} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                  <Legend />
                  <Bar 
                    dataKey={featureFilter === 'all' ? 'allUsers' : 
                            featureFilter === 'free' ? 'free' : 
                            featureFilter === 'pro' ? 'pro' : 'university'} 
                    fill="#8884d8" 
                    name={`${featureFilter === 'all' ? 'All Users' : 
                            featureFilter === 'free' ? 'Free Users' : 
                            featureFilter === 'pro' ? 'Pro Users' : 'University Users'} Usage`}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row (University License & Active Users) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* University License Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>University License Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData?.universityLicenses?.map((university, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{university.name}</span>
                      <div className="text-sm text-muted-foreground">
                        {university.seatsUsed} / {university.totalSeats} seats used
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{university.utilization}%</span>
                      <div className="text-sm text-muted-foreground">
                        {university.expiresIn <= 30 ? (
                          <span className="text-orange-500">Expires in {university.expiresIn} days</span>
                        ) : (
                          <span>Expires in {university.expiresIn} days</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={university.utilization} 
                    className={university.expiresIn <= 30 ? "h-2 bg-orange-100" : "h-2"}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Daily & Weekly Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analyticsData?.activeUsers || []}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} users`]}
                    labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="dailyActive" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8"
                    name="Daily Active Users"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="weeklyActive" 
                    stackId="2"
                    stroke="#82ca9d" 
                    fill="#82ca9d"
                    name="Weekly Active Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Top Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Total Sessions</TableHead>
                <TableHead>Avg. Session</TableHead>
                <TableHead>Features Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyticsData?.topUsers?.map((user, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      user.plan === 'Free' ? 'bg-blue-500/20 text-blue-700 border-blue-500/20' :
                      user.plan === 'Pro' ? 'bg-purple-500/20 text-purple-700 border-purple-500/20' :
                      'bg-green-500/20 text-green-700 border-green-500/20'
                    }>
                      {user.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(user.lastLogin), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{user.totalSessions}</TableCell>
                  <TableCell>{user.averageSessionTime}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.featuresUsed.slice(0, 2).map((feature, i) => (
                        <Badge key={i} variant="outline" className="bg-primary/10 text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {user.featuresUsed.length > 2 && (
                        <Badge variant="outline" className="bg-primary/10 text-xs">
                          +{user.featuresUsed.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// The following function generates mock data for demonstration purposes only.
// In a real application, this would be replaced with actual API calls.
function generateMockAnalyticsData(dateRange: { start: Date; end: Date }) {
  // Generate dates for the last 12 months
  const months = [];
  let currentDate = subMonths(new Date(), 11);
  for (let i = 0; i < 12; i++) {
    months.push({
      startDate: startOfMonth(currentDate),
      endDate: endOfMonth(currentDate),
      label: format(currentDate, 'MMM yyyy')
    });
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  // Generate user growth data
  const baseMonthlySignups = [150, 180, 210, 250, 280, 320, 380, 450, 520, 580, 650, 720];
  const userGrowth: UserGrowthData[] = [];
  let cumulativeTotal = 4500; // Starting cumulative total

  for (let i = 0; i < months.length; i++) {
    const variance = Math.floor(Math.random() * 50) - 25; // Random variance between -25 and 25
    const signups = Math.max(50, baseMonthlySignups[i] + variance);
    cumulativeTotal += signups;
    
    userGrowth.push({
      date: months[i].startDate.toISOString(),
      signups,
      cumulative: cumulativeTotal
    });
  }

  // User segmentation data
  const userSegmentation: UserSegmentation[] = [
    { type: 'Free', count: 5200, color: '#0088FE' },
    { type: 'Pro', count: 2800, color: '#00C49F' },
    { type: 'University', count: 1500, color: '#FFBB28' }
  ];

  // Feature usage data
  const featureUsage: FeatureUsage[] = [
    { feature: 'Resume Builder', allUsers: 78, free: 65, pro: 88, university: 85 },
    { feature: 'Cover Letter Generator', allUsers: 62, free: 45, pro: 82, university: 70 },
    { feature: 'Job Tracking', allUsers: 55, free: 40, pro: 75, university: 60 },
    { feature: 'AI Interview Coach', allUsers: 45, free: 20, pro: 92, university: 80 },
    { feature: 'Skill Assessment', allUsers: 38, free: 25, pro: 65, university: 55 },
    { feature: 'Career Path Analysis', allUsers: 32, free: 15, pro: 70, university: 50 }
  ];

  // University license data
  const universityLicenses: UniversityLicense[] = [
    { id: 1, name: 'University of Technology', seatsUsed: 420, totalSeats: 500, utilization: 84, expiresIn: 45 },
    { id: 2, name: 'State College', seatsUsed: 180, totalSeats: 200, utilization: 90, expiresIn: 15 },
    { id: 3, name: 'Community Institute', seatsUsed: 95, totalSeats: 150, utilization: 63, expiresIn: 120 },
    { id: 4, name: 'Liberal Arts University', seatsUsed: 210, totalSeats: 300, utilization: 70, expiresIn: 75 },
    { id: 5, name: 'Technical College', seatsUsed: 150, totalSeats: 150, utilization: 100, expiresIn: 30 }
  ];

  // Active users data (last 30 days)
  const activeUsers: ActiveUsers[] = [];
  let currentDay = subDays(new Date(), 29);
  
  for (let i = 0; i < 30; i++) {
    const dailyBase = 800 + Math.floor(Math.random() * 200);
    const weeklyBase = 3500 + Math.floor(Math.random() * 500);
    const sessionTime = 180 + Math.floor(Math.random() * 120);
    
    // Add weekly pattern (lower on weekends)
    const dayOfWeek = currentDay.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dailyMultiplier = isWeekend ? 0.7 : 1.0;
    
    activeUsers.push({
      date: currentDay.toISOString(),
      dailyActive: Math.floor(dailyBase * dailyMultiplier),
      weeklyActive: Math.floor(weeklyBase * (isWeekend ? 0.9 : 1.0)),
      averageSessionTime: sessionTime
    });
    
    currentDay = new Date(currentDay.getTime() + 86400000); // Add one day
  }

  // Top users data
  const topUsers: TopUser[] = [
    { 
      id: 1, 
      name: 'Emma Johnson', 
      email: 'emma.j@example.com', 
      plan: 'Pro', 
      lastLogin: new Date().toISOString(),
      totalSessions: 87,
      averageSessionTime: '24m 12s',
      featuresUsed: ['Resume Builder', 'Cover Letter Generator', 'AI Interview Coach', 'Job Tracking']
    },
    { 
      id: 2, 
      name: 'Michael Chen', 
      email: 'mchen@example.com', 
      plan: 'Pro', 
      lastLogin: subDays(new Date(), 1).toISOString(),
      totalSessions: 65,
      averageSessionTime: '18m 45s',
      featuresUsed: ['Resume Builder', 'AI Interview Coach', 'Skill Assessment']
    },
    { 
      id: 3, 
      name: 'Sarah Williams', 
      email: 'swilliams@university.edu', 
      plan: 'University', 
      lastLogin: subDays(new Date(), 2).toISOString(),
      totalSessions: 52,
      averageSessionTime: '22m 30s',
      featuresUsed: ['Resume Builder', 'Cover Letter Generator', 'Career Path Analysis']
    },
    { 
      id: 4, 
      name: 'James Taylor', 
      email: 'jtaylor@example.com', 
      plan: 'Free', 
      lastLogin: subDays(new Date(), 1).toISOString(),
      totalSessions: 48,
      averageSessionTime: '12m 15s',
      featuresUsed: ['Resume Builder', 'Job Tracking']
    },
    { 
      id: 5, 
      name: 'Olivia Martinez', 
      email: 'omartinez@college.edu', 
      plan: 'University', 
      lastLogin: subDays(new Date(), 3).toISOString(),
      totalSessions: 41,
      averageSessionTime: '19m 50s',
      featuresUsed: ['AI Interview Coach', 'Skill Assessment', 'Career Path Analysis']
    }
  ];

  return {
    userGrowth,
    userSegmentation,
    featureUsage,
    universityLicenses,
    activeUsers,
    topUsers,
    recentSignups: baseMonthlySignups[baseMonthlySignups.length - 1]
  };
}