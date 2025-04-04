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
  jobDescription: text("job_description"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  status: text("status").notNull().default("applied"),
  notes: text("notes"),
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

// Career Path
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

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