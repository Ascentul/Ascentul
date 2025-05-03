import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, Activity, TrendingUp, TrendingDown, 
  Building, Calendar, CreditCard, School,
  UserPlus, FileText, PieChart, Download,
  BarChart as BarChartIcon, Settings, Cpu, Plus
} from 'lucide-react';
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
  Legend,
  Cell
} from 'recharts';

export default function AdminOverview() {
  // User growth data (January to present)
  const userGrowthData = [
    { name: 'Jan', users: 400 },
    { name: 'Feb', users: 650 },
    { name: 'Mar', users: 810 },
    { name: 'Apr', users: 1100 },
    { name: 'May', users: 1300 },
    { name: 'Jun', users: 1550 },
    { name: 'Jul', users: 1800 },
  ];

  // Feature usage data
  const featureUsageData = [
    { name: 'Resume Builder', usage: 78 },
    { name: 'Cover Letters', usage: 62 },
    { name: 'Interview Prep', usage: 82 },
    { name: 'AI Coach', usage: 91 },
    { name: 'Work History', usage: 65 },
    { name: 'Goals', usage: 72 },
  ];

  // Formatted date and time for "last updated" timestamp
  const formattedDateTime = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date());

  // Use dummy data if the API is not available yet
  const userStats = {
    totalUsers: 4000,
    proUsers: 1600,
    universities: 18,
    universityUsers: 1600, 
    newSignups: 245,
  };

  return (
    <div className="dark bg-gray-900 text-white min-h-screen rounded-lg p-2">
      {/* Top bar with title and timestamp */}
      <div className="flex items-center justify-between mb-8 bg-gray-800/50 backdrop-blur-lg p-4 rounded-lg shadow-lg border border-gray-700/50">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-1.5 rounded-full text-xs">
          <span className="text-gray-400">Last updated:</span>
          <span className="font-medium text-gray-200">{formattedDateTime}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <StatCard 
          icon={<Users className="h-6 w-6 text-blue-400" />}
          title="Total Users"
          value={userStats.totalUsers.toLocaleString()}
          trend="+12% from last month"
          trendUp={true}
          gradientFrom="from-blue-500"
          gradientTo="to-indigo-600"
        />
        <StatCard 
          icon={<CreditCard className="h-6 w-6 text-purple-400" />}
          title="Pro Plan Users"
          value={userStats.proUsers.toLocaleString()}
          trend="+8% from last month"
          trendUp={true}
          gradientFrom="from-purple-500"
          gradientTo="to-pink-600"
        />
        <StatCard 
          icon={<Building className="h-6 w-6 text-emerald-400" />}
          title="Universities"
          value={userStats.universities.toString()}
          trend="+3 from last month"
          trendUp={true}
          gradientFrom="from-emerald-500"
          gradientTo="to-teal-600"
        />
        <StatCard 
          icon={<School className="h-6 w-6 text-amber-400" />}
          title="University Users"
          value={userStats.universityUsers.toLocaleString()}
          trend="+5% from last month"
          trendUp={true}
          gradientFrom="from-amber-500"
          gradientTo="to-orange-600"
        />
        <StatCard 
          icon={<UserPlus className="h-6 w-6 text-green-400" />}
          title="New Signups (30d)"
          value={userStats.newSignups.toLocaleString()}
          trend="+18% from last month"
          trendUp={true}
          gradientFrom="from-green-500"
          gradientTo="to-emerald-600"
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth Line Chart */}
        <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-gray-700/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10 pb-4">
            <CardTitle className="text-lg font-bold text-gray-100 flex items-center">
              <BarChartIcon className="mr-2 h-5 w-5 text-blue-400" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={userGrowthData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      borderColor: '#374151',
                      color: '#E5E7EB'
                    }} 
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    name="Total Users"
                    stroke="#60A5FA"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Feature Usage Bar Chart */}
        <Card className="bg-gray-800/50 backdrop-blur-lg border-gray-700/50 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-gray-700/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10 pb-4">
            <CardTitle className="text-lg font-bold text-gray-100 flex items-center">
              <Activity className="mr-2 h-5 w-5 text-purple-400" />
              Feature Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={featureUsageData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      borderColor: '#374151',
                      color: '#E5E7EB'
                    }}
                    formatter={(value) => [`${value}%`, 'Usage']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="usage" 
                    name="Usage %" 
                    radius={[4, 4, 0, 0]}
                    barSize={36}
                  >
                    {featureUsageData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index % 2 === 0 ? '#8B5CF6' : '#EC4899'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-100 mb-4 flex items-center">
          <FileText className="mr-2 h-5 w-5 text-gray-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <QuickActionCard
            icon={<UserPlus className="h-6 w-6" />}
            title="Add User"
            gradientFrom="from-blue-500"
            gradientTo="to-indigo-600"
          />
          <QuickActionCard
            icon={<Building className="h-6 w-6" />}
            title="Add University"
            gradientFrom="from-purple-500"
            gradientTo="to-pink-600"
          />
          <QuickActionCard
            icon={<FileText className="h-6 w-6" />}
            title="Edit Content"
            gradientFrom="from-emerald-500"
            gradientTo="to-teal-600"
          />
          <QuickActionCard
            icon={<Download className="h-6 w-6" />}
            title="Export Data"
            gradientFrom="from-amber-500"
            gradientTo="to-orange-600"
          />
          <QuickActionCard
            icon={<PieChart className="h-6 w-6" />}
            title="View Analytics"
            gradientFrom="from-red-500"
            gradientTo="to-rose-600"
          />
          <QuickActionCard
            icon={<Cpu className="h-6 w-6" />}
            title="Manage AI Models"
            gradientFrom="from-green-500"
            gradientTo="to-emerald-600"
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  gradientFrom: string;
  gradientTo: string;
}

function StatCard({ 
  icon, 
  title, 
  value, 
  trend, 
  trendUp,
  gradientFrom,
  gradientTo
}: StatCardProps) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
      <div className={`h-1 w-full bg-gradient-to-r ${gradientFrom} ${gradientTo}`}></div>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} p-3 rounded-lg text-white`}>
            {icon}
          </div>
          <div className={`flex items-center text-xs font-medium ${trendUp ? 'text-green-400' : 'text-red-400'} bg-gray-800/80 py-1 px-2 rounded-full`}>
            {trendUp ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3" />
            )}
            <span>{trend}</span>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-50 mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  gradientFrom: string;
  gradientTo: string;
}

function QuickActionCard({ icon, title, gradientFrom, gradientTo }: QuickActionCardProps) {
  // Extract color from gradient for the glow effect
  const colorName = gradientFrom.split('-')[1];
  
  return (
    <button className="group transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-xl">
      <div className="bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 p-6 rounded-xl shadow-lg h-full flex flex-col items-center justify-center text-center hover:bg-gray-800/80">
        <div className={`mb-4 bg-gradient-to-br ${gradientFrom} ${gradientTo} p-3 rounded-lg text-white group-hover:shadow-lg transition-all duration-300`} 
          style={{
            boxShadow: `0 0 0 rgba(0, 0, 0, 0)`,
            // Apply dynamic shadow on hover using inline styles and CSS variables
            "--tw-shadow-color": `rgba(var(--${colorName}-500-rgb), 0.2)`,
          } as React.CSSProperties}>
          {icon}
        </div>
        <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{title}</p>
      </div>
    </button>
  );
}