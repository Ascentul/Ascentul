import { pool } from "./db";
import {
  users,
  type User,
  type InsertUser,
  goals,
  type Goal,
  type InsertGoal,
  workHistory,
  type WorkHistory,
  type InsertWorkHistory,
  educationHistory,
  type EducationHistory,
  type InsertEducationHistory,
  resumes,
  type Resume,
  type InsertResume,
  coverLetters,
  type CoverLetter,
  type InsertCoverLetter,
  interviewQuestions,
  type InterviewQuestion,
  type InsertInterviewQuestion,
  interviewPractice,
  type InterviewPractice,
  type InsertInterviewPractice,
  achievements,
  type Achievement,
  type InsertAchievement,
  userAchievements,
  type UserAchievement,
  contactInteractions,
  type ContactInteraction,
  type InsertContactInteraction,
  type InsertUserAchievement,
  recommendations,
  type Recommendation,
  type InsertRecommendation,
  aiCoachConversations,
  type AiCoachConversation,
  contactMessages,
  type ContactMessage,
  type InsertContactMessage,
  type InsertAiCoachConversation,
  networkingContacts,
  type NetworkingContact,
  type InsertNetworkingContact,
  aiCoachMessages,
  type AiCoachMessage,
  type InsertAiCoachMessage,
  userReviews,
  type UserReview,
  type InsertUserReview,
  xpHistory,
  type XpHistory,
  type InsertXpHistory,
  interviewProcesses,
  type InterviewProcess,
  type InsertInterviewProcess,
  interviewStages,
  jobListings,
  type JobListing,
  type InsertJobListing,
  jobApplications,
  type JobApplication,
  type InsertJobApplication,
  applicationWizardSteps,
  type ApplicationWizardStep,
  type InsertApplicationWizardStep,
  type InterviewStage,
  type InsertInterviewStage,
  followupActions,
  type FollowupAction,
  type InsertFollowupAction,
  mentorChatConversations,
  type MentorChatConversation,
  type InsertMentorChatConversation,
  mentorChatMessages,
  type MentorChatMessage,
  type InsertMentorChatMessage,
  certifications,
  type Certification,
  type InsertCertification,
  userPersonalAchievements,
  type UserPersonalAchievement,
  type InsertUserPersonalAchievement,
  careerPaths,
  type CareerPath,
  type InsertCareerPath,
  skillStackerPlans,
  type SkillStackerPlan,
  type InsertSkillStackerPlan,
  type SkillStackerTask,
  skills,
  type Skill,
  type InsertSkill,
  languages,
  type Language,
  type InsertLanguage
} from "@shared/schema";
import session from "express-session";
import { sessionStore } from "./session-store";
import { db } from "./db";
import { eq, sql, desc } from "drizzle-orm";

