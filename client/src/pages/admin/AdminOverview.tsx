import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  Users, Activity, Briefcase, BarChart4, 
  Building, Calendar, TrendingUp, BookOpen,
  ExternalLink, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function AdminOverview() {
  // Mock data - would be replaced with actual API queries
  const userGrowthData = [
    { name: 'Jan', users: 400 },
    { name: 'Feb', users: 650 },
    { name: 'Mar', users: 810 },
    { name: 'Apr', users: 1100 },
    { name: 'May', users: 1300 },
    { name: 'Jun', users: 1550 },
    { name: 'Jul', users: 1800 },
  ];

  const userTypeData = [
    { name: 'Regular', value: 2400 },
    { name: 'University', value: 1600 },
  ];

  const planData = [
    { name: 'Free', value: 800 },
    { name: 'Premium', value: 1600 },
    { name: 'University', value: 1600 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const { data: userStats } = useQuery({
    queryKey: ['/api/admin/users/stats'],
    initialData: {
      totalUsers: 4000,
      activeUsers: 2850,
      universities: 18,
      newSignups: 245,
      premiumUsers: 1600,
      universityUsers: 1600,
      freeUsers: 800,
      averageEngagement: '32 min/day',
    }
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Last updated:</span>
          <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={<Users className="h-5 w-5 text-primary" />}
          title="Total Users"
          value={userStats.totalUsers.toLocaleString()}
          trend="+12% from last month"
          trendUp={true}
        />
        <StatCard 
          icon={<Activity className="h-5 w-5 text-green-500" />}
          title="Active Users"
          value={userStats.activeUsers.toLocaleString()}
          trend="+8% from last month"
          trendUp={true}
        />
        <StatCard 
          icon={<Building className="h-5 w-5 text-blue-500" />}
          title="Universities"
          value={userStats.universities.toString()}
          trend="+3 from last month"
          trendUp={true}
        />
        <StatCard 
          icon={<Calendar className="h-5 w-5 text-orange-500" />}
          title="New Signups (30d)"
          value={userStats.newSignups.toLocaleString()}
          trend="+18% from last month"
          trendUp={true}
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={userGrowthData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#0C29AB"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-center text-sm font-medium mt-2">User Types</p>
              </div>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-center text-sm font-medium mt-2">Subscription Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Feature Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Application Tracker', usage: 83 },
                  { name: 'Career Goal Tracker', usage: 72 },
                  { name: 'Network Hub', usage: 68 },
                  { name: 'CareerPath Explorer', usage: 76 },
                  { name: 'Project Portfolio', usage: 70 },
                  { name: 'Resume Studio', usage: 78 },
                  { name: 'Cover Letter Studio', usage: 65 },
                  { name: 'AI Career Coach', usage: 91 },
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{fontSize: 12}}
                />
                <YAxis label={{ value: 'Usage %', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="usage" fill="#0C29AB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
}

function StatCard({ icon, title, value, trend, trendUp }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="bg-muted/50 p-2 rounded-md">{icon}</div>
          <div className={`flex items-center text-xs font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
            {trendUp ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingUp className="mr-1 h-3 w-3 transform rotate-180" />}
            <span>{trend}</span>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}