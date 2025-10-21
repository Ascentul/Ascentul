/**
 * Phase 6: Local Document Analyzer
 *
 * Analyzes resume content to provide per-section metrics:
 * - Token counts (approximation using word count * 1.3)
 * - Sentence counts
 * - Estimated reading time
 * - Jargon flags (domain-specific terminology without context)
 * - Missing metrics flags (bullets without numbers)
 * - Passive voice flags (weak construction patterns)
 *
 * All analysis is deterministic and local - no network calls.
 */

import type { EditorSnapshot, BlockId } from '../editor/types/editorTypes';

/**
 * Analysis thresholds for stable test assertions
 */
export const ANALYSIS_THRESHOLDS = {
  summary: {
    minSentences: 2,
    maxSentences: 4,
    maxTokens: 100,
  },
  experience: {
    minBullets: 3,
    maxBullets: 6,
    maxBulletTokens: 40,
  },
  skills: {
    minSkills: 5,
    maxSkills: 15,
  },
  passiveVoiceLimit: 0.2, // 20% threshold
  jargonLimit: 0.3, // 30% threshold
} as const;

/**
 * Passive voice patterns (simple heuristics)
 */
const PASSIVE_VOICE_PATTERNS = [
  /\b(was|were|is|are|been|being)\s+(being\s+)?\w+ed\b/i,
  /\b(was|were|is|are)\s+(being\s+)?\w+en\b/i,
  /\bresponsible for\b/i,
  /\btasked with\b/i,
  /\binvolved in\b/i,
];

/**
 * Jargon patterns (terms needing context)
 */
const JARGON_TERMS = new Set([
  'synergy', 'leverage', 'paradigm', 'holistic', 'ecosystem',
  'bandwidth', 'circle back', 'touch base', 'move the needle',
  'low-hanging fruit', 'win-win', 'game-changer', 'disruptive',
]);

/**
 * Metrics patterns (numbers, percentages, time)
 */
const METRICS_PATTERNS = [
  /%/,
  /\$[\d,]+/,
  /\d+x/i,
  /\d+k\+/i,
  /\d+\s*(hours?|days?|weeks?|months?|years?)/i,
  /\d+\s*(users?|customers?|clients?)/i,
];

/**
 * Per-section analysis result
 */
export interface SectionAnalysis {
  blockId: BlockId;
  blockType: string;
  tokenCount: number;
  sentenceCount: number;
  readingTimeSeconds: number;
  passiveVoiceCount: number;
  passiveVoiceRatio: number;
  jargonCount: number;
  jargonRatio: number;
  missingMetricsCount: number;
  missingMetricsRatio: number;
  flags: AnalysisFlag[];
}

export interface AnalysisFlag {
  type: 'passive-voice' | 'jargon' | 'missing-metrics' | 'too-long' | 'too-short';
  severity: 'high' | 'medium' | 'low';
  message: string;
}

/**
 * Document-wide analysis result
 */
export interface DocumentAnalysis {
  sections: SectionAnalysis[];
  totalTokens: number;
  totalReadingTimeSeconds: number;
  overallFlags: AnalysisFlag[];
}

/**
 * Approximate token count (words * 1.3 for typical English)
 */
function countTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return Math.ceil(words.length * 1.3);
}

/**
 * Count sentences (split on .!? followed by space or end)
 */
