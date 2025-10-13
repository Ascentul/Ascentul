import { z } from "zod";

// Header block
const headerBlockSchema = z.object({
  type: z.literal("header"),
  order: z.number().int().positive(),
  data: z.object({
    fullName: z.string().min(1),
    title: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    links: z.array(z.string().url()).optional(),
  }),
});

// Summary block
const summaryBlockSchema = z.object({
  type: z.literal("summary"),
  order: z.number().int().positive(),
  data: z.object({
    content: z.string().min(1),
  }),
});

// Experience block
const experienceBlockSchema = z.object({
  type: z.literal("experience"),
  order: z.number().int().positive(),
  data: z.object({
    items: z.array(
      z.object({
        company: z.string().min(1),
        role: z.string().min(1),
        location: z.string().optional(),
        start: z.string(),
        end: z.string().optional(),
        bullets: z.array(z.string()).min(1),
      })
    ).min(1),
  }),
});

// Education block
const educationBlockSchema = z.object({
  type: z.literal("education"),
  order: z.number().int().positive(),
  data: z.object({
    items: z.array(
      z.object({
        school: z.string().min(1),
        degree: z.string().min(1),
        location: z.string().optional(),
        end: z.string().optional(),
        details: z.array(z.string()).optional(),
      })
    ).min(1),
  }),
});

// Skills block
const skillsBlockSchema = z.object({
  type: z.literal("skills"),
  order: z.number().int().positive(),
  data: z.object({
    categories: z.array(
      z.object({
        name: z.string().optional(),
        skills: z.array(z.string()).min(1),
      })
    ).min(1),
  }),
});

// Projects block
const projectsBlockSchema = z.object({
  type: z.literal("projects"),
  order: z.number().int().positive(),
  data: z.object({
    items: z.array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        bullets: z.array(z.string()).optional(),
      })
    ).min(1),
  }),
});

// Custom block
const customBlockSchema = z.object({
  type: z.literal("custom"),
  order: z.number().int().positive(),
  data: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
  }),
});

// Union of all block types
const blockSchema = z.discriminatedUnion("type", [
  headerBlockSchema,
  summaryBlockSchema,
  experienceBlockSchema,
  educationBlockSchema,
  skillsBlockSchema,
  projectsBlockSchema,
  customBlockSchema,
]);

// Main resume output schema
export const resumeOutputSchema = z.object({
  blocks: z.array(blockSchema).min(1),
});

export type ResumeOutput = z.infer<typeof resumeOutputSchema>;
export type ResumeBlock = z.infer<typeof blockSchema>;

// Legacy exports for backward compatibility
export const resumeGenerationSchema = resumeOutputSchema;
export type ResumeGeneration = ResumeOutput;
export type Block = ResumeBlock;
