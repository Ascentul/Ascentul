/**
 * Phase 7 - Part B: AI Actions
 * Action type definitions and prompt generation orchestration
 */

import {
  GENERATE_SUMMARY_SYSTEM_PROMPT,
  REWRITE_EXPERIENCE_SYSTEM_PROMPT,
  TAILOR_TO_JOB_SYSTEM_PROMPT,
  IMPROVE_BULLET_SYSTEM_PROMPT,
  FIX_TENSE_SYSTEM_PROMPT,
  TRANSLATE_SYSTEM_PROMPT,
  buildGenerateSummaryPrompt,
  buildRewriteExperiencePrompt,
  buildTailorToJobPrompt,
  buildImproveBulletPrompt,
  buildFixTensePrompt,
  buildTranslatePrompt,
} from '@/lib/ai/prompts/actions';

/**
 * Supported AI actions for resume content
 */
export type AIAction =
  | 'generateSummary'
  | 'rewriteExperience'
  | 'tailorToJob'
  | 'improveBullet'
  | 'fixTense'
  | 'translate';

/**
 * Context required for different AI actions
 */
export interface ActionContext {
  // Content to operate on
  currentContent?: string;

  // Tailoring context
  jobText?: string;
  targetRole?: string;

  // Experience context
  bullets?: string[];
  role?: string;
  company?: string;
  isCurrent?: boolean;

  // Summary context
  experienceYears?: number;
  keySkills?: string[];

  // Translation context
  targetLang?: string;
  contentType?: string;

  // Bullet improvement context
  bullet?: string;
}

/**
 * Result containing system and user prompts for an action
 */
export interface ActionPromptResult {
  systemPrompt: string;
  userPrompt: string;
  action: AIAction;
}

/**
 * Get appropriate prompts for an AI action
 *
 * @param action - The AI action to perform
 * @param context - Context required for the action
 * @returns System and user prompts for the action
 * @throws Error if required context is missing
 *
 * @example
 * ```typescript
 * const prompts = getActionPrompt('generateSummary', {
 *   targetRole: 'Senior Engineer',
 *   experienceYears: 10,
 *   keySkills: ['TypeScript', 'React', 'Node.js'],
 * });
 *
 * // Use prompts with OpenAI
 * const completion = await openai.chat.completions.create({
 *   model: 'gpt-4',
 *   messages: [
 *     { role: 'system', content: prompts.systemPrompt },
 *     { role: 'user', content: prompts.userPrompt },
 *   ],
 * });
 * ```
 */
export function getActionPrompt(
  action: AIAction,
  context: ActionContext
): ActionPromptResult {
  switch (action) {
    case 'generateSummary': {
      return {
        action,
        systemPrompt: GENERATE_SUMMARY_SYSTEM_PROMPT,
        userPrompt: buildGenerateSummaryPrompt({
          currentContent: context.currentContent,
          targetRole: context.targetRole,
          experienceYears: context.experienceYears,
          keySkills: context.keySkills,
        }),
      };
    }

    case 'rewriteExperience': {
      if (!context.bullets || context.bullets.length === 0) {
        throw new Error('rewriteExperience requires bullets in context');
      }
      if (!context.role || !context.company) {
        throw new Error('rewriteExperience requires role and company in context');
      }

      return {
        action,
        systemPrompt: REWRITE_EXPERIENCE_SYSTEM_PROMPT,
        userPrompt: buildRewriteExperiencePrompt({
          bullets: context.bullets,
          role: context.role,
          company: context.company,
          isCurrent: context.isCurrent ?? false,
          targetRole: context.targetRole,
        }),
      };
    }

    case 'tailorToJob': {
      if (!context.jobText) {
        throw new Error('tailorToJob requires jobText in context');
      }
      if (!context.currentContent) {
        throw new Error('tailorToJob requires currentContent in context');
      }

      return {
        action,
        systemPrompt: TAILOR_TO_JOB_SYSTEM_PROMPT,
        userPrompt: buildTailorToJobPrompt({
          currentContent: context.currentContent,
          jobDescription: context.jobText,
          contentType: (context.contentType as 'summary' | 'experience' | 'skills' | undefined) ?? 'experience',
        }),
      };
    }

    case 'improveBullet': {
      if (!context.bullet) {
        throw new Error('improveBullet requires bullet in context');
      }

      return {
        action,
        systemPrompt: IMPROVE_BULLET_SYSTEM_PROMPT,
        userPrompt: buildImproveBulletPrompt({
          bullet: context.bullet,
          targetRole: context.targetRole,
        }),
      };
    }

    case 'fixTense': {
      if (!context.currentContent) {
        throw new Error('fixTense requires currentContent in context');
      }
      if (context.isCurrent === undefined) {
        throw new Error('fixTense requires isCurrent in context');
      }

      return {
        action,
        systemPrompt: FIX_TENSE_SYSTEM_PROMPT,
        userPrompt: buildFixTensePrompt({
          content: context.currentContent,
          isCurrent: context.isCurrent,
        }),
      };
    }

    case 'translate': {
      if (!context.currentContent) {
        throw new Error('translate requires currentContent in context');
      }
      if (!context.targetLang) {
        throw new Error('translate requires targetLang in context');
      }

      return {
        action,
        systemPrompt: TRANSLATE_SYSTEM_PROMPT,
        userPrompt: buildTranslatePrompt({
          content: context.currentContent,
          targetLanguage: context.targetLang,
          contentType: context.contentType,
        }),
      };
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = action;
      throw new Error(`Unknown action: ${_exhaustive}`);
    }
  }
}

/**
 * Validate that context contains required fields for an action
 *
 * @param action - The AI action
 * @param context - Context to validate
 * @returns Validation result with missing fields if invalid
 */
export function validateActionContext(
  action: AIAction,
  context: ActionContext
): { valid: true } | { valid: false; missing: string[] } {
  const missing: string[] = [];

  switch (action) {
    case 'generateSummary':
      // All fields optional for generateSummary
      break;

    case 'rewriteExperience':
      if (!context.bullets || context.bullets.length === 0) missing.push('bullets');
      if (!context.role) missing.push('role');
      if (!context.company) missing.push('company');
      break;

    case 'tailorToJob':
      if (!context.jobText) missing.push('jobText');
      if (!context.currentContent) missing.push('currentContent');
      break;

    case 'improveBullet':
      if (!context.bullet) missing.push('bullet');
      break;

    case 'fixTense':
      if (!context.currentContent) missing.push('currentContent');
      if (context.isCurrent === undefined) missing.push('isCurrent');
      break;

    case 'translate':
      if (!context.currentContent) missing.push('currentContent');
      if (!context.targetLang) missing.push('targetLang');
      break;

    default: {
      const _exhaustive: never = action;
      throw new Error(`Unknown action: ${_exhaustive}`);
    }
  }

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}

/**
 * Get human-readable description of an action
 */
export function getActionDescription(action: AIAction): string {
  switch (action) {
    case 'generateSummary':
      return 'Generate professional summary';
    case 'rewriteExperience':
      return 'Rewrite experience bullets';
    case 'tailorToJob':
      return 'Tailor content to job description';
    case 'improveBullet':
      return 'Improve bullet point';
    case 'fixTense':
      return 'Fix tense consistency';
    case 'translate':
      return 'Translate content';
    default: {
      const _exhaustive: never = action;
      throw new Error(`Unknown action: ${_exhaustive}`);
    }
  }
}
