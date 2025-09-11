// Import types from our new database types file
import {
  User,
  InsertUser,
  Goal,
  InsertGoal,
  WorkHistory,
  InsertWorkHistory,
  EducationHistory,
  InsertEducationHistory,
  Resume,
  InsertResume,
  CoverLetter,
  InsertCoverLetter,
  InterviewQuestion,
  InsertInterviewQuestion,
  InterviewPractice,
  InsertInterviewPractice,
  Achievement,
  InsertAchievement,
  UserAchievement,
  ContactInteraction,
  InsertContactInteraction,
  InsertUserAchievement,
  Recommendation,
  InsertRecommendation,
  AiCoachConversation,
  ContactMessage,
  InsertContactMessage,
  InsertAiCoachConversation,
  NetworkingContact,
  InsertNetworkingContact,
  AiCoachMessage,
  InsertAiCoachMessage,
  DailyRecommendation,
  InsertDailyRecommendation,
  UserReview,
  InsertUserReview,
  XpHistory,
  InsertXpHistory,
  InterviewProcess,
  InsertInterviewProcess,
  JobListing,
  InsertJobListing,
  JobApplication,
  InsertJobApplication,
  ApplicationWizardStep,
  InsertApplicationWizardStep,
  InterviewStage,
  InsertInterviewStage,
  FollowupAction,
  InsertFollowupAction,
  MentorChatConversation,
  InsertMentorChatConversation,
  MentorChatMessage,
  InsertMentorChatMessage,
  Certification,
  InsertCertification,
  UserPersonalAchievement,
  InsertUserPersonalAchievement,
  CareerPath,
  InsertCareerPath,
  SkillStackerPlan,
  InsertSkillStackerPlan,
  SkillStackerTask,
  Skill,
  InsertSkill,
  Language,
  InsertLanguage,
  SupportTicket,
  InsertSupportTicket
} from "../types/database"
import { ENV } from "../config/env"
import { SupabaseStorage } from "./supabase-storage"

export interface IStorage {
  // User management for scheduled tasks
  getAllActiveUsers(): Promise<User[]>

  // Daily Recommendations operations
  generateDailyRecommendations(userId: string): Promise<DailyRecommendation[]>
  getUserDailyRecommendations(
    userId: string,
    date?: Date
  ): Promise<DailyRecommendation[]>
  getRecommendation(id: number): Promise<DailyRecommendation | undefined>
  completeRecommendation(id: number): Promise<DailyRecommendation | undefined>
  clearTodaysRecommendations(userId: string): Promise<boolean>

  // Contact interaction operations
  updateContactInteraction(
    id: number,
    data: Partial<ContactInteraction>
  ): Promise<ContactInteraction | undefined>
  deleteContactInteraction(id: number): Promise<boolean>

  // User review operations
  createUserReview(
    userId: string,
    reviewData: InsertUserReview
  ): Promise<UserReview>

  // Career path operations
  saveCareerPath(
    userId: string,
    name: string,
    pathData: any
  ): Promise<CareerPath>
  getUserCareerPaths(userId: string): Promise<CareerPath[]>
  getCareerPath(id: number): Promise<CareerPath | undefined>
  deleteCareerPath(id: number): Promise<boolean>

  // Skill operations
  createSkill(skill: InsertSkill | any): Promise<Skill>
  updateSkill(id: number, data: Partial<Skill>): Promise<Skill | undefined>
  deleteSkill(id: number): Promise<boolean>
  getSkill(id: number): Promise<Skill | undefined>
  getUserSkills(userId: string): Promise<Skill[]>

  // System operations
  getSystemMetrics(): Promise<{
    status: string
    uptime: number
    lastIncident: string
    lastChecked: string
  }>

  getComponentStatus(): Promise<
    {
      id: string
      name: string
      status: string
      health: number
      responseTime: string
      icon: string
      details?: {
        description: string
        metrics: {
          name: string
          value: string
          change?: string
          trend?: "up" | "down" | "stable"
        }[]
        issues?: {
          id: string
          title: string
          description: string
          severity: string
          timeDetected: string
          suggestedAction?: string
          impact?: string
          status?: "open" | "in_progress" | "resolved"
        }[]
        logs?: {
          timestamp: string
          message: string
          level: string
        }[]
        suggestedActions?: {
          id: string
          title: string
          description: string
          impact: "high" | "medium" | "low"
          effort: "easy" | "medium" | "complex"
          eta: string
          command?: string
          requiresConfirmation?: boolean
          requiresCredentials?: boolean
          status?: "available" | "in_progress" | "completed" | "failed"
        }[]
      }
    }[]
  >

  getRecentAlerts(): Promise<
    {
      title: string
      description: string
      severity: string
      time: string
    }[]
  >

  // Cache operations
  setCachedData(key: string, data: any, expirationMs?: number): Promise<void>
  getCachedData(key: string): Promise<any | null>
  deleteCachedData(key: string): Promise<boolean>

  // User operations
  getUser(id: number): Promise<User | undefined>
  getUserByUsername(username: string): Promise<User | undefined>
  getUserByEmail(email: string): Promise<User | undefined>
  getUserByStripeSubscriptionId(
    subscriptionId: string
  ): Promise<User | undefined>
  getUserByVerificationToken(token: string): Promise<User | undefined>
  getUserByPendingEmailToken(token: string): Promise<User | undefined>
  createUser(user: InsertUser): Promise<User>
  updateUser(id: string, userData: Partial<User>): Promise<User | undefined>
  updateUserStripeInfo(
    userId: number,
    stripeInfo: {
      stripeCustomerId?: string
      stripeSubscriptionId?: string
      subscriptionStatus?: "active" | "inactive" | "cancelled" | "past_due"
      subscriptionPlan?: "free" | "premium" | "university"
      subscriptionCycle?: "monthly" | "quarterly" | "annual"
      subscriptionExpiresAt?: Date
    }
  ): Promise<User | undefined>
  updateUserVerificationInfo(
    userId: number,
    verificationInfo: {
      emailVerified?: boolean
      verificationToken?: string | null
      verificationExpires?: Date | null
    }
  ): Promise<User | undefined>
  updateUserPassword(
    userId: string,
    newPassword: string
  ): Promise<User | undefined>
  updateUserCareerSummary(
    userId: string,
    careerSummary: string
  ): Promise<User | undefined>
  updateUserLinkedInUrl(
    userId: string,
    linkedInUrl: string
  ): Promise<User | undefined>
  addUserXP(
    userId: string,
    amount: number,
    source: string,
    description?: string
  ): Promise<number>

  // Goal operations
  getGoals(userId: string): Promise<Goal[]>
  getGoal(id: number): Promise<Goal | undefined>
  createGoal(userId: string, goal: InsertGoal): Promise<Goal>
  updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined>
  deleteGoal(id: number): Promise<boolean>

  // Skill Stacker operations
  getSkillStackerPlan(id: number): Promise<SkillStackerPlan | undefined>
  getSkillStackerPlanByGoalAndWeek(
    goalId: number,
    week: number
  ): Promise<SkillStackerPlan | undefined>
  getAllSkillStackerPlans(userId: string): Promise<SkillStackerPlan[]>
  getSkillStackerPlansByGoal(goalId: number): Promise<SkillStackerPlan[]>
  createSkillStackerPlan(
    userId: string,
    plan: InsertSkillStackerPlan
  ): Promise<SkillStackerPlan>
  updateSkillStackerPlan(
    id: number,
    planData: Partial<SkillStackerPlan>
  ): Promise<SkillStackerPlan | undefined>
  updateSkillStackerTaskStatus(
    planId: number,
    taskId: string,
    status: "complete" | "incomplete",
    rating?: number
  ): Promise<SkillStackerPlan | undefined>
  completeSkillStackerWeek(
    planId: number
  ): Promise<SkillStackerPlan | undefined>
  deleteSkillStackerPlan(id: number): Promise<boolean>

  // Work history operations
  getWorkHistory(userId: string): Promise<WorkHistory[]>
  getWorkHistoryItem(id: number): Promise<WorkHistory | undefined>
  createWorkHistoryItem(
    userId: string,
    item: InsertWorkHistory
  ): Promise<WorkHistory>
  updateWorkHistoryItem(
    id: number,
    itemData: Partial<WorkHistory>
  ): Promise<WorkHistory | undefined>
  deleteWorkHistoryItem(id: number): Promise<boolean>

