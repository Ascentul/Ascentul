import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Calendar, ArrowUpRight, ArrowDownRight, Loader2, AlertCircle } from 'lucide-react';
import { adminApiClient } from '@/lib/adminApiClient';
import { adminEndpoints } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Chart colors
const COLORS = ['#0C29AB', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Time frame options
type TimeFrame = 'day' | 'week' | 'month' | 'year';

export function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState<TimeFrame>('month');

  // Fetch user analytics
  const { 
    data: userAnalytics, 
    isLoading: isLoadingUsers,
    isError: isErrorUsers
  } = useQuery({
    queryKey: [adminEndpoints.analytics.users, timeframe],
    queryFn: () => adminApiClient.getUserAnalytics(timeframe),
  });

  // Fetch engagement analytics
  const { 
    data: engagementAnalytics, 
    isLoading: isLoadingEngagement,
    isError: isErrorEngagement
  } = useQuery({
    queryKey: [adminEndpoints.analytics.engagement, timeframe],
    queryFn: () => adminApiClient.getEngagementAnalytics(timeframe),
  });

  // Fetch revenue analytics
  const { 
    data: revenueAnalytics, 
    isLoading: isLoadingRevenue,
    isError: isErrorRevenue
  } = useQuery({
    queryKey: [adminEndpoints.analytics.revenue, timeframe],
    queryFn: () => adminApiClient.getRevenueAnalytics(timeframe),
  });

  // Fetch subscription analytics
  const { 
    data: subscriptionAnalytics, 
    isLoading: isLoadingSubscriptions,
    isError: isErrorSubscriptions
  } = useQuery({
    queryKey: [adminEndpoints.analytics.subscriptions, timeframe],
    queryFn: () => adminApiClient.getSubscriptionAnalytics(timeframe),
  });

  // Calculate loading and error states
  const isLoading = isLoadingUsers || isLoadingEngagement || isLoadingRevenue || isLoadingSubscriptions;
  const isError = isErrorUsers || isErrorEngagement || isErrorRevenue || isErrorSubscriptions;

  // Handle time frame change
  const handleTimeframeChange = (value: TimeFrame) => {
    setTimeframe(value);
  };

  // Render chart placeholders when loading
  const renderLoadingState = () => (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center h-64">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium">Failed to load analytics data</h3>
      <p className="text-muted-foreground">
        There was an error loading the analytics data. Please try again.
      </p>
    </div>
  );

  // Format dollar amounts
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Custom tooltip formatter for charts
  const formatTooltipValue = (value: number, name: string) => {
    if (name.toLowerCase().includes('revenue') || name.toLowerCase().includes('mrr')) {
      return formatCurrency(value);
    }
    return value;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={timeframe} onValueChange={handleTimeframeChange as (value: string) => void}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {isLoading ? renderLoadingState() : isError ? renderErrorState() : (
            <>
              {/* Overview Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      New Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userAnalytics?.currentPeriod?.newUsers || 0}
                    </div>
                    <div className="flex items-center text-xs mt-1">
                      {(userAnalytics?.changePercentage?.newUsers || 0) >= 0 ? (
                        <span className="text-green-500 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {Math.abs(userAnalytics?.changePercentage?.newUsers || 0)}%
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          {Math.abs(userAnalytics?.changePercentage?.newUsers || 0)}%
                        </span>
                      )}
                      <span className="text-muted-foreground ml-1">
                        vs. previous {timeframe}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userAnalytics?.currentPeriod?.activeUsers || 0}
                    </div>
                    <div className="flex items-center text-xs mt-1">
                      {(userAnalytics?.changePercentage?.activeUsers || 0) >= 0 ? (
                        <span className="text-green-500 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {Math.abs(userAnalytics?.changePercentage?.activeUsers || 0)}%
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          {Math.abs(userAnalytics?.changePercentage?.activeUsers || 0)}%
                        </span>
                      )}
                      <span className="text-muted-foreground ml-1">
                        vs. previous {timeframe}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      New Subscriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {subscriptionAnalytics?.currentPeriod?.newSubscriptions || 0}
                    </div>
                    <div className="flex items-center text-xs mt-1">
                      {(subscriptionAnalytics?.changePercentage?.newSubscriptions || 0) >= 0 ? (
                        <span className="text-green-500 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {Math.abs(subscriptionAnalytics?.changePercentage?.newSubscriptions || 0)}%
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          {Math.abs(subscriptionAnalytics?.changePercentage?.newSubscriptions || 0)}%
                        </span>
                      )}
                      <span className="text-muted-foreground ml-1">
                        vs. previous {timeframe}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      MRR
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueAnalytics?.currentPeriod?.mrr || 0)}
                    </div>
                    <div className="flex items-center text-xs mt-1">
                      {(revenueAnalytics?.changePercentage?.mrr || 0) >= 0 ? (
                        <span className="text-green-500 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {Math.abs(revenueAnalytics?.changePercentage?.mrr || 0)}%
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          {Math.abs(revenueAnalytics?.changePercentage?.mrr || 0)}%
                        </span>
                      )}
                      <span className="text-muted-foreground ml-1">
                        vs. previous {timeframe}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Main Overview Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Growth Overview</CardTitle>
                  <CardDescription>
                    User and subscription growth over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={userAnalytics?.timeline || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            if (timeframe === 'day') {
                              return value.substring(11, 16); // hour:minute
                            } else {
                              return value.substring(5, 10); // month-day
                            }
                          }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={formatTooltipValue}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totalUsers"
                          name="Total Users"
                          stroke="#0C29AB"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="activeUsers"
                          name="Active Users"
                          stroke="#00C49F"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="subscriptions"
                          name="Subscriptions"
                          stroke="#FFBB28"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {isLoading ? renderLoadingState() : isError ? renderErrorState() : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>New Users Over Time</CardTitle>
                    <CardDescription>
                      Number of new user signups over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={userAnalytics?.timeline || []}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              if (timeframe === 'day') {
                                return value.substring(11, 16); // hour:minute
                              } else {
                                return value.substring(5, 10); // month-day
                              }
                            }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="newUsers" name="New Users" fill="#0C29AB" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>User Types Distribution</CardTitle>
                    <CardDescription>
                      Distribution of users by subscription type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={userAnalytics?.userTypes || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {userAnalytics?.userTypes?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Retention</CardTitle>
                  <CardDescription>
                    User retention by cohort (%)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    {userAnalytics?.retention ? (
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th className="text-left p-2 font-medium">Cohort</th>
                            {userAnalytics.retention.weeks.map((week) => (
                              <th key={week} className="text-center p-2 font-medium">
                                Week {week}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {userAnalytics.retention.data.map((row) => (
                            <tr key={row.cohort}>
                              <td className="text-left p-2 font-medium">
                                {row.cohort}
                              </td>
                              {row.values.map((value, i) => (
                                <td 
                                  key={i} 
                                  className="text-center p-2"
                                  style={{
                                    backgroundColor: `rgba(12, 41, 171, ${value / 100})`,
                                    color: value > 50 ? 'white' : 'inherit'
                                  }}
                                >
                                  {value}%
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        No retention data available for the selected timeframe.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          {isLoading ? renderLoadingState() : isError ? renderErrorState() : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Usage</CardTitle>
                    <CardDescription>
                      Most used features in the application
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={engagementAnalytics?.featureUsage || []}
                          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            tick={{ fontSize: 12 }} 
                          />
                          <Tooltip />
                          <Bar dataKey="value" name="Usage Count" fill="#0C29AB" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Session Duration</CardTitle>
                    <CardDescription>
                      Average session duration by day
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={engagementAnalytics?.sessionDuration || []}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              return value.substring(5, 10); // month-day
                            }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }} 
                            tickFormatter={(value) => `${value} min`} 
                          />
                          <Tooltip formatter={(value) => [`${value} min`, 'Avg. Session']} />
                          <Line
                            type="monotone"
                            dataKey="value"
                            name="Session Duration"
                            stroke="#00C49F"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Engagement Score</CardTitle>
                  <CardDescription>
                    Engagement score based on activity level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={engagementAnalytics?.engagementScore || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            return value.substring(5, 10); // month-day
                          }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }} 
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}`} 
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}`, 'Engagement Score']} 
                        />
                        <Line
                          type="monotone"
                          dataKey="free"
                          name="Free Users"
                          stroke="#FFBB28"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="premium"
                          name="Premium Users"
                          stroke="#0C29AB"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          {isLoading ? renderLoadingState() : isError ? renderErrorState() : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      MRR
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueAnalytics?.currentPeriod?.mrr || 0)}
                    </div>
                    <div className="flex items-center text-xs mt-1">
                      {(revenueAnalytics?.changePercentage?.mrr || 0) >= 0 ? (
                        <span className="text-green-500 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {Math.abs(revenueAnalytics?.changePercentage?.mrr || 0)}%
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          {Math.abs(revenueAnalytics?.changePercentage?.mrr || 0)}%
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      ARR
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueAnalytics?.currentPeriod?.arr || 0)}
                    </div>
                    <div className="flex items-center text-xs mt-1">
                      {(revenueAnalytics?.changePercentage?.arr || 0) >= 0 ? (
                        <span className="text-green-500 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {Math.abs(revenueAnalytics?.changePercentage?.arr || 0)}%
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          {Math.abs(revenueAnalytics?.changePercentage?.arr || 0)}%
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      LTV
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(revenueAnalytics?.currentPeriod?.ltv || 0)}
                    </div>
                    <div className="flex items-center text-xs mt-1">
                      {(revenueAnalytics?.changePercentage?.ltv || 0) >= 0 ? (
                        <span className="text-green-500 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {Math.abs(revenueAnalytics?.changePercentage?.ltv || 0)}%
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          {Math.abs(revenueAnalytics?.changePercentage?.ltv || 0)}%
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Churn Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(revenueAnalytics?.currentPeriod?.churnRate || 0).toFixed(1)}%
                    </div>
                    <div className="flex items-center text-xs mt-1">
                      {(revenueAnalytics?.changePercentage?.churnRate || 0) <= 0 ? (
                        <span className="text-green-500 flex items-center">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          {Math.abs(revenueAnalytics?.changePercentage?.churnRate || 0)}%
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {Math.abs(revenueAnalytics?.changePercentage?.churnRate || 0)}%
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Growth</CardTitle>
                  <CardDescription>
                    Monthly recurring revenue over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={revenueAnalytics?.timeline || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            return value.substring(5, 10); // month-day
                          }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                        />
                        <Bar 
                          dataKey="revenue" 
                          name="Revenue" 
                          fill="#0C29AB" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Plan</CardTitle>
                    <CardDescription>
                      Distribution of revenue by subscription plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revenueAnalytics?.revenueByPlan || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {revenueAnalytics?.revenueByPlan?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Churn</CardTitle>
                    <CardDescription>
                      Churn rate over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={subscriptionAnalytics?.churnTimeline || []}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              return value.substring(5, 10); // month-day
                            }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }} 
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip formatter={(value) => [`${value}%`, 'Churn Rate']} />
                          <Line
                            type="monotone"
                            dataKey="churnRate"
                            name="Churn Rate"
                            stroke="#FF8042"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}