export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User management for scheduled tasks
  getAllActiveUsers(): Promise<User[]>;
  
  // Contact interaction operations
  updateContactInteraction(id: number, data: Partial<ContactInteraction>): Promise<ContactInteraction | undefined>;
  deleteContactInteraction(id: number): Promise<boolean>;
  
  // User review operations
  createUserReview(userId: number, reviewData: InsertUserReview): Promise<UserReview>;

  // Career path operations
  saveCareerPath(userId: number, name: string, pathData: any): Promise<CareerPath>;
  getUserCareerPaths(userId: number): Promise<CareerPath[]>;
  getCareerPath(id: number): Promise<CareerPath | undefined>;
  deleteCareerPath(id: number): Promise<boolean>;
  
  // Skill operations
  createSkill(skill: InsertSkill | any): Promise<Skill>;
  updateSkill(id: number, data: Partial<Skill>): Promise<Skill | undefined>;
  deleteSkill(id: number): Promise<boolean>;
  getUserSkills(userId: number): Promise<Skill[]>;

  // System operations
  getSystemMetrics(): Promise<{
    status: string;
    uptime: number;
    lastIncident: string;
    lastChecked: string;
  }>;

  getComponentStatus(): Promise<{
    id: string;
    name: string;
    status: string;
    health: number;
    responseTime: string;
    icon: string;
    details?: {
      description: string;
      metrics: {
        name: string;
        value: string;
        change?: string;
        trend?: 'up' | 'down' | 'stable';
      }[];
      issues?: {
        id: string;
        title: string;
        description: string;
        severity: string;
        timeDetected: string;
        suggestedAction?: string;
        impact?: string;
        status?: 'open' | 'in_progress' | 'resolved';
      }[];
      logs?: {
        timestamp: string;
        message: string;
        level: string;
      }[];
      suggestedActions?: {
        id: string;
        title: string;
        description: string;
        impact: 'high' | 'medium' | 'low';
        effort: 'easy' | 'medium' | 'complex';
        eta: string;
        command?: string;
        requiresConfirmation?: boolean;
        requiresCredentials?: boolean;
        status?: 'available' | 'in_progress' | 'completed' | 'failed';
      }[];
    };
  }[]>;

  getRecentAlerts(): Promise<{
    title: string;
    description: string;
    severity: string;
    time: string;
  }[]>;

  // Cache operations
  setCachedData(key: string, data: any, expirationMs?: number): Promise<void>;
  getCachedData(key: string): Promise<any | null>;
  deleteCachedData(key: string): Promise<boolean>;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByPendingEmailToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserStripeInfo(userId: number, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: 'active' | 'inactive' | 'cancelled' | 'past_due';
    subscriptionPlan?: 'free' | 'premium' | 'university';
    subscriptionExpiresAt?: Date;
  }): Promise<User | undefined>;
  updateUserVerificationInfo(userId: number, verificationInfo: {
    emailVerified?: boolean;
    verificationToken?: string | null;
    verificationExpires?: Date | null;
  }): Promise<User | undefined>;
  updateUserPassword(userId: number, newPassword: string): Promise<User | undefined>;
  addUserXP(userId: number, amount: number, source: string, description?: string): Promise<number>;

  // Goal operations
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(userId: number, goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Skill Stacker operations
  getSkillStackerPlan(id: number): Promise<SkillStackerPlan | undefined>;
  getSkillStackerPlanByGoalAndWeek(goalId: number, week: number): Promise<SkillStackerPlan | undefined>;
  getAllSkillStackerPlans(userId: number): Promise<SkillStackerPlan[]>;
  getSkillStackerPlansByGoal(goalId: number): Promise<SkillStackerPlan[]>;
  createSkillStackerPlan(userId: number, plan: InsertSkillStackerPlan): Promise<SkillStackerPlan>;
  updateSkillStackerPlan(id: number, planData: Partial<SkillStackerPlan>): Promise<SkillStackerPlan | undefined>;
  updateSkillStackerTaskStatus(planId: number, taskId: string, status: "complete" | "incomplete", rating?: number): Promise<SkillStackerPlan | undefined>;
  completeSkillStackerWeek(planId: number): Promise<SkillStackerPlan | undefined>;
  deleteSkillStackerPlan(id: number): Promise<boolean>;

  // Work history operations
  getWorkHistory(userId: number): Promise<WorkHistory[]>;
  getWorkHistoryItem(id: number): Promise<WorkHistory | undefined>;
  createWorkHistoryItem(userId: number, item: InsertWorkHistory): Promise<WorkHistory>;
  updateWorkHistoryItem(id: number, itemData: Partial<WorkHistory>): Promise<WorkHistory | undefined>;
  deleteWorkHistoryItem(id: number): Promise<boolean>;
  
  // Education history operations
  getEducationHistory(userId: number): Promise<EducationHistory[]>;
  getEducationHistoryItem(id: number): Promise<EducationHistory | undefined>;
  createEducationHistoryItem(userId: number, item: InsertEducationHistory): Promise<EducationHistory>;
  updateEducationHistoryItem(id: number, itemData: Partial<EducationHistory>): Promise<EducationHistory | undefined>;
  deleteEducationHistoryItem(id: number): Promise<boolean>;

  // Resume operations
  getResumes(userId: number): Promise<Resume[]>;
  getResumesByUserId(userId: number): Promise<Resume[]>; // Alias for getResumes for clarity
  getResume(id: number): Promise<Resume | undefined>;
  createResume(userId: number, resume: InsertResume): Promise<Resume>;
  updateResume(id: number, resumeData: Partial<Resume>): Promise<Resume | undefined>;
  deleteResume(id: number): Promise<boolean>;
  
  // Skills operations
  getUserSkills(userId: number): Promise<Skill[]>;

  // Cover letter operations
  getCoverLetters(userId: number): Promise<CoverLetter[]>;
  getCoverLetter(id: number): Promise<CoverLetter | undefined>;
  createCoverLetter(userId: number, coverLetter: InsertCoverLetter): Promise<CoverLetter>;
  updateCoverLetter(id: number, coverLetterData: Partial<CoverLetter>): Promise<CoverLetter | undefined>;
  deleteCoverLetter(id: number): Promise<boolean>;

  // Interview operations
  getInterviewQuestions(category?: string): Promise<InterviewQuestion[]>;
  getInterviewQuestion(id: number): Promise<InterviewQuestion | undefined>;
  createInterviewQuestion(question: InsertInterviewQuestion): Promise<InterviewQuestion>;
  saveInterviewPractice(userId: number, practice: InsertInterviewPractice): Promise<InterviewPractice>;
  getUserInterviewPractice(userId: number): Promise<InterviewPractice[]>;

  // Interview Process Tracking operations
  getInterviewProcesses(userId: number): Promise<InterviewProcess[]>;
  getInterviewProcess(id: number): Promise<InterviewProcess | undefined>;
  createInterviewProcess(userId: number, process: InsertInterviewProcess): Promise<InterviewProcess>;
  updateInterviewProcess(id: number, processData: Partial<InterviewProcess>): Promise<InterviewProcess | undefined>;
  deleteInterviewProcess(id: number): Promise<boolean>;

  // Interview Stage operations
  getInterviewStages(processId: number): Promise<InterviewStage[]>;
  getInterviewStage(id: number): Promise<InterviewStage | undefined>;
  createInterviewStage(processId: number, stage: InsertInterviewStage): Promise<InterviewStage>;
  updateInterviewStage(id: number, stageData: Partial<InterviewStage>): Promise<InterviewStage | undefined>;
  deleteInterviewStage(id: number): Promise<boolean>;

  // Followup Action operations
  getFollowupActions(processId: number, stageId?: number): Promise<FollowupAction[]>;
  getFollowupAction(id: number): Promise<FollowupAction | undefined>;
  createFollowupAction(processId: number, action: InsertFollowupAction): Promise<FollowupAction>;
  updateFollowupAction(id: number, actionData: Partial<FollowupAction>): Promise<FollowupAction | undefined>;
  deleteFollowupAction(id: number): Promise<boolean>;
  completeFollowupAction(id: number): Promise<FollowupAction | undefined>;
  uncompleteFollowupAction(id: number): Promise<FollowupAction | undefined>;

  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<(Achievement & { earnedAt: Date })[]>;
  checkAndAwardAchievements(userId: number): Promise<Achievement[]>;

  // AI Coach operations
  getAiCoachConversations(userId: number): Promise<AiCoachConversation[]>;
  getAiCoachConversation(id: number): Promise<AiCoachConversation | undefined>;
  createAiCoachConversation(userId: number, conversation: InsertAiCoachConversation): Promise<AiCoachConversation>;
  getAiCoachMessages(conversationId: number): Promise<AiCoachMessage[]>;
  addAiCoachMessage(message: InsertAiCoachMessage): Promise<AiCoachMessage>;

  // XP History operations
  getXpHistory(userId: number): Promise<XpHistory[]>;

  // Contact message operations
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  getContactMessage(id: number): Promise<ContactMessage | undefined>;
  markContactMessageAsRead(id: number): Promise<ContactMessage | undefined>;
  markContactMessageAsArchived(id: number): Promise<ContactMessage | undefined>;

  // Support ticket operations
  getSupportTickets(filters?: any): Promise<any[]>;
  getSupportTicket(id: number): Promise<any | undefined>;
  updateSupportTicket(id: number, data: any): Promise<any>;
  createSupportTicket(data: any): Promise<any>;

  // Career Mentor Chat operations
  getMentorChatConversations(userId: number): Promise<MentorChatConversation[]>;
  getMentorChatConversation(id: number): Promise<MentorChatConversation | undefined>;
  
  // User Reviews operations
  getUserReviews(userId: number): Promise<UserReview[]>;
  createUserReview(userId: number, review: InsertUserReview): Promise<UserReview>;
  createMentorChatConversation(userId: number, conversation: InsertMentorChatConversation): Promise<MentorChatConversation>;
  getMentorChatMessages(conversationId: number): Promise<MentorChatMessage[]>;
  
  // Job Listings operations
  getJobListings(filters?: { 
    query?: string; 
    location?: string; 
    remote?: boolean; 
    jobType?: string; 
    page?: number; 
    pageSize?: number; 
  }): Promise<{ listings: JobListing[]; total: number }>;
  getJobListing(id: number): Promise<JobListing | undefined>;
  createJobListing(listing: InsertJobListing): Promise<JobListing>;
  updateJobListing(id: number, listingData: Partial<JobListing>): Promise<JobListing | undefined>;
  deleteJobListing(id: number): Promise<boolean>;
  
  // Job Applications operations
  getJobApplications(userId: number): Promise<JobApplication[]>;
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  createJobApplication(userId: number, application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, applicationData: Partial<JobApplication>): Promise<JobApplication | undefined>;
  submitJobApplication(id: number, applied?: boolean): Promise<JobApplication | undefined>;
  deleteJobApplication(id: number): Promise<boolean>;

  // Application Interview Stages operations
  getInterviewStagesForApplication(applicationId: number): Promise<InterviewStage[]>;
  createInterviewStageForApplication(applicationId: number, stageData: any): Promise<InterviewStage>;
  
  // Application Follow-up Actions operations
  getFollowupActionsForApplication(applicationId: number): Promise<FollowupAction[]>;
  createFollowupActionForApplication(applicationId: number, actionData: any): Promise<FollowupAction>;
  
  // Application Wizard Steps operations
  getApplicationWizardSteps(applicationId: number): Promise<ApplicationWizardStep[]>;
  getApplicationWizardStep(id: number): Promise<ApplicationWizardStep | undefined>;
  createApplicationWizardStep(applicationId: number, step: InsertApplicationWizardStep): Promise<ApplicationWizardStep>;
  updateApplicationWizardStep(id: number, stepData: Partial<ApplicationWizardStep>): Promise<ApplicationWizardStep | undefined>;
  completeApplicationWizardStep(id: number): Promise<ApplicationWizardStep | undefined>;
  addMentorChatMessage(message: InsertMentorChatMessage): Promise<MentorChatMessage>;

  // Stats operations
  getUserStatistics(userId: number): Promise<{
    activeGoals: number;
    achievementsCount: number;
    resumesCount: number;
    pendingTasks: number;
    upcomingInterviews: number;
    monthlyXp: { month: string; xp: number }[];
  }>;

  // Subscription and verification operations
  getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: number, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: 'active' | 'inactive' | 'cancelled' | 'past_due';
    subscriptionPlan?: 'free' | 'premium' | 'university';
    subscriptionExpiresAt?: Date;
  }): Promise<User | undefined>;
  updateUserVerificationInfo(userId: number, verificationInfo: {
    emailVerified?: boolean;
    verificationToken?: string | null;
    verificationExpires?: Date | null;
  }): Promise<User | undefined>;

  // Recommendation operations
  getRecommendations(userId: number): Promise<Recommendation[]>;
  getRecommendation(id: number): Promise<Recommendation | undefined>;
  createRecommendation(userId: number, recommendation: InsertRecommendation): Promise<Recommendation>;
  updateRecommendation(id: number, recommendationData: Partial<Recommendation>): Promise<Recommendation | undefined>;
  completeRecommendation(id: number): Promise<Recommendation | undefined>;
  generateDailyRecommendations(userId: number): Promise<Recommendation[]>;
  clearTodaysRecommendations(userId: number): Promise<void>;

  // Certification operations (to be deprecated)
  getCertifications(userId: number): Promise<Certification[]>;
  getCertification(id: number): Promise<Certification | undefined>;
  createCertification(userId: number, certification: InsertCertification): Promise<Certification>;
  updateCertification(id: number, certificationData: Partial<Certification>): Promise<Certification | undefined>;
  deleteCertification(id: number): Promise<boolean>;

  // User Personal Achievements operations
  getUserPersonalAchievements(userId: number): Promise<UserPersonalAchievement[]>;
  getUserPersonalAchievement(id: number): Promise<UserPersonalAchievement | undefined>;
  createUserPersonalAchievement(userId: number, achievement: InsertUserPersonalAchievement): Promise<UserPersonalAchievement>;
  updateUserPersonalAchievement(id: number, achievementData: Partial<UserPersonalAchievement>): Promise<UserPersonalAchievement | undefined>;
  deleteUserPersonalAchievement(id: number): Promise<boolean>;
  
  // Networking Contacts (Ascentul CRM) operations
  getNetworkingContacts(userId: number, filters?: { query?: string, relationshipType?: string }): Promise<NetworkingContact[]>;
  getNetworkingContact(id: number): Promise<NetworkingContact | undefined>;
  createNetworkingContact(userId: number, contact: InsertNetworkingContact): Promise<NetworkingContact>;
  updateNetworkingContact(id: number, contactData: Partial<NetworkingContact>): Promise<NetworkingContact | undefined>;
  deleteNetworkingContact(id: number): Promise<boolean>;
  getContactsNeedingFollowUp(userId: number): Promise<NetworkingContact[]>;
  
  // Contact Interactions operations
  getContactInteractions(contactId: number): Promise<ContactInteraction[]>;
  createContactInteraction(userId: number, contactId: number, interaction: InsertContactInteraction): Promise<ContactInteraction>;
  
  // Contact Follow-ups operations
  getContactFollowUps(contactId: number): Promise<FollowupAction[]>;
  createContactFollowUp(userId: number, contactId: number, followUp: Partial<InsertFollowupAction>): Promise<FollowupAction>;
  completeContactFollowUp(id: number): Promise<FollowupAction | undefined>;
  deleteContactFollowUp(id: number): Promise<boolean>;

  // Career Path operations
  saveCareerPath(userId: number, name: string, pathData: any): Promise<CareerPath>;
  getUserCareerPaths(userId: number): Promise<CareerPath[]>;
  getCareerPath(id: number): Promise<CareerPath | undefined>;
  deleteCareerPath(id: number): Promise<boolean>;
  
  // Skill Stacker operations
  getSkillStackerPlan(id: number): Promise<SkillStackerPlan | undefined>;
  getSkillStackerPlanByGoalAndWeek(goalId: number, week: number): Promise<SkillStackerPlan | undefined>;
  getAllSkillStackerPlans(userId: number): Promise<SkillStackerPlan[]>;
  getSkillStackerPlansByGoal(goalId: number): Promise<SkillStackerPlan[]>;
  createSkillStackerPlan(userId: number, plan: InsertSkillStackerPlan): Promise<SkillStackerPlan>;
  updateSkillStackerPlan(id: number, planData: Partial<SkillStackerPlan>): Promise<SkillStackerPlan | undefined>;
  updateSkillStackerTaskStatus(planId: number, taskId: string, status: "complete" | "incomplete", rating?: number): Promise<SkillStackerPlan | undefined>;
  completeSkillStackerWeek(planId: number): Promise<SkillStackerPlan | undefined>;
  deleteSkillStackerPlan(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  // Simple in-memory cache for expensive operations
  private cache: Map<string, { data: any; expires: number | null }> = new Map();
  private users: Map<number, User>;
  private goals: Map<number, Goal>;
  private workHistory: Map<number, WorkHistory>;
  private educationHistory: Map<number, EducationHistory>;
  private resumes: Map<number, Resume>;
  private coverLetters: Map<number, CoverLetter>;
  private interviewQuestions: Map<number, InterviewQuestion>;
  private interviewPractice: Map<number, InterviewPractice>;
  private achievements: Map<number, Achievement>;
  private userAchievements: Map<number, UserAchievement>;
  private aiCoachConversations: Map<number, AiCoachConversation>;
  private aiCoachMessages: Map<number, AiCoachMessage>;
  private xpHistory: Map<number, XpHistory>;
  private interviewProcesses: Map<number, InterviewProcess>;
  private interviewStages: Map<number, InterviewStage>;
  private followupActions: Map<number, FollowupAction>;
  private contactMessages: Map<number, ContactMessage>;
  private mentorChatConversations: Map<number, MentorChatConversation>;
  private mentorChatMessages: Map<number, MentorChatMessage>;
  private recommendations: Map<number, Recommendation>;
  private certifications: Map<number, Certification>;
  private userPersonalAchievements: Map<number, UserPersonalAchievement>;
  private projects: Map<number, Project>;
  private supportTickets: Map<number, any>;
  private careerPaths: Map<number, CareerPath>;
  private skillStackerPlans: Map<number, SkillStackerPlan>;
  private jobListings: Map<number, JobListing>;
  private jobApplications: Map<number, JobApplication>;
  private applicationWizardSteps: Map<number, ApplicationWizardStep>;
  private networkingContacts: Map<number, NetworkingContact>;
  private contactInteractions: Map<number, ContactInteraction>;
  private userReviews: Map<number, UserReview>;

  private userIdCounter: number;
  private goalIdCounter: number;
  private workHistoryIdCounter: number;
  private educationHistoryIdCounter: number;
  private resumeIdCounter: number;
  private coverLetterIdCounter: number;
  private interviewQuestionIdCounter: number;
  private interviewPracticeIdCounter: number;
  private achievementIdCounter: number;
  private userAchievementIdCounter: number;
  private aiCoachConversationIdCounter: number;
  private aiCoachMessageIdCounter: number;
  private xpHistoryIdCounter: number;
  private interviewProcessIdCounter: number;
  private interviewStageIdCounter: number;
  private followupActionIdCounter: number;
  private contactMessageIdCounter: number;
  private mentorChatConversationIdCounter: number;
  private mentorChatMessageIdCounter: number;
  private recommendationIdCounter: number;
  private certificationIdCounter: number;
  private userPersonalAchievementIdCounter: number;
  private careerPathIdCounter: number;
  private skillStackerPlanIdCounter: number;
  private jobListingIdCounter: number;
  private jobApplicationIdCounter: number;
  private applicationWizardStepIdCounter: number;
  private supportTicketIdCounter: number;
  private projectIdCounter: number;
  private networkingContactIdCounter: number;
  private contactInteractionIdCounter: number;
  private userReviewIdCounter: number;

  public sessionStore: session.Store;

  constructor() {
    // Use the external session store
    this.sessionStore = sessionStore;

    this.users = new Map();
    this.goals = new Map();
    this.workHistory = new Map();
    this.educationHistory = new Map();
    this.resumes = new Map();
    this.coverLetters = new Map();
    this.interviewQuestions = new Map();
    this.interviewPractice = new Map();
    this.achievements = new Map();
    this.userAchievements = new Map();
    this.aiCoachConversations = new Map();
    this.aiCoachMessages = new Map();
    this.xpHistory = new Map();
    this.interviewProcesses = new Map();
    this.interviewStages = new Map();
    this.followupActions = new Map();
    this.contactMessages = new Map();
    this.mentorChatConversations = new Map();
    this.mentorChatMessages = new Map();
    this.recommendations = new Map();
    this.certifications = new Map();
    this.userPersonalAchievements = new Map();
    this.careerPaths = new Map();
    this.skillStackerPlans = new Map();
    this.jobListings = new Map();
    this.jobApplications = new Map();
    this.applicationWizardSteps = new Map();
    this.networkingContacts = new Map();
    this.contactInteractions = new Map();
    this.userReviews = new Map();

    this.userIdCounter = 1;
    this.goalIdCounter = 1;
    this.workHistoryIdCounter = 1;
    this.educationHistoryIdCounter = 1;
    this.resumeIdCounter = 1;
    this.coverLetterIdCounter = 1;
    this.interviewQuestionIdCounter = 1;
    this.interviewPracticeIdCounter = 1;
    this.achievementIdCounter = 1;
    this.userAchievementIdCounter = 1;
    this.aiCoachConversationIdCounter = 1;
    this.aiCoachMessageIdCounter = 1;
    this.xpHistoryIdCounter = 1;
    this.interviewProcessIdCounter = 1;
    this.interviewStageIdCounter = 1;
    this.followupActionIdCounter = 1;
    this.contactMessageIdCounter = 1;
    this.mentorChatConversationIdCounter = 1;
    this.mentorChatMessageIdCounter = 1;
    this.recommendationIdCounter = 1;
    this.certificationIdCounter = 1;
    this.userPersonalAchievementIdCounter = 1;
    this.careerPathIdCounter = 1;
    this.skillStackerPlanIdCounter = 1;
    this.jobListingIdCounter = 1;
    this.jobApplicationIdCounter = 1;
    this.applicationWizardStepIdCounter = 1;
    this.supportTicketIdCounter = 1;
    this.projectIdCounter = 1;
    this.networkingContactIdCounter = 1;
    this.contactInteractionIdCounter = 1;
    this.userReviewIdCounter = 1;
    
    // Initialize new maps for the Apply feature
    this.projects = new Map();
    this.supportTickets = new Map();

    // Initialize with sample data for testing
    this.initializeData();
  }

  // Cache operations
  async setCachedData(key: string, data: any, expirationMs?: number): Promise<void> {
    const expires = expirationMs ? Date.now() + expirationMs : null;
    this.cache.set(key, { data, expires });
  }

  async getCachedData(key: string): Promise<any | null> {
    const cachedItem = this.cache.get(key);

    if (!cachedItem) {
      return null;
    }

    // Check if the cached data has expired
    if (cachedItem.expires && Date.now() > cachedItem.expires) {
      this.cache.delete(key);
      return null;
    }

    return cachedItem.data;
  }

  async deleteCachedData(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  private initializeData() {
    // Sample interview process data for testing
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // No initial work history - users should enter their own work history
    const sampleWorkHistory: InsertWorkHistory[] = [];
    
    // Skip adding sample work history records as per requirements
    console.log(`No default work history items initialized - users will add their own data`);

    // Initialize sample education history for alex (user id 1)
    const sampleEducation: InsertEducationHistory[] = [
      {
        institution: "University of Technology",
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        startDate: new Date(2015, 8, 1), // September 1, 2015
        endDate: new Date(2019, 5, 15), // June 15, 2019
        location: "San Francisco, CA",
        description: "Focused on software engineering and data structures. Participated in hackathons and coding competitions.",
        achievements: ["Dean's List 2016-2019", "Best Senior Project Award", "Programming Club President"]
      },
      {
        institution: "Tech Institute",
        degree: "Certificate",
        fieldOfStudy: "Machine Learning",
        startDate: new Date(2020, 0, 15), // January 15, 2020
        endDate: new Date(2020, 6, 30), // July 30, 2020
        description: "Intensive machine learning program covering neural networks, deep learning, and practical applications.",
        achievements: ["Completed with Distinction", "Published research paper on ML applications"]
      }
    ];

    // Add sample education history for alex
    sampleEducation.forEach(education => {
      this.educationHistory.set(this.educationHistoryIdCounter, {
        ...education,
        id: this.educationHistoryIdCounter++,
        userId: 1, // For alex
        createdAt: twoDaysAgo
      });
    });

    // Initialize sample achievements
    const sampleAchievements: InsertAchievement[] = [
      {
        name: "First Resume",
        description: "Created your first resume",
        icon: "rocket",
        xpReward: 100,
        requiredAction: "resumes_created",
        requiredValue: 1
      },
      {
        name: "Goal Setter",
        description: "Set 5 career goals",
        icon: "bullseye",
        xpReward: 150,
        requiredAction: "goals_created",
        requiredValue: 5
      },
      {
        name: "Skill Builder",
        description: "Added 10+ skills",
        icon: "graduation-cap",
        xpReward: 200,
        requiredAction: "skills_added",
        requiredValue: 10
      },
      {
        name: "Job Master",
        description: "Apply to 10 jobs",
        icon: "briefcase",
        xpReward: 300,
        requiredAction: "jobs_applied",
        requiredValue: 10
      }
    ];

    sampleAchievements.forEach(achievement => {
      this.achievements.set(this.achievementIdCounter, {
        ...achievement,
        id: this.achievementIdCounter++
      });
    });

    // Create a sample interview process
    const sampleProcess: InterviewProcess = {
      id: this.interviewProcessIdCounter++,
      userId: 1, // For the sample user (alex)
      position: "Senior Software Engineer",
      companyName: "TechCorp Inc.",
      jobDescription: "Senior role focused on full-stack development with React and Node.js",
      contactName: "Jane Recruiter",
      contactEmail: "jane@techcorp.example",
      contactPhone: "+1-555-123-4567",
      notes: "Initial screening was positive. Team seems collaborative and focused on product quality.",
      status: "in_progress",
      createdAt: twoDaysAgo,
      updatedAt: now
    };
    this.interviewProcesses.set(sampleProcess.id, sampleProcess);

    // Create sample interview stages
    const phoneScreening: InterviewStage = {
      id: this.interviewStageIdCounter++,
      processId: sampleProcess.id,
      type: "Phone Screening",
      location: "Phone call",
      scheduledDate: twoDaysAgo,
      completedDate: twoDaysAgo,
      interviewers: ["Jane Recruiter", "John HR"],
      feedback: "Positive initial conversation. Technical background is strong. Moving to technical assessment.",
      outcome: "passed",
      notes: "Asked about team structure and development process.",
      nextSteps: "Technical assessment to be scheduled",
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo
    };
    this.interviewStages.set(phoneScreening.id, phoneScreening);

    const technicalAssessment: InterviewStage = {
      id: this.interviewStageIdCounter++,
      processId: sampleProcess.id,
      type: "Technical Assessment",
      location: "Online coding platform",
      scheduledDate: now,
      completedDate: now,
      interviewers: ["Senior Developer"],
      feedback: "Completed coding task efficiently. Good approach to problem-solving. Clean code.",
      outcome: "passed",
      notes: "Completed a task building a React component with data fetching.",
      nextSteps: "Technical interview with team lead",
      createdAt: now,
      updatedAt: now
    };
    this.interviewStages.set(technicalAssessment.id, technicalAssessment);

    const technicalInterview: InterviewStage = {
      id: this.interviewStageIdCounter++,
      processId: sampleProcess.id,
      type: "Technical Interview",
      location: "Video call",
      scheduledDate: tomorrow,
      completedDate: null,
      interviewers: ["Team Lead", "Senior Architect"],
      feedback: null,
      outcome: null,
      notes: "Will focus on system design and architecture discussions.",
      nextSteps: null,
      createdAt: now,
      updatedAt: now
    };
    this.interviewStages.set(technicalInterview.id, technicalInterview);

    // Create sample followup actions
    const thankYouEmail: FollowupAction = {
      id: this.followupActionIdCounter++,
      processId: sampleProcess.id,
      stageId: phoneScreening.id,
      type: "Thank You Email",
      description: "Send a thank you email to Jane for the phone screening",
      dueDate: new Date(twoDaysAgo.getTime() + 24 * 60 * 60 * 1000),
      notes: "Mention interest in the collaborative culture",
      completed: true,
      completedDate: new Date(twoDaysAgo.getTime() + 22 * 60 * 60 * 1000),
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo
    };
    this.followupActions.set(thankYouEmail.id, thankYouEmail);

    const prepareQuestions: FollowupAction = {
      id: this.followupActionIdCounter++,
      processId: sampleProcess.id,
      stageId: technicalInterview.id,
      type: "Prepare Questions",
      description: "Prepare questions about the tech stack and team structure",
      dueDate: tomorrow,
      notes: "Research company products thoroughly",
      completed: false,
      completedDate: null,
      createdAt: now,
      updatedAt: now
    };
    this.followupActions.set(prepareQuestions.id, prepareQuestions);

    const reviewTechnology: FollowupAction = {
      id: this.followupActionIdCounter++,
      processId: sampleProcess.id,
      stageId: technicalInterview.id,
      type: "Review Technology",
      description: "Brush up on system design patterns and React optimization techniques",
      dueDate: tomorrow,
      notes: "Focus on recent projects for examples",
      completed: false,
      completedDate: null,
      createdAt: now,
      updatedAt: now
    };
    this.followupActions.set(reviewTechnology.id, reviewTechnology);

    // Initialize sample interview questions
    const sampleQuestions: InsertInterviewQuestion[] = [
      {
        category: "behavioral",
        question: "Tell me about a challenging project you worked on.",
        suggestedAnswer: "Use the STAR method to describe a specific challenging project, focusing on your role, the actions you took, and the positive outcome achieved.",
        difficultyLevel: 2
      },
      {
        category: "technical",
        question: "How do you approach debugging a complex issue?",
        suggestedAnswer: "Describe your systematic approach: reproduce the issue, isolate variables, use debugging tools, collaborate when needed, and document the solution.",
        difficultyLevel: 3
      },
      {
        category: "behavioral",
        question: "How do you handle disagreements with team members?",
        suggestedAnswer: "Emphasize active listening, seeking to understand different perspectives, finding common ground, and focusing on the best solution for the project rather than personal preferences.",
        difficultyLevel: 2
      },
      {
        category: "technical",
        question: "Explain your experience with a specific technology relevant to this role.",
        suggestedAnswer: "Describe your hands-on experience with the technology, specific projects where you've applied it, challenges you've overcome, and how you stay updated with its developments.",
        difficultyLevel: 3
      },
      {
        category: "behavioral",
        question: "Where do you see yourself in 5 years?",
        suggestedAnswer: "Focus on professional growth, skills you want to develop, and how you aim to contribute to the company's success. Show ambition while being realistic.",
        difficultyLevel: 1
      }
    ];

    sampleQuestions.forEach(question => {
      this.interviewQuestions.set(this.interviewQuestionIdCounter, {
        ...question,
        id: this.interviewQuestionIdCounter++
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getAllActiveUsers(): Promise<User[]> {
    // Return all users, filtering out any that might be marked as inactive
    return Array.from(this.users.values()).filter(user => 
      !user.subscriptionStatus || 
      (user.subscriptionStatus !== 'cancelled' && user.subscriptionStatus !== 'inactive')
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      xp: 0, 
      level: 1, 
      rank: "Career Explorer", 
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async addUserXP(userId: number, amount: number, source: string, description?: string): Promise<number | null> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    // Only process XP for university users
    const isUniversityUser = user.userType === "university_student" || user.userType === "university_admin";

    // Skip XP handling for regular users
    if (!isUniversityUser) {
      return null;
    }

    // Add XP history record
    const xpHistoryId = this.xpHistoryIdCounter++;
    const xpRecord: XpHistory = {
      id: xpHistoryId,
      userId,
      amount,
      source,
      description,
      earnedAt: new Date()
    };
    this.xpHistory.set(xpHistoryId, xpRecord);

    // Update user XP
    const currentXp = user.xp || 0; // Use 0 as default if xp is undefined
    const newXp = currentXp + amount;

    // Check for level up (simple level calculation - can be refined)
    let newLevel = user.level || 1; // Use 1 as default if level is undefined
    let newRank = user.rank || "Career Explorer"; // Use default if rank is undefined

    // Level up logic: 1000 XP per level
    const calculatedLevel = Math.floor(newXp / 1000) + 1;

    if (calculatedLevel > newLevel) {
      newLevel = calculatedLevel;

      // Update rank based on level
      if (newLevel >= 15) newRank = "Career Master";
      else if (newLevel >= 10) newRank = "Career Navigator";
      else if (newLevel >= 5) newRank = "Career Adventurer";
      else newRank = "Career Explorer";
    }

    await this.updateUser(userId, { xp: newXp, level: newLevel, rank: newRank });

    // Check and award achievements
    await this.checkAndAwardAchievements(userId);

    return newXp;
  }

  // Goal operations
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(goal => goal.userId === userId);
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(userId: number, goalData: InsertGoal): Promise<Goal> {
    const id = this.goalIdCounter++;
    const now = new Date();

    // Ensure status is set to 'in_progress' by default for proper counting in statistics
    const status = goalData.status || 'in_progress';

    const goal: Goal = {
      ...goalData,
      status,
      id,
      userId,
      progress: 0,
      completed: false,
      completedAt: null,
      createdAt: now
    };
    this.goals.set(id, goal);

    // Award XP for creating a goal
    await this.addUserXP(userId, 50, "goals_created", "Created a new career goal");

    // Force statistics cache refresh when creating a new goal
    const userStatsCacheKey = `user-stats-${userId}`;
    this.cache.delete(userStatsCacheKey);
    console.log(`Deleted stats cache for user ${userId} on goal creation`);

    return goal;
  }

  async updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;

    // Check if the goal is being completed
    const completingGoal = !goal.completed && goalData.completed === true;

    const updatedGoal = { ...goal, ...goalData };

    // If completing the goal, set completedAt
    if (completingGoal) {
      updatedGoal.completedAt = new Date();
      updatedGoal.progress = 100;

      // Make sure to set the status to 'completed' as well
      updatedGoal.status = 'completed';
      updatedGoal.completed = true;

      // Award XP for completing a goal
      await this.addUserXP(goal.userId, goal.xpReward, "goals_completed", `Completed goal: ${goal.title}`);

      // Force statistics cache refresh when completing a goal
      const userStatsCacheKey = `user-stats-${goal.userId}`;
      this.cache.delete(userStatsCacheKey);
      console.log(`Deleted stats cache for user ${goal.userId} on goal completion`);
    }

    // Also check if the status is being set to 'completed' directly
    if (goalData.status === 'completed' && !updatedGoal.completed) {
      updatedGoal.completed = true;

      // Force statistics cache refresh when marking a goal as completed
      const userStatsCacheKey = `user-stats-${goal.userId}`;
      this.cache.delete(userStatsCacheKey);
      console.log(`Deleted stats cache for user ${goal.userId} on status change to completed`);
      updatedGoal.completedAt = updatedGoal.completedAt || new Date();
      updatedGoal.progress = 100;
    }

    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    // Get the goal first to know which user it belongs to
    const goal = this.goals.get(id);
    if (!goal) return false;

    // Store the userId for cache invalidation
    const userId = goal.userId;

    // Delete the goal
    const result = this.goals.delete(id);

    // If successfully deleted, invalidate the cache
    if (result) {
      const userStatsCacheKey = `user-stats-${userId}`;
      this.cache.delete(userStatsCacheKey);
      console.log(`Deleted stats cache for user ${userId} on goal deletion`);
    }

    return result;
  }

  // Work history operations
  async getWorkHistory(userId: number): Promise<WorkHistory[]> {
    return Array.from(this.workHistory.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  async getWorkHistoryItem(id: number): Promise<WorkHistory | undefined> {
    return this.workHistory.get(id);
  }

  async createWorkHistoryItem(userId: number, item: InsertWorkHistory): Promise<WorkHistory> {
    const id = this.workHistoryIdCounter++;
    const now = new Date();
    const workHistoryItem: WorkHistory = {
      ...item,
      id,
      userId,
      createdAt: now
    };
    this.workHistory.set(id, workHistoryItem);

    // Award XP for adding work history
    await this.addUserXP(userId, 75, "work_history_added", "Added work experience");

    // Invalidate the role insights cache for this user
    const roleInsightsCacheKey = `role_insights_${userId}`;
    await this.deleteCachedData(roleInsightsCacheKey);
    console.log(`Invalidated role insights cache for user ${userId} on work history creation`);

    return workHistoryItem;
  }

  async updateWorkHistoryItem(id: number, itemData: Partial<WorkHistory>): Promise<WorkHistory | undefined> {
    const item = this.workHistory.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...itemData };
    this.workHistory.set(id, updatedItem);

    // Invalidate the role insights cache for this user
    const roleInsightsCacheKey = `role_insights_${item.userId}`;
    await this.deleteCachedData(roleInsightsCacheKey);
    console.log(`Invalidated role insights cache for user ${item.userId} on work history update`);

    return updatedItem;
  }

  async deleteWorkHistoryItem(id: number): Promise<boolean> {
    // Get the work history item first to know which user it belongs to
    const item = this.workHistory.get(id);
    if (!item) return false;

    // Delete the work history item
    const result = this.workHistory.delete(id);

    // If successfully deleted, invalidate the cache
    if (result) {
      const roleInsightsCacheKey = `role_insights_${item.userId}`;
      await this.deleteCachedData(roleInsightsCacheKey);
      console.log(`Invalidated role insights cache for user ${item.userId} on work history deletion`);
    }

    return result;
  }
  
  // Education history operations
  async getEducationHistory(userId: number): Promise<EducationHistory[]> {
    return Array.from(this.educationHistory.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  async getEducationHistoryItem(id: number): Promise<EducationHistory | undefined> {
    return this.educationHistory.get(id);
  }

  async createEducationHistoryItem(userId: number, item: InsertEducationHistory): Promise<EducationHistory> {
    const id = this.educationHistoryIdCounter++;
    const now = new Date();
    const educationHistoryItem: EducationHistory = {
      ...item,
      id,
      userId,
      createdAt: now
    };
    this.educationHistory.set(id, educationHistoryItem);

    // Award XP for adding education history
    await this.addUserXP(userId, 75, "education_history_added", "Added education");

    // Invalidate the role insights cache for this user
    const roleInsightsCacheKey = `role_insights_${userId}`;
    await this.deleteCachedData(roleInsightsCacheKey);
    console.log(`Invalidated role insights cache for user ${userId} on education history creation`);

    return educationHistoryItem;
  }

  async updateEducationHistoryItem(id: number, itemData: Partial<EducationHistory>): Promise<EducationHistory | undefined> {
    const item = this.educationHistory.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...itemData };
    this.educationHistory.set(id, updatedItem);

    // Invalidate the role insights cache for this user
    const roleInsightsCacheKey = `role_insights_${item.userId}`;
    await this.deleteCachedData(roleInsightsCacheKey);
    console.log(`Invalidated role insights cache for user ${item.userId} on education history update`);

    return updatedItem;
  }

  async deleteEducationHistoryItem(id: number): Promise<boolean> {
    // Get the education history item first to know which user it belongs to
    const item = this.educationHistory.get(id);
    if (!item) return false;

    // Delete the education history item
    const result = this.educationHistory.delete(id);

    // If successfully deleted, invalidate the cache
    if (result) {
      const roleInsightsCacheKey = `role_insights_${item.userId}`;
      await this.deleteCachedData(roleInsightsCacheKey);
      console.log(`Invalidated role insights cache for user ${item.userId} on education history deletion`);
    }

    return result;
  }

  // Resume operations
  async getResumes(userId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values())
      .filter(resume => resume.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  
  // Alias for getResumes for clarity and API consistency
  async getResumesByUserId(userId: number): Promise<Resume[]> {
    return this.getResumes(userId);
  }

  async getResume(id: number): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }

  async createResume(userId: number, resumeData: InsertResume): Promise<Resume> {
    const id = this.resumeIdCounter++;
    const now = new Date();
    const resume: Resume = {
      ...resumeData,
      id,
      userId,
      createdAt: now,
      updatedAt: now
    };
    this.resumes.set(id, resume);

    // Check if this is the first resume for the user
    const userResumes = await this.getResumes(userId);
    if (userResumes.length === 1) {
      // Award XP for creating first resume
      await this.addUserXP(userId, 100, "first_resume", "Created your first resume");
    } else {
      // Award XP for creating additional resume
      await this.addUserXP(userId, 50, "resume_created", "Created a new resume");
    }

    return resume;
  }

  async updateResume(id: number, resumeData: Partial<Resume>): Promise<Resume | undefined> {
    const resume = this.resumes.get(id);
    if (!resume) return undefined;

    const updatedResume = { 
      ...resume, 
      ...resumeData,
      updatedAt: new Date() 
    };
    this.resumes.set(id, updatedResume);
    return updatedResume;
  }

  async deleteResume(id: number): Promise<boolean> {
    return this.resumes.delete(id);
  }

  // Cover letter operations
  async getCoverLetters(userId: number): Promise<CoverLetter[]> {
    return Array.from(this.coverLetters.values())
      .filter(letter => letter.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getCoverLetter(id: number): Promise<CoverLetter | undefined> {
    return this.coverLetters.get(id);
  }

  async createCoverLetter(userId: number, letterData: InsertCoverLetter): Promise<CoverLetter> {
    const id = this.coverLetterIdCounter++;
    const now = new Date();
    const coverLetter: CoverLetter = {
      ...letterData,
      id,
      userId,
      createdAt: now,
      updatedAt: now
    };
    this.coverLetters.set(id, coverLetter);

    // Award XP for creating a cover letter
    await this.addUserXP(userId, 75, "cover_letter_created", "Created a new cover letter");

    return coverLetter;
  }

  async updateCoverLetter(id: number, letterData: Partial<CoverLetter>): Promise<CoverLetter | undefined> {
    const letter = this.coverLetters.get(id);
    if (!letter) return undefined;

    const updatedLetter = { 
      ...letter, 
      ...letterData,
      updatedAt: new Date() 
    };
    this.coverLetters.set(id, updatedLetter);
    return updatedLetter;
  }

  async deleteCoverLetter(id: number): Promise<boolean> {
    return this.coverLetters.delete(id);
  }

  // Interview operations
  async getInterviewQuestions(category?: string): Promise<InterviewQuestion[]> {
    const questions = Array.from(this.interviewQuestions.values());
    if (category) {
      return questions.filter(q => q.category === category);
    }
    return questions;
  }

  async getInterviewQuestion(id: number): Promise<InterviewQuestion | undefined> {
    return this.interviewQuestions.get(id);
  }

  async createInterviewQuestion(question: InsertInterviewQuestion): Promise<InterviewQuestion> {
    const id = this.interviewQuestionIdCounter++;
    const interviewQuestion: InterviewQuestion = {
      ...question,
      id
    };
    this.interviewQuestions.set(id, interviewQuestion);
    return interviewQuestion;
  }

  async saveInterviewPractice(userId: number, practice: InsertInterviewPractice): Promise<InterviewPractice> {
    const id = this.interviewPracticeIdCounter++;
    const now = new Date();
    const interviewPractice: InterviewPractice = {
      ...practice,
      id,
      userId,
      practiceDate: now
    };
    this.interviewPractice.set(id, interviewPractice);

    // Award XP for practicing interview questions
    await this.addUserXP(userId, 25, "interview_practice", "Practiced an interview question");

    return interviewPractice;
  }

  async getUserInterviewPractice(userId: number): Promise<InterviewPractice[]> {
    return Array.from(this.interviewPractice.values())
      .filter(practice => practice.userId === userId)
      .sort((a, b) => new Date(b.practiceDate).getTime() - new Date(a.practiceDate).getTime());
  }

  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }
  
  // User Reviews operations
  async getUserReviews(userId: number): Promise<UserReview[]> {
    return Array.from(this.userReviews.values()).filter(
      review => review.userId === userId
    );
  }

  async createUserReview(userId: number, review: InsertUserReview): Promise<UserReview> {
    const id = this.userReviewIdCounter++;
    const newReview: UserReview = {
      ...review,
      id,
      userId,
      createdAt: new Date()
    };
    this.userReviews.set(id, newReview);
    return newReview;
  }

  // Networking Contacts (Ascentul CRM) operations
  async getNetworkingContacts(userId: number, filters?: { query?: string, relationshipType?: string }): Promise<NetworkingContact[]> {
    let contacts = Array.from(this.networkingContacts.values())
      .filter(contact => contact.userId === userId);
    
    if (filters?.query) {
      const query = filters.query.toLowerCase();
      contacts = contacts.filter(contact => 
        contact.fullName.toLowerCase().includes(query) ||
        contact.company.toLowerCase().includes(query) ||
        contact.jobTitle.toLowerCase().includes(query) ||
        (contact.notes && contact.notes.toLowerCase().includes(query))
      );
    }
    
    if (filters?.relationshipType) {
      contacts = contacts.filter(contact => 
        contact.relationshipType === filters.relationshipType
      );
    }
    
    return contacts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getNetworkingContact(id: number): Promise<NetworkingContact | undefined> {
    return this.networkingContacts.get(id);
  }
  
  async createNetworkingContact(userId: number, contact: InsertNetworkingContact): Promise<NetworkingContact> {
    const now = new Date();
    const newContact: NetworkingContact = {
      id: this.networkingContactIdCounter++,
      userId,
      fullName: contact.fullName,
      jobTitle: contact.jobTitle,
      company: contact.company,
      email: contact.email || null,
      phone: contact.phone || null,
      relationshipType: contact.relationshipType,
      linkedInUrl: contact.linkedInUrl || null,
      notes: contact.notes || null,
      lastContactedDate: contact.lastContactedDate || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.networkingContacts.set(newContact.id, newContact);
    return newContact;
  }
  
  async updateNetworkingContact(id: number, contactData: Partial<NetworkingContact>): Promise<NetworkingContact | undefined> {
    const contact = this.networkingContacts.get(id);
    if (!contact) {
      return undefined;
    }
    
    const updatedContact = {
      ...contact,
      ...contactData,
      updatedAt: new Date()
    };
    
    this.networkingContacts.set(id, updatedContact);
    return updatedContact;
  }
  
  async deleteNetworkingContact(id: number): Promise<boolean> {
    return this.networkingContacts.delete(id);
  }
  
  async getContactsNeedingFollowUp(userId: number): Promise<NetworkingContact[]> {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return Array.from(this.networkingContacts.values())
      .filter(contact => 
        contact.userId === userId && 
        (
          !contact.lastContactedDate || 
          contact.lastContactedDate < oneMonthAgo
        )
      )
      .sort((a, b) => {
        if (!a.lastContactedDate && !b.lastContactedDate) return 0;
        if (!a.lastContactedDate) return -1;
        if (!b.lastContactedDate) return 1;
        return a.lastContactedDate.getTime() - b.lastContactedDate.getTime();
      });
  }
  
  // Contact Interactions methods
  async getContactInteractions(contactId: number): Promise<ContactInteraction[]> {
    return Array.from(this.contactInteractions.values())
      .filter(interaction => interaction.contactId === contactId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createContactInteraction(userId: number, contactId: number, interaction: InsertContactInteraction): Promise<ContactInteraction> {
    const newInteraction: ContactInteraction = {
      id: this.contactInteractionIdCounter++,
      userId,
      contactId,
      interactionType: interaction.interactionType,
      notes: interaction.notes || null,
      date: interaction.date || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.contactInteractions.set(newInteraction.id, newInteraction);
    
    // Update the last contacted date on the contact
    const contact = await this.getNetworkingContact(contactId);
    if (contact) {
      await this.updateNetworkingContact(contactId, {
        lastContactedDate: newInteraction.date
      });
    }
    
    return newInteraction;
  }
  
  // Certification operations
  async getCertifications(userId: number): Promise<Certification[]> {
    return Array.from(this.certifications.values())
      .filter(cert => cert.userId === userId)
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }

  async getCertification(id: number): Promise<Certification | undefined> {
    return this.certifications.get(id);
  }

  async createCertification(userId: number, certification: InsertCertification): Promise<Certification> {
    const id = this.certificationIdCounter++;
    const now = new Date();
    const certificationItem: Certification = {
      ...certification,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
      description: certification.description || null,
      skills: certification.skills || null,
      expirationDate: certification.expirationDate || null,
      credentialId: certification.credentialId || null,
      credentialUrl: certification.credentialUrl || null
    };
    this.certifications.set(id, certificationItem);

    // Award XP for adding a certification
    await this.addUserXP(userId, 100, "certification_added", "Added professional certification");

    return certificationItem;
  }

  async updateCertification(id: number, certificationData: Partial<Certification>): Promise<Certification | undefined> {
    const certification = this.certifications.get(id);
    if (!certification) return undefined;

    const now = new Date();
    const updatedCertification = { 
      ...certification, 
      ...certificationData,
      updatedAt: now
    };
    this.certifications.set(id, updatedCertification);
    return updatedCertification;
  }

  async deleteCertification(id: number): Promise<boolean> {
    return this.certifications.delete(id);
  }

  // User Personal Achievements operations
  async getUserPersonalAchievements(userId: number): Promise<UserPersonalAchievement[]> {
    return Array.from(this.userPersonalAchievements.values())
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => new Date(b.achievementDate).getTime() - new Date(a.achievementDate).getTime());
  }

  async getUserPersonalAchievement(id: number): Promise<UserPersonalAchievement | undefined> {
    return this.userPersonalAchievements.get(id);
  }

  async createUserPersonalAchievement(userId: number, achievement: InsertUserPersonalAchievement): Promise<UserPersonalAchievement> {
    const id = this.userPersonalAchievementIdCounter++;
    const now = new Date();
    const achievementItem: UserPersonalAchievement = {
      ...achievement,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
      description: achievement.description || null,
      achievementDate: achievement.achievementDate || now,
      issuingOrganization: achievement.issuingOrganization || null,
      proofUrl: achievement.proofUrl || null,
      skills: achievement.skills || null
    };
    this.userPersonalAchievements.set(id, achievementItem);

    // Award XP for adding a personal achievement
    await this.addUserXP(userId, 75, "personal_achievement_added", "Added personal achievement");

    return achievementItem;
  }

  async updateUserPersonalAchievement(id: number, achievementData: Partial<UserPersonalAchievement>): Promise<UserPersonalAchievement | undefined> {
    const achievement = this.userPersonalAchievements.get(id);
    if (!achievement) return undefined;

    const now = new Date();
    const updatedAchievement = { 
      ...achievement, 
      ...achievementData,
      updatedAt: now 
    };

    this.userPersonalAchievements.set(id, updatedAchievement);
    return updatedAchievement;
  }

  async deleteUserPersonalAchievement(id: number): Promise<boolean> {
    return this.userPersonalAchievements.delete(id);
  }

  async getUserAchievements(userId: number): Promise<(Achievement & { earnedAt: Date })[]> {
    const userAchievementRecords = Array.from(this.userAchievements.values())
      .filter(ua => ua.userId === userId);

    return userAchievementRecords.map(record => {
      const achievement = this.achievements.get(record.achievementId);
      return {
        ...achievement!,
        earnedAt: record.earnedAt
      };
    });
  }

  async checkAndAwardAchievements(userId: number): Promise<Achievement[]> {
    const allAchievements = await this.getAchievements();
    const userAchievements = await this.getUserAchievements(userId);
    const earnedAchievementIds = userAchievements.map(a => a.id);
    const newlyEarnedAchievements: Achievement[] = [];

    // Check each achievement that hasn't been earned yet
    for (const achievement of allAchievements) {
      if (earnedAchievementIds.includes(achievement.id)) continue;

      // Check if user meets the requirements
      let meetsRequirements = false;

      switch (achievement.requiredAction) {
        case "resumes_created":
          const resumes = await this.getResumes(userId);
          meetsRequirements = resumes.length >= achievement.requiredValue;
          break;
        case "goals_created":
          const goals = await this.getGoals(userId);
          meetsRequirements = goals.length >= achievement.requiredValue;
          break;
        case "goals_completed":
          const completedGoals = (await this.getGoals(userId)).filter(g => g.completed);
          meetsRequirements = completedGoals.length >= achievement.requiredValue;
          break;
        // Add more achievement checks as needed
      }

      if (meetsRequirements) {
        // Award the achievement
        const userAchievementId = this.userAchievementIdCounter++;
        const now = new Date();
        const userAchievement: UserAchievement = {
          id: userAchievementId,
          userId,
          achievementId: achievement.id,
          earnedAt: now
        };
        this.userAchievements.set(userAchievementId, userAchievement);

        // Award XP for earning an achievement
        await this.addUserXP(userId, achievement.xpReward, "achievement_earned", `Earned achievement: ${achievement.name}`);

        newlyEarnedAchievements.push(achievement);
      }
    }

    return newlyEarnedAchievements;
  }

  // AI Coach operations
  async getAiCoachConversations(userId: number): Promise<AiCoachConversation[]> {
    return Array.from(this.aiCoachConversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAiCoachConversation(id: number): Promise<AiCoachConversation | undefined> {
    return this.aiCoachConversations.get(id);
  }

  async createAiCoachConversation(userId: number, conversation: InsertAiCoachConversation): Promise<AiCoachConversation> {
    const id = this.aiCoachConversationIdCounter++;
    const now = new Date();
    const aiCoachConversation: AiCoachConversation = {
      ...conversation,
      id,
      userId,
      createdAt: now
    };
    this.aiCoachConversations.set(id, aiCoachConversation);
    return aiCoachConversation;
  }

  async getAiCoachMessages(conversationId: number): Promise<AiCoachMessage[]> {
    return Array.from(this.aiCoachMessages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async addAiCoachMessage(message: InsertAiCoachMessage): Promise<AiCoachMessage> {
    const id = this.aiCoachMessageIdCounter++;
    const now = new Date();
    const aiCoachMessage: AiCoachMessage = {
      ...message,
      id,
      timestamp: now
    };
    this.aiCoachMessages.set(id, aiCoachMessage);

    // If it's a user message, add a small XP reward
    if (message.isUser) {
      const conversation = await this.getAiCoachConversation(message.conversationId);
      if (conversation) {
        await this.addUserXP(conversation.userId, 10, "ai_coach_interaction", "Interacted with AI Coach");
      }
    }

    return aiCoachMessage;
  }

  // XP History operations
  async getXpHistory(userId: number): Promise<XpHistory[]> {
    return Array.from(this.xpHistory.values())
      .filter(record => record.userId === userId)
      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());
  }

  // Contact message operations
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const id = this.contactMessageIdCounter++;
    const now = new Date();
    const contactMessage: ContactMessage = {
      ...message,
      id,
      timestamp: now,
      read: false,
      archived: false
    };
    this.contactMessages.set(id, contactMessage);
    return contactMessage;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessages.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getContactMessage(id: number): Promise<ContactMessage | undefined> {
    return this.contactMessages.get(id);
  }

  async markContactMessageAsRead(id: number): Promise<ContactMessage | undefined> {
    const message = this.contactMessages.get(id);
    if (!message) return undefined;

    const updatedMessage = { ...message, read: true };
    this.contactMessages.set(id, updatedMessage);
    return updatedMessage;
  }

  async markContactMessageAsArchived(id: number): Promise<ContactMessage | undefined> {
    const message = this.contactMessages.get(id);
    if (!message) return undefined;

    const updatedMessage = { ...message, archived: true };
    this.contactMessages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Stats operations
  async getUserStatistics(userId: number): Promise<{
    activeGoals: number;
    achievementsCount: number;
    resumesCount: number;
    pendingTasks: number;
    upcomingInterviews: number;
    monthlyXp: { month: string; xp: number }[];
  }> {
    // Use cache for expensive statistics calculations
    const cacheKey = `user-stats-${userId}`;

    // Check if cached stats are available
    const cachedStats = this.cache.get(cacheKey);
    if (cachedStats) {
      console.log(`Using cached statistics for user ${userId}`);
      return cachedStats;
    }

    console.log(`Calculating new statistics for user ${userId}`);
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    // Determine if this is a university user
    const isUniversityUser = user.userType === "university_student" || user.userType === "university_admin";

    const goals = await this.getGoals(userId);
    // Count goals that are in_progress and not completed, or have another active status
    console.log("All goals for user:", JSON.stringify(goals.map(g => ({ id: g.id, title: g.title, status: g.status, completed: g.completed }))));
    const activeGoals = goals.filter(g => {
      // Consider a goal active if its status is NOT 'completed'
      // and it's not marked as completed
      const isActive = g.status !== 'completed' && !g.completed;
      console.log(`Goal ${g.id} "${g.title}" - status: ${g.status}, completed: ${g.completed}, isActive: ${isActive}`);
      return isActive;
    }).length;

    const achievements = await this.getUserAchievements(userId);
    const achievementsCount = achievements.length;

    const resumes = await this.getResumes(userId);
    const resumesCount = resumes.length;

    // Count pending tasks (active goals with due date in the next week)
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(now.getDate() + 7);

    // Start with goals that have pending due dates
    let pendingTasks = goals.filter(g => {
      if (g.completed) return false;
      if (!g.dueDate) return false;
      const dueDate = new Date(g.dueDate);
      return dueDate <= oneWeekFromNow;
    }).length;
    
    // Add pending follow-up actions from job applications
    try {
      // Get all job applications for the user
      const applications = await this.getJobApplications(userId);
      
      // For each application, get and count pending follow-up actions
      for (const application of applications) {
        try {
          // Check if we can get follow-up actions for this application
          const followups = await this.getFollowupActionsForApplication(application.id);
          
          // Add pending (not completed) follow-up actions to the count
          const pendingFollowups = followups.filter(followup => !followup.completed);
          pendingTasks += pendingFollowups.length;
        } catch (error) {
          console.error(`Error getting follow-ups for application ${application.id}:`, error);
          // Continue with other applications if there's an error with one
        }
      }
    } catch (error) {
      console.error(`Error getting job applications for user ${userId}:`, error);
      // Continue with the statistics calculation even if we can't get application follow-ups
    }

    // Count upcoming interviews (stages with status "scheduled" and not completed)
    // First get all interview processes for this user
    const processes = await this.getInterviewProcesses(userId);

    // Track all interview stages that are scheduled
    let upcomingInterviews = 0;

    // For each process, get its stages and check for scheduled ones
    for (const process of processes) {
      const stages = await this.getInterviewStages(process.id);

      // Count stages that are scheduled but not completed
      const scheduledStages = stages.filter(stage => {
        // Check if stage has a scheduled date in the future and is not completed
        const now = new Date();
        const stageDate = stage.scheduledDate ? new Date(stage.scheduledDate) : null;

        // Scheduled date must exist, be in the future, and the stage must not be completed
        return stageDate && 
               stageDate >= now &&
               !stage.completedDate && 
               stage.outcome !== "passed" &&
               stage.outcome !== "failed";
      });

      upcomingInterviews += scheduledStages.length;

      // Get and count pending followup actions for this process
      const followups = await this.getFollowupActions(process.id);
      const pendingFollowups = followups.filter(followup => !followup.completed);

      // Add pending followups to the pending tasks count
      pendingTasks += pendingFollowups.length;
    }

    // Default empty XP data for regular users
    let monthlyXpArray: { month: string; xp: number }[] = [];

    // Get the month names for the past 6 months
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' });
      months.push(monthName);
    }

    // Only process XP history for university users
    if (isUniversityUser) {
      // Calculate monthly XP for the past 6 months
      const xpHistory = await this.getXpHistory(userId);
      const monthlyXp: { [key: string]: number } = {};

      // Initialize monthlyXp object with zeros
      months.forEach(month => {
        monthlyXp[month] = 0;
      });

      // Calculate XP for each month
      xpHistory.forEach(record => {
        const recordMonth = new Date(record.earnedAt).toLocaleString('default', { month: 'short' });
        if (months.includes(recordMonth)) {
          monthlyXp[recordMonth] = (monthlyXp[recordMonth] || 0) + record.amount;
        }
      });

      // Convert to array format
      monthlyXpArray = months.map(month => ({
        month,
        xp: monthlyXp[month] || 0
      }));
    } else {
      // For regular users, return an array with zero XP values
      monthlyXpArray = months.map(month => ({
        month,
        xp: 0
      }));
    }

    const stats = {
      activeGoals,
      achievementsCount,
      resumesCount,
      pendingTasks,
      upcomingInterviews,
      monthlyXp: monthlyXpArray
    };

    // Cache the statistics for 30 seconds to ensure more frequent updates
    this.cache.set(cacheKey, stats);
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, 30000); // 30 seconds instead of 5 minutes

    return stats;
  }

  // System monitoring methods
  async getSystemMetrics(): Promise<{
    status: string;
    uptime: number;
    lastIncident: string;
    lastChecked: string;
  }> {
    // In a real application, these values would be retrieved from monitoring systems
    return {
      status: "operational",
      uptime: 99.98,
      lastIncident: "2 days ago",
      lastChecked: new Date().toLocaleTimeString()
    };
  }

  async getComponentStatus(): Promise<{
    id: string;
    name: string;
    status: string;
    health: number;
    responseTime: string;
    icon: string;
    details?: {
      description: string;
      metrics: {
        name: string;
        value: string;
        change?: string;
        trend?: 'up' | 'down' | 'stable';
      }[];
      issues?: {
        id: string;
        title: string;
        description: string;
        severity: string;
        timeDetected: string;
        suggestedAction?: string;
        impact?: string;
        status?: 'open' | 'in_progress' | 'resolved';
      }[];
      logs?: {
        timestamp: string;
        message: string;
        level: string;
      }[];
      suggestedActions?: {
        id: string;
        title: string;
        description: string;
        impact: 'high' | 'medium' | 'low';
        effort: 'easy' | 'medium' | 'complex';
        eta: string;
        command?: string;
        requiresConfirmation?: boolean;
        requiresCredentials?: boolean;
        status?: 'available' | 'in_progress' | 'completed' | 'failed';
      }[];
    };
  }[]> {
    // This data would normally come from actual system monitoring
    // Using mock data for demonstration purposes
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toLocaleTimeString();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toLocaleTimeString();

    return [
      {
        id: "auth-service",
        name: "Authentication Service",
        status: "operational",
        health: 98,
        responseTime: "42ms",
        icon: "Shield", // Corresponds to lucide-react icon
        details: {
          description: "Handles user authentication and session management",
          metrics: [
            {
              name: "Success Rate",
              value: "99.7%",
              change: "+0.2%",
              trend: "up"
            },
            {
              name: "Avg. Response Time",
              value: "42ms",
              change: "-3ms",
              trend: "down"
            },
            {
              name: "Active Sessions",
              value: "2,457",
              change: "+125",
              trend: "up"
            }
          ],
          logs: [
            {
              timestamp: timestamp,
              message: "User login rate normal",
              level: "info"
            },
            {
              timestamp: fiveMinutesAgo,
              message: "Session cleanup completed",
              level: "info"
            },
            {
              timestamp: tenMinutesAgo,
              message: "Rate limiting applied to IP 192.168.1.127",
              level: "warning"
            }
          ]
        }
      },
      {
        id: "api-gateway",
        name: "API Gateway",
        status: "operational",
        health: 97,
        responseTime: "65ms",
        icon: "Network",
        details: {
          description: "Entry point for all API calls to the platform",
          metrics: [
            {
              name: "Request Rate",
              value: "876/min",
              change: "+12%",
              trend: "up"
            },
            {
              name: "Avg. Response Time",
              value: "65ms",
              change: "+5ms",
              trend: "up"
            },
            {
              name: "Error Rate",
              value: "0.2%",
              change: "-0.1%",
              trend: "down"
            }
          ],
          logs: [
            {
              timestamp: timestamp,
              message: "Traffic within normal parameters",
              level: "info"
            },
            {
              timestamp: fiveMinutesAgo,
              message: "API rate limits adjusted",
              level: "info"
            }
          ]
        }
      },
      {
        id: "database",
        name: "Database",
        status: "degraded",
        health: 89,
        responseTime: "120ms",
        icon: "Database",
        details: {
          description: "Primary data storage for user and application data",
          metrics: [
            {
              name: "Query Response Time",
              value: "120ms",
              change: "+35ms",
              trend: "up"
            },
            {
              name: "Connection Pool Usage",
              value: "78%",
              change: "+15%",
              trend: "up"
            },
            {
              name: "Disk Space",
              value: "67%",
              change: "+3%",
              trend: "up"
            }
          ],
          issues: [
            {
              id: "db-1",
              title: "Increased query latency",
              description: "Some queries are taking longer than expected due to index fragmentation",
              severity: "medium",
              timeDetected: "30 minutes ago",
              suggestedAction: "Run REINDEX operation",
              impact: "Affects approximately 15% of user requests",
              status: "in_progress"
            }
          ],
          logs: [
            {
              timestamp: timestamp,
              message: "Connection pool near capacity",
              level: "warning"
            },
            {
              timestamp: fiveMinutesAgo,
              message: "Query optimizer statistics update started",
              level: "info"
            },
            {
              timestamp: tenMinutesAgo,
              message: "Slow query detected: SELECT * FROM resumes WHERE...",
              level: "warning"
            }
          ],
          suggestedActions: [
            {
              id: "db-action-1",
              title: "Optimize Database Indexes",
              description: "Run maintenance task to rebuild fragmented indexes",
              impact: "medium",
              effort: "easy",
              eta: "5 minutes",
              command: "REINDEX DATABASE;",
              requiresConfirmation: true,
              status: "available"
            },
            {
              id: "db-action-2",
              title: "Increase Connection Pool",
              description: "Adjust max connections from 100 to 150",
              impact: "high",
              effort: "medium",
              eta: "10 minutes",
              requiresConfirmation: true,
              requiresCredentials: true,
              status: "available"
            }
          ]
        }
      },
      {
        id: "ai-service",
        name: "AI Service",
        status: "operational",
        health: 95,
        responseTime: "320ms",
        icon: "Brain",
        details: {
          description: "Handles all AI-related features including career advice and resume suggestions",
          metrics: [
            {
              name: "API Usage",
              value: "43%",
              change: "-2%",
              trend: "down"
            },
            {
              name: "Response Time",
              value: "320ms",
              change: "-15ms",
              trend: "down"
            },
            {
              name: "Token Usage",
              value: "2.1M/day",
              change: "+0.2M",
              trend: "up"
            }
          ],
          logs: [
            {
              timestamp: timestamp,
              message: "API quota usage within acceptable range",
              level: "info"
            },
            {
              timestamp: fiveMinutesAgo,
              message: "Model cache refreshed",
              level: "info"
            }
          ]
        }
      },
      {
        id: "storage-service",
        name: "File Storage",
        status: "operational",
        health: 99,
        responseTime: "18ms",
        icon: "HardDrive",
        details: {
          description: "Handles all file storage including resume documents and profile images",
          metrics: [
            {
              name: "Storage Utilization",
              value: "42%",
              change: "+1%",
              trend: "up"
            },
            {
              name: "Upload Success Rate",
              value: "99.9%",
              trend: "stable"
            },
            {
              name: "Download Speed",
              value: "15MB/s",
              trend: "stable"
            }
          ],
          logs: [
            {
              timestamp: timestamp,
              message: "Routine maintenance complete",
              level: "info"
            },
            {
              timestamp: tenMinutesAgo,
              message: "Storage quota increased for premium users",
              level: "info"
            }
          ]
        }
      },
      {
        id: "payment-service",
        name: "Payment Processing",
        status: "operational",
        health: 100,
        responseTime: "205ms",
        icon: "CreditCard",
        details: {
          description: "Handles all subscription and payment processing through Stripe",
          metrics: [
            {
              name: "Transaction Success",
              value: "100%",
              trend: "stable"
            },
            {
              name: "Response Time",
              value: "205ms",
              change: "-10ms",
              trend: "down"
            },
            {
              name: "Active Subscriptions",
              value: "1,205",
              change: "+15",
              trend: "up"
            }
          ],
          logs: [
            {
              timestamp: timestamp,
              message: "Webhook processing normal",
              level: "info"
            },
            {
              timestamp: fiveMinutesAgo,
              message: "Reconciliation process completed",
              level: "info"
            }
          ]
        }
      }
    ];
  }

  async getRecentAlerts(): Promise<{
    title: string;
    description: string;
    severity: string;
    time: string;
  }[]> {
    // This would normally come from a monitoring or alerting system
    return [
      {
        title: "Database performance degraded",
        description: "Some database operations are experiencing increased latency. Our team is investigating.",
        severity: "warning",
        time: "15 minutes ago"
      },
      {
        title: "System maintenance completed",
        description: "Scheduled maintenance has been completed successfully with no service interruptions.",
        severity: "success",
        time: "2 hours ago"
      }
    ];
  }

  // Interview Process Tracking operations
  async getInterviewProcesses(userId: number): Promise<InterviewProcess[]> {
    return Array.from(this.interviewProcesses.values())
      .filter(process => process.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getInterviewProcess(id: number): Promise<InterviewProcess | undefined> {
    return this.interviewProcesses.get(id);
  }

  async createInterviewProcess(userId: number, processData: InsertInterviewProcess): Promise<InterviewProcess> {
    const id = this.interviewProcessIdCounter++;
    const now = new Date();
    const interviewProcess: InterviewProcess = {
      ...processData,
      id,
      userId,
      status: processData.status || "applied",
      createdAt: now,
      updatedAt: now
    };
    this.interviewProcesses.set(id, interviewProcess);

    // Award XP for creating a new interview process
    await this.addUserXP(userId, 50, "interview_process_created", "Started tracking a new interview process");

    return interviewProcess;
  }

  async updateInterviewProcess(id: number, processData: Partial<InterviewProcess>): Promise<InterviewProcess | undefined> {
    const process = this.interviewProcesses.get(id);
    if (!process) return undefined;

    const now = new Date();
    const updatedProcess = { 
      ...process, 
      ...processData,
      updatedAt: now 
    };
    this.interviewProcesses.set(id, updatedProcess);

    // Award XP for updating job status if status changed
    if (processData.status && processData.status !== process.status) {
      await this.addUserXP(process.userId, 25, "interview_status_updated", `Updated job status to ${processData.status}`);
    }

    return updatedProcess;
  }

  async deleteInterviewProcess(id: number): Promise<boolean> {
    // Also delete all related stages and followup actions
    const process = this.interviewProcesses.get(id);
    if (!process) return false;

    const stages = await this.getInterviewStages(id);
    for (const stage of stages) {
      await this.deleteInterviewStage(stage.id);
    }

    const followupActions = await this.getFollowupActions(id);
    for (const action of followupActions) {
      await this.deleteFollowupAction(action.id);
    }

    return this.interviewProcesses.delete(id);
  }

  // Interview Stage operations
  async getInterviewStages(processId: number): Promise<InterviewStage[]> {
    return Array.from(this.interviewStages.values())
      .filter(stage => stage.processId === processId)
      .sort((a, b) => {
        // Sort by scheduled date if available, otherwise by creation date
        const aDate = a.scheduledDate || a.createdAt;
        const bDate = b.scheduledDate || b.createdAt;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      });
  }

  async getInterviewStage(id: number): Promise<InterviewStage | undefined> {
    return this.interviewStages.get(id);
  }

  async createInterviewStage(processId: number, stageData: InsertInterviewStage): Promise<InterviewStage> {
    // Validate process exists first
    const process = await this.getInterviewProcess(processId);
    if (!process) {
      throw new Error(`Interview process with ID ${processId} not found`);
    }

    const id = this.interviewStageIdCounter++;
    const now = new Date();
    const interviewStage: InterviewStage = {
      ...stageData,
      id,
      processId,
      createdAt: now,
      updatedAt: now
    };

    console.log(`Creating interview stage: ${JSON.stringify(interviewStage)}`);

    this.interviewStages.set(id, interviewStage);

    // Award XP to the user
    await this.addUserXP(process.userId, 40, "interview_stage_added", `Added interview stage: ${stageData.type}`);

    // If this stage has a scheduled date in the future, it should affect upcoming interviews
    if (stageData.scheduledDate) {
      const stageDate = new Date(stageData.scheduledDate);
      const now = new Date();
      if (stageDate >= now) {
        console.log(`Stage has future date, should increment upcoming interviews: ${stageDate}`);

        // Directly update the statistics cache to have correct upcoming interviews count
        const userStatsCacheKey = `user-stats-${process.userId}`;
        this.cache.delete(userStatsCacheKey);
      }
    }

    return interviewStage;
  }

  async updateInterviewStage(id: number, stageData: Partial<InterviewStage>): Promise<InterviewStage | undefined> {
    const stage = this.interviewStages.get(id);
    if (!stage) return undefined;

    const currentDate = new Date();
    const updatedStage = { 
      ...stage, 
      ...stageData,
      updatedAt: currentDate 
    };

    // If marking as completed and wasn't completed before
    if (stageData.completedDate && !stage.completedDate) {
      // Get the process to award XP to the user
      const process = await this.getInterviewProcess(stage.processId);
      if (process) {
        await this.addUserXP(process.userId, 75, "interview_stage_completed", `Completed interview stage: ${stage.type}`);
      }
    }

    this.interviewStages.set(id, updatedStage);

    // Invalidate user statistics cache since this affects upcoming interviews counts
    if (stageData.scheduledDate || stageData.completedDate || stageData.outcome) {
      // Get the process to invalidate the cache for the correct user
      const process = await this.getInterviewProcess(stage.processId);
      if (process) {
        const userStatsCacheKey = `user-stats-${process.userId}`;
        console.log(`Invalidating cache for ${userStatsCacheKey} due to interview stage update`);
        this.cache.delete(userStatsCacheKey);
      }
    }

    return updatedStage;
  }

  async deleteInterviewStage(id: number): Promise<boolean> {
    // Also delete related followup actions
    const stage = this.interviewStages.get(id);
    if (!stage) return false;

    // Get the process to find user id
    const process = await this.getInterviewProcess(stage.processId);

    const followupActions = Array.from(this.followupActions.values())
      .filter(action => action.stageId === id);

    for (const action of followupActions) {
      await this.deleteFollowupAction(action.id);
    }

    // Invalidate the user statistics cache if the stage was scheduled or this was an upcoming interview
    if (process && stage.scheduledDate) {
      const currentTime = new Date();
      const stageDate = new Date(stage.scheduledDate);

      if (stageDate >= currentTime && !stage.completedDate) {
        // This was an upcoming interview - invalidate stats
        const userStatsCacheKey = `user-stats-${process.userId}`;
        this.cache.delete(userStatsCacheKey);
      }
    }

    return this.interviewStages.delete(id);
  }

  // Followup Action operations
  async getFollowupActions(processId: number, stageId?: number): Promise<FollowupAction[]> {
    let actions = Array.from(this.followupActions.values())
      .filter(action => action.processId === processId);

    if (stageId !== undefined) {
      actions = actions.filter(action => action.stageId === stageId);
    }

    return actions.sort((a, b) => {
      // Sort by due date if available, otherwise by creation date
      const aDate = a.dueDate || a.createdAt;
      const bDate = b.dueDate || b.createdAt;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  }

  async getFollowupActionsByUser(userId: number): Promise<FollowupAction[]> {
    // First, get all processes belonging to this user
    const userProcesses = Array.from(this.interviewProcesses.values())
      .filter(process => process.userId === userId)
      .map(process => process.id);

    // Then, get all followup actions for these processes
    const actions = Array.from(this.followupActions.values())
      .filter(action => userProcesses.includes(action.processId));

    return actions.sort((a, b) => {
      // Sort by due date if available, otherwise by creation date
      const aDate = a.dueDate || a.createdAt;
      const bDate = b.dueDate || b.createdAt;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  }

  async getFollowupAction(id: number): Promise<FollowupAction | undefined> {
    return this.followupActions.get(id);
  }

  async createFollowupAction(processId: number, actionData: InsertFollowupAction): Promise<FollowupAction> {
    const id = this.followupActionIdCounter++;
    const now = new Date();
    const followupAction: FollowupAction = {
      ...actionData,
      id,
      processId,
      completed: false,
      completedDate: null,
      createdAt: now,
      updatedAt: now
    };
    this.followupActions.set(id, followupAction);

    // Get the process to award XP to the user and invalidate cache
    const process = await this.getInterviewProcess(processId);
    if (process) {
      // Clear the user statistics cache so the pending tasks count gets updated
      const userStatsCacheKey = `user-stats-${process.userId}`;
      this.cache.delete(userStatsCacheKey);
      console.log(`Deleted stats cache for user ${process.userId} on followup action creation`);

      await this.addUserXP(process.userId, 25, "followup_action_created", `Added followup action: ${actionData.type}`);
    }

    return followupAction;
  }

  async updateFollowupAction(id: number, actionData: Partial<FollowupAction>): Promise<FollowupAction | undefined> {
    const action = this.followupActions.get(id);
    if (!action) return undefined;

    const now = new Date();
    const updatedAction = { 
      ...action, 
      ...actionData,
      updatedAt: now 
    };
    this.followupActions.set(id, updatedAction);
    return updatedAction;
  }

  async completeFollowupAction(id: number): Promise<FollowupAction | undefined> {
    const action = this.followupActions.get(id);
    if (!action) return undefined;

    if (action.completed) {
      // Already completed
      return action;
    }

    const now = new Date();
    const updatedAction = {
      ...action,
      completed: true,
      completedDate: now,
      updatedAt: now
    };
    this.followupActions.set(id, updatedAction);

    // Get the process to award XP to the user
    const process = await this.getInterviewProcess(action.processId);
    if (process) {
      // Clear the user statistics cache so the pending tasks count gets updated
      const userStatsCacheKey = `user-stats-${process.userId}`;
      this.cache.delete(userStatsCacheKey);
      console.log(`Deleted stats cache for user ${process.userId} on followup action completion`);

      await this.addUserXP(process.userId, 50, "followup_action_completed", `Completed followup action: ${action.type}`);
    }

    return updatedAction;
  }

  async uncompleteFollowupAction(id: number): Promise<FollowupAction | undefined> {
    const action = this.followupActions.get(id);
    if (!action) return undefined;

    if (!action.completed) {
      // Already uncompleted
      return action;
    }

    const now = new Date();
    const updatedAction = {
      ...action,
      completed: false,
      completedDate: null,
      updatedAt: now
    };
    this.followupActions.set(id, updatedAction);

    // Get the process to invalidate the user statistics cache
    const process = await this.getInterviewProcess(action.processId);
    if (process) {
      // Clear the user statistics cache so the pending tasks count gets updated
      const userStatsCacheKey = `user-stats-${process.userId}`;
      this.cache.delete(userStatsCacheKey);
      console.log(`Deleted stats cache for user ${process.userId} on followup action uncompleted`);
    }

    return updatedAction;
  }

  async deleteFollowupAction(id: number): Promise<boolean> {
    // Get the action first to get the process and user info
    const action = this.followupActions.get(id);
    if (!action) return false;

    // Get the process to invalidate the user statistics cache
    const process = await this.getInterviewProcess(action.processId);

    // Delete the action
    const result = this.followupActions.delete(id);

    // Clear stats cache if we found the process and user
    if (result && process) {
      const userStatsCacheKey = `user-stats-${process.userId}`;
      this.cache.delete(userStatsCacheKey);
      console.log(`Deleted stats cache for user ${process.userId} on followup action deletion`);
    }

    return result;
  }

  // Subscription and verification methods
  async getUserByStripeSubscriptionId(subscriptionId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.stripeSubscriptionId === subscriptionId
    );
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.verificationToken === token
    );
  }

  async getUserByPendingEmailToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.pendingEmailToken === token
    );
  }

  async updateUserStripeInfo(userId: number, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: 'active' | 'inactive' | 'cancelled' | 'past_due';
    subscriptionPlan?: 'free' | 'premium' | 'university';
    subscriptionCycle?: 'monthly' | 'quarterly' | 'annual';
    subscriptionExpiresAt?: Date;
  }): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const updatedUser = { ...user, ...stripeInfo };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserVerificationInfo(userId: number, verificationInfo: {
    emailVerified?: boolean;
    verificationToken?: string | null;
    verificationExpires?: Date | null;
  }): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    // Handle null values properly
    const updatedUser = { 
      ...user,
      emailVerified: verificationInfo.emailVerified !== undefined ? verificationInfo.emailVerified : user.emailVerified,
      verificationToken: verificationInfo.verificationToken === null ? undefined : verificationInfo.verificationToken || user.verificationToken,
      verificationExpires: verificationInfo.verificationExpires === null ? undefined : verificationInfo.verificationExpires || user.verificationExpires,
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const updatedUser = { 
      ...user,
      password: newPassword,
      passwordLastChanged: new Date()
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Career Mentor Chat operations
  async getMentorChatConversations(userId: number): Promise<MentorChatConversation[]> {
    return Array.from(this.mentorChatConversations.values())
      .filter(conversation => conversation.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getMentorChatConversation(id: number): Promise<MentorChatConversation | undefined> {
    return this.mentorChatConversations.get(id);
  }

  async createMentorChatConversation(userId: number, conversation: InsertMentorChatConversation): Promise<MentorChatConversation> {
    const id = this.mentorChatConversationIdCounter++;
    const now = new Date();

    const newConversation: MentorChatConversation = {
      ...conversation,
      id,
      userId,
      createdAt: now,
      updatedAt: now
    };

    this.mentorChatConversations.set(id, newConversation);

    // Award XP for starting a new conversation with the mentor
    await this.addUserXP(userId, 25, "mentor_chat_started", "Started a conversation with the Career Mentor");

    return newConversation;
  }

  async getMentorChatMessages(conversationId: number): Promise<MentorChatMessage[]> {
    return Array.from(this.mentorChatMessages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async addMentorChatMessage(message: InsertMentorChatMessage): Promise<MentorChatMessage> {
    const id = this.mentorChatMessageIdCounter++;
    const now = new Date();

    const newMessage: MentorChatMessage = {
      ...message,
      id,
      createdAt: now
    };

    this.mentorChatMessages.set(id, newMessage);

    // Update the conversation's updatedAt timestamp
    const conversation = await this.getMentorChatConversation(message.conversationId);
    if (conversation) {
      conversation.updatedAt = now;
      this.mentorChatConversations.set(conversation.id, conversation);

      // Award XP for user messages only (not system or assistant)
      if (message.role === 'user') {
        await this.addUserXP(conversation.userId, 5, "mentor_chat_message", "Engaged with the Career Mentor");
      }
    }

    return newMessage;
  }

  // Recommendation operations
  async getRecommendations(userId: number): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values())
      .filter(recommendation => recommendation.userId === userId)
      .sort((a, b) => {
        // First, sort by completion status
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1; // Incomplete first
        }
        // Then, sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getRecommendation(id: number): Promise<Recommendation | undefined> {
    return this.recommendations.get(id);
  }

  async createRecommendation(userId: number, recommendationData: InsertRecommendation): Promise<Recommendation> {
    const id = this.recommendationIdCounter++;
    const now = new Date();
    const recommendation: Recommendation = {
      ...recommendationData,
      id,
      userId,
      completed: false,
      completedAt: null,
      createdAt: now
    };
    this.recommendations.set(id, recommendation);
    return recommendation;
  }

  async updateRecommendation(id: number, recommendationData: Partial<Recommendation>): Promise<Recommendation | undefined> {
    const recommendation = this.recommendations.get(id);
    if (!recommendation) return undefined;

    const updatedRecommendation = { ...recommendation, ...recommendationData };
    this.recommendations.set(id, updatedRecommendation);
    return updatedRecommendation;
  }

  async completeRecommendation(id: number): Promise<Recommendation | undefined> {
    const recommendation = this.recommendations.get(id);
    if (!recommendation) return undefined;

    const now = new Date();
    const completedRecommendation = {
      ...recommendation,
      completed: true,
      completedAt: now
    };

    this.recommendations.set(id, completedRecommendation);

    // Award XP for completing a recommendation
    await this.addUserXP(recommendation.userId, 15, "recommendation_completed", `Completed recommendation: ${recommendation.text}`);

    return completedRecommendation;
  }

  async generateDailyRecommendations(userId: number): Promise<Recommendation[]> {
    // Get the date for today's recommendations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if we already generated recommendations today
    const existingRecommendations = await this.getRecommendations(userId);
    const todaysRecommendations = existingRecommendations.filter(rec => {
      const recDate = new Date(rec.createdAt);
      recDate.setHours(0, 0, 0, 0);
      return recDate.getTime() === today.getTime();
    });

    // If we already have recommendations for today, return them
    if (todaysRecommendations.length > 0) {
      return todaysRecommendations;
    }

    // First, gather all user context data for AI recommendations
    // Get user data
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User not found with ID ${userId}`);
    }

    // Get user's active goals
    const goals = await this.getGoals(userId);
    const activeGoals = goals.filter(goal => !goal.completed);

    // Get user's interview processes
    const interviewProcesses = await this.getInterviewProcesses(userId);
    const activeProcesses = interviewProcesses.filter(process => process.status === "in_progress");

    // Get user's work history
    const workHistory = await this.getWorkHistory(userId);

    // Get upcoming stages
    const upcomingStages: InterviewStage[] = [];
    for (const process of activeProcesses) {
      const stages = await this.getInterviewStages(process.id);
      const upcoming = stages.filter(stage => stage.completedDate === null && stage.scheduledDate !== null);
      upcomingStages.push(...upcoming);
    }

    // Get pending followup actions
    const pendingActions: FollowupAction[] = [];
    for (const process of activeProcesses) {
      const actions = await this.getFollowupActions(process.id);
      const pending = actions.filter(action => !action.completed);
      pendingActions.push(...pending);
    }

    try {
      // Import the OpenAI recommendation generator
      const { generateDailyAIRecommendations } = await import('./utils/openai');

      // Generate AI-powered recommendations
      const aiRecommendations = await generateDailyAIRecommendations({
        userId,
        userName: user.name,
        goals: activeGoals,
        interviewProcesses: activeProcesses,
        workHistory
      });

      // Create recommendation objects from AI suggestions
      const newRecommendations: InsertRecommendation[] = [];

      // Add AI recommendations
      aiRecommendations.forEach(recommendation => {
        newRecommendations.push({
          userId,
          text: recommendation,
          type: "system", // Mark AI recommendations as system-generated
          relatedEntityType: "system"
        });
      });

      // Add critical goal-based recommendations
      if (activeGoals.length > 0) {
        activeGoals.forEach(goal => {
          if (goal.status === "not_started") {
            newRecommendations.push({
              userId,
              text: `Start working on your goal: "${goal.title}"`,
              type: "goal",
              relatedEntityId: goal.id,
              relatedEntityType: "goal"
            });
          }
        });
      }

      // Add critical upcoming interview recommendations
      if (upcomingStages.length > 0) {
        upcomingStages.forEach(stage => {
          if (stage.scheduledDate) {
            const stageDate = new Date(stage.scheduledDate);
            const daysDiff = Math.floor((stageDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff <= 3) { // If very soon (3 days)
              const process = activeProcesses.find(p => p.id === stage.processId);
              if (process) {
                newRecommendations.push({
                  userId,
                  text: `Prepare for your upcoming ${stage.type} with ${process.companyName} (${daysDiff} days away)`,
                  type: "interview",
                  relatedEntityId: stage.id,
                  relatedEntityType: "interview_stage"
                });
              }
            }
          }
        });
      }

      // Add critical pending followup recommendations
      if (pendingActions.length > 0) {
        pendingActions.forEach(action => {
          if (action.dueDate) {
            const dueDate = new Date(action.dueDate);
            const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff <= 1) { // If due today or tomorrow
              newRecommendations.push({
                userId,
                text: `Complete action: "${action.description}" (due ${daysDiff <= 0 ? 'today' : 'tomorrow'})`,
                type: "followup",
                relatedEntityId: action.id,
                relatedEntityType: "followup_action"
              });
            }
          }
        });
      }

      // Create all the recommendations in the database
      const createdRecommendations: Recommendation[] = [];
      for (const rec of newRecommendations) {
        createdRecommendations.push(await this.createRecommendation(userId, rec));
      }

      return createdRecommendations;
    } catch (error) {
      console.error("Error generating AI recommendations:", error);

      // Fallback to previous recommendation generation logic if AI fails
      const newRecommendations: InsertRecommendation[] = [];

      // 1. Goal-based recommendations
      if (activeGoals.length > 0) {
        // For each goal, create a recommendation
        activeGoals.forEach(goal => {
          if (goal.status === "not_started") {
            newRecommendations.push({
              userId,
              text: `Start working on your goal: "${goal.title}"`,
              type: "goal",
              relatedEntityId: goal.id,
              relatedEntityType: "goal"
            });
          } else if (goal.progress < 50) {
            newRecommendations.push({
              userId,
              text: `Continue progress on your goal: "${goal.title}"`,
              type: "goal",
              relatedEntityId: goal.id,
              relatedEntityType: "goal"
            });
          }
        });
      } else {
        // If no active goals, recommend creating one
        newRecommendations.push({
          userId,
          text: "Create a new career goal to track your progress",
          type: "system",
          relatedEntityType: "system"
        });
      }

      // 2. Interview process recommendations
      if (activeProcesses.length > 0) {
        // For each process, create recommendations
        activeProcesses.forEach(process => {
          newRecommendations.push({
            userId,
            text: `Update status for your interview with ${process.companyName}`,
            type: "interview",
            relatedEntityId: process.id,
            relatedEntityType: "interview_process"
          });
        });
      }

      // 3. Upcoming interview recommendations
      if (upcomingStages.length > 0) {
        upcomingStages.forEach(stage => {
          if (stage.scheduledDate) {
            const stageDate = new Date(stage.scheduledDate);
            const daysDiff = Math.floor((stageDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff <= 7) { // If within a week
              const process = activeProcesses.find(p => p.id === stage.processId);
              if (process) {
                newRecommendations.push({
                  userId,
                  text: `Prepare for your upcoming ${stage.type} with ${process.companyName} (${daysDiff} days away)`,
                  type: "interview",
                  relatedEntityId: stage.id,
                  relatedEntityType: "interview_stage"
                });
              }
            }
          }
        });
      }

      // 4. Pending followup recommendations
      if (pendingActions.length > 0) {
        pendingActions.forEach(action => {
          if (action.dueDate) {
            const dueDate = new Date(action.dueDate);
            const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff <= 3) { // If due within 3 days
              newRecommendations.push({
                userId,
                text: `Complete action: "${action.description}" (due ${daysDiff <= 0 ? 'today' : `in ${daysDiff} days`})`,
                type: "followup",
                relatedEntityId: action.id,
                relatedEntityType: "followup_action"
              });
            }
          }
        });
      }

      // 5. System recommendations
      // If less than 5 recommendations, add generic career development recommendations
      if (newRecommendations.length < 5) {
        const genericRecommendations = [
          "Update your work history with recent experiences",
          "Update your resume with your latest skills and achievements",
          "Practice a new interview question today",
          "Connect with the AI Career Coach for personalized advice",
          "Review and update the skills section of your profile",
          "Add a recent achievement to showcase your progress"
        ];

        // Add random generic recommendations until we have at least 5
        while (newRecommendations.length < 5 && genericRecommendations.length > 0) {
          const randomIndex = Math.floor(Math.random() * genericRecommendations.length);
          const recommendation = genericRecommendations.splice(randomIndex, 1)[0];

          newRecommendations.push({
            userId,
            text: recommendation,
            type: "system",
            relatedEntityType: "system"
          });
        }
      }

      // Create all the recommendations in the database
      const createdRecommendations: Recommendation[] = [];
      for (const rec of newRecommendations) {
        createdRecommendations.push(await this.createRecommendation(userId, rec));
      }

      return createdRecommendations;
    }
  }

  async clearTodaysRecommendations(userId: number): Promise<void> {
    // Get today's date (start of the day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all recommendations for the user
    const existingRecommendations = await this.getRecommendations(userId);

    // Filter to get only today's recommendations
    const todaysRecommendations = existingRecommendations.filter(rec => {
      const recDate = new Date(rec.createdAt);
      recDate.setHours(0, 0, 0, 0);
      return recDate.getTime() === today.getTime();
    });

    // Remove today's recommendations from the map
    for (const rec of todaysRecommendations) {
      this.recommendations.delete(rec.id);
    }
  }

  // Career Path operations
  async saveCareerPath(userId: number, name: string, pathData: any): Promise<CareerPath> {
    const id = this.careerPathIdCounter++;
    const now = new Date();

    const careerPath: CareerPath = {
      id,
      userId,
      name,
      pathData,
      createdAt: now,
      updatedAt: now
    };

    this.careerPaths.set(id, careerPath);
    return careerPath;
  }

  async getUserCareerPaths(userId: number): Promise<CareerPath[]> {
    return Array.from(this.careerPaths.values()).filter(path => path.userId === userId);
  }

  async getCareerPath(id: number): Promise<CareerPath | undefined> {
    return this.careerPaths.get(id);
  }

  async deleteCareerPath(id: number): Promise<boolean> {
    return this.careerPaths.delete(id);
  }
  
  // Skill Stacker operations
  async getSkillStackerPlan(id: number): Promise<SkillStackerPlan | undefined> {
    return this.skillStackerPlans.get(id);
  }

  async getSkillStackerPlanByGoalAndWeek(goalId: number, week: number): Promise<SkillStackerPlan | undefined> {
    return Array.from(this.skillStackerPlans.values()).find(
      plan => plan.goalId === goalId && plan.week === week
    );
  }

  async getAllSkillStackerPlans(userId: number): Promise<SkillStackerPlan[]> {
    return Array.from(this.skillStackerPlans.values()).filter(
      plan => plan.userId === userId
    );
  }

  async getSkillStackerPlansByGoal(goalId: number): Promise<SkillStackerPlan[]> {
    return Array.from(this.skillStackerPlans.values()).filter(
      plan => plan.goalId === goalId
    );
  }

  async createSkillStackerPlan(userId: number, plan: InsertSkillStackerPlan): Promise<SkillStackerPlan> {
    const id = this.skillStackerPlanIdCounter++;
    const now = new Date();
    
    const newPlan: SkillStackerPlan = {
      ...plan,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
      status: plan.status || 'active',
      isCompleted: false,
      completedAt: null,
      streak: 0,
      tasks: plan.tasks || []
    };
    
    this.skillStackerPlans.set(id, newPlan);
    
    // Award XP for creating a skill stacker plan
    await this.addUserXP(userId, 25, "skill_stacker_created", "Created a new skill stacker plan");
    
    return newPlan;
  }

  async updateSkillStackerPlan(id: number, planData: Partial<SkillStackerPlan>): Promise<SkillStackerPlan | undefined> {
    const plan = this.skillStackerPlans.get(id);
    if (!plan) return undefined;
    
    const now = new Date();
    const updatedPlan = { 
      ...plan, 
      ...planData,
      updatedAt: now
    };
    
    this.skillStackerPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async updateSkillStackerTaskStatus(planId: number, taskId: string, status: "complete" | "incomplete", rating?: number): Promise<SkillStackerPlan | undefined> {
    const plan = this.skillStackerPlans.get(planId);
    if (!plan) return undefined;
    
    const now = new Date();
    
    // Find the task to update
    const updatedTasks = plan.tasks.map(task => {
      if (task.id === taskId) {
        const updatedTask: SkillStackerTask = {
          ...task,
          status,
          completedAt: status === 'complete' ? now : null
        };
        
        if (rating && status === 'complete') {
          updatedTask.rating = rating;
        }
        
        return updatedTask;
      }
      return task;
    });
    
    // Calculate if all tasks are complete
    const allTasksComplete = updatedTasks.every(task => task.status === 'complete');
    
    // Update the plan
    const updatedPlan: SkillStackerPlan = {
      ...plan,
      tasks: updatedTasks,
      updatedAt: now,
      isCompleted: allTasksComplete,
      completedAt: allTasksComplete && !plan.isCompleted ? now : plan.completedAt
    };
    
    this.skillStackerPlans.set(planId, updatedPlan);
    
    // Award XP for completing a task
    if (status === 'complete') {
      await this.addUserXP(plan.userId, 10, "skill_task_completed", "Completed a skill development task");
    }
    
    return updatedPlan;
  }

  async completeSkillStackerWeek(planId: number): Promise<SkillStackerPlan | undefined> {
    const plan = this.skillStackerPlans.get(planId);
    if (!plan || plan.isCompleted) return plan;
    
    const now = new Date();
    
    // Mark as completed and update the streak
    const updatedPlan: SkillStackerPlan = {
      ...plan,
      isCompleted: true,
      status: 'completed',
      completedAt: now,
      updatedAt: now,
      streak: plan.streak + 1
    };
    
    this.skillStackerPlans.set(planId, updatedPlan);
    
    // Award XP for completing the weekly plan
    await this.addUserXP(plan.userId, 50, "skill_stacker_completed", "Completed a weekly skill development plan");
    
    return updatedPlan;
  }

  async deleteSkillStackerPlan(id: number): Promise<boolean> {
    return this.skillStackerPlans.delete(id);
  }

  // Support ticket functions
  async getSupportTickets(filters?: any): Promise<any[]> {
    // Implement your support ticket retrieval logic here
    return [];
  }

  async getSupportTicket(id: number): Promise<any | undefined> {
    // Implement your support ticket retrieval logic here
    return undefined;
  }

  async updateSupportTicket(id: number, data: any): Promise<any> {
    // Implement your support ticket update logic here
    return {};
  }

  async createSupportTicket(data: any): Promise<any> {
    const id = this.supportTicketIdCounter++;
    const now = new Date();
    const supportTicket = { ...data, id, createdAt: now };
    this.supportTickets.set(id, supportTicket);
    return supportTicket;
  }

  // Job Listings operations
  async getJobListings(filters?: { 
    query?: string; 
    location?: string; 
    remote?: boolean; 
    jobType?: string; 
    page?: number; 
    pageSize?: number; 
  }): Promise<{ listings: JobListing[]; total: number }> {
    let listings = Array.from(this.jobListings.values());
    
    // Apply filters if provided
    if (filters) {
      if (filters.query) {
        const lowercaseQuery = filters.query.toLowerCase();
        listings = listings.filter(listing => 
          listing.title.toLowerCase().includes(lowercaseQuery) || 
          listing.company.toLowerCase().includes(lowercaseQuery) ||
          listing.description.toLowerCase().includes(lowercaseQuery)
        );
      }
      
      if (filters.location) {
        const lowercaseLocation = filters.location.toLowerCase();
        listings = listings.filter(listing => 
          listing.location.toLowerCase().includes(lowercaseLocation)
        );
      }
      
      if (filters.remote !== undefined) {
        listings = listings.filter(listing => listing.remote === filters.remote);
      }
      
      if (filters.jobType) {
        listings = listings.filter(listing => listing.jobType === filters.jobType);
      }
      
      // Pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 10;
      const startIndex = (page - 1) * pageSize;
      const total = listings.length;
      listings = listings.slice(startIndex, startIndex + pageSize);
      
      return { listings, total };
    }
    
    return { listings, total: listings.length };
  }

  async getJobListing(id: number): Promise<JobListing | undefined> {
    return this.jobListings.get(id);
  }

  async createJobListing(listing: InsertJobListing): Promise<JobListing> {
    const id = this.jobListingIdCounter++;
    const now = new Date();
    
    const newListing: JobListing = {
      ...listing,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.jobListings.set(id, newListing);
    return newListing;
  }

  async updateJobListing(id: number, listingData: Partial<JobListing>): Promise<JobListing | undefined> {
    const listing = this.jobListings.get(id);
    if (!listing) return undefined;
    
    const updatedListing: JobListing = {
      ...listing,
      ...listingData,
      updatedAt: new Date()
    };
    
    this.jobListings.set(id, updatedListing);
    return updatedListing;
  }

  async deleteJobListing(id: number): Promise<boolean> {
    return this.jobListings.delete(id);
  }
  
  // Job Applications operations
  async getJobApplications(userId: number): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values())
      .filter(application => application.userId === userId);
  }

  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    return this.jobApplications.get(id);
  }

  async createJobApplication(userId: number, application: InsertJobApplication): Promise<JobApplication> {
    const id = this.jobApplicationIdCounter++;
    const now = new Date();
    
    // Ensure jobId is set (use provided value or default to 0 for manually created applications)
    const jobId = application.jobId ?? 0;
    
    const newApplication: JobApplication = {
      ...application,
      id,
      userId,
      jobId, 
      status: application.status || "In Progress", // Capitalized for consistency with UI
      createdAt: now,
      updatedAt: now
    };
    
    console.log(`Creating job application with ID ${id} for user ${userId} with jobId ${jobId}`);
    this.jobApplications.set(id, newApplication);
    return newApplication;
  }

  async updateJobApplication(id: number, applicationData: Partial<JobApplication>): Promise<JobApplication | undefined> {
    const application = this.jobApplications.get(id);
    if (!application) return undefined;
    
    const updatedApplication: JobApplication = {
      ...application,
      ...applicationData,
      updatedAt: new Date()
    };
    
    this.jobApplications.set(id, updatedApplication);
    return updatedApplication;
  }

  async submitJobApplication(id: number, applied: boolean = true): Promise<JobApplication | undefined> {
    const application = this.jobApplications.get(id);
    if (!application) return undefined;
    
    // Check if all required steps are completed
    const steps = await this.getApplicationWizardSteps(id);
    
    // For demo/development purposes, we'll allow submission even if not all steps are completed
    // In production, you would want to enforce this validation
    /*
    const allStepsCompleted = steps.every(step => step.completed);
    
    if (!allStepsCompleted) {
      throw new Error("All application steps must be completed before submitting");
    }
    */
    
    // Set status based on whether the user has checked "I've submitted this application"
    const status = applied ? "Applied" : "In Progress";
    
    const submittedApplication: JobApplication = {
      ...application,
      status: status,  // Set to "Applied" or "In Progress" based on checkbox
      submittedAt: applied ? new Date() : null, // Only set submittedAt if actually applied
      appliedAt: applied ? new Date() : null, // Only set appliedAt if actually applied
      updatedAt: new Date()
    };
    
    this.jobApplications.set(id, submittedApplication);
    
    // Award XP for applying to a job only if actually applied
    if (applied && application.userId) {
      await this.addUserXP(application.userId, 50, "job_application", `Applied to ${application.title || application.jobTitle} at ${application.company}`);
    }
    
    return submittedApplication;
  }

  async deleteJobApplication(id: number): Promise<boolean> {
    // Also delete any associated wizard steps
    const steps = await this.getApplicationWizardSteps(id);
    steps.forEach(step => {
      this.applicationWizardSteps.delete(step.id);
    });
    
    return this.jobApplications.delete(id);
  }
  
  // Application Interview Stages operations
  async getInterviewStagesForApplication(applicationId: number): Promise<InterviewStage[]> {
    return Array.from(this.interviewStages.values())
      .filter(stage => {
        // Handle both legacy data and new data structure
        return stage.applicationId === applicationId;
      })
      .sort((a, b) => {
        if (a.scheduledDate && b.scheduledDate) {
          return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
        }
        return 0;
      });
  }

  async createInterviewStageForApplication(applicationId: number, stageData: any): Promise<InterviewStage> {
    const id = this.interviewStageIdCounter++;
    const now = new Date();
    
    const newStage: InterviewStage = {
      id,
      applicationId,
      processId: null, // Not associated with an interview process
      type: stageData.type || 'interview',
      status: stageData.status || 'scheduled',
      scheduledDate: stageData.scheduledDate ? new Date(stageData.scheduledDate) : null,
      completedDate: stageData.completedDate ? new Date(stageData.completedDate) : null,
      location: stageData.location || null,
      interviewers: stageData.interviewers || [],
      notes: stageData.notes || null,
      outcome: stageData.outcome || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.interviewStages.set(id, newStage);
    return newStage;
  }
  
  // Application Follow-up Actions operations
  async getFollowupActionsForApplication(applicationId: number): Promise<FollowupAction[]> {
    return Array.from(this.followupActions.values())
      .filter(action => {
        // Handle both legacy data and new data structure
        return action.applicationId === applicationId;
      })
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      });
  }

  async createFollowupActionForApplication(applicationId: number, actionData: any): Promise<FollowupAction> {
    const id = this.followupActionIdCounter++;
    const now = new Date();
    
    const newAction: FollowupAction = {
      id,
      applicationId,
      processId: null, // Not associated with an interview process
      stageId: actionData.stageId || null,
      type: actionData.type || 'follow_up',
      description: actionData.description || '',
      dueDate: actionData.dueDate ? new Date(actionData.dueDate) : null,
      completed: actionData.completed || false,
      completedDate: actionData.completedDate ? new Date(actionData.completedDate) : null,
      notes: actionData.notes || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.followupActions.set(id, newAction);
    return newAction;
  }
  
  // Application Wizard Steps operations
  async getApplicationWizardSteps(applicationId: number): Promise<ApplicationWizardStep[]> {
    return Array.from(this.applicationWizardSteps.values())
      .filter(step => step.applicationId === applicationId)
      .sort((a, b) => a.order - b.order); // Sort by step order
  }

  async getApplicationWizardStep(id: number): Promise<ApplicationWizardStep | undefined> {
    return this.applicationWizardSteps.get(id);
  }

  async createApplicationWizardStep(applicationId: number, step: InsertApplicationWizardStep): Promise<ApplicationWizardStep> {
    const id = this.applicationWizardStepIdCounter++;
    const now = new Date();
    
    const newStep: ApplicationWizardStep = {
      ...step,
      id,
      applicationId,
      isCompleted: false,
      createdAt: now,
      updatedAt: now
    };
    
    this.applicationWizardSteps.set(id, newStep);
    return newStep;
  }

  async updateApplicationWizardStep(id: number, stepData: Partial<ApplicationWizardStep>): Promise<ApplicationWizardStep | undefined> {
    const step = this.applicationWizardSteps.get(id);
    if (!step) return undefined;
    
    const updatedStep: ApplicationWizardStep = {
      ...step,
      ...stepData,
      updatedAt: new Date()
    };
    
    this.applicationWizardSteps.set(id, updatedStep);
    return updatedStep;
  }

  async completeApplicationWizardStep(id: number): Promise<ApplicationWizardStep | undefined> {
    const step = this.applicationWizardSteps.get(id);
    if (!step) return undefined;
    
    const completedStep: ApplicationWizardStep = {
      ...step,
      isCompleted: true,
      completedAt: new Date(),
      updatedAt: new Date()
    };
    
    this.applicationWizardSteps.set(id, completedStep);
    
    // Get the application
    const application = await this.getJobApplication(step.applicationId);
    if (application) {
      // Check if all steps are completed
      const steps = await this.getApplicationWizardSteps(application.id);
      const completedSteps = steps.filter(s => s.isCompleted).length;
      const totalSteps = steps.length;
      
      // Update application progress
      await this.updateJobApplication(application.id, {
        progress: Math.floor((completedSteps / totalSteps) * 100)
      });
    }
    
    return completedStep;
  }

  // Skills operations
  private skills = new Map<number, Skill>();
  private nextSkillId = 1;

  async getUserSkills(userId: number): Promise<Skill[]> {
    return Array.from(this.skills.values()).filter(skill => skill.userId === userId);
  }

  async getSkill(id: number): Promise<Skill | undefined> {
    return this.skills.get(id);
  }

  async createSkill(data: any): Promise<Skill> {
    const userId = data.userId;
    const id = this.nextSkillId++;
    
    const newSkill: Skill = {
      id,
      userId,
      name: data.name,
      proficiencyLevel: data.proficiencyLevel || 1,
      category: data.category || 'technical',
      yearOfExperience: data.yearOfExperience || null,
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.skills.set(id, newSkill);
    return newSkill;
  }

  async updateSkill(id: number, data: any): Promise<Skill | undefined> {
    const skill = this.skills.get(id);
    if (!skill) return undefined;
    
    const updatedSkill: Skill = {
      ...skill,
      ...data,
      updatedAt: new Date()
    };
    
    this.skills.set(id, updatedSkill);
    return updatedSkill;
  }

  async deleteSkill(id: number): Promise<boolean> {
    return this.skills.delete(id);
  }

  // Languages operations
  private languages = new Map<number, Language>();
  private nextLanguageId = 1;

  async getUserLanguages(userId: number): Promise<Language[]> {
    return Array.from(this.languages.values()).filter(lang => lang.userId === userId);
  }

  async getLanguage(id: number): Promise<Language | undefined> {
    return this.languages.get(id);
  }

  async createLanguage(data: any): Promise<Language> {
    const userId = data.userId;
    const id = this.nextLanguageId++;
    
    const newLanguage: Language = {
      id,
      userId,
      name: data.name,
      proficiencyLevel: data.proficiencyLevel || 'beginner',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.languages.set(id, newLanguage);
    return newLanguage;
  }

  async updateLanguage(id: number, data: any): Promise<Language | undefined> {
    const language = this.languages.get(id);
    if (!language) return undefined;
    
    const updatedLanguage: Language = {
      ...language,
      ...data,
      updatedAt: new Date()
    };
    
    this.languages.set(id, updatedLanguage);
    return updatedLanguage;
  }

  async deleteLanguage(id: number): Promise<boolean> {
    return this.languages.delete(id);
  }
  
  // Networking Contacts (Ascentul CRM) operations
  async getNetworkingContacts(userId: number, filters?: { query?: string, relationshipType?: string }): Promise<NetworkingContact[]> {
    let contacts = Array.from(this.networkingContacts.values()).filter(contact => contact.userId === userId);
    
    // Apply filters if provided
    if (filters) {
      if (filters.query) {
        const query = filters.query.toLowerCase();
        contacts = contacts.filter(contact => 
          contact.name.toLowerCase().includes(query) || 
          (contact.company && contact.company.toLowerCase().includes(query)) || 
          (contact.position && contact.position.toLowerCase().includes(query)) || 
          (contact.email && contact.email.toLowerCase().includes(query))
        );
      }
      
      if (filters.relationshipType) {
        contacts = contacts.filter(contact => contact.relationshipType === filters.relationshipType);
      }
    }
    
    // Sort by most recent first
    return contacts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getNetworkingContact(id: number): Promise<NetworkingContact | undefined> {
    return this.networkingContacts.get(id);
  }
  
  async createNetworkingContact(userId: number, contact: InsertNetworkingContact): Promise<NetworkingContact> {
    const id = this.networkingContactIdCounter++;
    const now = new Date();
    const newContact: NetworkingContact = {
      ...contact,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
      // Set default values for optional fields if not provided
      followUpDate: contact.followUpDate || null,
      lastContactDate: contact.lastContactDate || now,
      notes: contact.notes || "",
      source: contact.source || "manual",
      status: contact.status || "active"
    };
    this.networkingContacts.set(id, newContact);
    return newContact;
  }
  
  async updateNetworkingContact(id: number, contactData: Partial<NetworkingContact>): Promise<NetworkingContact | undefined> {
    const contact = this.networkingContacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact = {
      ...contact,
      ...contactData,
      updatedAt: new Date()
    };
    this.networkingContacts.set(id, updatedContact);
    return updatedContact;
  }
  
  async deleteNetworkingContact(id: number): Promise<boolean> {
    return this.networkingContacts.delete(id);
  }
  
  async getContactsNeedingFollowUp(userId: number): Promise<NetworkingContact[]> {
    const now = new Date();
    
    // First, get contacts with built-in followUpDate property (including future dates)
    const contactsWithBuiltInFollowup = Array.from(this.networkingContacts.values())
      .filter(contact => 
        contact.userId === userId && 
        contact.status === "active" &&
        contact.followUpDate !== null
      );
    
    // Get all follow-up actions that are for contacts (not completed, regardless of date)
    const allContactFollowups = Array.from(this.followupActions.values())
      .filter(followup => 
        !followup.completed && 
        followup.dueDate !== null &&
        followup.type.startsWith('contact_')
      );
      
    console.log(`Found ${allContactFollowups.length} pending follow-ups in the system`);
    
    // Get contact IDs from follow-up actions
    const contactIdsWithExplicitFollowups = new Set(
      allContactFollowups.map(followup => followup.applicationId)
    );
    
    // Get contacts that have explicit follow-ups
    const contactsWithExplicitFollowups = Array.from(this.networkingContacts.values())
      .filter(contact => 
        contact.userId === userId && 
        contact.status === "active" &&
        contactIdsWithExplicitFollowups.has(contact.id)
      );
    
    console.log(`Found ${contactsWithExplicitFollowups.length} contacts with explicit follow-ups`);
    
    // Combine both lists, removing duplicates
    const allContactIds = new Set();
    const allContacts: NetworkingContact[] = [];
    
    // Process both lists and ensure we don't have duplicates
    [...contactsWithBuiltInFollowup, ...contactsWithExplicitFollowups].forEach(contact => {
      if (!allContactIds.has(contact.id)) {
        allContactIds.add(contact.id);
        allContacts.push(contact);
      }
    });
    
    console.log(`Total contacts needing follow-up: ${allContacts.length}`);
    
    // Sort by followUpDate (oldest first), or by due date of earliest follow-up action
    return allContacts.sort((a, b) => {
      // If both have followUpDate, use that
      if (a.followUpDate && b.followUpDate) {
        return a.followUpDate.getTime() - b.followUpDate.getTime();
      }
      
      // If only one has followUpDate, prioritize it
      if (a.followUpDate) return -1;
      if (b.followUpDate) return 1;
      
      // Otherwise sort by most recently created
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  // Contact Interactions methods
  async getContactInteractions(contactId: number): Promise<ContactInteraction[]> {
    // Filter interactions by contactId and sort by date (most recent first)
    return Array.from(this.contactInteractions.values())
      .filter(interaction => interaction.contactId === contactId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createContactInteraction(userId: number, contactId: number, interaction: InsertContactInteraction): Promise<ContactInteraction> {
    // Ensure the contact exists
    const contact = this.networkingContacts.get(contactId);
    if (!contact) {
      throw new Error(`Contact with ID ${contactId} not found`);
    }

    // Create the new interaction
    const newInteraction: ContactInteraction = {
      id: this.contactInteractionIdCounter++,
      contactId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...interaction
    };

    // Store the interaction
    this.contactInteractions.set(newInteraction.id, newInteraction);

    // Update the contact's lastContactedDate
    contact.lastContactedDate = new Date();
    this.networkingContacts.set(contact.id, contact);

    return newInteraction;
  }
  
  async updateContactInteraction(id: number, data: Partial<ContactInteraction>): Promise<ContactInteraction | undefined> {
    const interaction = this.contactInteractions.get(id);
    if (!interaction) return undefined;
    
    const updatedInteraction: ContactInteraction = {
      ...interaction,
      ...data,
      updatedAt: new Date()
    };
    
    this.contactInteractions.set(id, updatedInteraction);
    return updatedInteraction;
  }
  
  async deleteContactInteraction(id: number): Promise<boolean> {
    return this.contactInteractions.delete(id);
  }
  
  // Contact Follow-ups methods
  async getContactFollowUps(contactId: number): Promise<FollowupAction[]> {
    console.log(`🔍 Looking for follow-ups for contact ID: ${contactId}`);
    
    // Debug all follow-up actions in storage
    const allActions = Array.from(this.followupActions.values());
    console.log(`📊 Total follow-up actions in storage: ${allActions.length}`);
    
    // Debug the actions to find any for this contact
    allActions.forEach(action => {
      console.log(`📑 Follow-up ID ${action.id}:
        - applicationId: ${action.applicationId}
        - type: ${action.type}
        - dueDate: ${action.dueDate}
        - notes: ${action.notes}
      `);
    });
    
    // Filter follow-ups by contactId and sort by due date (most recent first)
    const result = Array.from(this.followupActions.values())
      .filter(followup => {
        // Check if this is a contact follow-up for the requested contact
        const matches = followup.applicationId === contactId;
        
        // We no longer need to check type.startsWith('contact_') due to a bug in the createContactFollowUp method
        // where it doesn't add this prefix correctly. Let's only filter by applicationId.
        
        return matches;
      })
      .sort((a, b) => {
        // Sort by due date if available, otherwise by created date
        const dateA = a.dueDate || a.createdAt;
        const dateB = b.dueDate || b.createdAt;
        return dateA.getTime() - dateB.getTime();
      });
      
    console.log(`✅ Found ${result.length} follow-ups for contact ID: ${contactId}`);
    return result;
  }

  async createContactFollowUp(userId: number, contactId: number, followUp: Partial<InsertFollowupAction>): Promise<FollowupAction> {
    // Ensure the contact exists
    const contact = this.networkingContacts.get(contactId);
    if (!contact) {
      throw new Error(`Contact with ID ${contactId} not found`);
    }

    const now = new Date();
    
    // Log incoming data
    console.log(`📝 Creating contact follow-up for contact ID ${contactId}:`, JSON.stringify(followUp, null, 2));
    
    // Check/validate dueDate if provided
    let parsedDueDate = null;
    if (followUp.dueDate) {
      if (followUp.dueDate instanceof Date) {
        console.log(`✅ Valid Date object for dueDate:`, followUp.dueDate.toISOString());
        parsedDueDate = followUp.dueDate;
      } else {
        try {
          parsedDueDate = new Date(followUp.dueDate);
          console.log(`✅ Parsed dueDate string to Date:`, parsedDueDate.toISOString());
        } catch (err) {
          console.error(`❌ Error parsing dueDate:`, err);
          throw new Error("Invalid date format");
        }
      }
    }
    
    // Ensure the type includes the contact_ prefix
    let followUpType = followUp.type || 'followup';
    if (!followUpType.startsWith('contact_')) {
      followUpType = `contact_${followUpType}`;
    }
    
    // Create the new follow-up
    const newFollowUp: FollowupAction = {
      id: this.followupActionIdCounter++,
      processId: null, // Not related to an interview process
      applicationId: contactId, // Store contactId in applicationId field
      stageId: null, // Not related to an interview stage
      type: followUpType, // Ensure it has the 'contact_' prefix
      description: followUp.description || `Follow up with ${contact.fullName}`,
      dueDate: parsedDueDate,
      completed: false,
      completedDate: null,
      notes: followUp.notes || null,
      createdAt: now,
      updatedAt: now
    };

    // Store the follow-up
    this.followupActions.set(newFollowUp.id, newFollowUp);

    return newFollowUp;
  }

  async completeContactFollowUp(id: number): Promise<FollowupAction | undefined> {
    const followUp = this.followupActions.get(id);
    if (!followUp) return undefined;

    // If already completed, just return it
    if (followUp.completed) return followUp;

    const now = new Date();
    
    // Update the follow-up to completed status
    const updatedFollowUp: FollowupAction = {
      ...followUp,
      completed: true,
      completedDate: now,
      updatedAt: now
    };

    // Store the updated follow-up
    this.followupActions.set(id, updatedFollowUp);

    return updatedFollowUp;
  }

  async deleteContactFollowUp(id: number): Promise<boolean> {
    return this.followupActions.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = sessionStore;
    
    // Run a synchronous check to verify database connection
    // We can't use async in constructor, so we'll do a simple sync check
    try {
      // This is just to check if the db object is properly configured
      if (!db) {
        throw new Error("Database client is not initialized");
      }
      
      console.log("✅ Database client initialized, proceeding with PostgreSQL storage");
    } catch (error) {
      console.error("❌ Database client initialization error:", error);
      throw new Error("Failed to initialize database client");
    }
  }
  
  // Job application methods
  async getJobApplications(userId: number): Promise<JobApplication[]> {
    try {
      const result = await db.select()
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId))
        .orderBy(sql`${jobApplications.updatedAt} DESC`);
      return result;
    } catch (error) {
      console.error("Error fetching job applications from database:", error);
      return [];
    }
  }
  
  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    try {
      const [result] = await db.select().from(jobApplications).where(eq(jobApplications.id, id));
      return result;
    } catch (error) {
      console.error("Error fetching job application from database:", error);
      return undefined;
    }
  }
  
  async createJobApplication(userId: number, application: InsertJobApplication): Promise<JobApplication> {
    try {
      // Ensure the application object has the user ID
      const applicationData = {
        ...application,
        userId
      };
      
      // Insert the application and return the created record
      const [newApplication] = await db.insert(jobApplications)
        .values(applicationData)
        .returning();
        
      console.log(`Successfully created job application:`, newApplication);
      
      return newApplication;
    } catch (error) {
      console.error(`Error creating job application:`, error);
      throw new Error(`Failed to create job application: ${error.message}`);
    }
  }
  
  async updateJobApplication(id: number, applicationData: Partial<JobApplication>): Promise<JobApplication | undefined> {
    try {
      const [updatedApplication] = await db.update(jobApplications)
        .set({
          ...applicationData,
          updatedAt: new Date()
        })
        .where(eq(jobApplications.id, id))
        .returning();
        
      return updatedApplication;
    } catch (error) {
      console.error(`Error updating job application ${id}:`, error);
      return undefined;
    }
  }
  
  async submitJobApplication(id: number, applied: boolean = false): Promise<JobApplication | undefined> {
    try {
      // Get the current application
      const application = await this.getJobApplication(id);
      
      if (!application) {
        throw new Error("Application not found");
      }
      
      // Update the application status and add submission date
      const [submittedApplication] = await db.update(jobApplications)
        .set({
          status: "Applied",
          submittedAt: new Date(),
          applicationDate: applied ? new Date() : application.applicationDate,
          updatedAt: new Date()
        })
        .where(eq(jobApplications.id, id))
        .returning();
        
      return submittedApplication;
    } catch (error) {
      console.error(`Error submitting job application ${id}:`, error);
      throw error;
    }
  }
  
  async deleteJobApplication(id: number): Promise<boolean> {
    try {
      // Also delete any associated interview stages
      await db.delete(interviewStages)
        .where(eq(interviewStages.applicationId, id));
      
      // Delete any associated wizard steps
      await db.delete(applicationWizardSteps)
        .where(eq(applicationWizardSteps.applicationId, id));
        
      // Delete the application itself
      await db.delete(jobApplications)
        .where(eq(jobApplications.id, id));
        
      return true;
    } catch (error) {
      console.error(`Error deleting job application ${id}:`, error);
      return false;
    }
  }
  
  async getApplicationWizardSteps(applicationId: number): Promise<ApplicationWizardStep[]> {
    try {
      const result = await db.select().from(applicationWizardSteps)
        .where(eq(applicationWizardSteps.applicationId, applicationId))
        .orderBy(asc(applicationWizardSteps.stepOrder));
      return result;
    } catch (error) {
      console.error(`Error fetching wizard steps for application ${applicationId}:`, error);
      return [];
    }
  }
  
  // Interview stages methods
  async getInterviewStagesForApplication(applicationId: number): Promise<InterviewStage[]> {
    try {
      const result = await db.select().from(interviewStages)
        .where(eq(interviewStages.applicationId, applicationId))
        .orderBy(asc(interviewStages.scheduledDate));
      return result;
    } catch (error) {
      console.error("Error fetching interview stages from database:", error);
      return [];
    }
  }
  
  async createInterviewStageForApplication(applicationId: number, stageData: InsertInterviewStage): Promise<InterviewStage> {
    try {
      console.log(`Creating interview stage for application ${applicationId} with data:`, stageData);
      
      // Ensure applicationId is set in the data
      const interviewStageData = {
        ...stageData,
        applicationId
      };
      
      // Insert the stage and return the created record
      const [newStage] = await db.insert(interviewStages)
        .values(interviewStageData)
        .returning();
        
      console.log(`Successfully created interview stage:`, newStage);
      
      return newStage;
    } catch (error) {
      console.error(`Error creating interview stage for application ${applicationId}:`, error);
      throw new Error(`Failed to create interview stage: ${error.message}`);
    }
  }
  
  async getInterviewStage(id: number): Promise<InterviewStage | undefined> {
    try {
      const [stage] = await db.select().from(interviewStages).where(eq(interviewStages.id, id));
      return stage;
    } catch (error) {
      console.error(`Error fetching interview stage ${id} from database:`, error);
      return undefined;
    }
  }
  
  // Critical missing methods that are causing errors
  
  async getUserReviews(userId: number): Promise<UserReview[]> {
    try {
      const result = await db.select()
        .from(userReviews)
        .where(eq(userReviews.userId, userId))
        .orderBy(userReviews.createdAt, "desc");
      return result;
    } catch (error) {
      console.error("Error fetching user reviews from database:", error);
      return [];
    }
  }
  
  async createUserReview(userId: number, review: InsertUserReview): Promise<UserReview> {
    try {
      // Create the review object with userId
      const reviewData = {
        ...review,
        userId
      };
      
      // Insert into database and return the created review
      const [newReview] = await db.insert(userReviews).values(reviewData).returning();
      console.log("Review created successfully:", newReview);
      return newReview;
    } catch (error) {
      console.error("Error creating user review in database:", error);
      throw new Error(`Failed to create user review: ${error.message}`);
    }
  }
  
  async getResumes(userId: number): Promise<Resume[]> {
    try {
      const result = await db.select()
        .from(resumes)
        .where(eq(resumes.userId, userId))
        .orderBy(resumes.updatedAt, "desc");
      return result;
    } catch (error) {
      console.error("Error fetching resumes from database:", error);
      return [];
    }
  }
  
  // Alias for getResumes for clarity and API consistency
  async getResumesByUserId(userId: number): Promise<Resume[]> {
    return this.getResumes(userId);
  }
  
  async getGoals(userId: number): Promise<Goal[]> {
    try {
      // Use raw SQL query to avoid orderBy syntax issues
      // Note: The table only has created_at, not updated_at
      const result = await pool.query(`
        SELECT * FROM goals 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [userId]);
      
      return result.rows;
    } catch (error) {
      console.error("Error fetching goals from database:", error);
      return [];
    }
  }
  
  async createGoal(userId: number, goalData: InsertGoal): Promise<Goal> {
    try {
      // Set default values
      const now = new Date();
      const status = goalData.status || 'in_progress';
      
      // Insert the goal into the database
      const [goal] = await db.insert(goals)
        .values({
          ...goalData,
          userId,
          status,
          progress: 0,
          completed: false,
          completedAt: null,
          createdAt: now
        })
        .returning();
      
      // Award XP for creating a goal
      await this.addUserXP(userId, 50, "goals_created", "Created a new career goal");
      
      return goal;
    } catch (error) {
      console.error("Error creating goal in database:", error);
      throw error;
    }
  }
  
  async getGoal(id: number): Promise<Goal | undefined> {
    try {
      const [goal] = await db.select().from(goals).where(eq(goals.id, id));
      return goal || undefined;
    } catch (error) {
      console.error("Error fetching goal from database:", error);
      return undefined;
    }
  }
  
  async updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined> {
    try {
      // First get the current goal
      const [goal] = await db.select().from(goals).where(eq(goals.id, id));
      if (!goal) return undefined;

      // Check if the goal is being completed
      const completingGoal = !goal.completed && goalData.completed === true;
      
      // Prepare updated data
      const updateData: Partial<Goal> = { ...goalData };
      
      // If completing the goal, set completedAt and other fields
      if (completingGoal) {
        updateData.completedAt = new Date();
        updateData.progress = 100;
        updateData.status = 'completed';
        updateData.completed = true;
      }
      
      // Also check if the status is being set to 'completed' directly
      if (goalData.status === 'completed' && !goal.completed) {
        updateData.completed = true;
        updateData.completedAt = updateData.completedAt || new Date();
        updateData.progress = 100;
      }
      
      // Update the goal in the database
      const [updatedGoal] = await db
        .update(goals)
        .set(updateData)
        .where(eq(goals.id, id))
        .returning();
      
      // If goal was completed, award XP
      if (completingGoal || (goalData.status === 'completed' && !goal.completed)) {
        await this.addUserXP(
          goal.userId, 
          goal.xpReward, 
          "goals_completed", 
          `Completed goal: ${goal.title}`
        );
      }
      
      return updatedGoal;
    } catch (error) {
      console.error("Error updating goal in database:", error);
      throw error; // Re-throw to propagate error to the route handler
    }
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    try {
      // First check if the goal exists
      const [goal] = await db.select().from(goals).where(eq(goals.id, id));
      if (!goal) {
        console.error(`Goal with ID ${id} not found for deletion`);
        return false;
      }
      
      // Delete the goal
      await db.delete(goals).where(eq(goals.id, id));
      
      console.log(`Successfully deleted goal with ID ${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting goal with ID ${id}:`, error);
      throw error; // Re-throw to propagate error to the route handler
    }
  }
  
  async getUserAchievements(userId: number): Promise<(Achievement & { earnedAt: Date })[]> {
    try {
      // Use raw SQL query to avoid orderBy syntax issues
      const result = await pool.query(`
        SELECT 
          a.id, a.name, a.description, a.icon, a.xp_value as "xpValue", 
          a.category, a.created_at as "createdAt", a.updated_at as "updatedAt",
          ua.earned_at as "earnedAt"
        FROM user_achievements ua
        INNER JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = $1
        ORDER BY ua.earned_at DESC
      `, [userId]);
      
      return result.rows as unknown as (Achievement & { earnedAt: Date })[];
    } catch (error) {
      console.error("Error fetching user achievements from database:", error);
      return [];
    }
  }
  
  async getAiCoachConversations(userId: number): Promise<AiCoachConversation[]> {
    try {
      // Use raw SQL query to avoid orderBy syntax issues
      // Note: This table only has created_at, no updated_at column
      const result = await pool.query(`
        SELECT * FROM ai_coach_conversations 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [userId]);
      
      return result.rows;
    } catch (error) {
      console.error("Error fetching AI coach conversations from database:", error);
      return [];
    }
  }
  
  async getUserStatistics(userId: number): Promise<{
    activeGoals: number;
    achievementsCount: number;
    resumesCount: number;
    pendingTasks: number;
    upcomingInterviews: number;
    monthlyXp: { month: string; xp: number }[];
  }> {
    try {
      // Count active goals
      const activeGoalsCount = await db
        .select({ count: sql`count(*)` })
        .from(goals)
        .where(eq(goals.userId, userId))
        .where(eq(goals.status, 'active'));
      
      // Count achievements
      const achievementsCount = await db
        .select({ count: sql`count(*)` })
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));
      
      // Count resumes
      const resumesCount = await db
        .select({ count: sql`count(*)` })
        .from(resumes)
        .where(eq(resumes.userId, userId));
      
      // TODO: Implement pending tasks and upcoming interviews counts
      
      // Get monthly XP data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Use raw SQL to avoid syntax issues
      const xpHistoryResult = await pool.query(`
        SELECT * FROM xp_history 
        WHERE user_id = $1 
        AND created_at >= $2
        ORDER BY created_at ASC
      `, [userId, sixMonthsAgo]);
      
      const xpHistoryData = xpHistoryResult.rows;
      
      // Process XP history data into monthly aggregates
      const monthlyXpMap = new Map<string, number>();
      
      for (const record of xpHistoryData) {
        // Note: Database column names use snake_case
        const date = new Date(record.created_at);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const currentXp = monthlyXpMap.get(monthKey) || 0;
        monthlyXpMap.set(monthKey, currentXp + record.amount);
      }
      
      const monthlyXp = Array.from(monthlyXpMap.entries()).map(([month, xp]) => ({ month, xp }));
      
      return {
        activeGoals: Number(activeGoalsCount[0]?.count || 0),
        achievementsCount: Number(achievementsCount[0]?.count || 0),
        resumesCount: Number(resumesCount[0]?.count || 0),
        pendingTasks: 0, // TODO: Implement
        upcomingInterviews: 0, // TODO: Implement
        monthlyXp
      };
    } catch (error) {
      console.error("Error fetching user statistics from database:", error);
      return {
        activeGoals: 0,
        achievementsCount: 0,
        resumesCount: 0,
        pendingTasks: 0,
        upcomingInterviews: 0,
        monthlyXp: []
      };
    }
  }
  
  // Method to test the database connection (can be called after constructor)
  async testDatabaseConnection(): Promise<boolean> {
    try {
      // Try a simple query to test the connection
      const result = await db.execute(sql`SELECT 1 as test`);
      console.log("✅ Database connection test successful:", result);
      return true;
    } catch (error) {
      console.error("❌ Database connection test failed:", error);
      return false;
    }
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }
  
  // Skills Methods
  async getSkills(): Promise<Skill[]> {
    return db.select().from(skills).orderBy(skills.name);
  }
  
  async getSkill(id: number): Promise<Skill | undefined> {
    const [skill] = await db.select().from(skills).where(eq(skills.id, id));
    return skill || undefined;
  }
  
  async createSkill(skill: InsertSkill): Promise<Skill> {
    const [newSkill] = await db.insert(skills).values(skill).returning();
    return newSkill;
  }
  
  async getUserSkills(userId: number): Promise<Skill[]> {
    // This assumes there's a userSkills junction table that relates users to skills
    // If it doesn't exist in your schema, you'll need to add it
    return [];
  }
  
  // Languages Methods
  async getLanguages(): Promise<Language[]> {
    return db.select().from(languages).orderBy(languages.name);
  }
  
  async getLanguage(id: number): Promise<Language | undefined> {
    const [language] = await db.select().from(languages).where(eq(languages.id, id));
    return language || undefined;
  }
  
  async createLanguage(language: InsertLanguage): Promise<Language> {
    const [newLanguage] = await db.insert(languages).values(language).returning();
    return newLanguage;
  }
  
  async getUserLanguages(userId: number): Promise<Language[]> {
    // This assumes there's a userLanguages junction table that relates users to languages
    // If it doesn't exist in your schema, you'll need to add it
    return [];
  }
  
  // Networking Contacts
  async getNetworkingContacts(userId: number): Promise<NetworkingContact[]> {
    return db
      .select()
      .from(networkingContacts)
      .where(eq(networkingContacts.userId, userId))
      .orderBy(networkingContacts.createdAt);
  }
  
  async getNetworkingContact(id: number): Promise<NetworkingContact | undefined> {
    const [contact] = await db
      .select()
      .from(networkingContacts)
      .where(eq(networkingContacts.id, id));
    return contact || undefined;
  }
  
  async createNetworkingContact(userId: number, contact: InsertNetworkingContact): Promise<NetworkingContact> {
    const [newContact] = await db
      .insert(networkingContacts)
      .values({ ...contact, userId })
      .returning();
    return newContact;
  }
  
  async updateNetworkingContact(id: number, contactData: Partial<NetworkingContact>): Promise<NetworkingContact | undefined> {
    const [updatedContact] = await db
      .update(networkingContacts)
      .set(contactData)
      .where(eq(networkingContacts.id, id))
      .returning();
    return updatedContact || undefined;
  }
  
  async deleteNetworkingContact(id: number): Promise<boolean> {
    await db
      .delete(networkingContacts)
      .where(eq(networkingContacts.id, id));
    return true;
  }
  
  async getContactsNeedingFollowup(userId: number): Promise<NetworkingContact[]> {
    // Use raw SQL query with proper columns matching the actual database schema
    // For now, we'll fetch all contacts where last_contacted_date is older than 30 days
    // This is a simple heuristic for determining contacts needing follow-up
    const result = await pool.query(`
      SELECT * FROM networking_contacts 
      WHERE user_id = $1 
      AND (
        last_contacted_date IS NULL OR 
        last_contacted_date < (CURRENT_TIMESTAMP - INTERVAL '30 days')
      )
      ORDER BY last_contacted_date ASC NULLS FIRST
    `, [userId]);
    
    return result.rows;
  }
  
  // Alias for backward compatibility
  async getContactsNeedingFollowUp(userId: number): Promise<NetworkingContact[]> {
    return this.getContactsNeedingFollowup(userId);
  }
  
  // Contact Interaction methods
  async getContactInteractions(contactId: number): Promise<ContactInteraction[]> {
    return db
      .select()
      .from(contactInteractions)
      .where(eq(contactInteractions.contactId, contactId))
      .orderBy(contactInteractions.date, "desc");
  }
  
  async createContactInteraction(userId: number, contactId: number, interaction: InsertContactInteraction): Promise<ContactInteraction> {
    // Insert the new interaction
    const [newInteraction] = await db
      .insert(contactInteractions)
      .values({
        ...interaction,
        userId,
        contactId
      })
      .returning();
      
    // Update the last contacted date on the contact
    await db
      .update(networkingContacts)
      .set({ lastContactedDate: interaction.date || new Date() })
      .where(eq(networkingContacts.id, contactId));
      
    return newInteraction;
  }
  
  // XP Management Methods
  async addUserXP(userId: number, amount: number, source: string, description?: string): Promise<number> {
    try {
      const now = new Date();
      
      // Create XP history record
      await db.insert(xpHistory)
        .values({
          userId,
          amount,
          source,
          description: description || '',
          createdAt: now
        });
      
      // Get the current user
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      // Update user's total XP
      const [updatedUser] = await db
        .update(users)
        .set({ xp: (currentUser?.xp || 0) + amount })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser?.xp || 0;
    } catch (error) {
      console.error("Error adding user XP in database:", error);
      // Return 0 instead of throwing to avoid breaking goal creation
      return 0;
    }
  }
  
  // These methods remain to be implemented
  // We'll implement more as we go through conversion
}

// Flag to control which storage implementation to use
// This allows us to explicitly choose which storage to use for testing
const USE_DATABASE_STORAGE = true; // Set to true to use PostgreSQL or false to use memory

// Create storage instance with proper error handling
let storage: IStorage;

try {
  if (USE_DATABASE_STORAGE) {
    console.log("Attempting to initialize DatabaseStorage with PostgreSQL...");
    
    // Check if required environment variables are present
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL environment variable is missing");
      throw new Error("Missing required database configuration");
    }
    
    // Initialize database storage
    storage = new DatabaseStorage();
    
    // Test database connection after initialization
    // We don't await this promise because we can't use top-level await
    // But we log the result for diagnostic purposes
    (async () => {
      const connectionSuccessful = await (storage as DatabaseStorage).testDatabaseConnection();
      if (connectionSuccessful) {
        console.log("✅ DATABASE CONNECTION VERIFIED: PostgreSQL is working properly");
      } else {
        console.error("⚠️ DATABASE CONNECTION TEST FAILED: Using DatabaseStorage but connection is not working properly");
      }
    })();
    
    console.log("✅ SUCCESS: Using DatabaseStorage with PostgreSQL for data persistence");
  } else {
    console.log("⚠️ USING IN-MEMORY STORAGE BY CONFIGURATION: All data will be lost on server restart");
    storage = new MemStorage();
  }
} catch (error) {
  console.error("❌ ERROR: Failed to initialize DatabaseStorage:", error);
  console.log("⚠️ FALLING BACK to MemStorage. ALL DATA WILL BE LOST ON SERVER RESTART!");
  storage = new MemStorage();
}

// Health check method to verify storage status
// This is exported for use in API health checks
export async function checkStorageHealth(): Promise<{
  type: 'memory' | 'database';
  status: 'healthy' | 'degraded' | 'failing';
  details: string;
}> {
  if (storage instanceof DatabaseStorage) {
    try {
      const connectionTest = await (storage as DatabaseStorage).testDatabaseConnection();
      return {
        type: 'database',
        status: connectionTest ? 'healthy' : 'degraded',
        details: connectionTest 
          ? 'PostgreSQL database connection working properly' 
          : 'Using database storage but connection test failed'
      };
    } catch (error) {
      return {
        type: 'database',
        status: 'failing',
        details: `Database error: ${(error as Error).message}`
      };
    }
  } else {
    return {
      type: 'memory',
      status: 'degraded', // Memory storage is always considered degraded
      details: 'Using in-memory storage - all data will be lost when server restarts'
    };
  }
}

export { storage };