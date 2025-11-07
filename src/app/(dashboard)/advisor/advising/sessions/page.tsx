'use client';

import { AdvisorGate } from '@/components/advisor/AdvisorGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic } from 'lucide-react';

export default function AdvisorSessionsPage() {
  return (
    <AdvisorGate requiredFlag="advisor.advising">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage advising sessions
            </p>
          </div>
        </div>

        {/* Empty State */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Session History
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
            <Mic className="h-16 w-16 text-muted-foreground/50" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Session management coming in PR 6</p>
              <p className="text-sm text-muted-foreground max-w-md">
                This page will display a searchable, filterable table of all advising sessions
                with autosave notes, session types, privacy controls, and follow-up creation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdvisorGate>
  );
}
