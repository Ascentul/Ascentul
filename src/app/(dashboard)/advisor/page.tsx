"use client";

import { AdvisorGate } from "@/components/advisor/AdvisorGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileEdit,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

export default function AdvisorDashboardPage() {
  const { user } = useUser();
  const clerkId = user?.id;

  // Fetch dashboard data
  const stats = useQuery(
    api.advisor_dashboard.getDashboardStats,
    clerkId ? { clerkId } : "skip"
  );

  const upcomingItems = useQuery(
    api.advisor_dashboard.getUpcomingItems,
    clerkId ? { clerkId } : "skip"
  );

  const activityChart = useQuery(
    api.advisor_dashboard.getActivityChart,
    clerkId ? { clerkId } : "skip"
  );

  const reviewQueue = useQuery(
    api.advisor_dashboard.getReviewQueueSnapshot,
    clerkId ? { clerkId } : "skip"
  );

  return (
    <AdvisorGate>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Advisor Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your caseload overview
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                My Caseload
              </CardTitle>
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalStudents ?? "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalStudents === 1 ? "student" : "students"} assigned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Applications
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.activeApplications ?? "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                Prospect/Applied/Interview stages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sessions This Week
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.sessionsThisWeek ?? "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Reviews Waiting
              </CardTitle>
              <FileEdit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.pendingReviews ?? "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                Resumes & cover letters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                At-Risk Students
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.atRiskStudents ?? "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                {'>'} 5 apps, no offers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Apps/Student
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.averageApplicationsPerStudent?.toFixed(1) ?? "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                Active applications
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Session Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityChart && activityChart.length > 0 ? (
                <div className="space-y-2">
                  {activityChart.map((week) => (
                    <div key={week.date} className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground w-24">
                        {format(new Date(week.date), "MMM d")}
                      </div>
                      <div className="flex-1 bg-secondary h-6 rounded-md overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${(week.count / 10) * 100}%` }}
                        />
                      </div>
                      <div className="text-sm font-medium w-8 text-right">
                        {week.count}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                  No session data for the last 4 weeks
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Items */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming (Next 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingItems && upcomingItems.length > 0 ? (
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {upcomingItems.slice(0, 5).map((item) => (
                    <div key={item._id} className="flex items-start gap-3 text-sm">
                      {item.type === "session" ? (
                        <Calendar className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.student_name} • {format(new Date(item.date), "MMM d, h:mm a")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                  No upcoming sessions or follow-ups
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Review Queue Snapshot */}
        <Card>
          <CardHeader>
            <CardTitle>Review Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewQueue && reviewQueue.length > 0 ? (
              <div className="space-y-3">
                {reviewQueue.map((review) => (
                  <div key={review._id} className="flex items-center gap-3 p-3 border rounded-md">
                    <FileEdit className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {review.asset_type === "resume" ? "Resume" : "Cover Letter"} Review
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {review.student_name} • Submitted {format(new Date(review.submitted_at), "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {review.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[150px] flex items-center justify-center text-sm text-muted-foreground">
                No pending reviews
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdvisorGate>
  );
}
