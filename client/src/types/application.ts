// Application type definition
export interface Application {
  id: number;
  status: string;
  appliedAt?: string;
  submittedAt?: string;
  applicationDate?: string;
  company: string;
  position: string;
  jobTitle?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  jobLink?: string;
  source?: string;
  companyName?: string; // Alternate to company
  title?: string; // Alternate to position
  description?: string;
  externalJobUrl?: string;
}

// Interview stage type definition
export interface InterviewStage {
  id: number;
  applicationId: number;
  type: string;
  status?: string;
  scheduledDate?: string;
  location?: string;
  interviewers?: string[];
  notes?: string | null;
  feedback?: string | null;
  outcome?: string | null;
  nextSteps?: string | null;
  createdAt: string;
  updatedAt: string;
  completedDate?: string | null;
  application?: Application;
}

// Follow-up action type definition
export interface FollowupAction {
  id: number;
  applicationId: number;
  processId?: number | null;
  stageId?: number | null;
  type: string;
  description: string;
  dueDate?: string | null;
  completed: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  completedDate?: string | null;
  application?: Application;
}