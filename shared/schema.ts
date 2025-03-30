import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  rank: text("rank").notNull().default("Career Explorer"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  xp: true,
  level: true,
  rank: true,
  createdAt: true,
});

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
});

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
