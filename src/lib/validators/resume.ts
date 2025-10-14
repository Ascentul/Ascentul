import { z } from 'zod';

// ===== Resume Template Types =====

export const pageSize = z.enum(['A4', 'Letter']);

export const templateMargins = z.object({
  top: z.number().min(0),
  right: z.number().min(0),
  bottom: z.number().min(0),
  left: z.number().min(0),
});

export const resumeTemplateSchema = z.object({
  slug: z.string(),
  name: z.string(),
  thumbnailUrl: z.string().url().optional(),
  pageSize: pageSize,
  margins: templateMargins,
  allowedBlocks: z.array(z.string()),
});

// ===== Resume Theme Types =====

export const resumeThemeSchema = z.object({
  name: z.string(),
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  fontSizes: z.object({
    heading: z.number().min(8).max(72),
    body: z.number().min(8).max(72),
  }).optional(),
  colors: z.object({
    primary: z.string(),
    text: z.string(),
    accent: z.string(),
  }),
});

// ===== Block Data Types =====

// Header block
export const headerBlockData = z.object({
  fullName: z.string(),
  title: z.string().optional(),
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    links: z.array(z.object({
      label: z.string(),
      url: z.string().url(),
    })).optional(),
  }),
});

// Summary block
export const summaryBlockData = z.object({
  paragraph: z.string(),
});

// Experience block
export const experienceItem = z.object({
  company: z.string(),
  role: z.string(),
  location: z.string().optional(),
  start: z.string().optional(), // Date string like "Jan 2020" or ISO format
  end: z.string().optional(), // "Present" for current roles
  bullets: z.array(z.string()).optional(),
});

export const experienceBlockData = z.object({
  items: z.array(experienceItem),
});

// Education block
export const educationItem = z.object({
  school: z.string(),
  degree: z.string().optional(),
  end: z.string().optional(), // Graduation date
  details: z.array(z.string()).optional(), // GPA, honors, etc.
});

export const educationBlockData = z.object({
  items: z.array(educationItem),
});

// Skills block
export const skillsBlockData = z.object({
  primary: z.array(z.string()).optional(),
  secondary: z.array(z.string()).optional(),
}).refine(
  (data) => (data.primary?.length ?? 0) > 0 || (data.secondary?.length ?? 0) > 0,
  { message: 'At least one skills list must be provided' }
);

// Projects block
export const projectItem = z.object({
  name: z.string(),
  description: z.string(),
  bullets: z.array(z.string()).optional(),
});

export const projectsBlockData = z.object({
  items: z.array(projectItem),
});

// Custom block
export const customBlockData = z.object({
  heading: z.string(),
  bullets: z.array(z.string()).optional(),
});

// ===== Block Type Union =====

export const blockType = z.enum([
  'header',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'custom',
]);

// Generic block structure
export const resumeBlock = z.object({
  type: blockType,
  data: z.union([
    headerBlockData,
    summaryBlockData,
    experienceBlockData,
    educationBlockData,
    skillsBlockData,
    projectsBlockData,
    customBlockData,
  ]),
  order: z.number().min(0),
  locked: z.boolean().optional(),
});

// Type-safe block validators for each specific type
export const headerBlock = z.object({
  type: z.literal('header'),
  data: headerBlockData,
  order: z.number().min(0),
  locked: z.boolean().optional(),
});

export const summaryBlock = z.object({
  type: z.literal('summary'),
  data: summaryBlockData,
  order: z.number().min(0),
  locked: z.boolean().optional(),
});

export const experienceBlock = z.object({
  type: z.literal('experience'),
  data: experienceBlockData,
  order: z.number().min(0),
  locked: z.boolean().optional(),
});

export const educationBlock = z.object({
  type: z.literal('education'),
  data: educationBlockData,
  order: z.number().min(0),
  locked: z.boolean().optional(),
});

export const skillsBlock = z.object({
  type: z.literal('skills'),
  data: skillsBlockData,
  order: z.number().min(0),
  locked: z.boolean().optional(),
});

export const projectsBlock = z.object({
  type: z.literal('projects'),
  data: projectsBlockData,
  order: z.number().min(0),
  locked: z.boolean().optional(),
});

export const customBlock = z.object({
  type: z.literal('custom'),
  data: customBlockData,
  order: z.number().min(0),
  locked: z.boolean().optional(),
});

// ===== Resume Document =====

