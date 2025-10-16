/**
 * Inline AI Suggestions System
 * Analyzes resume content and provides improvement tips
 */

import type { ResumeBlock } from '@/lib/validators/resume';

export type SuggestionPriority = 'high' | 'medium' | 'low';

export interface ContentSuggestion {
  id: string;
  type: 'metrics' | 'verb' | 'length' | 'clarity' | 'keyword' | 'tense';
  priority: SuggestionPriority;
  message: string;
  detail?: string;
  position?: {
    start: number;
    end: number;
  };
}

// Weak action verbs to flag (single words only)
const WEAK_VERBS = new Set([
  'helped', 'worked', 'did', 'made', 'got', 'was', 'were', 'had',
  'used', 'assisted', 'participated', 'involved',
]);

// Weak multi-word phrases to flag
const WEAK_PHRASES = new Set([
  'responsible for',
  'duties included',
  'tasked with',
  'in charge of',
  'handled',
  'dealt with',
  'was part of',
]);

// Present tense verbs for tense detection
const PRESENT_TENSE_VERBS = [
  'leads', 'manages', 'develops', 'implements', 'designs', 'builds', 'creates',
  'drives', 'optimizes', 'improves', 'oversees', 'coordinates', 'directs',
  'establishes', 'maintains', 'operates', 'supervises', 'delivers', 'executes',
  'achieves', 'launches', 'streamlines', 'collaborates', 'spearheads', 'facilitates',
  'analyzes', 'evaluates', 'strategizes', 'pioneers', 'orchestrates', 'transforms',
  'accelerates', 'enhances', 'resolves', 'generates', 'automates', 'scales',
  'mentors', 'trains', 'architected', 'deploys', 'integrates', 'migrates',
  'refactors', 'debugs', 'tests', 'reviews', 'documents', 'presents',
];

// Past tense verbs for tense detection
const PAST_TENSE_VERBS = [
  'led', 'managed', 'developed', 'implemented', 'designed', 'built', 'created',
  'drove', 'optimized', 'improved', 'oversaw', 'coordinated', 'directed',
  'established', 'maintained', 'operated', 'supervised', 'delivered', 'executed',
  'achieved', 'launched', 'streamlined', 'collaborated', 'spearheaded', 'facilitated',
  'analyzed', 'evaluated', 'strategized', 'pioneered', 'orchestrated', 'transformed',
  'accelerated', 'enhanced', 'resolved', 'generated', 'automated', 'scaled',
  'mentored', 'trained', 'architected', 'deployed', 'integrated', 'migrated',
  'refactored', 'debugged', 'tested', 'reviewed', 'documented', 'presented',
];

// Common metrics patterns
const METRICS_PATTERNS = [
  /%/,
  /\$[\d,]+/,
  /\d+x/,
  /\d+k\+/,
  /\d+ hours?/,
  /\d+ days?/,
  /\d+ weeks?/,
  /\d+ months?/,
];

/**
 * Analyze a single bullet point for improvements
 */
