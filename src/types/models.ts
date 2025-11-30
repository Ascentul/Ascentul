// Shared domain models used across Convex, API routes, and UI
// Keep these in sync with Convex validators to avoid drift.

export type ApplicationStage =
  | 'Prospect'
  | 'Applied'
  | 'Interview'
  | 'Offer'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn'
  | 'Archived';

export interface Application {
  _id?: string;
  job_title: string;
  company: string;
  status?: string;
  stage?: ApplicationStage;
  next_step?: string;
  next_step_date?: number;
  updated_at?: number;
}

export interface FollowUp {
  _id?: string;
  contact_id?: string;
  application_id?: string;
  type?: string;
  description?: string;
  due_at?: number;
  status?: string;
  notes?: string;
  created_at?: number;
}

export interface Session {
  _id?: string;
  student_id?: string;
  title?: string;
  session_type?: string;
  start_at?: number;
  end_at?: number;
  duration_minutes?: number;
  location?: string;
  meeting_url?: string;
  notes?: string;
  visibility?: string;
  status?: string;
  version?: number;
}

export interface Goal {
  _id?: string;
  title: string;
  status?: string;
  description?: string;
  target_date?: number;
  completed?: boolean;
}
