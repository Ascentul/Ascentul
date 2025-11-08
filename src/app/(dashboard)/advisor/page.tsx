'use client';

import { AdvisorGate } from '@/components/advisor/AdvisorGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityChart } from '@/components/advisor/analytics/ActivityChart';
import { UpcomingItems } from '@/components/advisor/analytics/UpcomingItems';
import { ReviewQueueSnapshot } from '@/components/advisor/analytics/ReviewQueueSnapshot';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileEdit,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

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

  // Loading state is handled by checking for undefined
  // Convex queries return undefined while loading, never null

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
                &gt; 5 apps, no offers
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
          <ActivityChart
            data={activityChart || []}
            isLoading={activityChart === undefined}
          />

          <UpcomingItems
            items={upcomingItems || []}
            isLoading={upcomingItems === undefined}
          />
        </div>

        {/* Review Queue Snapshot */}
        <ReviewQueueSnapshot
          reviews={reviewQueue || []}
          isLoading={reviewQueue === undefined}
        />
      </div>
    </AdvisorGate>
  );
}
