import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  userType: text("user_type").notNull().default("regular"), // Options: "regular", "admin", "staff"
  xp: integer("xp").default(0),
  level: integer("level").default(1),
  rank: text("rank").default("Career Explorer"),
  profileImage: text("profile_image"),
  // Career profile fields
  location: text("location"),
  remotePreference: text("remote_preference"), // Options: "remote", "hybrid", "onsite", "flexible"
  careerSummary: text("career_summary"),
  // Subscription fields
  subscriptionPlan: text("subscription_plan").notNull().default("free"), // Options: "free", "premium"
  subscriptionStatus: text("subscription_status").notNull().default("inactive"), // Options: "active", "inactive", "cancelled", "past_due"
  subscriptionCycle: text("subscription_cycle").default("monthly"), // Options: "monthly", "quarterly", "annual"
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID for payments
  stripeSubscriptionId: text("stripe_subscription_id"), // Stripe subscription ID
  subscriptionExpiresAt: timestamp("subscription_expires_at"), // When the subscription expires
  needsUsername: boolean("needs_username").default(false), // Whether the user needs to set a username during onboarding
  emailVerified: boolean("email_verified").default(false), // Whether the user's email has been verified
  verificationToken: text("verification_token"), // Token for email verification
  verificationExpires: timestamp("verification_expires"), // When the verification token expires
  pendingEmail: text("pending_email"), // Email address pending verification for change
  pendingEmailToken: text("pending_email_token"), // Token for pending email verification
  pendingEmailExpires: timestamp("pending_email_expires"), // When the pending email token expires
  passwordLastChanged: timestamp("password_last_changed"), // When the user last changed their password
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  xp: true,
  level: true,
  rank: true,
  createdAt: true,
  subscriptionPlan: true,
  // subscriptionStatus is no longer omitted to allow setting it during user creation
  subscriptionCycle: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionExpiresAt: true,
  emailVerified: true,
  verificationToken: true,
  verificationExpires: true,
  passwordLastChanged: true,
}).extend({
  needsUsername: z.boolean().optional().default(false),
  subscriptionStatus: z.string().optional().default("inactive"),
});

// Goal checklist item type for json storage
export const goalChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean().default(false),
});

export type GoalChecklistItem = z.infer<typeof goalChecklistItemSchema>;

// Goals model
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  progress: integer("progress").notNull().default(0),
  status: text("status").notNull().default("active"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  checklist: jsonb("checklist").$type<GoalChecklistItem[]>().default([]),
  xpReward: integer("xp_reward").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  userId: true,
  progress: true,
  completed: true,
  completedAt: true,
  createdAt: true,
}).extend({
  // Convert dueDate string to Date object if it's not already a Date
  dueDate: z.date().optional().nullable().or(
    z.string().transform((val) => val ? new Date(val) : null)
  ),
});

// Work History model
export const workHistory = pgTable("work_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  company: text("company").notNull(),
  position: text("position").notNull(),
  location: text("location"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  currentJob: boolean("current_job").notNull().default(false),
  description: text("description"),
  achievements: text("achievements").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkHistorySchema = createInsertSchema(workHistory).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  // Convert startDate string to Date object if it's not already a Date
  startDate: z.date().or(
    z.string().transform((val) => new Date(val))
  ),
  // Convert endDate string to Date object if it's not already a Date
  endDate: z.date().optional().nullable().or(
    z.string().transform((val) => val ? new Date(val) : null)
  ),
});

// Education History model
export const educationHistory = pgTable("education_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  institution: text("institution").notNull(),
  degree: text("degree").notNull(),
  fieldOfStudy: text("field_of_study").notNull(),
  location: text("location"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  current: boolean("current").notNull().default(false),
  gpa: text("gpa"),
  description: text("description"),
  achievements: text("achievements").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEducationHistorySchema = createInsertSchema(educationHistory).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  // Convert startDate string to Date object if it's not already a Date
  startDate: z.date().or(
    z.string().transform((val) => new Date(val))
  ),
  // Convert endDate string to Date object if it's not already a Date
  endDate: z.date().optional().nullable().or(
    z.string().transform((val) => val ? new Date(val) : null)
  ),
});

// Resume model
export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  template: text("template").notNull().default("standard"),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Cover Letter model
export const coverLetters = pgTable("cover_letters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  template: text("template").notNull().default("standard"),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCoverLetterSchema = createInsertSchema(coverLetters).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Interview Questions model
export const interviewQuestions = pgTable("interview_questions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  question: text("question").notNull(),
  suggestedAnswer: text("suggested_answer"),
  difficultyLevel: integer("difficulty_level").notNull().default(1),
});

