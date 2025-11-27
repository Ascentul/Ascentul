"use client";

import { AdvisorGate } from "@/components/advisor/AdvisorGate";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react";

export default function AdvisorAnalyticsPage() {
  return (
    <AppShell>
      <AdvisorGate requiredFlag="advisor.analytics">
        <div className="container mx-auto p-6 space-y-6">
          <PageHeader
            title="Analytics"
            description="Insights into your advising effectiveness"
          />

        {/* Empty State */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Advising Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
            <LineChart className="h-16 w-16 text-muted-foreground/50" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Analytics dashboard coming soon</p>
              <p className="text-sm text-muted-foreground max-w-md">
                This page will display caseload metrics, stage velocity charts, offer acceptance rates,
                engagement trends, and privacy-aware telemetry with hashed student IDs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </AdvisorGate>
    </AppShell>
  );
}
