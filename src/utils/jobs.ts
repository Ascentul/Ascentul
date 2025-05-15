/**
 * Job Interfaces
 * These interfaces define the structure of job data across the application.
 */

export interface Job {
  id: string;
  source: string;
  sourceId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  fullDescription?: string;
  applyUrl: string;
  salary?: string;
  datePosted?: string;
  jobType?: string;
  isRemote?: boolean;
  logo?: string;
  tags?: string[];
  benefits?: string[];
  requirements?: string[];
  isSaved?: boolean;
  isApplied?: boolean;
}

export interface SavedJob extends Job {
  savedDate: string;
  notes?: string;
}

export interface AppliedJob extends Job {
  applicationDate: string;
  status: 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';
  resumeId?: string;
  coverLetterId?: string;
  notes?: string;
}