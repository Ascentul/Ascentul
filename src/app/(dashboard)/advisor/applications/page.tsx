"use client";

import { useState } from "react";
import { AdvisorGate } from "@/components/advisor/AdvisorGate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApplicationKanban } from "@/components/advisor/applications/ApplicationKanban";
import { ApplicationTable } from "@/components/advisor/applications/ApplicationTable";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import {
  LayoutGrid,
  Table as TableIcon,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
} from "lucide-react";

export default function AdvisorApplicationsPage() {
  const { user } = useUser();
  const clerkId = user?.id;

  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  const applicationsByStage = useQuery(
    api.advisor_applications.getApplicationsByStage,
    clerkId ? { clerkId } : "skip"
  );

  const applications = useQuery(
    api.advisor_applications.getApplicationsForCaseload,
    clerkId ? { clerkId } : "skip"
  );

  const stats = useQuery(
    api.advisor_applications.getApplicationStats,
    clerkId ? { clerkId } : "skip"
  );

  return (
    <AdvisorGate requiredFlag="advisor.applications">
      <ErrorBoundary
        fallback={
          <div className="container mx-auto p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Applications</AlertTitle>
              <AlertDescription>
                There was an error loading application data. Please try refreshing the page.
                If the problem persists, contact support.
              </AlertDescription>
            </Alert>
          </div>
        }
      >
        <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
            <p className="text-muted-foreground mt-1">
              Track student application pipelines
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Table
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? "-"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active ?? "-"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.offers ?? "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {stats?.accepted ?? "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Action</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.needingAction ?? "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conv. Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.conversionRate ?? "-"}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {viewMode === "kanban" ? (
                <LayoutGrid className="h-5 w-5" />
              ) : (
                <TableIcon className="h-5 w-5" />
              )}
              Application Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {viewMode === "kanban" ? (
              <ApplicationKanban
                applicationsByStage={applicationsByStage || {}}
                isLoading={applicationsByStage === undefined}
                clerkId={clerkId}
                onRefresh={() => {
                  // Convex will automatically refetch when data changes
                  // No manual refresh needed
                }}
              />
            ) : (
              <ApplicationTable
                applications={applications || []}
                isLoading={applications === undefined}
              />
            )}
          </CardContent>
        </Card>
        </div>
      </ErrorBoundary>
    </AdvisorGate>
  );
}