  // Education history operations
  getEducationHistory(userId: string): Promise<EducationHistory[]>
  getEducationHistoryItem(id: number): Promise<EducationHistory | undefined>
  createEducationHistoryItem(
    userId: string,
    item: InsertEducationHistory
  ): Promise<EducationHistory>
  updateEducationHistoryItem(
    id: number,
    itemData: Partial<EducationHistory>
  ): Promise<EducationHistory | undefined>
  deleteEducationHistoryItem(id: number): Promise<boolean>

  // Resume operations
  getResumes(userId: string): Promise<Resume[]>
  getResumesByUserId(userId: string): Promise<Resume[]> // Alias for getResumes for clarity
  getResume(id: number): Promise<Resume | undefined>
  createResume(userId: string, resume: InsertResume): Promise<Resume>
  updateResume(
    id: number,
    resumeData: Partial<Resume>
  ): Promise<Resume | undefined>
  deleteResume(id: number): Promise<boolean>

  // Skills operations
  getUserSkills(userId: string): Promise<Skill[]>

  // Cover letter operations
  getCoverLetters(userId: string): Promise<CoverLetter[]>
  getCoverLetter(id: number): Promise<CoverLetter | undefined>
  createCoverLetter(
    userId: string,
    coverLetter: InsertCoverLetter
  ): Promise<CoverLetter>
  updateCoverLetter(
    id: number,
    coverLetterData: Partial<CoverLetter>
  ): Promise<CoverLetter | undefined>
  deleteCoverLetter(id: number): Promise<boolean>

  // Interview operations
  getInterviewQuestions(category?: string): Promise<InterviewQuestion[]>
  getInterviewQuestion(id: number): Promise<InterviewQuestion | undefined>
  createInterviewQuestion(
    question: InsertInterviewQuestion
  ): Promise<InterviewQuestion>
  saveInterviewPractice(
    userId: string,
    practice: InsertInterviewPractice
  ): Promise<InterviewPractice>
  getUserInterviewPractice(userId: string): Promise<InterviewPractice[]>

  // Interview Process Tracking operations
  getInterviewProcesses(userId: string): Promise<InterviewProcess[]>
  getInterviewProcess(id: number): Promise<InterviewProcess | undefined>
  createInterviewProcess(
    userId: string,
    process: InsertInterviewProcess
  ): Promise<InterviewProcess>
  updateInterviewProcess(
    id: number,
    processData: Partial<InterviewProcess>
  ): Promise<InterviewProcess | undefined>
  deleteInterviewProcess(id: number): Promise<boolean>

  // Interview Stage operations
  getInterviewStages(processId: number): Promise<InterviewStage[]>
  getInterviewStage(id: number): Promise<InterviewStage | undefined>
  createInterviewStage(
    processId: number,
    stage: InsertInterviewStage
  ): Promise<InterviewStage>
  updateInterviewStage(
    id: number,
    stageData: Partial<InterviewStage>
  ): Promise<InterviewStage | undefined>
  deleteInterviewStage(id: number): Promise<boolean>

  // Followup Action operations
  getFollowupActions(
    processId: number,
    stageId?: number
  ): Promise<FollowupAction[]>
  getFollowupAction(id: number): Promise<FollowupAction | undefined>
  createFollowupAction(
    processId: number,
    action: InsertFollowupAction
  ): Promise<FollowupAction>
  updateFollowupAction(
    id: number,
    actionData: Partial<FollowupAction>
  ): Promise<FollowupAction | undefined>
  deleteFollowupAction(id: number): Promise<boolean>
  completeFollowupAction(id: number): Promise<FollowupAction | undefined>
  uncompleteFollowupAction(id: number): Promise<FollowupAction | undefined>

  // Achievement operations
  getAchievements(): Promise<Achievement[]>
  getUserAchievements(
    userId: string
  ): Promise<(Achievement & { earnedAt: Date })[]>
  checkAndAwardAchievements(userId: string): Promise<Achievement[]>

  // AI Coach operations
  getAiCoachConversations(userId: string): Promise<AiCoachConversation[]>
  getAiCoachConversation(id: number): Promise<AiCoachConversation | undefined>
  createAiCoachConversation(
    userId: string,
    conversation: InsertAiCoachConversation
  ): Promise<AiCoachConversation>
  getAiCoachMessages(conversationId: number): Promise<AiCoachMessage[]>
  addAiCoachMessage(message: InsertAiCoachMessage): Promise<AiCoachMessage>

  // XP History operations
  getXpHistory(userId: string): Promise<XpHistory[]>

  // Contact message operations
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>
  getContactMessages(): Promise<ContactMessage[]>
  getContactMessage(id: number): Promise<ContactMessage | undefined>
  markContactMessageAsRead(id: number): Promise<ContactMessage | undefined>
  markContactMessageAsArchived(id: number): Promise<ContactMessage | undefined>

  // Support ticket operations
  getSupportTickets(filters?: any): Promise<any[]>
  getSupportTicket(id: number): Promise<any | undefined>
  updateSupportTicket(id: number, data: any): Promise<any>
  createSupportTicket(data: any): Promise<any>

  // Career Mentor Chat operations
  getMentorChatConversations(userId: string): Promise<MentorChatConversation[]>
  getMentorChatConversation(
    id: number
  ): Promise<MentorChatConversation | undefined>

  // User Reviews operations
  getUserReviews(userId: string): Promise<UserReview[]>
  createUserReview(
    userId: string,
    review: InsertUserReview
  ): Promise<UserReview>
  createMentorChatConversation(
    userId: string,
    conversation: InsertMentorChatConversation
  ): Promise<MentorChatConversation>
  getMentorChatMessages(conversationId: number): Promise<MentorChatMessage[]>

  // Job Listings operations
  getJobListings(filters?: {
    query?: string
    location?: string
    remote?: boolean
    jobType?: string
    page?: number
    pageSize?: number
  }): Promise<{ listings: JobListing[]; total: number }>
  getJobListing(id: number): Promise<JobListing | undefined>
  createJobListing(listing: InsertJobListing): Promise<JobListing>
  updateJobListing(
    id: number,
    listingData: Partial<JobListing>
  ): Promise<JobListing | undefined>
  deleteJobListing(id: number): Promise<boolean>

  // Job Applications operations
  getJobApplications(userId: string): Promise<JobApplication[]>
  getJobApplication(id: number): Promise<JobApplication | undefined>
  createJobApplication(
    userId: string,
    application: InsertJobApplication
  ): Promise<JobApplication>
  updateJobApplication(
    id: number,
    applicationData: Partial<JobApplication>
  ): Promise<JobApplication | undefined>
  submitJobApplication(
    id: number,
    applied?: boolean
  ): Promise<JobApplication | undefined>
  deleteJobApplication(id: number): Promise<boolean>

  // Application Interview Stages operations
  getInterviewStagesForApplication(
    applicationId: number
  ): Promise<InterviewStage[]>
  createInterviewStageForApplication(
    applicationId: number,
    stageData: any
  ): Promise<InterviewStage>

  // Application Follow-up Actions operations
  getFollowupActionsForApplication(
    applicationId: number
  ): Promise<FollowupAction[]>
  createFollowupActionForApplication(
    applicationId: number,
    actionData: any
  ): Promise<FollowupAction>

  // Application Wizard Steps operations
  getApplicationWizardSteps(
    applicationId: number
  ): Promise<ApplicationWizardStep[]>
  getApplicationWizardStep(
    id: number
  ): Promise<ApplicationWizardStep | undefined>
  createApplicationWizardStep(
    applicationId: number,
    step: InsertApplicationWizardStep
  ): Promise<ApplicationWizardStep>
  updateApplicationWizardStep(
    id: number,
    stepData: Partial<ApplicationWizardStep>
  ): Promise<ApplicationWizardStep | undefined>
  completeApplicationWizardStep(
    id: number
  ): Promise<ApplicationWizardStep | undefined>
  addMentorChatMessage(
    message: InsertMentorChatMessage
  ): Promise<MentorChatMessage>

  // Stats operations
  getUserStatistics(userId: string): Promise<{
    activeGoals: number
    achievementsCount: number
    resumesCount: number
    pendingTasks: number
    upcomingInterviews: number
    monthlyXp: { month: string; xp: number }[]
  }>

  // Subscription and verification operations
  getUserByStripeSubscriptionId(
    subscriptionId: string
  ): Promise<User | undefined>
  getUserByVerificationToken(token: string): Promise<User | undefined>
  updateUserStripeInfo(
    userId: string,
    stripeInfo: {
      stripeCustomerId?: string
      stripeSubscriptionId?: string
      subscriptionStatus?: "active" | "inactive" | "cancelled" | "past_due"
      subscriptionPlan?: "free" | "premium" | "university"
      subscriptionExpiresAt?: Date
    }
  ): Promise<User | undefined>
  updateUserVerificationInfo(
    userId: string,
    verificationInfo: {
      emailVerified?: boolean
      verificationToken?: string | null
      verificationExpires?: Date | null
    }
  ): Promise<User | undefined>