export const resumeSchema = z.object({
  userId: z.string(),
  title: z.string(),
  templateSlug: z.string(),
  themeId: z.string().optional(),
  version: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// ===== Resume Export =====

export const exportFormat = z.enum(['pdf', 'docx']);

export const resumeExportSchema = z.object({
  resumeId: z.string(),
  format: exportFormat,
  url: z.string().url(),
  createdAt: z.number(),
});

// ===== TypeScript Types (inferred from Zod schemas) =====

export type PageSize = z.infer<typeof pageSize>;
export type TemplateMargins = z.infer<typeof templateMargins>;
export type ResumeTemplate = z.infer<typeof resumeTemplateSchema>;
export type ResumeTheme = z.infer<typeof resumeThemeSchema>;

export type HeaderBlockData = z.infer<typeof headerBlockData>;
export type SummaryBlockData = z.infer<typeof summaryBlockData>;
export type ExperienceItem = z.infer<typeof experienceItem>;
export type ExperienceBlockData = z.infer<typeof experienceBlockData>;
export type EducationItem = z.infer<typeof educationItem>;
export type EducationBlockData = z.infer<typeof educationBlockData>;
export type SkillsBlockData = z.infer<typeof skillsBlockData>;
export type ProjectItem = z.infer<typeof projectItem>;
export type ProjectsBlockData = z.infer<typeof projectsBlockData>;
export type CustomBlockData = z.infer<typeof customBlockData>;

export type BlockType = z.infer<typeof blockType>;
export type ResumeBlock = z.infer<typeof resumeBlock>;
export type HeaderBlock = z.infer<typeof headerBlock>;
export type SummaryBlock = z.infer<typeof summaryBlock>;
export type ExperienceBlock = z.infer<typeof experienceBlock>;
export type EducationBlock = z.infer<typeof educationBlock>;
export type SkillsBlock = z.infer<typeof skillsBlock>;
export type ProjectsBlock = z.infer<typeof projectsBlock>;
export type CustomBlock = z.infer<typeof customBlock>;

export type Resume = z.infer<typeof resumeSchema>;
export type ExportFormat = z.infer<typeof exportFormat>;
export type ResumeExport = z.infer<typeof resumeExportSchema>;

// ===== Helper Functions =====

/**
 * Validate a block's data based on its type
 */
export function validateBlockData(type: BlockType, data: unknown) {
  switch (type) {
    case 'header':
      return headerBlockData.parse(data);
    case 'summary':
      return summaryBlockData.parse(data);
    case 'experience':
      return experienceBlockData.parse(data);
    case 'education':
      return educationBlockData.parse(data);
    case 'skills':
      return skillsBlockData.parse(data);
    case 'projects':
      return projectsBlockData.parse(data);
    case 'custom':
      return customBlockData.parse(data);
    default:
      throw new Error(`Unknown block type: ${type}`);
  }
}

/**
 * Type guard to check if data matches a specific block type
 */
export function isBlockType<T extends BlockType>(
  block: ResumeBlock,
  type: T
): block is Extract<ResumeBlock, { type: T }> {
  return block.type === type;
}

/**
 * Safe block data getter with type narrowing
 */
export function getBlockData<T extends BlockType>(
  block: ResumeBlock,
  type: T
): Extract<ResumeBlock, { type: T }>['data'] | null {
  if (block.type === type) {
    return block.data as Extract<ResumeBlock, { type: T }>['data'];
  }
  return null;
}

// ===== API Request/Response Types =====

export const createResumeRequest = z.object({
  title: z.string().min(1, 'Title is required'),
  templateSlug: z.string(),
  themeId: z.string().optional(),
});

export const updateResumeRequest = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  templateSlug: z.string().optional(),
  themeId: z.string().optional(),
});

export const createBlockRequest = z.object({
  resumeId: z.string(),
  type: blockType,
  data: z.unknown(), // Will be validated based on type
  order: z.number().min(0),
  locked: z.boolean().optional(),
});

export const updateBlockRequest = z.object({
  blockId: z.string(),
  data: z.unknown().optional(),
  order: z.number().min(0).optional(),
  locked: z.boolean().optional(),
});

export const exportResumeRequest = z.object({
  resumeId: z.string(),
  format: exportFormat,
});

export type CreateResumeRequest = z.infer<typeof createResumeRequest>;
export type UpdateResumeRequest = z.infer<typeof updateResumeRequest>;
export type CreateBlockRequest = z.infer<typeof createBlockRequest>;
export type UpdateBlockRequest = z.infer<typeof updateBlockRequest>;
export type ExportResumeRequest = z.infer<typeof exportResumeRequest>;

// ===== AI Generation Response Schema =====

/**
 * Discriminated union for type-safe block validation
 * This ensures the data field matches the type field
 */
export const resumeBlockDiscriminated = z.discriminatedUnion('type', [
  headerBlock,
  summaryBlock,
  experienceBlock,
  educationBlock,
  skillsBlock,
  projectsBlock,
  customBlock,
]);

/**
 * AI response schema for resume generation
 * Validates the entire response including all blocks
 */
export const aiResumeResponseSchema = z.object({
  blocks: z.array(resumeBlockDiscriminated).min(1, 'At least one block is required'),
});

export type ResumeBlockDiscriminated = z.infer<typeof resumeBlockDiscriminated>;
export type AIResumeResponse = z.infer<typeof aiResumeResponseSchema>;

/**
 * Format Zod validation errors into a human-readable string for AI correction
 */
export function formatZodErrorsForAI(error: z.ZodError): string {
  const errors: string[] = [];

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    const message = err.message;
    errors.push(`- Path "${path}": ${message}`);
  });

  return errors.join('\n');
}
