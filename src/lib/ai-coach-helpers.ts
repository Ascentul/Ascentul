/**
 * AI Coach Helper Functions
 *
 * Utilities for building user context and formatting data for AI coaching features.
 */

interface UserProfile {
  name?: string;
  current_position?: string;
  current_company?: string;
  industry?: string;
  experience_level?: string;
  skills?: string;
  career_goals?: string;
}

interface Goal {
  title: string;
  status: string;
}

interface Application {
  job_title: string;
  company: string;
  status: string;
}

interface Project {
  title: string;
  description?: string;
}

interface UserContextData {
  userProfile: UserProfile | null;
  goals: Goal[];
  applications: Application[];
  resumes: unknown[];
  coverLetters: unknown[];
  projects: Project[];
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
    if (data.userProfile.name) contextParts.push(`Name: ${data.userProfile.name}`);
    if (data.userProfile.current_position) contextParts.push(`Current Position: ${data.userProfile.current_position}`);
    if (data.userProfile.current_company) contextParts.push(`Current Company: ${data.userProfile.current_company}`);
    if (data.userProfile.industry) contextParts.push(`Industry: ${data.userProfile.industry}`);
    if (data.userProfile.experience_level) contextParts.push(`Experience Level: ${data.userProfile.experience_level}`);
    if (data.userProfile.skills) contextParts.push(`Skills: ${data.userProfile.skills}`);
    if (data.userProfile.career_goals) contextParts.push(`Career Goals: ${data.userProfile.career_goals}`);
  }

  // Career goals section
  if (data.goals && data.goals.length > 0) {
    contextParts.push('\n--- CAREER GOALS ---');
    data.goals.slice(0, 5).forEach((goal, idx) => {
      contextParts.push(`${idx + 1}. ${goal.title} (Status: ${goal.status})`);
    });
  }

  // Job applications section
  if (data.applications && data.applications.length > 0) {
    contextParts.push('\n--- RECENT JOB APPLICATIONS ---');
    data.applications.slice(0, 8).forEach((app, idx) => {
      contextParts.push(`${idx + 1}. ${app.job_title} at ${app.company} (Status: ${app.status})`);
    });
  }

  // Projects section
  if (data.projects && data.projects.length > 0) {
    contextParts.push('\n--- PROJECTS & EXPERIENCE ---');
    data.projects.slice(0, 5).forEach((project, idx) => {
      contextParts.push(`${idx + 1}. ${project.title}`);
      if (project.description) contextParts.push(`   ${project.description}`);
    });
  }

  return contextParts.join('\n');
}