export const insertInterviewQuestionSchema = createInsertSchema(interviewQuestions).omit({
  id: true,
});

// User Interview Practice model
export const interviewPractice = pgTable("interview_practice", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  questionId: integer("question_id").notNull(),
  userAnswer: text("user_answer"),
  confidence: integer("confidence"),
  practiceDate: timestamp("practice_date").defaultNow().notNull(),
});

export const insertInterviewPracticeSchema = createInsertSchema(interviewPractice).omit({
  id: true,
  userId: true,
  practiceDate: true,
});

// Achievement model
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  xpReward: integer("xp_reward").notNull(),
  requiredAction: text("required_action").notNull(),
  requiredValue: integer("required_value").notNull(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
});

// User Achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  userId: true,
  earnedAt: true,
});

// AI Coach Conversations
export const aiCoachConversations = pgTable("ai_coach_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAiCoachConversationSchema = createInsertSchema(aiCoachConversations).omit({
  id: true,
  userId: true,
  createdAt: true,
});

// AI Coach Messages
export const aiCoachMessages = pgTable("ai_coach_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  isUser: boolean("is_user").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAiCoachMessageSchema = createInsertSchema(aiCoachMessages).omit({
  id: true,
  timestamp: true,
});

// XP History
export const xpHistory = pgTable("xp_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  source: text("source").notNull(),
  description: text("description"),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

export const insertXpHistorySchema = createInsertSchema(xpHistory).omit({
  id: true,
  userId: true,
  earnedAt: true,
});

// Professional Certifications (to be deprecated)
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  issuingOrganization: text("issuing_organization").notNull(),
  issueDate: text("issue_date").notNull(),
  expirationDate: text("expiration_date"),
  credentialId: text("credential_id"),
  credentialUrl: text("credential_url"),
  description: text("description"),
  skills: text("skills"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// User Personal Achievements
export const userPersonalAchievements = pgTable("user_personal_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  achievementDate: timestamp("achievement_date").notNull(),
  issuingOrganization: text("issuing_organization"),
  proofUrl: text("proof_url"),
  skills: text("skills"),
  category: text("category").notNull().default("professional"), // professional, academic, personal, etc.
  icon: text("icon").default("award"), // Matches available icons in AchievementBadge.tsx
  xpValue: integer("xp_value").notNull().default(50),
  isHighlighted: boolean("is_highlighted").default(false), // Whether to highlight this achievement in the profile
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserPersonalAchievementSchema = createInsertSchema(userPersonalAchievements).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Convert achievementDate string to Date object if it's not already a Date
  achievementDate: z.date().or(
    z.string().transform((val) => new Date(val))
  ),
});

// Interview Process Tracking
export const interviewProcesses = pgTable("interview_processes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companyName: text("company_name").notNull(),
  position: text("position").notNull(),
  location: text("location"),
  jobDescription: text("job_description"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  jobLink: text("job_link"),
  resumeId: integer("resume_id"),
  applicationDate: timestamp("application_date").defaultNow(),
  status: text("status").notNull().default("not_started"),
  notes: text("notes"),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInterviewProcessSchema = createInsertSchema(interviewProcesses).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const interviewStages = pgTable("interview_stages", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").notNull(),
  type: text("type").notNull(), // e.g., "phone_screen", "technical", "onsite", "final"
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  location: text("location"),
  interviewers: text("interviewers").array(),
  notes: text("notes"),
  feedback: text("feedback"),
  outcome: text("outcome"), // e.g., "passed", "failed", "pending"
  nextSteps: text("next_steps"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInterviewStageSchema = createInsertSchema(interviewStages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Convert scheduledDate string to Date object if it's not already a Date
  scheduledDate: z.date().optional().nullable().or(
    z.string().transform((val) => val ? new Date(val) : null)
  ),
  // Same for completedDate
  completedDate: z.date().optional().nullable().or(
    z.string().transform((val) => val ? new Date(val) : null)
  ),
});

export const followupActions = pgTable("followup_actions", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").notNull(),
  stageId: integer("stage_id"),
  type: text("type").notNull(), // e.g., "thank_you_email", "follow_up", "preparation", "document_submission"
  description: text("description").notNull(),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").notNull().default(false),
  completedDate: timestamp("completed_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFollowupActionSchema = createInsertSchema(followupActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completed: true,
  completedDate: true,
}).extend({
  // Convert dueDate string to Date object if it's not already a Date
  dueDate: z.date().optional().nullable().or(
    z.string().transform((val) => val ? new Date(val) : null)
  ),
});

// Career Mentor Chat Conversations
export const mentorChatConversations = pgTable("mentor_chat_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull().default("general"), // general, interview, resume, career_change, etc.
  mentorPersona: text("mentor_persona").notNull().default("career_coach"), // career_coach, industry_expert, interviewer, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMentorChatConversationSchema = createInsertSchema(mentorChatConversations).omit({
  id: true,
  userId: true,
  createdAt: true,
});

// Career Mentor Chat Messages
export const mentorChatMessages = pgTable("mentor_chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  isUser: boolean("is_user").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  role: text("role"),
});

export const insertMentorChatMessageSchema = createInsertSchema(mentorChatMessages).omit({
  id: true,
  timestamp: true,
});

// Contact Messages model
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  read: boolean("read").notNull().default(false),
  archived: boolean("archived").notNull().default(false),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  timestamp: true,
  read: true,
  archived: true,
});