  // Recommendation operations
  getRecommendations(userId: string): Promise<Recommendation[]>
  getRecommendation(id: number): Promise<Recommendation | undefined>
  createRecommendation(
    userId: string,
    recommendation: InsertRecommendation
  ): Promise<Recommendation>
  updateRecommendation(
    id: number,
    recommendationData: Partial<Recommendation>
  ): Promise<Recommendation | undefined>
  completeRecommendation(id: number): Promise<Recommendation | undefined>
  generateDailyRecommendations(userId: string): Promise<Recommendation[]>
  clearTodaysRecommendations(userId: string): Promise<void>

  // Certification operations (to be deprecated)
  getCertifications(userId: string): Promise<Certification[]>
  getCertification(id: number): Promise<Certification | undefined>
  createCertification(
    userId: string,
    certification: InsertCertification
  ): Promise<Certification>
  updateCertification(
    id: number,
    certificationData: Partial<Certification>
  ): Promise<Certification | undefined>
  deleteCertification(id: number): Promise<boolean>

  // User Personal Achievements operations
  getUserPersonalAchievements(
    userId: string
  ): Promise<UserPersonalAchievement[]>
  getUserPersonalAchievement(
    id: number
  ): Promise<UserPersonalAchievement | undefined>
  createUserPersonalAchievement(
    userId: string,
    achievement: InsertUserPersonalAchievement
  ): Promise<UserPersonalAchievement>
  updateUserPersonalAchievement(
    id: number,
    achievementData: Partial<UserPersonalAchievement>
  ): Promise<UserPersonalAchievement | undefined>
  deleteUserPersonalAchievement(id: number): Promise<boolean>

  // Networking Contacts (Ascentul CRM) operations
  getNetworkingContacts(
    userId: string,
    filters?: { query?: string; relationshipType?: string }
  ): Promise<NetworkingContact[]>
  getNetworkingContact(id: number): Promise<NetworkingContact | undefined>
  createNetworkingContact(
    userId: string,
    contact: InsertNetworkingContact
  ): Promise<NetworkingContact>
  updateNetworkingContact(
    id: number,
    contactData: Partial<NetworkingContact>
  ): Promise<NetworkingContact | undefined>
  deleteNetworkingContact(id: number): Promise<boolean>
  getContactsNeedingFollowup(userId: string): Promise<NetworkingContact[]>

  // Contact Interactions operations
  getContactInteractions(contactId: number): Promise<ContactInteraction[]>
  createContactInteraction(
    userId: string,
    contactId: number,
    interaction: InsertContactInteraction
  ): Promise<ContactInteraction>

  // Contact Follow-ups operations
  getContactFollowUps(contactId: number): Promise<FollowupAction[]>
  createContactFollowUp(
    userId: string,
    contactId: number,
    followUp: Partial<InsertFollowupAction>
  ): Promise<FollowupAction>
  completeContactFollowUp(id: number): Promise<FollowupAction | undefined>
  deleteContactFollowUp(id: number): Promise<boolean>

  // Career Path operations
  saveCareerPath(
    userId: number,
    name: string,
    pathData: any
  ): Promise<CareerPath>
  getUserCareerPaths(userId: number): Promise<CareerPath[]>
  getCareerPath(id: number): Promise<CareerPath | undefined>
  deleteCareerPath(id: number): Promise<boolean>

  // Skill Stacker operations
  getSkillStackerPlan(id: number): Promise<SkillStackerPlan | undefined>
  getSkillStackerPlanByGoalAndWeek(
    goalId: number,
    week: number
  ): Promise<SkillStackerPlan | undefined>
  getAllSkillStackerPlans(userId: number): Promise<SkillStackerPlan[]>
  getSkillStackerPlansByGoal(goalId: number): Promise<SkillStackerPlan[]>
  createSkillStackerPlan(
    userId: number,
    plan: InsertSkillStackerPlan
  ): Promise<SkillStackerPlan>
  updateSkillStackerPlan(
    id: number,
    planData: Partial<SkillStackerPlan>
  ): Promise<SkillStackerPlan | undefined>
  updateSkillStackerTaskStatus(
    planId: number,
    taskId: string,
    status: "complete" | "incomplete",
    rating?: number
  ): Promise<SkillStackerPlan | undefined>
  completeSkillStackerWeek(
    planId: number
  ): Promise<SkillStackerPlan | undefined>
  deleteSkillStackerPlan(id: number): Promise<boolean>

  // Support Ticket operations
  getSupportTickets(
    filters?: Partial<{
      source: string
      issueType: string
      status: string
      universityName: string
    }>
  ): Promise<SupportTicket[]>
  getSupportTicket(id: number): Promise<SupportTicket | undefined>
  createSupportTicket(data: InsertSupportTicket): Promise<SupportTicket>
  updateSupportTicket(
    id: number,
    data: Partial<SupportTicket>
  ): Promise<SupportTicket | undefined>
}

export class MemStorage implements IStorage {
  // Simple in-memory cache for expensive operations
  private cache: Map<string, { data: any; expires: number | null }> = new Map()
  private users: Map<number, User>
  private goals: Map<number, Goal>
  private workHistory: Map<number, WorkHistory>
  private educationHistory: Map<number, EducationHistory>
  private resumes: Map<number, Resume>
  private coverLetters: Map<number, CoverLetter>
  private interviewQuestions: Map<number, InterviewQuestion>
  private interviewPractice: Map<number, InterviewPractice>
  private achievements: Map<number, Achievement>
  private userAchievements: Map<number, UserAchievement>
  private aiCoachConversations: Map<number, AiCoachConversation>
  private aiCoachMessages: Map<number, AiCoachMessage>
  private xpHistory: Map<number, XpHistory>
  private interviewProcesses: Map<number, InterviewProcess>
  private interviewStages: Map<number, InterviewStage>
  private followupActions: Map<number, FollowupAction>
  private contactMessages: Map<number, ContactMessage>
  private mentorChatConversations: Map<number, MentorChatConversation>
  private mentorChatMessages: Map<number, MentorChatMessage>
  private recommendations: Map<number, Recommendation>
  private certifications: Map<number, Certification>
  private userPersonalAchievements: Map<number, UserPersonalAchievement>
  private projects: Map<number, Project>
  private supportTickets: Map<number, any>
  private careerPaths: Map<number, CareerPath>
  private skillStackerPlans: Map<number, SkillStackerPlan>
  private dailyRecommendations: Map<number, DailyRecommendation>
  private jobListings: Map<number, JobListing>
  private jobApplications: Map<number, JobApplication>
  private applicationWizardSteps: Map<number, ApplicationWizardStep>
  private networkingContacts: Map<number, NetworkingContact>
  private contactInteractions: Map<number, ContactInteraction>
  private userReviews: Map<number, UserReview>

  private userIdCounter: number
  private goalIdCounter: number
  private workHistoryIdCounter: number
  private educationHistoryIdCounter: number
  private resumeIdCounter: number
  private coverLetterIdCounter: number
  private interviewQuestionIdCounter: number
  private interviewPracticeIdCounter: number
  private achievementIdCounter: number
  private userAchievementIdCounter: number
  private aiCoachConversationIdCounter: number
  private aiCoachMessageIdCounter: number
  private xpHistoryIdCounter: number
  private interviewProcessIdCounter: number
  private interviewStageIdCounter: number
  private followupActionIdCounter: number
  private contactMessageIdCounter: number
  private mentorChatConversationIdCounter: number
  private mentorChatMessageIdCounter: number
  private recommendationIdCounter: number
  private certificationIdCounter: number
  private userPersonalAchievementIdCounter: number
  private careerPathIdCounter: number
  private skillStackerPlanIdCounter: number
  private jobListingIdCounter: number
  private jobApplicationIdCounter: number
  private applicationWizardStepIdCounter: number
  private supportTicketIdCounter: number
  private projectIdCounter: number
  private networkingContactIdCounter: number
  private contactInteractionIdCounter: number
  private userReviewIdCounter: number
  private dailyRecommendationIdCounter: number

