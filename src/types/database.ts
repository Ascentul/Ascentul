import { Database } from './supabase';

// Export the User type from Supabase database types
export type User = Database['public']['Tables']['users']['Row'] & {
  // Add any frontend-specific fields that need to be mapped from snake_case
  userType?: string;
  profileImage?: string;
  careerSummary?: string;
  linkedInUrl?: string;
  remotePreference?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  subscriptionCycle?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionExpiresAt?: string;
  emailVerified?: boolean;
  verificationToken?: string;
  verificationExpires?: string;
  pendingEmail?: string;
  pendingEmailToken?: string;
  pendingEmailExpires?: string;
  universityId?: number;
  universityName?: string;
  passwordLastChanged?: string;
  createdAt?: string;
  needsUsername?: boolean;
  onboardingCompleted?: boolean;
  onboardingData?: any;
};

export type InsertUser = Database['public']['Tables']['users']['Insert'];
export type UpdateUser = Database['public']['Tables']['users']['Update'];

// Define types for other tables that were previously in schema.ts
export interface Goal {
  id: number;
  userId: string;
  title: string;
  description?: string;
  targetDate?: Date | string;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  progress?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertGoal = Omit<Goal, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface WorkHistory {
  id: number;
  userId: string;
  company: string;
  position: string;
  startDate: Date | string;
  endDate?: Date | string;
  description?: string;
  current: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertWorkHistory = Omit<WorkHistory, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface EducationHistory {
  id: number;
  userId: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: Date | string;
  endDate?: Date | string;
  description?: string;
  current: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertEducationHistory = Omit<EducationHistory, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface Resume {
  id: number;
  userId: string;
  title: string;
  content: string;
  version: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertResume = Omit<Resume, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface CoverLetter {
  id: number;
  userId: string;
  title: string;
  content: string;
  version: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertCoverLetter = Omit<CoverLetter, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface InterviewQuestion {
  id: number;
  userId: string;
  question: string;
  answer?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertInterviewQuestion = Omit<InterviewQuestion, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface InterviewPractice {
  id: number;
  userId: string;
  question: string;
  answer?: string;
  feedback?: string;
  score?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertInterviewPractice = Omit<InterviewPractice, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface Achievement {
  id: number;
  name: string;
  description: string;
  xpValue: number;
  icon?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertAchievement = Omit<Achievement, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface UserAchievement {
  id: number;
  userId: string;
  achievementId: number;
  earnedAt: Date | string;
  createdAt: Date | string;
}

export type InsertUserAchievement = Omit<UserAchievement, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface ContactInteraction {
  id: number;
  userId: string;
  contactId: number;
  type: string;
  notes?: string;
  date: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertContactInteraction = Omit<ContactInteraction, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface Recommendation {
  id: number;
  userId: string;
  type: string;
  title: string;
  description: string;
  link?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertRecommendation = Omit<Recommendation, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface AiCoachConversation {
  id: number;
  userId: string;
  title: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertAiCoachConversation = Omit<AiCoachConversation, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertContactMessage = Omit<ContactMessage, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface NetworkingContact {
  id: number;
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  linkedInUrl?: string;
  relationshipType?: string;
  notes?: string;
  lastContactDate?: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertNetworkingContact = Omit<NetworkingContact, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface AiCoachMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date | string;
}

export type InsertAiCoachMessage = Omit<AiCoachMessage, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface DailyRecommendation {
  id: number;
  userId: string;
  title: string;
  description: string;
  type: string;
  completed: boolean;
  date: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertDailyRecommendation = Omit<DailyRecommendation, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface UserReview {
  id: number;
  userId: string;
  rating: number;
  feedback: string;
  isPublic: boolean;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  moderatedAt?: Date | string;
  moderatedBy?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertUserReview = Omit<UserReview, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface XpHistory {
  id: number;
  userId: string;
  amount: number;
  reason: string;
  createdAt: Date | string;
}

export type InsertXpHistory = Omit<XpHistory, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface InterviewProcess {
  id: number;
  userId: string;
  company: string;
  position: string;
  status: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertInterviewProcess = Omit<InterviewProcess, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface InterviewStage {
  id: number;
  processId: number;
  name: string;
  date?: Date | string;
  notes?: string;
  status: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertInterviewStage = Omit<InterviewStage, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface FollowupAction {
  id: number;
  contactId: number;
  title: string;
  description?: string;
  dueDate?: Date | string;
  completed: boolean;
  completedAt?: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertFollowupAction = Omit<FollowupAction, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface MentorChatConversation {
  id: number;
  userId: string;
  title: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertMentorChatConversation = Omit<MentorChatConversation, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface MentorChatMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date | string;
}

export type InsertMentorChatMessage = Omit<MentorChatMessage, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface Certification {
  id: number;
  userId: string;
  name: string;
  issuer: string;
  issueDate?: Date | string;
  expirationDate?: Date | string;
  credentialId?: string;
  credentialUrl?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertCertification = Omit<Certification, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface UserPersonalAchievement {
  id: number;
  userId: string;
  title: string;
  description?: string;
  date?: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertUserPersonalAchievement = Omit<UserPersonalAchievement, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface CareerPath {
  id: number;
  userId: string;
  name: string;
  pathData: any;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertCareerPath = Omit<CareerPath, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface SkillStackerPlan {
  id: number;
  userId: string;
  title: string;
  description?: string;
  targetSkill: string;
  currentLevel: number;
  targetLevel: number;
  estimatedTimeInWeeks: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertSkillStackerPlan = Omit<SkillStackerPlan, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface SkillStackerTask {
  id: number;
  planId: number;
  title: string;
  description?: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTimeInHours: number;
  completed: boolean;
  completedAt?: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface Skill {
  id: number;
  userId: string;
  name: string;
  category?: string;
  proficiencyLevel?: number;
  yearsOfExperience?: number;
  isHighlighted?: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertSkill = Omit<Skill, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface Language {
  id: number;
  userId: string;
  name: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'native';
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertLanguage = Omit<Language, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface JobListing {
  id: number;
  userId: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  url?: string;
  salary?: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'accepted' | 'declined';
  notes?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertJobListing = Omit<JobListing, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface JobApplication {
  id: number;
  userId: string;
  jobId: number;
  status: 'draft' | 'submitted' | 'interviewing' | 'offered' | 'rejected' | 'accepted' | 'declined';
  appliedDate?: Date | string;
  notes?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertJobApplication = Omit<JobApplication, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface ApplicationWizardStep {
  id: number;
  applicationId: number;
  stepNumber: number;
  stepType: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  data?: any;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type InsertApplicationWizardStep = Omit<ApplicationWizardStep, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};

export interface SupportTicket {
  id: number;
  userId?: string;
  userEmail?: string;
  userName?: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  assignedTo?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  resolvedAt?: Date | string;
}

export type InsertSupportTicket = Omit<SupportTicket, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: Date | string;
};
