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
  ArrowRight
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

  // Loading state
  if (analyticsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // If no data available, show empty state
  if (!analyticsData || !userStats) {
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

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users className="h-5 w-5 text-primary" />}
          title="Total Users"
          value={(analyticsData?.totalUsers || 0).toLocaleString()}
          trend="Total registered users"
          trendUp={true}
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-green-500" />}
          title="User Types"
          value={Object.keys(
            analyticsData?.userTypeDistribution || {}
          ).length.toString()}
          trend="Different user types"
          trendUp={true}
        />
        <StatCard
          icon={<Building className="h-5 w-5 text-blue-500" />}
          title="Universities"
          value={(userStats?.universities || 0).toString()}
          trend="Partner institutions"
          trendUp={true}
        />
        <StatCard
          icon={<Calendar className="h-5 w-5 text-orange-500" />}
          title="Growth Rate"
          value={
            userGrowthData.length > 0 ? userGrowthData.length.toString() : "0"
          }
          trend="Data points available"
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
            <CardTitle className="text-lg">
              User Distribution Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8 justify-between items-center w-full">
              <div className="w-full md:w-1/2 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) =>
                        `${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {userTypeData.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={
                            entry.name === "Regular"
                              ? COLORS.REGULAR
                              : COLORS.UNIVERSITY
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} users`, name]}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ paddingTop: "20px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-center text-sm font-medium mt-2">
                  User Types
                </p>
              </div>

              <div className="w-full md:w-1/2 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) =>
                        `${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {planData.map((entry) => {
                        let color
                        if (entry.name === "Free") color = COLORS.FREE
                        else if (entry.name === "Premium")
                          color = COLORS.PREMIUM
                        else color = COLORS.UNIVERSITY

                        return <Cell key={`cell-${entry.name}`} fill={color} />
                      })}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} users`, name]}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ paddingTop: "20px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-center text-sm font-medium mt-2">
                  Subscription Plans
                </p>
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