  constructor() {
    // Session store removed in Supabase auth migration

    this.users = new Map()
    this.goals = new Map()
    this.workHistory = new Map()
    this.educationHistory = new Map()
    this.resumes = new Map()
    this.coverLetters = new Map()
    this.interviewQuestions = new Map()
    this.interviewPractice = new Map()
    this.achievements = new Map()
    this.userAchievements = new Map()
    this.aiCoachConversations = new Map()
    this.aiCoachMessages = new Map()
    this.xpHistory = new Map()
    this.interviewProcesses = new Map()
    this.interviewStages = new Map()
    this.followupActions = new Map()
    this.contactMessages = new Map()
    this.mentorChatConversations = new Map()
    this.mentorChatMessages = new Map()
    this.recommendations = new Map()
    this.certifications = new Map()
    this.userPersonalAchievements = new Map()
    this.careerPaths = new Map()
    this.skillStackerPlans = new Map()
    this.jobListings = new Map()
    this.jobApplications = new Map()
    this.applicationWizardSteps = new Map()
    this.networkingContacts = new Map()
    this.contactInteractions = new Map()
    this.userReviews = new Map()
    this.dailyRecommendations = new Map()

    this.userIdCounter = 1
    this.goalIdCounter = 1
    this.workHistoryIdCounter = 1
    this.educationHistoryIdCounter = 1
    this.resumeIdCounter = 1
    this.coverLetterIdCounter = 1
    this.interviewQuestionIdCounter = 1
    this.interviewPracticeIdCounter = 1
    this.achievementIdCounter = 1
    this.userAchievementIdCounter = 1
    this.aiCoachConversationIdCounter = 1
    this.aiCoachMessageIdCounter = 1
    this.xpHistoryIdCounter = 1
    this.interviewProcessIdCounter = 1
    this.interviewStageIdCounter = 1
    this.followupActionIdCounter = 1
    this.contactMessageIdCounter = 1
    this.mentorChatConversationIdCounter = 1
    this.mentorChatMessageIdCounter = 1
    this.recommendationIdCounter = 1
    this.certificationIdCounter = 1
    this.userPersonalAchievementIdCounter = 1
    this.careerPathIdCounter = 1
    this.skillStackerPlanIdCounter = 1
    this.jobListingIdCounter = 1
    this.jobApplicationIdCounter = 1
    this.applicationWizardStepIdCounter = 1
    this.supportTicketIdCounter = 1
    this.projectIdCounter = 1
    this.networkingContactIdCounter = 1
    this.contactInteractionIdCounter = 1
    this.userReviewIdCounter = 1
    this.dailyRecommendationIdCounter = 1

    // Initialize new maps for the Apply feature
    this.projects = new Map()
    this.supportTickets = new Map()

    // Initialize with sample data for testing
    this.initializeData()
  }

  // Cache operations
  async setCachedData(
    key: string,
    data: any,
    expirationMs?: number
  ): Promise<void> {
    const expires = expirationMs ? Date.now() + expirationMs : null
    this.cache.set(key, { data, expires })
  }

  async getCachedData(key: string): Promise<any | null> {
    const cachedItem = this.cache.get(key)

    if (!cachedItem) {
      return null
    }

    // Check if the cached data has expired
    if (cachedItem.expires && Date.now() > cachedItem.expires) {
      this.cache.delete(key)
      return null
    }

    return cachedItem.data
  }

  async deleteCachedData(key: string): Promise<boolean> {
    return this.cache.delete(key)
  }

  private initializeData() {
    // Sample interview process data for testing
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // No initial work history - users should enter their own work history
    const sampleWorkHistory: InsertWorkHistory[] = []

    // Skip adding sample work history records as per requirements

    return newReview
  }

  // Networking Contacts (Ascentul CRM) operations
  async getNetworkingContacts(
    userId: number,
    filters?: { query?: string; relationshipType?: string }
  ): Promise<NetworkingContact[]> {
    let contacts = Array.from(this.networkingContacts.values()).filter(
      (contact) => contact.userId === userId
    )

    if (filters?.query) {
      const query = filters.query.toLowerCase()
      contacts = contacts.filter(
        (contact) =>
          contact.fullName.toLowerCase().includes(query) ||
          contact.company.toLowerCase().includes(query) ||
          contact.jobTitle.toLowerCase().includes(query) ||
          (contact.notes && contact.notes.toLowerCase().includes(query))
      )
    }

    if (filters?.relationshipType) {
      contacts = contacts.filter(
        (contact) => contact.relationshipType === filters.relationshipType
      )
    }

    return contacts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async getNetworkingContact(
    id: number
  ): Promise<NetworkingContact | undefined> {
    return this.networkingContacts.get(id)
  }

  async createNetworkingContact(
    userId: number,
    contact: InsertNetworkingContact
  ): Promise<NetworkingContact> {
    const now = new Date()
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
    }

    this.networkingContacts.set(newContact.id, newContact)
    return newContact
  }

  async updateNetworkingContact(
    id: number,
    contactData: Partial<NetworkingContact>
  ): Promise<NetworkingContact | undefined> {
    const contact = this.networkingContacts.get(id)
    if (!contact) {
      return undefined
    }

    const updatedContact = {
      ...contact,
      ...contactData,
      updatedAt: new Date()
    }

    this.networkingContacts.set(id, updatedContact)
    return updatedContact
  }

  async deleteNetworkingContact(id: number): Promise<boolean> {
    return this.networkingContacts.delete(id)
  }

  async getContactsNeedingFollowUp(
    userId: number
  ): Promise<NetworkingContact[]> {
    const now = new Date()
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return Array.from(this.networkingContacts.values())
      .filter(
        (contact) =>
          contact.userId === userId &&
          (!contact.lastContactedDate ||
            contact.lastContactedDate < oneMonthAgo)
      )
      .sort((a, b) => {
        if (!a.lastContactedDate && !b.lastContactedDate) return 0
        if (!a.lastContactedDate) return -1
        if (!b.lastContactedDate) return 1
        return a.lastContactedDate.getTime() - b.lastContactedDate.getTime()
      })
  }

  // Contact Interactions methods
  async getContactInteractions(
    contactId: number
  ): Promise<ContactInteraction[]> {
    return Array.from(this.contactInteractions.values())
      .filter((interaction) => interaction.contactId === contactId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  async createContactInteraction(
    userId: number,
    contactId: number,
    interaction: InsertContactInteraction
  ): Promise<ContactInteraction> {
    const newInteraction: ContactInteraction = {
      id: this.contactInteractionIdCounter++,
      userId,
      contactId,
      interactionType: interaction.interactionType,
      notes: interaction.notes || null,
      date: interaction.date || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.contactInteractions.set(newInteraction.id, newInteraction)

    // Update the last contacted date on the contact
    const contact = await this.getNetworkingContact(contactId)
    if (contact) {
      await this.updateNetworkingContact(contactId, {
        lastContactedDate: newInteraction.date
      })
    }

    return newInteraction
  }

  // Certification operations
  async getCertifications(userId: number): Promise<Certification[]> {
    return Array.from(this.certifications.values())
      .filter((cert) => cert.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
      )
  }

  async getCertification(id: number): Promise<Certification | undefined> {
    return this.certifications.get(id)
  }

  async createCertification(
    userId: number,
    certification: InsertCertification
  ): Promise<Certification> {
    const id = this.certificationIdCounter++
    const now = new Date()
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
    }
    this.certifications.set(id, certificationItem)

    // Award XP for adding a certification
    await this.addUserXP(
      userId,
      100,
      "certification_added",
      "Added professional certification"
    )

    return certificationItem
  }

  async updateCertification(
    id: number,
    certificationData: Partial<Certification>
  ): Promise<Certification | undefined> {
    const certification = this.certifications.get(id)
    if (!certification) return undefined

    const now = new Date()
    const updatedCertification = {
      ...certification,
      ...certificationData,
      updatedAt: now
    }
    this.certifications.set(id, updatedCertification)
    return updatedCertification
  }

  async deleteCertification(id: number): Promise<boolean> {
    return this.certifications.delete(id)
  }

  // User Personal Achievements operations
  async getUserPersonalAchievements(
    userId: number
  ): Promise<UserPersonalAchievement[]> {
    return Array.from(this.userPersonalAchievements.values())
      .filter((achievement) => achievement.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.achievementDate).getTime() -
          new Date(a.achievementDate).getTime()
      )
  }

  async getUserPersonalAchievement(
    id: number
  ): Promise<UserPersonalAchievement | undefined> {
    return this.userPersonalAchievements.get(id)
  }

  async createUserPersonalAchievement(
    userId: number,
    achievement: InsertUserPersonalAchievement
  ): Promise<UserPersonalAchievement> {
    const id = this.userPersonalAchievementIdCounter++
    const now = new Date()
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
    }
    this.userPersonalAchievements.set(id, achievementItem)

    // Award XP for adding a personal achievement
    await this.addUserXP(
      userId,
      75,
      "personal_achievement_added",
      "Added personal achievement"
    )

    return achievementItem
  }

