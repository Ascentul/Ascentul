/**
 * Phase 7 - Part B: AI Action Prompts
 * System and user prompts for different AI actions
 */

/**
 * Base system prompt for all AI actions
 * Sets professional tone and output expectations
 */
const BASE_SYSTEM_PROMPT = `You are an expert resume writer and career coach. Your responses must be:
- Professional and ATS-optimized
- Concise and impactful
- Truthful (never invent facts)
- Grammatically correct
- Free of filler words and clichés

Output ONLY the requested content without explanations, markdown formatting, or commentary.`;

/**
 * System prompt for generating professional summaries
 */
export const GENERATE_SUMMARY_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

Your task: Generate a compelling 2-3 sentence professional summary that:
1. Highlights the candidate's expertise and value proposition
2. Includes relevant keywords for the target role
3. Quantifies experience level when possible (e.g., "10+ years")
4. Avoids first-person pronouns (I, me, my)
5. Starts with a strong professional identifier

Example format: "[Role] with [X years] experience in [key skills]. Proven track record of [key achievements]. Skilled in [relevant technologies/methods]."`;

/**
 * System prompt for rewriting experience bullets
 */
export const REWRITE_EXPERIENCE_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

Your task: Improve experience bullet points by:
1. Starting with strong action verbs (Led, Developed, Implemented, Optimized, etc.)
2. Adding quantifiable metrics (%, $, time saved, scale, users affected)
3. Following the STAR format (Situation, Task, Action, Result)
4. Keeping bullets concise (15-25 words)
5. Using past tense for previous roles, present tense for current roles

Transform weak bullets into high-impact achievements that demonstrate value and results.`;

/**
 * System prompt for tailoring content to job descriptions
 */
export const TAILOR_TO_JOB_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

Your task: Tailor resume content to match a specific job description by:
1. Incorporating relevant keywords from the job posting
2. Emphasizing skills and experiences that align with requirements
3. Adjusting language to match the company's industry and culture
4. Maintaining truthfulness (enhance emphasis, don't fabricate)
5. Keeping the core facts and timeline intact

Focus on strategic emphasis and keyword optimization for ATS systems.`;

/**
 * System prompt for improving individual bullets
 */
export const IMPROVE_BULLET_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

Your task: Enhance a single bullet point to make it more impactful:
1. Strengthen the action verb
2. Add or improve quantifiable metrics
3. Clarify the impact and result
4. Improve readability and flow
5. Keep it concise (15-25 words)

Return ONLY the improved bullet text, nothing else.`;

/**
 * System prompt for fixing tense consistency
 */
export const FIX_TENSE_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

Your task: Fix tense consistency in resume content:
- Current roles (end date = "Present"): Use present tense (leads, manages, develops)
- Previous roles: Use past tense (led, managed, developed)
- Maintain parallel structure across all bullets
- Keep all other content unchanged

Return the corrected text with proper tense applied.`;

/**
 * System prompt for translating resume content
 */
export const TRANSLATE_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

Your task: Translate resume content to another language while:
1. Maintaining professional tone and formality
2. Preserving resume-specific terminology
3. Keeping proper nouns (company names, product names) unchanged
4. Adapting cultural norms for the target language
5. Ensuring ATS compatibility in the target language

Provide accurate, professional translation suitable for job applications.`;

/**
 * Generate user prompt for summary generation
 */
export function buildGenerateSummaryPrompt(context: {
  currentContent?: string;
  targetRole?: string;
  experienceYears?: number;
  keySkills?: string[];
}): string {
  const { currentContent, targetRole, experienceYears, keySkills } = context;

  // Build the main prompt sentence
  const parts = ['Generate a professional summary'];

  if (targetRole) {
    parts.push(`for a ${targetRole} position`);
  }

  if (experienceYears) {
    parts.push(`with ${experienceYears}+ years of experience`);
  }

  const sections = [parts.join(' ')];

  // Add key skills section if provided
  if (keySkills && keySkills.length > 0) {
    sections.push(`Key skills to highlight: ${keySkills.join(', ')}`);
  }

  // Add current content reference if provided
  if (currentContent) {
    sections.push(`Current summary (for reference):\n${currentContent}`);
    sections.push('Improve this summary or generate a new one that is more compelling.');
  }

  return sections.join('\n\n');
}

/**
 * Generate user prompt for experience rewriting
 */
export function buildRewriteExperiencePrompt(context: {
  bullets: string[];
  role: string;
  company: string;
  isCurrent: boolean;
  targetRole?: string;
}): string {
  const { bullets, role, company, isCurrent, targetRole } = context;

  let prompt = `Role: ${role} at ${company}\n`;
  prompt += `Status: ${isCurrent ? 'Current position' : 'Previous position'}\n\n`;

  if (targetRole) {
    prompt += `Target role: ${targetRole}\n\n`;
  }

  prompt += `Current bullets:\n`;
  bullets.forEach((bullet, i) => {
    prompt += `${i + 1}. ${bullet}\n`;
  });

  prompt += `\nRewrite these bullets to be more impactful. Use ${isCurrent ? 'present' : 'past'} tense. Return each improved bullet on a new line.`;

  return prompt;
}

/**
 * Generate user prompt for job tailoring
 */
export function buildTailorToJobPrompt(context: {
  currentContent: string;
  jobDescription: string;
  contentType: 'summary' | 'experience' | 'skills';
}): string {
  const { currentContent, jobDescription, contentType } = context;

  let prompt = `Job Description:\n${jobDescription}\n\n`;
  prompt += `Current ${contentType} content:\n${currentContent}\n\n`;
  prompt += `Tailor the ${contentType} content to better match this job description. `;
  prompt += `Emphasize relevant skills and experiences, incorporate key terms, `;
  prompt += `but maintain truthfulness and core facts.`;

  return prompt;
}

/**
 * Generate user prompt for bullet improvement
 */
export function buildImproveBulletPrompt(context: {
  bullet: string;
  targetRole?: string;
}): string {
  const { bullet, targetRole } = context;

  let prompt = `Current bullet:\n${bullet}\n\n`;
  prompt += `Improve this bullet to be more impactful and results-oriented.`;

  if (targetRole) {
    prompt += ` Emphasize skills relevant to ${targetRole}.`;
  }

  return prompt;
}

/**
 * Generate user prompt for tense fixing
 */
export function buildFixTensePrompt(context: {
  content: string;
  isCurrent: boolean;
}): string {
  const { content, isCurrent } = context;

  const targetTense = isCurrent ? 'present' : 'past';

  let prompt = `Content:\n${content}\n\n`;
  prompt += `Fix the tense to ${targetTense} tense (${isCurrent ? 'current role' : 'previous role'}). `;
  prompt += `Return the corrected content with consistent tense applied.`;

  return prompt;
}

/**
 * Generate user prompt for translation
 */
export function buildTranslatePrompt(context: {
  content: string;
  targetLanguage: string;
  contentType?: string;
}): string {
  const { content, targetLanguage, contentType = 'resume content' } = context;

  let prompt = `Translate the following ${contentType} to ${targetLanguage}:\n\n`;
  prompt += content;
  prompt += `\n\nMaintain professional tone and resume formatting conventions for ${targetLanguage}.`;

  return prompt;
}