export function analyzeBullet(bullet: string, index: number | string): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];

  if (!bullet || bullet.trim().length === 0) {
    return suggestions;
  }

  const lowerBullet = bullet.toLowerCase();
  const words = bullet.split(/\s+/);

  // Check for weak multi-word phrases anywhere in the bullet
  let weakPhrase = null;
  for (const phrase of Array.from(WEAK_PHRASES)) {
    if (lowerBullet.includes(phrase)) {
      weakPhrase = phrase;
      break;
    }
  }

  if (weakPhrase) {
    // Weak phrase detected - high priority
    suggestions.push({
      id: `verb-${index}`,
      type: 'verb',
      priority: 'high',
      message: 'Strengthen action phrase',
      detail: `Replace "${weakPhrase}" with a stronger verb like "led", "managed", or "developed"`,
    });
  } else {
    // Check for weak/missing action verbs (single word check)
    const firstWord = words[0]?.toLowerCase();
    if (firstWord && WEAK_VERBS.has(firstWord)) {
      // Weak verb detected - high priority
      const randomStrongVerb = PAST_TENSE_VERBS[Math.floor(Math.random() * PAST_TENSE_VERBS.length)];
      suggestions.push({
        id: `verb-${index}`,
        type: 'verb',
        priority: 'high',
        message: 'Strengthen action verb',
        detail: `Replace "${firstWord}" with a stronger verb like "${randomStrongVerb}"`,
      });
    } else if (!firstWord) {
      // First word is missing - low priority
      suggestions.push({
        id: `keyword-${index}`,
        type: 'keyword',
        priority: 'low',
        message: 'Start with action verb',
        detail: 'Begin with a strong action verb to improve ATS scanning',
      });
    }
  }

  // Check for missing metrics
  const hasMetrics = METRICS_PATTERNS.some(pattern => pattern.test(bullet));
  if (!hasMetrics) {
    suggestions.push({
      id: `metrics-${index}`,
      type: 'metrics',
      priority: 'high',
      message: 'Add quantifiable metrics',
      detail: 'Include numbers, percentages, or time saved to show impact',
    });
  }

  // Check bullet length (word count is more accurate than character count)
  const wordCount = words.length;
  if (wordCount > 25) {
    suggestions.push({
      id: `length-${index}`,
      type: 'length',
      priority: 'medium',
      message: 'Bullet is too long',
      detail: `Keep bullets concise (20-25 words max). Current: ${wordCount} words. Split into multiple bullets if needed.`,
    });
  }

  // Check for vague language
  const vagueTerms = ['various', 'several', 'multiple', 'many', 'some', 'lots of'];
  const foundVagueTerms: string[] = [];
  for (const term of vagueTerms) {
    if (lowerBullet.includes(term)) {
      foundVagueTerms.push(term);
    }
  }

  if (foundVagueTerms.length > 0) {
    suggestions.push({
      id: `clarity-${index}`,
      type: 'clarity',
      priority: 'medium',
      message: foundVagueTerms.length === 1 ? 'Be more specific' : 'Be more specific (multiple vague terms)',
      detail: foundVagueTerms.length === 1
        ? `Replace "${foundVagueTerms[0]}" with exact numbers or details`
        : `Replace vague terms (${foundVagueTerms.join(', ')}) with exact numbers or details`,
    });
  }

  return suggestions;
}

/**
 * Analyze experience block items
 */
export function analyzeExperienceBlock(items: Array<{
  role: string;
  company: string;
  start: string;
  end: string;
  bullets?: string[];
}>): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];

  items.forEach((item, itemIndex) => {
    // Check if bullets exist
    if (!item.bullets || item.bullets.length === 0) {
      suggestions.push({
        id: `experience-empty-${itemIndex}`,
        type: 'clarity',
        priority: 'high',
        message: 'Add achievement bullets',
        detail: 'List 4-6 key accomplishments for this role',
      });
      return;
    }

    // Check tense consistency
    const isCurrentRole = item.end?.toLowerCase() === 'present';
    item.bullets.forEach((bullet, bulletIndex) => {
      if (!bullet) return;

      const bulletSuggestions = analyzeBullet(bullet, `${itemIndex}-${bulletIndex}`);
      suggestions.push(...bulletSuggestions);

      // Check tense with more robust detection
      // Detect present tense verbs
      const hasPresentTense = PRESENT_TENSE_VERBS.some(verb =>
        new RegExp(`\\b${verb}\\b`, 'i').test(bullet)
      );

      // Detect past tense verbs
      const hasPastTense = PAST_TENSE_VERBS.some(verb =>
        new RegExp(`\\b${verb}\\b`, 'i').test(bullet)
      );

      const shouldBePresent = isCurrentRole;

      // Only suggest if we have clear evidence of wrong tense
      if (shouldBePresent && hasPastTense && !hasPresentTense) {
        suggestions.push({
          id: `tense-${itemIndex}-${bulletIndex}`,
          type: 'tense',
          priority: 'medium',
          message: 'Use present tense',
          detail: 'Current role bullets should use present tense (e.g., "leads" not "led")',
        });
      } else if (!shouldBePresent && hasPresentTense && !hasPastTense) {
        suggestions.push({
          id: `tense-${itemIndex}-${bulletIndex}`,
          type: 'tense',
          priority: 'medium',
          message: 'Use past tense',
          detail: 'Previous role bullets should use past tense (e.g., "led" not "leads")',
        });
      }
    });
  });

  return suggestions;
}

/**
 * Analyze skills block
 */