// Projects model
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  role: text("role").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  clientOrCompany: text("client_or_company").notNull(),
  projectUrl: text("project_url"),
  description: text("description").notNull(),
  skillsUsed: text("skills_used").array(),
  tags: text("tags").array(),
  projectType: text("project_type").notNull().default("personal"), // personal, client, academic
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.date().or(z.string().transform(val => new Date(val))),
  endDate: z.date().nullable().or(z.string().transform(val => val ? new Date(val) : null)),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

// Career Path model
export const careerPaths = pgTable("career_paths", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  pathData: jsonb("path_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCareerPathSchema = createInsertSchema(careerPaths).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Daily Recommendations
export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  text: text("text").notNull(),
  type: text("type").notNull().default("general"), // general, goal_related, interview_related, etc.
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  relatedEntityType: text("related_entity_type"), // 'goal', 'interview_process', etc.
  relatedEntityId: integer("related_entity_id"),
  expiresAt: timestamp("expires_at"), // When the recommendation expires (e.g., end of day)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  userId: true,
  completed: true,
  completedAt: true,
  createdAt: true,
}).extend({
  // Convert expiresAt string to Date object if it's not already a Date
  expiresAt: z.date().optional().nullable().or(
    z.string().transform((val) => val ? new Date(val) : null)
  ),
});

// Define relations between models
export const usersRelations = relations(users, ({ many }) => ({
  workHistory: many(workHistory),
  goals: many(goals),
  interviewPractices: many(interviewPractice),
  interviewProcesses: many(interviewProcesses),
  mentorChatConversations: many(mentorChatConversations),
  certifications: many(certifications),
  personalAchievements: many(userPersonalAchievements),
  projects: many(projects),
  skills: many(skills),
  languages: many(languages),
}));

// Interview Questions Relations
export const interviewQuestionsRelations = relations(interviewQuestions, ({ many }) => ({
  practices: many(interviewPractice),
}));

// Interview Practice Relations
export const interviewPracticeRelations = relations(interviewPractice, ({ one }) => ({
  question: one(interviewQuestions, {
    fields: [interviewPractice.questionId],
    references: [interviewQuestions.id],
  }),
  user: one(users, {
    fields: [interviewPractice.userId],
    references: [users.id],
  }),
}));

// Interview Process Relations
export const interviewProcessesRelations = relations(interviewProcesses, ({ one, many }) => ({
  user: one(users, {
    fields: [interviewProcesses.userId],
    references: [users.id],
  }),
  stages: many(interviewStages),
  followupActions: many(followupActions),
}));

// Interview Stages Relations
export const interviewStagesRelations = relations(interviewStages, ({ one, many }) => ({
  process: one(interviewProcesses, {
    fields: [interviewStages.processId],
    references: [interviewProcesses.id],
  }),
  followupActions: many(followupActions),
}));

// Followup Actions Relations
export const followupActionsRelations = relations(followupActions, ({ one }) => ({
  process: one(interviewProcesses, {
    fields: [followupActions.processId],
    references: [interviewProcesses.id],
  }),
  stage: one(interviewStages, {
    fields: [followupActions.stageId],
    references: [interviewStages.id],
  }),
}));

