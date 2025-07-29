import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import {
  Users,
  Activity,
  Briefcase,
  BarChart4,
  Building,
  Calendar,
  TrendingUp,
  BookOpen,
  ExternalLink,
  ArrowRight,
  CreditCard,
  DollarSign,
  Percent,
  Target
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
} from "recharts"

export default function AdminOverview() {
  // Consistent color palette as requested
  const COLORS = {
    FREE: "#1E90FF", // Blue
    PREMIUM: "#28A745", // Green
    UNIVERSITY: "#F4B400", // Orange
    REGULAR: "#6F42C1" // Purple
  }

  // Fetch real admin analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/analytics")
      return response
    }
  })

  // Fetch user statistics
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/users/stats"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/users/stats")
      return response
    }
  })

  // Fetch subscription analytics
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/admin/subscription-analytics"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/subscription-analytics")
      return response
    }
  })

  // Loading state
  if (analyticsLoading || statsLoading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // If no data available, show empty state
  if (!analyticsData || !userStats || !subscriptionData) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <BarChart4 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">
              No Analytics Data Available
            </h3>
            <p className="text-muted-foreground mb-6">
              Analytics data will appear as users begin using the platform.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Transform data for charts
  const userGrowthData = analyticsData?.userGrowth || []
  const userTypeData = Object.entries(
    analyticsData?.userTypeDistribution || {}
  ).map(([type, count]) => ({
    name:
      type === "user"
        ? "Regular"
        : type === "university_user"
        ? "University"
        : type,
    value: count
  }))
  const planData = [
    { name: "Free", value: userStats?.freeUsers || 0 },
    { name: "Premium", value: userStats?.premiumUsers || 0 },
    { name: "University", value: userStats?.universityUsers || 0 }
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Last updated:</span>
          <span className="text-sm font-medium">
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Subscription Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
          title="Monthly Revenue"
          value={`$${(subscriptionData?.totalMRR || 0).toLocaleString()}`}
          trend="Total MRR"
          trendUp={true}
        />
        <StatCard
          icon={<Target className="h-5 w-5 text-blue-500" />}
          title="Active Subscriptions"
          value={(subscriptionData?.activeSubscriptions || 0).toLocaleString()}
          trend="Paying customers"
          trendUp={true}
        />
        <StatCard
          icon={<Percent className="h-5 w-5 text-purple-500" />}
          title="Conversion Rate"
          value={`${subscriptionData?.conversionRate || '0.0'}%`}
          trend="Free to paid"
          trendUp={true}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-primary" />}
          title="Total Users"
          value={(subscriptionData?.totalUsers || 0).toLocaleString()}
          trend="All registered users"
          trendUp={true}
        />
      </div>

      {/* Subscription Breakdown Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users className="h-5 w-5 text-gray-500" />}
          title="Free Users"
          value={(subscriptionData?.freeUsers || 0).toLocaleString()}
          trend="On free plan"
          trendUp={false}
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5 text-amber-500" />}
          title="Premium Users"
          value={(subscriptionData?.premiumUsers || 0).toLocaleString()}
          trend={`$${subscriptionData?.premiumMRR || 0} MRR`}
          trendUp={true}
        />
        <StatCard
          icon={<Building className="h-5 w-5 text-blue-500" />}
          title="University Users"
          value={(subscriptionData?.universityUsers || 0).toLocaleString()}
          trend={`$${subscriptionData?.universityMRR || 0} MRR`}
          trendUp={true}
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-red-500" />}
          title="Past Due"
          value={(subscriptionData?.pastDueSubscriptions || 0).toLocaleString()}
          trend="Needs attention"
          trendUp={false}
        />
      </div>

      {/* Subscription Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Subscription Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Subscription Growth (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionData?.subscriptionGrowth?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={subscriptionData.subscriptionGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value, name) => [
                      name === 'newSubscriptions' ? `${value} new subs` : `$${value}`,
                      name === 'newSubscriptions' ? 'New Subscriptions' : 'MRR Impact'
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="newSubscriptions"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="newSubscriptions"
                  />
                  <Line
                    type="monotone"
                    dataKey="mrr"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="mrr"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No subscription growth data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart4 className="h-5 w-5" />
              Subscription Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionData?.planDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subscriptionData.planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subscriptionData.planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[
                        '#94a3b8', // Free - gray
                        '#f59e0b', // Premium - amber
                        '#3b82f6'  // University - blue
                      ][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} users`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No plan distribution data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Subscription Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Billing Cycle Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing Cycle Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionData?.billingCycleDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subscriptionData.billingCycleDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No billing cycle data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionData?.subscriptionStatusBreakdown?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subscriptionData.subscriptionStatusBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subscriptionData.subscriptionStatusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} subscriptions`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No subscription status data available
              </div>
            )}
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
                  { name: "Application Tracker", usage: 83 },
                  { name: "Career Goal Tracker", usage: 72 },
                  { name: "Network Hub", usage: 68 },
                  { name: "CareerPath Explorer", usage: 76 },
                  { name: "Project Portfolio", usage: 70 },
                  { name: "Resume Studio", usage: 78 },
                  { name: "Cover Letter Studio", usage: 65 },
                  { name: "AI Career Coach", usage: 91 }
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  label={{
                    value: "Usage %",
                    angle: -90,
                    position: "insideLeft"
                  }}
                />
                <Tooltip />
                <Bar dataKey="usage" fill="#0C29AB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string
  trend: string
  trendUp: boolean
}

function StatCard({ icon, title, value, trend, trendUp }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="bg-muted/50 p-2 rounded-md">{icon}</div>
          <div
            className={`flex items-center text-xs font-medium ${
              trendUp ? "text-green-500" : "text-red-500"
            }`}
          >
            {trendUp ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : (
              <TrendingUp className="mr-1 h-3 w-3 transform rotate-180" />
            )}
            <span>{trend}</span>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
