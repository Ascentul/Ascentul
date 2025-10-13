import { z } from "zod";

// Contact information schema
const contactSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
  website: z.string().url().optional(),
  portfolio: z.string().url().optional(),
});

// Header block data
const headerDataSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  title: z.string().optional(),
  contact: contactSchema.optional(),
});

// Summary block data
const summaryDataSchema = z.object({
  content: z.string().min(1, "Summary content is required"),
});

// Skills block data
const skillsDataSchema = z.object({
  primary: z.array(z.string()).optional(),
  secondary: z.array(z.string()).optional(),
  categories: z.record(z.array(z.string())).optional(),
});

// Experience item
const experienceItemSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  bullets: z.array(z.string()).min(1, "At least one bullet point is required"),
  description: z.string().optional(),
});

// Experience block data
const experienceDataSchema = z.object({
  items: z.array(experienceItemSchema).min(1, "At least one experience item is required"),
});

// Education item
const educationItemSchema = z.object({
  institution: z.string().min(1, "Institution name is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
  honors: z.array(z.string()).optional(),
  coursework: z.array(z.string()).optional(),
});

// Education block data
const educationDataSchema = z.object({
  items: z.array(educationItemSchema).min(1, "At least one education item is required"),
});

// Project item
const projectItemSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  link: z.string().url().optional(),
  github: z.string().url().optional(),
  bullets: z.array(z.string()).optional(),
  date: z.string().optional(),
});

// Projects block data
const projectsDataSchema = z.object({
  items: z.array(projectItemSchema).min(1, "At least one project is required"),
});

// Custom block data
const customDataSchema = z.object({
  title: z.string().min(1, "Custom section title is required"),
  content: z.string().optional(),
  items: z.array(z.string()).optional(),
});

// Block type enum
const blockTypeSchema = z.enum([
  "header",
  "summary",
  "skills",
  "experience",
  "education",
  "projects",
  "custom",
]);

// Single block schema with discriminated union
const blockSchema = z.object({
  type: blockTypeSchema,
  data: z.union([
    headerDataSchema,
    summaryDataSchema,
    skillsDataSchema,
    experienceDataSchema,
    educationDataSchema,
    projectsDataSchema,
    customDataSchema,
    z.record(z.any()), // Fallback for any other data structure
  ]),
  order: z.number().int().min(0),
});

// Full resume blocks response from AI
export const aiResumeResponseSchema = z.object({
  blocks: z.array(blockSchema).min(1, "At least one block is required"),
});

// Export individual schemas for specific validation
export const schemas = {
  contact: contactSchema,
  headerData: headerDataSchema,
  summaryData: summaryDataSchema,
  skillsData: skillsDataSchema,
  experienceData: experienceDataSchema,
  educationData: educationDataSchema,
  projectsData: projectsDataSchema,
  customData: customDataSchema,
  block: blockSchema,
  blockType: blockTypeSchema,
};

// Type exports
export type ResumeBlock = z.infer<typeof blockSchema>;
export type AIResumeResponse = z.infer<typeof aiResumeResponseSchema>;
export type BlockType = z.infer<typeof blockTypeSchema>;
export type HeaderData = z.infer<typeof headerDataSchema>;
export type SummaryData = z.infer<typeof summaryDataSchema>;
export type SkillsData = z.infer<typeof skillsDataSchema>;
export type ExperienceData = z.infer<typeof experienceDataSchema>;
export type EducationData = z.infer<typeof educationDataSchema>;
export type ProjectsData = z.infer<typeof projectsDataSchema>;
export type CustomData = z.infer<typeof customDataSchema>;

// Validation helper function
export function validateAIResponse(data: unknown): {
  success: boolean;
  data?: AIResumeResponse;
  errors?: z.ZodError;
} {
  try {
    const validated = aiResumeResponseSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Format Zod errors for Claude to fix
export function formatZodErrorsForAI(errors: z.ZodError): string {
  return errors.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `- ${path}: ${issue.message}`;
    })
    .join("\n");
}
