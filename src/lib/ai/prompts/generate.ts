import { z } from 'zod';

/**
 * User profile data from Convex
 */
export interface UserProfile {
  name?: string;
  email?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  website?: string;
  bio?: string;
  skills?: string;
  current_position?: string;
  current_company?: string;
  work_history?: Array<{
    role?: string;
    company?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    location?: string;
    summary?: string;
  }>;
  education_history?: Array<{
    school?: string;
    degree?: string;
    field_of_study?: string;
    start_year?: string;
    end_year?: string;
    is_current?: boolean;
    description?: string;
  }>;
}

/**
 * System prompt for resume generation
 */
export const RESUME_GENERATION_SYSTEM_PROMPT = `You are an expert resume writer and career coach with deep knowledge of modern hiring practices, ATS systems, and what makes resumes stand out to both automated systems and human recruiters.

Your task is to generate professional, ATS-optimized resume content in structured JSON format.

## Guidelines:

### General Principles:
- Use strong action verbs (Led, Developed, Implemented, Designed, etc.)
- Quantify achievements with metrics whenever possible (%, $, #)
- Focus on impact and results, not just responsibilities
- Use industry-standard terminology and keywords
- Keep language concise and professional
- Tailor content to the target role

### Format Requirements:
- Output ONLY valid JSON matching the exact schema provided
- No markdown formatting, no code blocks, no explanations
- Use proper JSON escaping for special characters
- Ensure all arrays and objects are properly closed

### Content Standards:
- Experience bullets: 3-5 per role, emphasizing achievements
- Skills: Organize into primary (core expertise) and secondary (supporting skills)
- Summary: 2-4 sentences highlighting key qualifications
- Use present tense for current roles, past tense for previous roles
- Include specific technologies, tools, and methodologies

### Block Types:
1. **header**: Contact information with full name, title, email, phone, location, and professional links
2. **summary**: Compelling professional summary highlighting value proposition
3. **experience**: Work history with company, role, dates, and achievement-focused bullets
4. **education**: Academic credentials with school, degree, and graduation date
5. **skills**: Technical and professional skills organized by priority
6. **projects**: Notable projects with name, description, and key achievements
7. **custom**: Additional sections like certifications, publications, awards, etc.

## JSON Schema:

\`\`\`json
{
  "blocks": [
    {
      "type": "header",
      "order": 0,
      "data": {
        "fullName": "string",
        "title": "string (optional)",
        "contact": {
          "email": "string (optional)",
          "phone": "string (optional)",
          "location": "string (optional)",
          "links": [
            { "label": "string", "url": "string" }
          ]
        }
      }
    },
    {
      "type": "summary",
      "order": 1,
      "data": {
        "paragraph": "string"
      }
    },
    {
      "type": "experience",
      "order": 2,
      "data": {
        "items": [
          {
            "company": "string",
            "role": "string",
            "start": "string",
            "end": "string or Present",
            "bullets": ["string"]
          }
        ]
      }
    },
    {
      "type": "education",
      "order": 3,
      "data": {
        "items": [
          {
            "school": "string",
            "degree": "string",
            "end": "string",
            "details": ["string (optional)"]
          }
        ]
      }
    },
    {
      "type": "skills",
      "order": 4,
      "data": {
        "primary": ["string"],
        "secondary": ["string (optional)"]
      }
    },
    {
      "type": "projects",
      "order": 5,
      "data": {
        "items": [
          {
            "name": "string",
            "description": "string",
            "bullets": ["string (optional)"]
          }
        ]
      }
    }
  ]
}
\`\`\`

Remember: Output ONLY the JSON object. No explanations, no markdown, no code blocks.`;

/**
 * Generate user prompt for resume creation
 */
