/**
 * AI Coach Helper Functions
 *
 * Utilities for building user context and formatting data for AI coaching features.
 */

// Context limits for AI prompt generation
const MAX_GOALS_IN_CONTEXT = 5;
const MAX_APPLICATIONS_IN_CONTEXT = 8;
const MAX_PROJECTS_IN_CONTEXT = 5;

interface UserProfile {
  name?: string,
  current_position?: string,
  current_company?: string,
  industry?: string,
  experience_level?: string,
  skills?: string,
  career_goals?: string,
}

import type { Application, Goal } from '@/types/models';

interface Project {
  title: string,
  description?: string,
}

interface UserContextData {
  userProfile: UserProfile | null,
  goals: Goal[],
  applications: Application[],
  resumes: unknown[], // Reserved for future use
  coverLetters: unknown[], // Reserved for future use
  projects: Project[],
}

// Sanitize user-provided strings before injecting into prompts
function sanitizeForPrompt(input: string, maxLength = 500): string {
  if (!input) return '';
  const normalized = input.normalize('NFKC');
  // Remove control/format characters (incl. bidi/zero-width)
  const stripped = normalized.replace(
    /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g,
    ''
  );
  // Collapse whitespace, avoid forging section markers, enforce max length
  return stripped
    .replace(/---/g, '—')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Builds a formatted context string from user data for AI coaching prompts.
 *
 * @param data - User profile and activity data
 * @returns Formatted context string ready for AI prompt injection
 */
export function buildUserContext(data: UserContextData): string {
  const contextParts: string[] = [];

  // User profile section
  if (data.userProfile) {
    contextParts.push('--- USER PROFILE ---');
    if (data.userProfile.name) contextParts.push(`Name: ${sanitizeForPrompt(data.userProfile.name, 100)}`);
    if (data.userProfile.current_position) contextParts.push(`Current Position: ${sanitizeForPrompt(data.userProfile.current_position, 150)}`);
    if (data.userProfile.current_company) contextParts.push(`Current Company: ${sanitizeForPrompt(data.userProfile.current_company, 150)}`);
    if (data.userProfile.industry) contextParts.push(`Industry: ${sanitizeForPrompt(data.userProfile.industry, 120)}`);
    if (data.userProfile.experience_level) contextParts.push(`Experience Level: ${sanitizeForPrompt(data.userProfile.experience_level, 120)}`);
    if (data.userProfile.skills) contextParts.push(`Skills: ${sanitizeForPrompt(data.userProfile.skills)}`);
    if (data.userProfile.career_goals) contextParts.push(`Career Goals: ${sanitizeForPrompt(data.userProfile.career_goals)}`);
  }

  // Career goals section
  if (data.goals && data.goals.length > 0) {
    contextParts.push('\n--- CAREER GOALS ---');
    data.goals.slice(0, MAX_GOALS_IN_CONTEXT).forEach((goal, idx) => {
      contextParts.push(`${idx + 1}. ${sanitizeForPrompt(goal.title, 200)} (Status: ${sanitizeForPrompt(goal.status ?? 'unknown', 80)})`);
    });
  }

  // Job applications section
  if (data.applications && data.applications.length > 0) {
    contextParts.push('\n--- RECENT JOB APPLICATIONS ---');
    data.applications.slice(0, MAX_APPLICATIONS_IN_CONTEXT).forEach((app, idx) => {
      contextParts.push(
        `${idx + 1}. ${sanitizeForPrompt(app.job_title, 200)} at ${sanitizeForPrompt(app.company, 200)} (Status: ${sanitizeForPrompt(app.status ?? 'unknown', 80)})`
      );
    });
  }

  // Projects section
  if (data.projects && data.projects.length > 0) {
    contextParts.push('\n--- PROJECTS & EXPERIENCE ---');
    data.projects.slice(0, MAX_PROJECTS_IN_CONTEXT).forEach((project, idx) => {
      contextParts.push(`${idx + 1}. ${sanitizeForPrompt(project.title, 200)}`);
      if (project.description) contextParts.push(`   ${sanitizeForPrompt(project.description)}`);
    });
  }

  return contextParts.join('\n');
}