  async updateUserPersonalAchievement(
    id: number,
    achievementData: Partial<UserPersonalAchievement>
  ): Promise<UserPersonalAchievement | undefined> {
    const achievement = this.userPersonalAchievements.get(id)
    if (!achievement) return undefined

    const now = new Date()
    const updatedAchievement = {
      ...achievement,
      ...achievementData,
      updatedAt: now
    }

    this.userPersonalAchievements.set(id, updatedAchievement)
    return updatedAchievement
  }

  async deleteUserPersonalAchievement(id: number): Promise<boolean> {
    return this.userPersonalAchievements.delete(id)
  }

  async getUserAchievements(
    userId: number
  ): Promise<(Achievement & { earnedAt: Date })[]> {
    const userAchievementRecords = Array.from(
      this.userAchievements.values()
    ).filter((ua) => ua.userId === userId)

    return userAchievementRecords.map((record) => {
      const achievement = this.achievements.get(record.achievementId)
      return {
        ...achievement!,
        earnedAt: record.earnedAt
      }
    })
  }

  async checkAndAwardAchievements(userId: number): Promise<Achievement[]> {
    const allAchievements = await this.getAchievements()
    const userAchievements = await this.getUserAchievements(userId)
    const earnedAchievementIds = userAchievements.map((a) => a.id)
    const newlyEarnedAchievements: Achievement[] = []

    // Check each achievement that hasn't been earned yet
    for (const achievement of allAchievements) {
      if (earnedAchievementIds.includes(achievement.id)) continue

      // Check if user meets the requirements
      let meetsRequirements = false

      switch (achievement.requiredAction) {
        case "resumes_created":
          const resumes = await this.getResumes(userId)
          meetsRequirements = resumes.length >= achievement.requiredValue
          break
        case "goals_created":
          const goals = await this.getGoals(userId)
          meetsRequirements = goals.length >= achievement.requiredValue
          break
        case "goals_completed":
          const completedGoals = (await this.getGoals(userId)).filter(
            (g) => g.completed
          )
          meetsRequirements = completedGoals.length >= achievement.requiredValue
          break
        // Add more achievement checks as needed
      }

      if (meetsRequirements) {
        // Award the achievement
        const userAchievementId = this.userAchievementIdCounter++
        const now = new Date()
        const userAchievement: UserAchievement = {
          id: userAchievementId,
          userId,
          achievementId: achievement.id,
          earnedAt: now
        }
        this.userAchievements.set(userAchievementId, userAchievement)

        // Award XP for earning an achievement
        await this.addUserXP(
          userId,
          achievement.xpReward,
          "achievement_earned",
          `Earned achievement: ${achievement.name}`
        )

        newlyEarnedAchievements.push(achievement)
      }
    }

    return newlyEarnedAchievements
  }

