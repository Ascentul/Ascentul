/**
 * Job Provider Interface
 * This defines the standard interface for job source providers
 */

import { Job } from '@shared/jobs';
import { zipRecruiterProvider } from './ziprecruiter';
import { mockProvider } from './mock-provider';

// Search parameters interface
export interface JobSearchParams {
  query: string;
  location?: string;
  jobType?: string;
  isRemote?: boolean;
  page: number;
  pageSize: number;
}

// Job provider interface
export interface JobProvider {
  id: string;
  name: string;
  searchJobs: (params: JobSearchParams) => Promise<Job[]>;
  getJob: (id: string) => Promise<Job | null>;
  applyToJob?: (id: string, resumeData: any) => Promise<{ success: boolean; message: string }>;
}

// Initialize and export job providers
export const jobProviders: Record<string, JobProvider> = {
  ziprecruiter: zipRecruiterProvider,
  mock: mockProvider,
};

// Log registered providers
Object.values(jobProviders).forEach(provider => {

});