// Mentor Chat Conversations Relations
export const mentorChatConversationsRelations = relations(mentorChatConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [mentorChatConversations.userId],
    references: [users.id],
  }),
  messages: many(mentorChatMessages),
}));

// Mentor Chat Messages Relations
export const mentorChatMessagesRelations = relations(mentorChatMessages, ({ one }) => ({
  conversation: one(mentorChatConversations, {
    fields: [mentorChatMessages.conversationId],
    references: [mentorChatConversations.id],
  }),
}));

// Certification Relations
export const certificationsRelations = relations(certifications, ({ one }) => ({
  user: one(users, {
    fields: [certifications.userId],
    references: [users.id],
  }),
}));

// User Personal Achievements Relations
export const userPersonalAchievementsRelations = relations(userPersonalAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userPersonalAchievements.userId],
    references: [users.id],
  }),
}));

// Support Tickets model
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email"),
  source: text("source").notNull(),
  issueType: text("issue_type").notNull(),
  description: text("description").notNull(),
  attachmentUrl: text("attachment_url"),
  status: text("status").notNull().default("Open"),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
}).extend({
  source: z.enum(["in-app", "marketing-site"]),
  issueType: z.enum(["Bug", "Billing", "Feedback", "Feature Request", "Other"]),
  status: z.enum(["Open", "In Progress", "Resolved"]).optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

// Skill Stacker Weekly Plan task type
export const skillStackerTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["Article", "Video", "Practice", "Reflection"]),
  link: z.string().optional(),
  estimated_time: z.string(),
  status: z.enum(["incomplete", "complete"]).default("incomplete"),
  rating: z.number().min(1).max(5).optional(),
  completedAt: z.date().optional().nullable(),
});

export type SkillStackerTask = z.infer<typeof skillStackerTaskSchema>;

// Skill Stacker Weekly Plan model
export const skillStackerPlans = pgTable("skill_stacker_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  goalId: integer("goal_id").notNull(),
  week: integer("week").notNull(),
  weekStartDate: timestamp("week_start_date").notNull(),
  weekEndDate: timestamp("week_end_date").notNull(),
  status: text("status").notNull().default("active"), // active, completed
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  tasks: jsonb("tasks").$type<SkillStackerTask[]>().default([]),
  streak: integer("streak").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSkillStackerPlanSchema = createInsertSchema(skillStackerPlans).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
}).extend({
  // Convert date strings to Date objects if needed
  weekStartDate: z.date().or(
    z.string().transform((val) => new Date(val))
  ),
  weekEndDate: z.date().or(
    z.string().transform((val) => new Date(val))
  ),
});

export type SkillStackerPlan = typeof skillStackerPlans.$inferSelect;
export type InsertSkillStackerPlan = z.infer<typeof insertSkillStackerPlanSchema>;

export type WorkHistory = typeof workHistory.$inferSelect;
export type InsertWorkHistory = z.infer<typeof insertWorkHistorySchema>;

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;

export type CoverLetter = typeof coverLetters.$inferSelect;
export type InsertCoverLetter = z.infer<typeof insertCoverLetterSchema>;

export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertInterviewQuestion = z.infer<typeof insertInterviewQuestionSchema>;

export type InterviewPractice = typeof interviewPractice.$inferSelect;
export type InsertInterviewPractice = z.infer<typeof insertInterviewPracticeSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type AiCoachConversation = typeof aiCoachConversations.$inferSelect;
export type InsertAiCoachConversation = z.infer<typeof insertAiCoachConversationSchema>;

export type AiCoachMessage = typeof aiCoachMessages.$inferSelect;
export type InsertAiCoachMessage = z.infer<typeof insertAiCoachMessageSchema>;

export type XpHistory = typeof xpHistory.$inferSelect;
export type InsertXpHistory = z.infer<typeof insertXpHistorySchema>;

export type InterviewProcess = typeof interviewProcesses.$inferSelect;
export type InsertInterviewProcess = z.infer<typeof insertInterviewProcessSchema>;

export type InterviewStage = typeof interviewStages.$inferSelect;
export type InsertInterviewStage = z.infer<typeof insertInterviewStageSchema>;

export type FollowupAction = typeof followupActions.$inferSelect;
export type InsertFollowupAction = z.infer<typeof insertFollowupActionSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

export type MentorChatConversation = typeof mentorChatConversations.$inferSelect;
export type InsertMentorChatConversation = z.infer<typeof insertMentorChatConversationSchema>;