function countSentences(text: string): number {
  const sentences = text
    .split(/[.!?]+(?:\s|$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  return sentences.length;
}

/**
 * Estimate reading time (200 words per minute)
 */
function estimateReadingTime(tokens: number): number {
  const words = Math.floor(tokens / 1.3);
  const minutes = words / 200;
  return Math.ceil(minutes * 60); // seconds
}

/**
 * Detect passive voice patterns
 */
function detectPassiveVoice(text: string): number {
  let count = 0;
  for (const pattern of PASSIVE_VOICE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
}

/**
 * Detect jargon terms
 */
function detectJargon(text: string): number {
  const lowerText = text.toLowerCase();
  let count = 0;
  for (const term of JARGON_TERMS) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

/**
 * Check if text contains metrics
 */
function hasMetrics(text: string): boolean {
  return METRICS_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Analyze a block of text
 */
function analyzeText(text: string): {
  tokens: number;
  sentences: number;
  passiveVoice: number;
  jargon: number;
} {
  return {
    tokens: countTokens(text),
    sentences: countSentences(text),
    passiveVoice: detectPassiveVoice(text),
    jargon: detectJargon(text),
  };
}

/**
 * Analyze a single section/block
 */
function analyzeSection(blockId: BlockId, blockType: string, block: any): SectionAnalysis {
  let combinedText = '';
  let bulletCount = 0;
  let bulletsWithoutMetrics = 0;

  // Extract text based on block type
  if (blockType === 'summary' && block.props?.paragraph) {
    combinedText = block.props.paragraph;
  } else if (blockType === 'experience' && Array.isArray(block.props?.items)) {
    for (const item of block.props.items) {
      if (item.bullets && Array.isArray(item.bullets)) {
        for (const bullet of item.bullets) {
          combinedText += bullet + ' ';
          bulletCount++;
          if (!hasMetrics(bullet)) {
            bulletsWithoutMetrics++;
          }
        }
      }
    }
  } else if (blockType === 'skills') {
    const primary = block.props.primary || [];
    const secondary = block.props.secondary || [];
    combinedText = [...primary, ...secondary].join(', ');
  } else if (blockType === 'education' && Array.isArray(block.props.items)) {
    for (const item of block.props.items) {
      combinedText += `${item.degree || ''} ${item.school || ''} ${item.details || ''} `;
    }
  }

  const analysis = analyzeText(combinedText);
  const readingTime = estimateReadingTime(analysis.tokens);

  const sentenceCount = Math.max(analysis.sentences, 1);
  const passiveVoiceRatio = analysis.passiveVoice / sentenceCount;
  const jargonRatio = analysis.jargon / sentenceCount;
  const missingMetricsRatio = bulletCount > 0 ? bulletsWithoutMetrics / bulletCount : 0;

  // Generate flags
  const flags: AnalysisFlag[] = [];

  if (blockType === 'summary') {
    if (analysis.sentences < ANALYSIS_THRESHOLDS.summary.minSentences) {
      flags.push({
        type: 'too-short',
        severity: 'medium',
        message: `Summary has only ${analysis.sentences} sentence(s). Aim for ${ANALYSIS_THRESHOLDS.summary.minSentences}-${ANALYSIS_THRESHOLDS.summary.maxSentences}.`,
      });
    }
    if (analysis.tokens > ANALYSIS_THRESHOLDS.summary.maxTokens) {
      flags.push({
        type: 'too-long',
        severity: 'medium',
        message: `Summary is too long (${analysis.tokens} tokens). Keep under ${ANALYSIS_THRESHOLDS.summary.maxTokens}.`,
      });
    }
  }

  if (blockType === 'experience' && bulletCount > 0) {
    if (bulletCount < ANALYSIS_THRESHOLDS.experience.minBullets) {
      flags.push({
        type: 'too-short',
        severity: 'low',
        message: `Only ${bulletCount} bullets. Aim for ${ANALYSIS_THRESHOLDS.experience.minBullets}-${ANALYSIS_THRESHOLDS.experience.maxBullets} per role.`,
      });
    }
  }

  if (passiveVoiceRatio > ANALYSIS_THRESHOLDS.passiveVoiceLimit) {
    flags.push({
      type: 'passive-voice',
      severity: 'high',
      message: `${Math.round(passiveVoiceRatio * 100)}% passive voice detected. Use active voice for stronger impact.`,
    });
  }

  if (jargonRatio > ANALYSIS_THRESHOLDS.jargonLimit) {
    flags.push({
      type: 'jargon',
      severity: 'medium',
      message: `${Math.round(jargonRatio * 100)}% jargon detected. Use concrete, specific terms.`,
    });
  }

  if (missingMetricsRatio > 0.5 && bulletCount > 0) {
    flags.push({
      type: 'missing-metrics',
      severity: 'high',
      message: `${bulletsWithoutMetrics}/${bulletCount} bullets lack metrics. Add numbers, percentages, or time saved.`,
    });
  }

  return {
    blockId,
    blockType,
    tokenCount: analysis.tokens,
    sentenceCount: analysis.sentences,
    readingTimeSeconds: readingTime,
    passiveVoiceCount: analysis.passiveVoice,
    passiveVoiceRatio,
    jargonCount: analysis.jargon,
    jargonRatio,
    missingMetricsCount: bulletsWithoutMetrics,
    missingMetricsRatio,
    flags,
  };
}

/**
 * Analyze entire document from EditorSnapshot
 *
 * @param snapshot - Current editor state
 * @returns Document analysis with per-section metrics and flags
 */
export function analyzeDocument(snapshot: EditorSnapshot): DocumentAnalysis {
  const sections: SectionAnalysis[] = [];
  let totalTokens = 0;
  let totalReadingTime = 0;

  // Analyze each block
  for (const blockId of Object.keys(snapshot.blocksById)) {
    const block = snapshot.blocksById[blockId];
    if (!block) continue;

    const blockType = block.type;

    // Only analyze content blocks
    if (['summary', 'experience', 'skills', 'education'].includes(blockType)) {
      const sectionAnalysis = analyzeSection(blockId, blockType, block);
      sections.push(sectionAnalysis);
      totalTokens += sectionAnalysis.tokenCount;
      totalReadingTime += sectionAnalysis.readingTimeSeconds;
    }
  }

  // Generate overall flags
  const overallFlags: AnalysisFlag[] = [];

  if (totalTokens > 800) {
    overallFlags.push({
      type: 'too-long',
      severity: 'medium',
      message: `Resume is ${totalTokens} tokens. Consider keeping under 800 tokens for readability.`,
    });
  }

  return {
    sections,
    totalTokens,
    totalReadingTimeSeconds: totalReadingTime,
    overallFlags,
  };
}
