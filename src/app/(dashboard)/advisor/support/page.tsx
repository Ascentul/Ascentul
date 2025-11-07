"use client";

import { AdvisorGate } from '@/components/advisor/AdvisorGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export default function AdvisorSupportPage() {
  return (
    <AdvisorGate requiredFlag='advisor.support'>
      <div className='container mx-auto p-6 space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Support</h1>
            <p className='text-muted-foreground mt-1'>
              Get help with the advisor platform
            </p>
          </div>
        </div>

        {/* Empty State */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <HelpCircle className='h-5 w-5' />
              Help & Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col items-center justify-center h-[400px] text-center space-y-4'>
            <HelpCircle className='h-16 w-16 text-muted-foreground/50' />
            <div className='space-y-2'>
              <p className='text-lg font-medium'>Support resources coming soon</p>
              <p className='text-sm text-muted-foreground max-w-md'>
                This page will provide access to advisor documentation, FAQs,
                tutorial videos, and a support ticket system.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdvisorGate>
  );
}
