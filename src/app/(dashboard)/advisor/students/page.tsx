'use client';

import { useState, useMemo } from 'react';
import { AdvisorGate } from '@/components/advisor/AdvisorGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentsTable } from '@/components/advisor/StudentsTable';
import { StudentFilters } from '@/components/advisor/StudentFilters';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Users } from 'lucide-react';

function AdvisorStudentsPageContent() {
  const { user } = useUser();
  const clerkId = user?.id;

  // Fetch caseload data (errors are caught by ErrorBoundary wrapper)
  const caseloadData = useQuery(
    api.advisor_students.getMyCaseload,
    clerkId ? { clerkId } : 'skip'
  );

  // Filter state
  const [selectedMajor, setSelectedMajor] = useState('all');
  const [selectedGradYear, setSelectedGradYear] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Extract unique majors and grad years from data
  const { majors, gradYears } = useMemo(() => {
    if (!caseloadData) return { majors: [], gradYears: [] };

    const majorsSet = new Set<string>();
    const yearsSet = new Set<string>();

    caseloadData.forEach((student) => {
      if (student.major) majorsSet.add(student.major);
      if (student.graduation_year) yearsSet.add(student.graduation_year);
    });

    return {
      majors: Array.from(majorsSet).sort(),
      gradYears: Array.from(yearsSet).sort(),
    };
  }, [caseloadData]);

  // Apply filters
  const filteredStudents = useMemo(() => {
    if (!caseloadData) return [];

    return caseloadData.filter((student) => {
      // Major filter
      if (selectedMajor !== 'all' && student.major !== selectedMajor) {
        return false;
      }

      // Grad year filter
      if (selectedGradYear !== 'all' && student.graduation_year !== selectedGradYear) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        const isAtRisk = student.metadata?.isAtRisk || false;
        const hasApps = (student.metadata?.activeApplicationsCount || 0) > 0;
        const hasOffer = student.metadata?.hasOffer || false;

        if (selectedStatus === 'at-risk' && !isAtRisk) return false;
        if (selectedStatus === 'has-offer' && !hasOffer) return false;
        if (selectedStatus === 'active' && !hasApps) return false;
        if (selectedStatus === 'inactive' && hasApps) return false;
      }

      return true;
    });
  }, [caseloadData, selectedMajor, selectedGradYear, selectedStatus]);

  const hasActiveFilters =
    selectedMajor !== 'all' ||
    selectedGradYear !== 'all' ||
    selectedStatus !== 'all';

  const handleClearFilters = () => {
    setSelectedMajor('all');
    setSelectedGradYear('all');
    setSelectedStatus('all');
  };

  return (
    <AdvisorGate requiredFlag='advisor.students'>
      <div className='container mx-auto p-6 space-y-6'>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
            <p className="text-muted-foreground mt-1">
              Manage your student caseload
            </p>
          </div>
        </div>

        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Caseload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <StudentFilters
            selectedMajor={selectedMajor}
            selectedGradYear={selectedGradYear}
            selectedStatus={selectedStatus}
            onMajorChange={setSelectedMajor}
            onGradYearChange={setSelectedGradYear}
            onStatusChange={setSelectedStatus}
            onClearFilters={handleClearFilters}
            majors={majors}
            gradYears={gradYears}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Table */}
          <StudentsTable
            students={filteredStudents}
            isLoading={caseloadData === undefined}
          />
        </CardContent>
      </Card>
    </div>
  </AdvisorGate>
  );
}

export default function AdvisorStudentsPage() {
  return (
    <ErrorBoundary>
      <AdvisorStudentsPageContent />
    </ErrorBoundary>
  );
}
