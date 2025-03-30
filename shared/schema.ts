import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// University Model for University Edition
export const universities = pgTable("universities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(),
  logo: text("logo"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  address: text("address"),
  subscriptionPlan: text("subscription_plan").notNull().default("basic"),
  licenseCount: integer("license_count").notNull().default(0),
  activeLicenses: integer("active_licenses").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUniversitySchema = createInsertSchema(universities).omit({
  id: true,
  createdAt: true,
});

// University Administrators
export const universityAdmins = pgTable("university_admins", {
  id: serial("id").primaryKey(),
  universityId: integer("university_id").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("admin"), // admin, super_admin, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUniversityAdminSchema = createInsertSchema(universityAdmins).omit({
  id: true,
  createdAt: true,
});

// University Departments
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  universityId: integer("university_id").notNull(),
  name: text("name").notNull(),
  code: text("code"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

// User model (Extended for University Edition)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  userType: text("user_type").notNull().default("regular"), // Options: "regular", "university_student", "university_admin"
  universityId: integer("university_id"),
  departmentId: integer("department_id"),
  studentId: text("student_id"), // University-assigned student ID
  graduationYear: integer("graduation_year"),
  isUniversityStudent: boolean("is_university_student").default(false),
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

// Study Plan Model (University Edition)
export const studyPlans = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  academicTerm: text("academic_term"), // Fall 2023, Spring 2024, etc.
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStudyPlanSchema = createInsertSchema(studyPlans).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Study Plan Course Model
export const studyPlanCourses = pgTable("study_plan_courses", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  courseCode: text("course_code").notNull(),
  courseName: text("course_name").notNull(),
  credits: integer("credits").notNull().default(3),
  schedule: text("schedule"), // e.g., "MWF 9:00-10:30"
  instructor: text("instructor"),
  location: text("location"),
  priority: integer("priority").notNull().default(1), // 1 = highest
  status: text("status").notNull().default("planned"), // planned, in-progress, completed
  grade: text("grade"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudyPlanCourseSchema = createInsertSchema(studyPlanCourses).omit({
  id: true,
  createdAt: true,
});

// Course Assignment Model
export const courseAssignments = pgTable("course_assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, in-progress, completed
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  grade: text("grade"),
  weight: integer("weight").notNull().default(1), // percentage weight in course grade
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCourseAssignmentSchema = createInsertSchema(courseAssignments).omit({
  id: true,
  createdAt: true,
  completed: true,
  completedAt: true,
});

// Learning Module for LMS (University Edition)
export const learningModules = pgTable("learning_modules", {
  id: serial("id").primaryKey(),
  universityId: integer("university_id").notNull(),
  departmentId: integer("department_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  level: text("level").notNull().default("beginner"), // beginner, intermediate, advanced
  estimatedHours: integer("estimated_hours"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLearningModuleSchema = createInsertSchema(learningModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  published: true,
});

// Learning Unit Model
export const learningUnits = pgTable("learning_units", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: jsonb("content").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLearningUnitSchema = createInsertSchema(learningUnits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Module Enrollment Model
export const moduleEnrollments = pgTable("module_enrollments", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  userId: integer("user_id").notNull(),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertModuleEnrollmentSchema = createInsertSchema(moduleEnrollments).omit({
  id: true,
  userId: true,
  progress: true,
  completed: true,
  completedAt: true,
  lastAccessedAt: true,
  createdAt: true,
});

// Define relations between models
export const universitiesRelations = relations(universities, ({ many }) => ({
  administrators: many(universityAdmins),
  departments: many(departments),
  students: many(users),
  learningModules: many(learningModules),
}));

export const universityAdminsRelations = relations(universityAdmins, ({ one }) => ({
  university: one(universities, {
    fields: [universityAdmins.universityId],
    references: [universities.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  university: one(universities, {
    fields: [departments.universityId],
    references: [universities.id],
  }),
  students: many(users),
  learningModules: many(learningModules),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  university: one(universities, {
    fields: [users.universityId],
    references: [universities.id],
  }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  workHistory: many(workHistory),
  goals: many(goals),
  studyPlans: many(studyPlans),
  moduleEnrollments: many(moduleEnrollments),
}));

export const studyPlansRelations = relations(studyPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [studyPlans.userId],
    references: [users.id],
  }),
  courses: many(studyPlanCourses),
}));

export const studyPlanCoursesRelations = relations(studyPlanCourses, ({ one, many }) => ({
  studyPlan: one(studyPlans, {
    fields: [studyPlanCourses.planId],
    references: [studyPlans.id],
  }),
  assignments: many(courseAssignments),
}));

export const courseAssignmentsRelations = relations(courseAssignments, ({ one }) => ({
  course: one(studyPlanCourses, {
    fields: [courseAssignments.courseId],
    references: [studyPlanCourses.id],
  }),
}));

export const learningModulesRelations = relations(learningModules, ({ one, many }) => ({
  university: one(universities, {
    fields: [learningModules.universityId],
    references: [universities.id],
  }),
  department: one(departments, {
    fields: [learningModules.departmentId],
    references: [departments.id],
  }),
  units: many(learningUnits),
  enrollments: many(moduleEnrollments),
}));

export const learningUnitsRelations = relations(learningUnits, ({ one }) => ({
  module: one(learningModules, {
    fields: [learningUnits.moduleId],
    references: [learningModules.id],
  }),
}));

export const moduleEnrollmentsRelations = relations(moduleEnrollments, ({ one }) => ({
  module: one(learningModules, {
    fields: [moduleEnrollments.moduleId],
    references: [learningModules.id],
  }),
  user: one(users, {
    fields: [moduleEnrollments.userId],
    references: [users.id],
  }),
}));

// Types
export type University = typeof universities.$inferSelect;
export type InsertUniversity = z.infer<typeof insertUniversitySchema>;

export type UniversityAdmin = typeof universityAdmins.$inferSelect;
export type InsertUniversityAdmin = z.infer<typeof insertUniversityAdminSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type StudyPlan = typeof studyPlans.$inferSelect;
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;

export type StudyPlanCourse = typeof studyPlanCourses.$inferSelect;
export type InsertStudyPlanCourse = z.infer<typeof insertStudyPlanCourseSchema>;

export type CourseAssignment = typeof courseAssignments.$inferSelect;
export type InsertCourseAssignment = z.infer<typeof insertCourseAssignmentSchema>;

export type LearningModule = typeof learningModules.$inferSelect;
export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;

export type LearningUnit = typeof learningUnits.$inferSelect;
export type InsertLearningUnit = z.infer<typeof insertLearningUnitSchema>;

export type ModuleEnrollment = typeof moduleEnrollments.$inferSelect;
export type InsertModuleEnrollment = z.infer<typeof insertModuleEnrollmentSchema>;

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