export function analyzeSkillsBlock(primary: string[], secondary?: string[]): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];
  const allSkills = [...(primary || []), ...(secondary || [])];

  if (allSkills.length === 0) {
    suggestions.push({
      id: 'skills-empty',
      type: 'clarity',
      priority: 'high',
      message: 'Add skills',
      detail: 'List your technical and professional skills',
    });
  } else if (allSkills.length < 5) {
    suggestions.push({
      id: 'skills-few',
      type: 'clarity',
      priority: 'medium',
      message: 'Add more skills',
      detail: 'List 8-12 relevant skills for better ATS matching',
    });
  } else if (allSkills.length > 20) {
    suggestions.push({
      id: 'skills-many',
      type: 'clarity',
      priority: 'low',
      message: 'Too many skills',
      detail: 'Focus on your most relevant and strongest skills (8-15)',
    });
  }

  return suggestions;
}

/**
 * Analyze summary/professional summary
 */
export function analyzeSummary(paragraph: string): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];

  if (!paragraph || paragraph.trim().length === 0) {
    suggestions.push({
      id: 'summary-empty',
      type: 'clarity',
      priority: 'medium',
      message: 'Add professional summary',
      detail: 'Write 2-3 sentences highlighting your expertise and value',
    });
    return suggestions;
  }

  const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);

  if (sentences.length < 2) {
    suggestions.push({
      id: 'summary-short',
      type: 'clarity',
      priority: 'medium',
      message: 'Expand your summary',
      detail: 'Include 2-3 sentences covering expertise, experience, and key achievements',
    });
  }

  if (paragraph.length > 300) {
    suggestions.push({
      id: 'summary-long',
      type: 'length',
      priority: 'medium',
      message: 'Summary is too long',
      detail: 'Keep it concise - 2-3 sentences (200-300 characters)',
    });
  }

  // Check for first-person pronouns
  if (!/\b(I|my|me)\b/i.test(paragraph)) {
    suggestions.push({
      id: 'summary-voice',
      type: 'clarity',
      priority: 'low',
      message: 'Consider adding personal voice',
      detail: 'Use first-person ("I" or "my") to make it more engaging',
    });
  }

  return suggestions;
}

/**
 * Get all suggestions for a complete resume
 */
export function analyzeResume(blocks: ResumeBlock[]): Map<string, ContentSuggestion[]> {
  const suggestionsByBlock = new Map<string, ContentSuggestion[]>();

  blocks.forEach((block, index) => {
    const blockId = (block as any)._id || `block-${index}`;
    let suggestions: ContentSuggestion[] = [];

    if (block.type === 'experience') {
      const experienceData = block.data as any;
      if (experienceData?.items && Array.isArray(experienceData.items) && experienceData.items.length > 0) {
        suggestions = analyzeExperienceBlock(experienceData.items);
      }
    } else if (block.type === 'skills') {
      const skillsData = block.data as any;
      if (
        skillsData &&
        ((Array.isArray(skillsData.primary) && skillsData.primary.length > 0) ||
          (Array.isArray(skillsData.secondary) && skillsData.secondary.length > 0))
      ) {
        suggestions = analyzeSkillsBlock(
          Array.isArray(skillsData.primary) ? skillsData.primary : [],
          Array.isArray(skillsData.secondary) ? skillsData.secondary : []
        );
      }
    } else if (block.type === 'summary') {
      const summaryData = block.data as any;
      if (summaryData?.paragraph && typeof summaryData.paragraph === 'string' && summaryData.paragraph.trim().length > 0) {
        suggestions = analyzeSummary(summaryData.paragraph);
      }
    }
    // Education, projects, custom blocks can be added later

    if (suggestions.length > 0) {
      suggestionsByBlock.set(blockId, suggestions);
    }
  });

  return suggestionsByBlock;
}

/**
 * Get priority color for UI
 */
export function getSuggestionColor(priority: SuggestionPriority): string {
  switch (priority) {
    case 'high':
      return 'text-red-600 dark:text-red-400';
    case 'medium':
      return 'text-amber-600 dark:text-amber-400';
    case 'low':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * Get priority icon for UI
 */
export function getSuggestionIcon(priority: SuggestionPriority): string {
  switch (priority) {
    case 'high':
      return '⚠️';
    case 'medium':
      return 'ℹ️';
    case 'low':
      return '💡';
    default:
      return 'ℹ️';
  }
}
