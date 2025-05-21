import { z } from "zod"

// Goal checklist item schema for frontend use
export const goalChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean().default(false)
})

export type GoalChecklistItem = z.infer<typeof goalChecklistItemSchema>

// Project schema
export const insertProjectSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  role: z.string().optional(),
  description: z.string().optional(),
  clientOrCompany: z.string().optional(),
  projectUrl: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal("")),
  projectType: z.enum(["personal", "professional", "academic", "volunteer"]),
  isPublic: z.boolean().default(false),
  skillsUsed: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional()
})

export type InsertProject = z.infer<typeof insertProjectSchema>

// User Personal Achievement schema
export const insertUserPersonalAchievementSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  category: z.enum([
    "professional",
    "academic",
    "personal",
    "certification",
    "award"
  ]),
  icon: z
    .enum(["award", "briefcase", "graduation", "medal", "star", "trophy"])
    .default("award"),
  achievementDate: z.date().optional(),
  issuingOrganization: z.string().optional(),
  proofUrl: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal("")),
  skills: z.string().optional(),
  xpValue: z.number().min(0).default(50),
  isHighlighted: z.boolean().default(false)
})

// Interview Process schema
export const insertInterviewProcessSchema = z.object({
  companyName: z.string().min(1, { message: "Company name is required" }),
  position: z.string().min(1, { message: "Position is required" }),
  jobDescription: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("In Progress"),
  jobLink: z.string().optional()
})

// Job Application schema
export const insertJobApplicationSchema = z.object({
  company: z.string().min(1, { message: "Company is required" }),
  position: z.string().min(1, { message: "Position is required" }),
  location: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  jobLink: z.string().optional(),
  status: z.string().default("In Progress"),
  source: z.string().default("Manual")
})

// Add any other frontend-specific schemas here