  // AI Coach operations
  async getAiCoachConversations(
    userId: number
  ): Promise<AiCoachConversation[]> {
    return Array.from(this.aiCoachConversations.values())
      .filter((conv) => conv.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }

  async getAiCoachConversation(
    id: number
  ): Promise<AiCoachConversation | undefined> {
    return this.aiCoachConversations.get(id)
  }

  async createAiCoachConversation(
    userId: number,
    conversation: InsertAiCoachConversation
  ): Promise<AiCoachConversation> {
    const id = this.aiCoachConversationIdCounter++
    const now = new Date()
    const aiCoachConversation: AiCoachConversation = {
      ...conversation,
      id,
      userId,
      createdAt: now
    }
    this.aiCoachConversations.set(id, aiCoachConversation)
    return aiCoachConversation
  }

  async getAiCoachMessages(conversationId: number): Promise<AiCoachMessage[]> {
    return Array.from(this.aiCoachMessages.values())
      .filter((message) => message.conversationId === conversationId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
  }

  async addAiCoachMessage(
    message: InsertAiCoachMessage
  ): Promise<AiCoachMessage> {
    const id = this.aiCoachMessageIdCounter++
    const now = new Date()
    const aiCoachMessage: AiCoachMessage = {
      ...message,
      id,
      timestamp: now
    }
    this.aiCoachMessages.set(id, aiCoachMessage)

    // If it's a user message, add a small XP reward
    if (message.isUser) {
      const conversation = await this.getAiCoachConversation(
        message.conversationId
      )
      if (conversation) {
        await this.addUserXP(
          conversation.userId,
          10,
          "ai_coach_interaction",
          "Interacted with AI Coach"
        )
      }
    }

    return aiCoachMessage
  }

  // XP History operations
  async getXpHistory(userId: number): Promise<XpHistory[]> {
    return Array.from(this.xpHistory.values())
      .filter((record) => record.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
      )
  }

  // Contact message operations
  async createContactMessage(
    message: InsertContactMessage
  ): Promise<ContactMessage> {
    const id = this.contactMessageIdCounter++
    const now = new Date()
    const contactMessage: ContactMessage = {
      ...message,
      id,
      timestamp: now,
      read: false,
      archived: false
    }
    this.contactMessages.set(id, contactMessage)
    return contactMessage
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessages.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  async getContactMessage(id: number): Promise<ContactMessage | undefined> {
    return this.contactMessages.get(id)
  }

  async markContactMessageAsRead(
    id: number
  ): Promise<ContactMessage | undefined> {
    const message = this.contactMessages.get(id)
    if (!message) return undefined

    const updatedMessage = { ...message, read: true }
    this.contactMessages.set(id, updatedMessage)
    return updatedMessage
  }

  async markContactMessageAsArchived(
    id: number
  ): Promise<ContactMessage | undefined> {
    const message = this.contactMessages.get(id)
    if (!message) return undefined

    const updatedMessage = { ...message, archived: true }
    this.contactMessages.set(id, updatedMessage)
    return updatedMessage
  }

  // Stats operations
  async getUserStatistics(userId: number): Promise<{
    activeGoals: number
    achievementsCount: number
    resumesCount: number
    pendingTasks: number
    upcomingInterviews: number
    monthlyXp: { month: string; xp: number }[]
  }> {
    // Use cache for expensive statistics calculations
    const cacheKey = `user-stats-${userId}`

    // Check if cached stats are available
    const cachedStats = this.cache.get(cacheKey)
    if (cachedStats) {

      // Add pending followups to the pending tasks count
      pendingTasks += pendingFollowups.length
    }

    // Default empty XP data for regular users
    let monthlyXpArray: { month: string; xp: number }[] = []

    // Get the month names for the past 6 months
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthName = d.toLocaleString("default", { month: "short" })
      months.push(monthName)
    }

    // Only process XP history for university users
    if (isUniversityUser) {
      // Calculate monthly XP for the past 6 months
      const xpHistory = await this.getXpHistory(userId)
      const monthlyXp: { [key: string]: number } = {}

      // Initialize monthlyXp object with zeros
      months.forEach((month) => {
        monthlyXp[month] = 0
      })

      // Calculate XP for each month
      xpHistory.forEach((record) => {
        const recordMonth = new Date(record.earnedAt).toLocaleString(
          "default",
          { month: "short" }
        )
        if (months.includes(recordMonth)) {
          monthlyXp[recordMonth] = (monthlyXp[recordMonth] || 0) + record.amount
        }
      })

      // Convert to array format
      monthlyXpArray = months.map((month) => ({
        month,
        xp: monthlyXp[month] || 0
      }))
    } else {
      // For regular users, return an array with zero XP values
      monthlyXpArray = months.map((month) => ({
        month,
        xp: 0
      }))
    }

    const stats = {
      activeGoals,
      achievementsCount,
      resumesCount,
      pendingTasks,
      upcomingInterviews,
      monthlyXp: monthlyXpArray
    }

    // Cache the statistics for 30 seconds to ensure more frequent updates
    this.cache.set(cacheKey, stats)
    setTimeout(() => {
      this.cache.delete(cacheKey)
    }, 30000) // 30 seconds instead of 5 minutes

    return stats
  }

  // System monitoring methods
  async getSystemMetrics(): Promise<{
    status: string
    uptime: number
    lastIncident: string
    lastChecked: string
  }> {
    // In a real application, these values would be retrieved from monitoring systems
    return {
      status: "operational",
      uptime: 99.98,
      lastIncident: "2 days ago",
      lastChecked: new Date().toLocaleTimeString()
    }
  }

  async getComponentStatus(): Promise<
    {
      id: string
      name: string
      status: string
      health: number
      responseTime: string
      icon: string
      details?: {
        description: string
        metrics: {
          name: string
          value: string
          change?: string
          trend?: "up" | "down" | "stable"
        }[]
        issues?: {
          id: string
          title: string
          description: string
          severity: string
          timeDetected: string
          suggestedAction?: string
          impact?: string
          status?: "open" | "in_progress" | "resolved"
        }[]
        logs?: {
          timestamp: string
          message: string
          level: string
        }[]
        suggestedActions?: {
          id: string
          title: string
          description: string
          impact: "high" | "medium" | "low"
          effort: "easy" | "medium" | "complex"
          eta: string
          command?: string
          requiresConfirmation?: boolean
          requiresCredentials?: boolean
          status?: "available" | "in_progress" | "completed" | "failed"
        }[]
      }
    }[]
  > {
    // This data would normally come from actual system monitoring
    // Using mock data for demonstration purposes
    const now = new Date()
    const timestamp = now.toLocaleTimeString()
    const fiveMinutesAgo = new Date(
      now.getTime() - 5 * 60 * 1000
    ).toLocaleTimeString()
    const tenMinutesAgo = new Date(
      now.getTime() - 10 * 60 * 1000
    ).toLocaleTimeString()

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
              description:
                "Some queries are taking longer than expected due to index fragmentation",
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
          description:
            "Handles all AI-related features including career advice and resume suggestions",
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
          description:
            "Handles all file storage including resume documents and profile images",
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
          description:
            "Handles all subscription and payment processing through Stripe",
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
    ]
  }

  async getRecentAlerts(): Promise<
    {
      title: string
      description: string
      severity: string
      time: string
    }[]
  > {
    // This would normally come from a monitoring or alerting system
    return [
      {
        title: "Database performance degraded",
        description:
          "Some database operations are experiencing increased latency. Our team is investigating.",
        severity: "warning",
        time: "15 minutes ago"
      },
      {
        title: "System maintenance completed",
        description:
          "Scheduled maintenance has been completed successfully with no service interruptions.",
        severity: "success",
        time: "2 hours ago"
      }
    ]
  }

  // Interview Process Tracking operations
  async getInterviewProcesses(userId: number): Promise<InterviewProcess[]> {
    return Array.from(this.interviewProcesses.values())
      .filter((process) => process.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }

  async getInterviewProcess(id: number): Promise<InterviewProcess | undefined> {
    return this.interviewProcesses.get(id)
  }

  async createInterviewProcess(
    userId: number,
    processData: InsertInterviewProcess
  ): Promise<InterviewProcess> {
    const id = this.interviewProcessIdCounter++
    const now = new Date()
    const interviewProcess: InterviewProcess = {
      ...processData,
      id,
      userId,
      status: processData.status || "applied",
      createdAt: now,
      updatedAt: now
    }
    this.interviewProcesses.set(id, interviewProcess)

    // Award XP for creating a new interview process
    await this.addUserXP(
      userId,
      50,
      "interview_process_created",
      "Started tracking a new interview process"
    )

    return interviewProcess
  }

  async updateInterviewProcess(
    id: number,
    processData: Partial<InterviewProcess>
  ): Promise<InterviewProcess | undefined> {
    const process = this.interviewProcesses.get(id)
    if (!process) return undefined

    const now = new Date()
    const updatedProcess = {
      ...process,
      ...processData,
      updatedAt: now
    }
    this.interviewProcesses.set(id, updatedProcess)

    // Award XP for updating job status if status changed
    if (processData.status && processData.status !== process.status) {
      await this.addUserXP(
        process.userId,
        25,
        "interview_status_updated",
        `Updated job status to ${processData.status}`
      )
    }

    return updatedProcess
  }

  async deleteInterviewProcess(id: number): Promise<boolean> {
    // Also delete all related stages and followup actions
    const process = this.interviewProcesses.get(id)
    if (!process) return false

    const stages = await this.getInterviewStages(id)
    for (const stage of stages) {
      await this.deleteInterviewStage(stage.id)
    }

    const followupActions = await this.getFollowupActions(id)
    for (const action of followupActions) {
      await this.deleteFollowupAction(action.id)
    }

    return this.interviewProcesses.delete(id)
  }

  // Interview Stage operations
  async getInterviewStages(processId: number): Promise<InterviewStage[]> {
    return Array.from(this.interviewStages.values())
      .filter((stage) => stage.processId === processId)
      .sort((a, b) => {
        // Sort by scheduled date if available, otherwise by creation date
        const aDate = a.scheduledDate || a.createdAt
        const bDate = b.scheduledDate || b.createdAt
        return new Date(aDate).getTime() - new Date(bDate).getTime()
      })
  }

  async getInterviewStage(id: number): Promise<InterviewStage | undefined> {
    return this.interviewStages.get(id)
  }

  async createInterviewStage(
    processId: number,
    stageData: InsertInterviewStage
  ): Promise<InterviewStage> {
    // Validate process exists first
    const process = await this.getInterviewProcess(processId)
    if (!process) {
      throw new Error(`Interview process with ID ${processId} not found`)
    }

    const id = this.interviewStageIdCounter++
    const now = new Date()
    const interviewStage: InterviewStage = {
      ...stageData,
      id,
      processId,
      createdAt: now,
      updatedAt: now
    }

      return supportTicket
    }
  }

  // Job Listings operations
  async getJobListings(filters?: {
    query?: string
    location?: string
    remote?: boolean
    jobType?: string
    page?: number
    pageSize?: number
  }): Promise<{ listings: JobListing[]; total: number }> {
    let listings = Array.from(this.jobListings.values())

    // Apply filters if provided
    if (filters) {
      if (filters.query) {
        const lowercaseQuery = filters.query.toLowerCase()
        listings = listings.filter(
          (listing) =>
            listing.title.toLowerCase().includes(lowercaseQuery) ||
            listing.company.toLowerCase().includes(lowercaseQuery) ||
            listing.description.toLowerCase().includes(lowercaseQuery)
        )
      }

      if (filters.location) {
        const lowercaseLocation = filters.location.toLowerCase()
        listings = listings.filter((listing) =>
          listing.location.toLowerCase().includes(lowercaseLocation)
        )
      }

      if (filters.remote !== undefined) {
        listings = listings.filter(
          (listing) => listing.remote === filters.remote
        )
      }

      if (filters.jobType) {
        listings = listings.filter(
          (listing) => listing.jobType === filters.jobType
        )
      }

      // Pagination
      const page = filters.page || 1
      const pageSize = filters.pageSize || 10
      const startIndex = (page - 1) * pageSize
      const total = listings.length
      listings = listings.slice(startIndex, startIndex + pageSize)

      return { listings, total }
    }

    return { listings, total: listings.length }
  }

  async getJobListing(id: number): Promise<JobListing | undefined> {
    return this.jobListings.get(id)
  }

  async createJobListing(listing: InsertJobListing): Promise<JobListing> {
    const id = this.jobListingIdCounter++
    const now = new Date()

    const newListing: JobListing = {
      ...listing,
      id,
      createdAt: now,
      updatedAt: now
    }

    this.jobListings.set(id, newListing)
    return newListing
  }

  async updateJobListing(
    id: number,
    listingData: Partial<JobListing>
  ): Promise<JobListing | undefined> {
    const listing = this.jobListings.get(id)
    if (!listing) return undefined

    const updatedListing: JobListing = {
      ...listing,
      ...listingData,
      updatedAt: new Date()
    }

    this.jobListings.set(id, updatedListing)
    return updatedListing
  }

  async deleteJobListing(id: number): Promise<boolean> {
    return this.jobListings.delete(id)
  }

  // Job Applications operations
  async getJobApplications(userId: number): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values()).filter(
      (application) => application.userId === userId
    )
  }

  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    return this.jobApplications.get(id)
  }

  async createJobApplication(
    userId: number,
    application: InsertJobApplication
  ): Promise<JobApplication> {
    const id = this.jobApplicationIdCounter++
    const now = new Date()

    // Ensure jobId is set (use provided value or default to 0 for manually created applications)
    const jobId = application.jobId ?? 0

    const newApplication: JobApplication = {
      ...application,
      id,
      userId,
      jobId,
      status: application.status || "In Progress", // Capitalized for consistency with UI
      createdAt: now,
      updatedAt: now
    }

    if (!allStepsCompleted) {
      throw new Error("All application steps must be completed before submitting");
    }
    */

    // Set status based on whether the user has checked "I've submitted this application"
    const status = applied ? "Applied" : "In Progress"

    const submittedApplication: JobApplication = {
      ...application,
      status: status, // Set to "Applied" or "In Progress" based on checkbox
      submittedAt: applied ? new Date() : null, // Only set submittedAt if actually applied
      appliedAt: applied ? new Date() : null, // Only set appliedAt if actually applied
      updatedAt: new Date()
    }

    this.jobApplications.set(id, submittedApplication)

    // Award XP for applying to a job only if actually applied
    if (applied && application.userId) {
      await this.addUserXP(
        application.userId,
        50,
        "job_application",
        `Applied to ${application.title || application.jobTitle} at ${
          application.company
        }`
      )
    }

    return submittedApplication
  }

  async deleteJobApplication(id: number): Promise<boolean> {
    // Also delete any associated wizard steps
    const steps = await this.getApplicationWizardSteps(id)
    steps.forEach((step) => {
      this.applicationWizardSteps.delete(step.id)
    })

    return this.jobApplications.delete(id)
  }

  // Application Interview Stages operations
  async getInterviewStagesForApplication(
    applicationId: number
  ): Promise<InterviewStage[]> {
    return Array.from(this.interviewStages.values())
      .filter((stage) => {
        // Handle both legacy data and new data structure
        return stage.applicationId === applicationId
      })
      .sort((a, b) => {
        if (a.scheduledDate && b.scheduledDate) {
          return (
            new Date(a.scheduledDate).getTime() -
            new Date(b.scheduledDate).getTime()
          )
        }
        return 0
      })
  }

  async createInterviewStageForApplication(
    applicationId: number,
    stageData: any
  ): Promise<InterviewStage> {
    const id = this.interviewStageIdCounter++
    const now = new Date()

    const newStage: InterviewStage = {
      id,
      applicationId,
      processId: null, // Not associated with an interview process
      type: stageData.type || "interview",
      status: stageData.status || "scheduled",
      scheduledDate: stageData.scheduledDate
        ? new Date(stageData.scheduledDate)
        : null,
      completedDate: stageData.completedDate
        ? new Date(stageData.completedDate)
        : null,
      location: stageData.location || null,
      interviewers: stageData.interviewers || [],
      notes: stageData.notes || null,
      outcome: stageData.outcome || null,
      createdAt: now,
      updatedAt: now
    }

    this.interviewStages.set(id, newStage)
    return newStage
  }

  // Application Follow-up Actions operations
  async getFollowupActionsForApplication(
    applicationId: number
  ): Promise<FollowupAction[]> {
    return Array.from(this.followupActions.values())
      .filter((action) => {
        // Handle both legacy data and new data structure
        return action.applicationId === applicationId
      })
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        return 0
      })
  }

  async createFollowupActionForApplication(
    applicationId: number,
    actionData: any
  ): Promise<FollowupAction> {
    const id = this.followupActionIdCounter++
    const now = new Date()

    const newAction: FollowupAction = {
      id,
      applicationId,
      processId: null, // Not associated with an interview process
      stageId: actionData.stageId || null,
      type: actionData.type || "follow_up",
      description: actionData.description || "",
      dueDate: actionData.dueDate ? new Date(actionData.dueDate) : null,
      completed: actionData.completed || false,
      completedDate: actionData.completedDate
        ? new Date(actionData.completedDate)
        : null,
      notes: actionData.notes || null,
      createdAt: now,
      updatedAt: now
    }

    this.followupActions.set(id, newAction)
    return newAction
  }

  // Application Wizard Steps operations
  async getApplicationWizardSteps(
    applicationId: number
  ): Promise<ApplicationWizardStep[]> {
    return Array.from(this.applicationWizardSteps.values())
      .filter((step) => step.applicationId === applicationId)
      .sort((a, b) => a.order - b.order) // Sort by step order
  }

  async getApplicationWizardStep(
    id: number
  ): Promise<ApplicationWizardStep | undefined> {
    return this.applicationWizardSteps.get(id)
  }

  async createApplicationWizardStep(
    applicationId: number,
    step: InsertApplicationWizardStep
  ): Promise<ApplicationWizardStep> {
    const id = this.applicationWizardStepIdCounter++
    const now = new Date()

    const newStep: ApplicationWizardStep = {
      ...step,
      id,
      applicationId,
      isCompleted: false,
      createdAt: now,
      updatedAt: now
    }

    this.applicationWizardSteps.set(id, newStep)
    return newStep
  }

  async updateApplicationWizardStep(
    id: number,
    stepData: Partial<ApplicationWizardStep>
  ): Promise<ApplicationWizardStep | undefined> {
    const step = this.applicationWizardSteps.get(id)
    if (!step) return undefined

    const updatedStep: ApplicationWizardStep = {
      ...step,
      ...stepData,
      updatedAt: new Date()
    }

    this.applicationWizardSteps.set(id, updatedStep)
    return updatedStep
  }

  async completeApplicationWizardStep(
    id: number
  ): Promise<ApplicationWizardStep | undefined> {
    const step = this.applicationWizardSteps.get(id)
    if (!step) return undefined

    const completedStep: ApplicationWizardStep = {
      ...step,
      isCompleted: true,
      completedAt: new Date(),
      updatedAt: new Date()
    }

    this.applicationWizardSteps.set(id, completedStep)

    // Get the application
    const application = await this.getJobApplication(step.applicationId)
    if (application) {
      // Check if all steps are completed
      const steps = await this.getApplicationWizardSteps(application.id)
      const completedSteps = steps.filter((s) => s.isCompleted).length
      const totalSteps = steps.length

      // Update application progress
      await this.updateJobApplication(application.id, {
        progress: Math.floor((completedSteps / totalSteps) * 100)
      })
    }

    return completedStep
  }

  // Skills operations
  private skills = new Map<number, Skill>()
  private nextSkillId = 1

  async getUserSkills(userId: number): Promise<Skill[]> {
    return Array.from(this.skills.values()).filter(
      (skill) => skill.userId === userId
    )
  }

  async getSkill(id: number): Promise<Skill | undefined> {
    return this.skills.get(id)
  }

  async createSkill(data: any): Promise<Skill> {
    const userId = data.userId
    const id = this.nextSkillId++

    const newSkill: Skill = {
      id,
      userId,
      name: data.name,
      proficiencyLevel: data.proficiencyLevel || 1,
      category: data.category || "technical",
      yearOfExperience: data.yearOfExperience || null,
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.skills.set(id, newSkill)
    return newSkill
  }

  async updateSkill(id: number, data: any): Promise<Skill | undefined> {
    const skill = this.skills.get(id)
    if (!skill) return undefined

    const updatedSkill: Skill = {
      ...skill,
      ...data,
      updatedAt: new Date()
    }

    this.skills.set(id, updatedSkill)
    return updatedSkill
  }

  async deleteSkill(id: number): Promise<boolean> {
    return this.skills.delete(id)
  }

  // Languages operations
  private languages = new Map<number, Language>()
  private nextLanguageId = 1

  async getUserLanguages(userId: number): Promise<Language[]> {
    return Array.from(this.languages.values()).filter(
      (lang) => lang.userId === userId
    )
  }

  async getLanguage(id: number): Promise<Language | undefined> {
    return this.languages.get(id)
  }

  async createLanguage(data: any): Promise<Language> {
    const userId = data.userId
    const id = this.nextLanguageId++

    const newLanguage: Language = {
      id,
      userId,
      name: data.name,
      proficiencyLevel: data.proficiencyLevel || "beginner",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.languages.set(id, newLanguage)
    return newLanguage
  }

  async updateLanguage(id: number, data: any): Promise<Language | undefined> {
    const language = this.languages.get(id)
    if (!language) return undefined

    const updatedLanguage: Language = {
      ...language,
      ...data,
      updatedAt: new Date()
    }

    this.languages.set(id, updatedLanguage)
    return updatedLanguage
  }

  async deleteLanguage(id: number): Promise<boolean> {
    return this.languages.delete(id)
  }

  // Networking Contacts (Ascentul CRM) operations
  async getNetworkingContacts(
    userId: number,
    filters?: { query?: string; relationshipType?: string }
  ): Promise<NetworkingContact[]> {
    let contacts = Array.from(this.networkingContacts.values()).filter(
      (contact) => contact.userId === userId
    )

    // Apply filters if provided
    if (filters) {
      if (filters.query) {
        const query = filters.query.toLowerCase()
        contacts = contacts.filter(
          (contact) =>
            contact.name.toLowerCase().includes(query) ||
            (contact.company &&
              contact.company.toLowerCase().includes(query)) ||
            (contact.position &&
              contact.position.toLowerCase().includes(query)) ||
            (contact.email && contact.email.toLowerCase().includes(query))
        )
      }

      if (filters.relationshipType) {
        contacts = contacts.filter(
          (contact) => contact.relationshipType === filters.relationshipType
        )
      }
    }

    // Sort by most recent first
    return contacts.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )
  }

  async getNetworkingContact(
    id: number
  ): Promise<NetworkingContact | undefined> {
    return this.networkingContacts.get(id)
  }

  async createNetworkingContact(
    userId: number,
    contact: InsertNetworkingContact
  ): Promise<NetworkingContact> {
    const id = this.networkingContactIdCounter++
    const now = new Date()
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
    }
    this.networkingContacts.set(id, newContact)
    return newContact
  }

  async updateNetworkingContact(
    id: number,
    contactData: Partial<NetworkingContact>
  ): Promise<NetworkingContact | undefined> {
    const contact = this.networkingContacts.get(id)
    if (!contact) return undefined

    const updatedContact = {
      ...contact,
      ...contactData,
      updatedAt: new Date()
    }
    this.networkingContacts.set(id, updatedContact)
    return updatedContact
  }

  async deleteNetworkingContact(id: number): Promise<boolean> {
    return this.networkingContacts.delete(id)
  }

  async getContactsNeedingFollowUp(
    userId: number
  ): Promise<NetworkingContact[]> {
    const now = new Date()

    // First, get contacts with built-in followUpDate property (including future dates)
    const contactsWithBuiltInFollowup = Array.from(
      this.networkingContacts.values()
    ).filter(
      (contact) =>
        contact.userId === userId &&
        contact.status === "active" &&
        contact.followUpDate !== null
    )

    // Get all follow-up actions that are for contacts (not completed, regardless of date)
    const allContactFollowups = Array.from(
      this.followupActions.values()
    ).filter(
      (followup) =>
        !followup.completed &&
        followup.dueDate !== null &&
        followup.type.startsWith("contact_")
    )

    const allContacts: NetworkingContact[] = []

    // Process both lists and ensure we don't have duplicates
    ;[...contactsWithBuiltInFollowup, ...contactsWithExplicitFollowups].forEach(
      (contact) => {
        if (!allContactIds.has(contact.id)) {
          allContactIds.add(contact.id)
          allContacts.push(contact)
        }
      }
    )

      return []
    }
  }

  async getUserStatistics(userId: number): Promise<{
    activeGoals: number
    achievementsCount: number
    resumesCount: number
    pendingTasks: number
    upcomingInterviews: number
    monthlyXp: { month: string; xp: number }[]
  }> {
    try {
      // Count active goals - using raw SQL to get any uncompleted goals
      // This will count goals where status != 'completed' OR completed = false
      const activeGoalsResult = await pool.query(
        `
        SELECT COUNT(*) FROM goals 
        WHERE user_id = $1 
        AND (status != 'completed' AND completed = false)
      `,
        [userId]
      )

      const activeGoalsCount = parseInt(activeGoalsResult.rows[0].count)

    return newLanguage
  }

  async getUserLanguages(userId: number): Promise<Language[]> {
    // This assumes there's a userLanguages junction table that relates users to languages
    // If it doesn't exist in your schema, you'll need to add it
    return []
  }

  // Networking Contacts
  async getNetworkingContacts(
    userId: string,
    filters?: { query?: string; relationshipType?: string }
  ): Promise<NetworkingContact[]> {
    let query = db
      .select()
      .from(networkingContacts)
      .where(eq(networkingContacts.userId, userId))

    // Apply filters if provided
    if (filters?.query) {
      query = query.where(
        sql`${networkingContacts.fullName} ILIKE ${
          "%" + filters.query + "%"
        } OR 
            ${networkingContacts.company} ILIKE ${"%" + filters.query + "%"} OR 
            ${networkingContacts.email} ILIKE ${"%" + filters.query + "%"}`
      )
    }

    if (filters?.relationshipType) {
      query = query.where(
        eq(networkingContacts.relationshipType, filters.relationshipType)
      )
    }

    return query.orderBy(networkingContacts.createdAt)
  }

  async getNetworkingContact(
    id: number
  ): Promise<NetworkingContact | undefined> {
    const [contact] = await db
      .select()
      .from(networkingContacts)
      .where(eq(networkingContacts.id, id))
    return contact || undefined
  }

  async createNetworkingContact(
    userId: string,
    contact: InsertNetworkingContact
  ): Promise<NetworkingContact> {
    const [newContact] = await db
      .insert(networkingContacts)
      .values({ ...contact, userId })
      .returning()
    return newContact
  }

  async updateNetworkingContact(
    id: number,
    contactData: Partial<NetworkingContact>
  ): Promise<NetworkingContact | undefined> {
    const [updatedContact] = await db
      .update(networkingContacts)
      .set(contactData)
      .where(eq(networkingContacts.id, id))
      .returning()
    return updatedContact || undefined
  }

  async deleteNetworkingContact(id: number): Promise<boolean> {
    await db.delete(networkingContacts).where(eq(networkingContacts.id, id))
    return true
  }

  async getContactsNeedingFollowup(
    userId: string
  ): Promise<NetworkingContact[]> {
    // Use raw SQL query with proper columns matching the actual database schema
    // For now, we'll fetch all contacts where last_contacted_date is older than 30 days
    // This is a simple heuristic for determining contacts needing follow-up
    const result = await pool.query(
      `
      SELECT * FROM networking_contacts 
      WHERE user_id = $1 
      AND (
        last_contacted_date IS NULL OR 
        last_contacted_date < (CURRENT_TIMESTAMP - INTERVAL '30 days')
      )
      ORDER BY last_contacted_date ASC NULLS FIRST
    `,
      [userId]
    )

    return result.rows
  }

  // Alias for backward compatibility
  async getContactsNeedingFollowUp(
    userId: string
  ): Promise<NetworkingContact[]> {
    return this.getContactsNeedingFollowup(userId)
  }

  // Contact Interaction methods
  async getContactInteractions(
    contactId: number
  ): Promise<ContactInteraction[]> {
    return db
      .select()
      .from(contactInteractions)
      .where(eq(contactInteractions.contactId, contactId))
      .orderBy(contactInteractions.date, "desc")
  }

  async createContactInteraction(
    userId: string,
    contactId: number,
    interaction: InsertContactInteraction
  ): Promise<ContactInteraction> {
    // Insert the new interaction
    const [newInteraction] = await db
      .insert(contactInteractions)
      .values({
        ...interaction,
        userId,
        contactId
      })
      .returning()

    // Update the last contacted date on the contact
    await db
      .update(networkingContacts)
      .set({ lastContactedDate: interaction.date || new Date() })
      .where(eq(networkingContacts.id, contactId))

    return newInteraction
  }

  // XP Management Methods
  async addUserXP(
    userId: number,
    amount: number,
    source: string,
    description?: string
  ): Promise<number> {
    try {
      const now = new Date()

      // Create XP history record
      await db.insert(xpHistory).values({
        userId,
        amount,
        source,
        description: description || "",
        earnedAt: now // Use earnedAt instead of createdAt to match database schema
      })

      // Get the current user
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))

      // Update user's total XP
      const [updatedUser] = await db
        .update(users)
        .set({ xp: (currentUser?.xp || 0) + amount })
        .where(eq(users.id, userId))
        .returning()

      return updatedUser?.xp || 0
    } catch (error) {
      console.error("Error adding user XP in database:", error)
      // Return 0 instead of throwing to avoid breaking goal creation
      return 0
    }
  }

  // Contact Follow-ups methods
  async getContactFollowUps(contactId: number): Promise<FollowupAction[]> {
    try {

        for (let i = 0; i < neededCount; i++) {
          newRecommendations.push({
            userId,
            date: formattedDate,
            text: genericRecommendations[i],
            category: "momentum"
          })
        }
      }

      // Take the first 5 recommendations at most
      const finalRecommendations = newRecommendations.slice(0, 5)

      // Insert all recommendations
      const insertedRecommendations = await db
        .insert(dailyRecommendations)
        .values(finalRecommendations)
        .returning()

      return {
        type: "database",
        status: connectionTest ? "healthy" : "degraded",
        details: connectionTest
          ? "PostgreSQL database connection working properly"
          : "Using database storage but connection test failed"
      }
    } catch (error) {
      return {
        type: "database",
        status: "failing",
        details: `Database error: ${(error as Error).message}`
      }
    }
  } else {
    return {
      type: "memory",
      status: "degraded", // Memory storage is always considered degraded
      details:
        "Using in-memory storage - all data will be lost when server restarts"
    }
  }
}

export { storage }
