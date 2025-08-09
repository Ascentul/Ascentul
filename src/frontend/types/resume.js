import { z } from "zod";
// Define the Resume schema
export const resumeSchema = z.object({
    id: z.number().optional(),
    userId: z.number().optional(),
    name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
    template: z.string().default('standard'),
    content: z.object({
        personalInfo: z.object({
            fullName: z.string().min(1, { message: 'Full name is required' }),
            email: z.string().email({ message: 'Please enter a valid email' }),
            phone: z.string().optional(),
            location: z.string().optional(),
            linkedIn: z.string().optional(),
            portfolio: z.string().optional(),
        }),
        summary: z.string().optional(),
        skills: z.array(z.string()).default([]),
        experience: z.array(z.object({
            company: z.string(),
            position: z.string(),
            startDate: z.string(),
            endDate: z.string().optional(),
            currentJob: z.boolean().default(false),
            description: z.string().optional(),
            achievements: z.array(z.string()).optional(),
        })).default([]),
        education: z.array(z.object({
            institution: z.string(),
            degree: z.string(),
            field: z.string().optional(),
            startDate: z.string(),
            endDate: z.string().optional(),
            description: z.string().optional(),
        })).default([]),
        projects: z.array(z.object({
            name: z.string(),
            description: z.string().optional(),
            url: z.string().optional(),
            technologies: z.array(z.string()).default([]),
        })).default([]),
        certifications: z.array(z.object({
            name: z.string(),
            issuer: z.string(),
            date: z.string(),
            url: z.string().optional(),
        })).default([]),
    }),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
// Define the create resume schema (omitting auto-generated fields)
export const createResumeSchema = resumeSchema.omit({ id: true, userId: true, createdAt: true, updatedAt: true });
// Define the update resume schema
export const updateResumeSchema = createResumeSchema.partial();