export type MentorChatMessage = typeof mentorChatMessages.$inferSelect;
export type InsertMentorChatMessage = z.infer<typeof insertMentorChatMessageSchema>;

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;

export type UserPersonalAchievement = typeof userPersonalAchievements.$inferSelect;
export type InsertUserPersonalAchievement = z.infer<typeof insertUserPersonalAchievementSchema>;

export type CareerPath = typeof careerPaths.$inferSelect;
export type InsertCareerPath = z.infer<typeof insertCareerPathSchema>;

// Job Listings model
export const jobListings = pgTable("job_listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  jobUrl: text("job_url").notNull(),
  tags: text("tags").array(),
  salary: text("salary"),
  remote: boolean("remote").default(false),
  jobType: text("job_type").notNull().default("full-time"), // full-time, part-time, contract, etc.
  source: text("source").notNull().default("manual"), // manual, api, etc.
  sourceId: text("source_id"), // ID from external API if applicable
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertJobListingSchema = createInsertSchema(jobListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Job Applications model
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  jobId: integer("job_id").notNull(), // Reference to jobListings
  title: text("title"), // Job title
  jobTitle: text("job_title"), // Alternative name for job title
  position: text("position"), // Alternative name for job title
  company: text("company"), // Company name
  companyName: text("company_name"), // Alternative name for company
  location: text("location"), // Job location
  jobLocation: text("job_location"), // Alternative name for location
  description: text("description"), // Job description
  adzunaJobId: text("adzuna_job_id"), // ID from Adzuna if applicable
  externalJobUrl: text("external_job_url"), // URL to external job posting
  jobLink: text("job_link"), // Alternative name for external job URL
  source: text("source").default("manual"), // Where the job was found (Adzuna, manual, etc.)
  progress: integer("progress").default(0), // Application progress (0-100%)
  resumeId: integer("resume_id"),
  coverLetterId: integer("cover_letter_id"),
  status: text("status").notNull().default("In Progress"), // In Progress, Applied, Rejected, etc.
  responses: jsonb("responses").$type<Record<string, string>>(), // Form field responses
  notes: text("notes"),
  aiAssisted: boolean("ai_assisted").default(true),
  submittedAt: timestamp("submitted_at"),
  applicationDate: timestamp("application_date"), // Date when user applied for the job
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
});

// Application Wizard Steps
export const applicationWizardSteps = pgTable("application_wizard_steps", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  stepName: text("step_name").notNull(), // personal_info, experience, questions, review, etc.
  stepOrder: integer("step_order").notNull(),
  completed: boolean("completed").default(false),
  data: jsonb("data"), // Step-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertApplicationWizardStepSchema = createInsertSchema(applicationWizardSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type JobListing = typeof jobListings.$inferSelect;
export type InsertJobListing = z.infer<typeof insertJobListingSchema>;

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;

export type ApplicationWizardStep = typeof applicationWizardSteps.$inferSelect;
export type InsertApplicationWizardStep = z.infer<typeof insertApplicationWizardStepSchema>;

// User Skills model
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  proficiencyLevel: integer("proficiency_level").notNull().default(1), // 1-5 scale
  category: text("category").notNull().default("technical"), // technical, soft, language, etc.
  yearOfExperience: integer("year_of_experience"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;

// User Languages model
export const languages = pgTable("languages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  proficiencyLevel: text("proficiency_level").notNull().default("beginner"), // beginner, intermediate, advanced, native
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLanguageSchema = createInsertSchema(languages).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type Language = typeof languages.$inferSelect;
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;

export type EducationHistory = typeof educationHistory.$inferSelect;
export type InsertEducationHistory = z.infer<typeof insertEducationHistorySchema>;

// Networking Contacts (Ascentul CRM)
export const networkingContacts = pgTable("networking_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fullName: text("full_name").notNull(),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  relationshipType: text("relationship_type").notNull(), // Mentor, Recruiter, Peer, Leader, etc.
  email: text("email"),
  phone: text("phone"),
  linkedInUrl: text("linkedin_url"),
  lastContactedDate: timestamp("last_contacted_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNetworkingContactSchema = createInsertSchema(networkingContacts).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Convert lastContactedDate string to Date object if it's not already a Date
  lastContactedDate: z.date().optional().nullable().or(
    z.string().transform((val) => val ? new Date(val) : null)
  ),
});

export type NetworkingContact = typeof networkingContacts.$inferSelect;
export type InsertNetworkingContact = z.infer<typeof insertNetworkingContactSchema>;