export function generateResumePrompt(params: {
  targetRole: string;
  targetCompany?: string;
  userProfile: UserProfile;
}): string {
  const { targetRole, targetCompany, userProfile } = params;

  const sections: string[] = [];

  // Target position
  sections.push(`## Target Position`);
  sections.push(`Role: ${targetRole}`);
  if (targetCompany) {
    sections.push(`Company: ${targetCompany}`);
  }
  sections.push('');

  // User information
  sections.push(`## User Information`);

  if (userProfile.name) {
    sections.push(`Name: ${userProfile.name}`);
  }

  if (userProfile.email) {
    sections.push(`Email: ${userProfile.email}`);
  }

  if (userProfile.location) {
    sections.push(`Location: ${userProfile.location}`);
  }

  // Professional links
  const links: string[] = [];
  if (userProfile.linkedin_url) links.push(`LinkedIn: ${userProfile.linkedin_url}`);
  if (userProfile.github_url) links.push(`GitHub: ${userProfile.github_url}`);
  if (userProfile.website) links.push(`Website: ${userProfile.website}`);

  if (links.length > 0) {
    sections.push('\nProfessional Links:');
    links.forEach(link => sections.push(`- ${link}`));
  }

  sections.push('');

  // Current position
  if (userProfile.current_position || userProfile.current_company) {
    sections.push(`## Current Position`);
    if (userProfile.current_position) {
      sections.push(`Title: ${userProfile.current_position}`);
    }
    if (userProfile.current_company) {
      sections.push(`Company: ${userProfile.current_company}`);
    }
    sections.push('');
  }

  // Bio/Summary
  if (userProfile.bio) {
    sections.push(`## Professional Bio`);
    sections.push(userProfile.bio);
    sections.push('');
  }

  // Skills
  if (userProfile.skills) {
    sections.push(`## Skills`);
    sections.push(userProfile.skills);
    sections.push('');
  }

  // Work history
  if (userProfile.work_history && userProfile.work_history.length > 0) {
    sections.push(`## Work History`);
    userProfile.work_history.forEach((job, index) => {
      sections.push(`\n### Position ${index + 1}`);
      if (job.role) sections.push(`Role: ${job.role}`);
      if (job.company) sections.push(`Company: ${job.company}`);
      if (job.location) sections.push(`Location: ${job.location}`);

      const startDate = job.start_date || 'Unknown';
      const endDate = job.is_current ? 'Present' : (job.end_date || 'Unknown');
      sections.push(`Duration: ${startDate} - ${endDate}`);

      if (job.summary) {
        sections.push(`Summary: ${job.summary}`);
      }
    });
    sections.push('');
  }

  // Education history
  if (userProfile.education_history && userProfile.education_history.length > 0) {
    sections.push(`## Education History`);
    userProfile.education_history.forEach((edu, index) => {
      sections.push(`\n### Education ${index + 1}`);
      if (edu.school) sections.push(`School: ${edu.school}`);
      if (edu.degree) sections.push(`Degree: ${edu.degree}`);
      if (edu.field_of_study) sections.push(`Field: ${edu.field_of_study}`);

      if (edu.is_current) {
        sections.push(`Status: Currently enrolled`);
      } else if (edu.end_year) {
        sections.push(`Graduation: ${edu.end_year}`);
      }

      if (edu.description) {
        sections.push(`Details: ${edu.description}`);
      }
    });
    sections.push('');
  }

  // Instructions
  sections.push(`## Instructions`);
  sections.push(`Generate a professional resume tailored for the ${targetRole} position${targetCompany ? ` at ${targetCompany}` : ''}.`);
  sections.push('');
  sections.push('Requirements:');
  sections.push('1. Create a compelling professional summary that highlights relevant qualifications');
  sections.push('2. Transform the work history into achievement-focused bullet points with metrics');
  sections.push('3. Organize skills by relevance to the target role (primary vs. secondary)');
  sections.push('4. Include all education credentials');
  sections.push('5. Add a projects section if relevant experience can be highlighted');
  sections.push('6. Ensure all content is ATS-optimized with relevant keywords');
  sections.push('7. Use strong action verbs and quantify achievements where possible');
  sections.push('');
  sections.push('Output the resume as a valid JSON object matching the schema provided in the system prompt.');
  sections.push('Remember: Output ONLY the JSON. No explanations, no markdown code blocks, no additional text.');

  return sections.join('\n');
}

/**
 * Zod schema for AI response validation
 */
export const headerBlockSchema = z.object({
  type: z.literal('header'),
  order: z.number(),
  data: z.object({
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
  }),
});

export const summaryBlockSchema = z.object({
  type: z.literal('summary'),
  order: z.number(),
  data: z.object({
    paragraph: z.string().min(1),
  }),
});

export const experienceBlockSchema = z.object({
  type: z.literal('experience'),
  order: z.number(),
  data: z.object({
    items: z.array(z.object({
      company: z.string(),
      role: z.string(),
      start: z.string(),
      end: z.string(),
      bullets: z.array(z.string()).min(1),
    })).min(1),
  }),
});

export const educationBlockSchema = z.object({
  type: z.literal('education'),
  order: z.number(),
  data: z.object({
    items: z.array(z.object({
      school: z.string(),
      degree: z.string(),
      end: z.string(),
      details: z.array(z.string()).optional(),
    })).min(1),
  }),
});

export const skillsBlockSchema = z.object({
  type: z.literal('skills'),
  order: z.number(),
  data: z.object({
    primary: z.array(z.string()).min(1),
    secondary: z.array(z.string()).optional(),
  }),
});

export const projectsBlockSchema = z.object({
  type: z.literal('projects'),
  order: z.number(),
  data: z.object({
    items: z.array(z.object({
      name: z.string(),
      description: z.string(),
      bullets: z.array(z.string()).optional(),
    })).min(1),
  }),
});

export const customBlockSchema = z.object({
  type: z.literal('custom'),
  order: z.number(),
  data: z.object({
    heading: z.string(),
    bullets: z.array(z.string()),
  }),
});

export const resumeBlockSchema = z.discriminatedUnion('type', [
  headerBlockSchema,
  summaryBlockSchema,
  experienceBlockSchema,
  educationBlockSchema,
  skillsBlockSchema,
  projectsBlockSchema,
  customBlockSchema,
]);

export const aiResumeResponseSchema = z.object({
  blocks: z.array(resumeBlockSchema).min(1),
});

export type AIResumeResponse = z.infer<typeof aiResumeResponseSchema>;
export type ResumeBlock = z.infer<typeof resumeBlockSchema>;

/**
 * Extract JSON from AI response (handles markdown code blocks)
 */
export function extractJSON(text: string): unknown {
  // Try to find JSON in code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1]);
  }

  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  // If nothing found, try parsing the whole text
  return JSON.parse(text);
}

/**
 * Format Zod errors for AI retry
 */
export function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.join('.');
      return `- ${path}: ${err.message}`;
    })
    .join('\n');
}
