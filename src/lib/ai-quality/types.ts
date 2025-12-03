/**
 * AI Quality Center Types
 *
 * Core type definitions for prompt versioning, governance, and evaluation.
 * These types are used across the AI Quality Center feature.
 */

// ============================================================================
// AI TOOLS REGISTRY
// ============================================================================

/**
 * All AI tools in the platform that use prompts.
 * Each tool has a unique ID used for prompt versioning and binding.
 */
export const AI_TOOLS = [
  'resume-generation',
  'resume-analysis',
  'resume-optimization',
  'resume-suggestions',
  'resume-parse',
  'cover-letter-generation',
  'cover-letter-analysis',
  'ai-coach-response',
  'ai-coach-message',
  'career-path-generation',
  'career-path-from-job',
  'career-paths-generation',
  'career-certifications',
  'ai-evaluator',
] as const;

export type AIToolId = (typeof AI_TOOLS)[number];

/**
 * Feature groups for organizing AI tools in the UI
 */
export type FeatureGroup = 'resume' | 'cover-letter' | 'ai-coach' | 'career-path' | 'evaluator';

/**
 * Feature group definitions mapping tools to their groups
 */
export const FEATURE_GROUPS: Record<FeatureGroup, readonly AIToolId[]> = {
  resume: [
    'resume-generation',
    'resume-analysis',
    'resume-optimization',
    'resume-suggestions',
    'resume-parse',
  ],
  'cover-letter': ['cover-letter-generation', 'cover-letter-analysis'],
  'ai-coach': ['ai-coach-response', 'ai-coach-message'],
  'career-path': [
    'career-path-generation',
    'career-path-from-job',
    'career-paths-generation',
    'career-certifications',
  ],
  evaluator: ['ai-evaluator'],
} as const;

/**
 * Configuration for each AI tool
 */
export interface AIToolConfig {
  /** Display name for the tool */
  displayName: string;
  /** Feature group this tool belongs to */
  featureGroup: FeatureGroup;
  /** Default model to use for this tool */
  defaultModel: string;
  /** Inherent risk profile of this tool */
  riskProfile: 'low' | 'medium' | 'high';
  /** API route path (or 'internal' for non-HTTP tools) */
  route: string;
  /** Short description of what the tool does */
  description: string;
}

/**
 * Registry of all AI tools with their configurations
 */
export const AI_TOOL_REGISTRY: Record<AIToolId, AIToolConfig> = {
  'resume-generation': {
    displayName: 'Resume Generation',
    featureGroup: 'resume',
    defaultModel: 'gpt-4o',
    riskProfile: 'medium',
    route: '/api/resumes/generate',
    description: 'Generate tailored resumes from user profile and job description',
  },
  'resume-analysis': {
    displayName: 'Resume Analysis',
    featureGroup: 'resume',
    defaultModel: 'gpt-4o',
    riskProfile: 'low',
    route: '/api/resumes/analyze',
    description: 'Analyze resume quality and provide improvement suggestions',
  },
  'resume-optimization': {
    displayName: 'Resume Optimization',
    featureGroup: 'resume',
    defaultModel: 'gpt-4o',
    riskProfile: 'medium',
    route: '/api/resumes/optimize',
    description: 'Optimize resume content for specific job descriptions',
  },
  'resume-suggestions': {
    displayName: 'Resume Suggestions',
    featureGroup: 'resume',
    defaultModel: 'gpt-4o-mini',
    riskProfile: 'low',
    route: '/api/resumes/suggestions',
    description: 'Generate quick suggestions for resume improvements',
  },
  'resume-parse': {
    displayName: 'Resume Parser',
    featureGroup: 'resume',
    defaultModel: 'gpt-4o-mini',
    riskProfile: 'low',
    route: '/api/resumes/parse',
    description: 'Extract structured data from uploaded resumes',
  },
  'cover-letter-generation': {
    displayName: 'Cover Letter Generation',
    featureGroup: 'cover-letter',
    defaultModel: 'gpt-4o',
    riskProfile: 'medium',
    route: '/api/cover-letters/generate',
    description: 'Generate personalized cover letters',
  },
  'cover-letter-analysis': {
    displayName: 'Cover Letter Analysis',
    featureGroup: 'cover-letter',
    defaultModel: 'gpt-4o-mini',
    riskProfile: 'low',
    route: '/api/cover-letters/analyze',
    description: 'Analyze cover letter quality and relevance',
  },
  'ai-coach-response': {
    displayName: 'AI Coach Response',
    featureGroup: 'ai-coach',
    defaultModel: 'gpt-4o',
    riskProfile: 'high',
    route: '/api/ai-coach/generate-response',
    description: 'Generate career coaching responses',
  },
  'ai-coach-message': {
    displayName: 'AI Coach Message',
    featureGroup: 'ai-coach',
    defaultModel: 'gpt-4o',
    riskProfile: 'high',
    route: '/api/ai-coach/conversations/[id]/messages',
    description: 'Generate conversational AI coach messages',
  },
  'career-path-generation': {
    displayName: 'Career Path Generation',
    featureGroup: 'career-path',
    defaultModel: 'gpt-4o',
    riskProfile: 'medium',
    route: '/api/career-path/generate',
    description: 'Generate personalized career paths',
  },
  'career-path-from-job': {
    displayName: 'Career Path from Job',
    featureGroup: 'career-path',
    defaultModel: 'gpt-4o',
    riskProfile: 'medium',
    route: '/api/career-path/generate-from-job',
    description: 'Generate career path based on target job',
  },
  'career-paths-generation': {
    displayName: 'Career Paths Generation',
    featureGroup: 'career-path',
    defaultModel: 'gpt-4o',
    riskProfile: 'medium',
    route: '/api/career-paths/generate',
    description: 'Generate multiple career path options',
  },
  'career-certifications': {
    displayName: 'Career Certifications',
    featureGroup: 'career-path',
    defaultModel: 'gpt-4o-mini',
    riskProfile: 'low',
    route: '/api/career-certifications',
    description: 'Recommend relevant certifications',
  },
  'ai-evaluator': {
    displayName: 'AI Evaluator',
    featureGroup: 'evaluator',
    defaultModel: 'gpt-4o-mini',
    riskProfile: 'low',
    route: 'internal',
    description: 'Internal tool for evaluating AI outputs',
  },
};

/**
 * Get tools for a specific feature group
 */
export function getToolsForGroup(group: FeatureGroup): AIToolId[] {
  return [...FEATURE_GROUPS[group]];
}

/**
 * Get the feature group for a tool
 */
export function getGroupForTool(toolId: AIToolId): FeatureGroup {
  return AI_TOOL_REGISTRY[toolId].featureGroup;
}

// ============================================================================
// ENVIRONMENTS
// ============================================================================

/**
 * Available deployment environments
 */
export const ENVIRONMENTS = ['dev', 'prod'] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

/**
 * Environment display names
 */
export const ENVIRONMENT_LABELS: Record<Environment, string> = {
  dev: 'Development',
  prod: 'Production',
};

// ============================================================================
// PROMPT VERSIONING
// ============================================================================

/**
 * Types of prompts
 */
export const PROMPT_KINDS = ['system', 'rubric', 'other'] as const;
export type PromptKind = (typeof PROMPT_KINDS)[number];

/**
 * Prompt version statuses
 */
export const PROMPT_STATUSES = [
  'draft',
  'in_review',
  'active',
  'inactive',
  'rolled_back',
  'archived',
] as const;
export type PromptStatus = (typeof PROMPT_STATUSES)[number];

/**
 * Status display labels and colors
 */
export const PROMPT_STATUS_CONFIG: Record<
  PromptStatus,
  { label: string; color: 'gray' | 'yellow' | 'green' | 'red' | 'blue' }
> = {
  draft: { label: 'Draft', color: 'gray' },
  in_review: { label: 'In Review', color: 'yellow' },
  active: { label: 'Active', color: 'green' },
  inactive: { label: 'Inactive', color: 'gray' },
  rolled_back: { label: 'Rolled Back', color: 'red' },
  archived: { label: 'Archived', color: 'gray' },
};

/**
 * Risk levels for prompt changes
 */
export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/**
 * Risk level display configuration
 */
export const RISK_LEVEL_CONFIG: Record<
  RiskLevel,
  { label: string; color: 'green' | 'yellow' | 'red'; description: string }
> = {
  low: {
    label: 'Low',
    color: 'green',
    description: 'Typos, minor clarifications, no behavior change',
  },
  medium: {
    label: 'Medium',
    color: 'yellow',
    description: 'Better examples, structure changes, no new capabilities',
  },
  high: {
    label: 'High',
    color: 'red',
    description: 'Safety rule changes, new capabilities, behavior changes',
  },
};

/**
 * Source types for prompt versions
 */
export const PROMPT_SOURCES = ['git_synced', 'dev_draft'] as const;
export type PromptSource = (typeof PROMPT_SOURCES)[number];

/**
 * Environment scope for prompt versions
 */
export const ENV_SCOPES = ['dev', 'prod', 'any'] as const;
export type EnvScope = (typeof ENV_SCOPES)[number];

// ============================================================================
// GOVERNANCE
// ============================================================================

/**
 * Governance requirements for activating a prompt version
 */
export interface GovernanceRequirements {
  /** Whether a PCR link is required */
  requiresPCR: boolean;
  /** Whether approvals are required */
  requiresApprovals: boolean;
  /** Minimum number of approvals required */
  minApprovals: number;
  /** Whether at least one eval run is required */
  requiresEvalRun: boolean;
}

/**
 * Get governance requirements based on risk level and environment
 */
export function getGovernanceRequirements(
  riskLevel: RiskLevel,
  env: Environment,
): GovernanceRequirements {
  // Dev environment has no governance requirements
  if (env === 'dev') {
    return {
      requiresPCR: false,
      requiresApprovals: false,
      minApprovals: 0,
      requiresEvalRun: false,
    };
  }

  // Prod environment has risk-based requirements
  switch (riskLevel) {
    case 'high':
      return {
        requiresPCR: true,
        requiresApprovals: true,
        minApprovals: 1,
        requiresEvalRun: true,
      };
    case 'medium':
      return {
        requiresPCR: true,
        requiresApprovals: false,
        minApprovals: 0,
        requiresEvalRun: true,
      };
    case 'low':
      return {
        requiresPCR: false,
        requiresApprovals: false,
        minApprovals: 0,
        requiresEvalRun: false,
      };
  }
}

/**
 * Determine risk level based on version change
 */
export function determineRiskFromVersionChange(
  oldMajor: number,
  oldMinor: number,
  newMajor: number,
  newMinor: number,
): RiskLevel {
  if (newMajor > oldMajor) return 'high';
  if (newMinor > oldMinor) return 'medium';
  return 'low';
}

/**
 * Parse semantic version string into components
 */
export function parseVersion(versionString: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const parts = versionString.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

/**
 * Format version components into string
 */
export function formatVersion(major: number, minor: number, patch: number): string {
  return `${major}.${minor}.${patch}`;
}

/**
 * Increment version based on risk level
 */
export function incrementVersion(
  currentVersion: string,
  riskLevel: RiskLevel,
): { major: number; minor: number; patch: number; versionString: string } {
  const { major, minor, patch } = parseVersion(currentVersion);

  let newMajor = major;
  let newMinor = minor;
  let newPatch = patch;

  switch (riskLevel) {
    case 'high':
      newMajor = major + 1;
      newMinor = 0;
      newPatch = 0;
      break;
    case 'medium':
      newMinor = minor + 1;
      newPatch = 0;
      break;
    case 'low':
      newPatch = patch + 1;
      break;
  }

  return {
    major: newMajor,
    minor: newMinor,
    patch: newPatch,
    versionString: formatVersion(newMajor, newMinor, newPatch),
  };
}

// ============================================================================
// PROMPT EVENTS
// ============================================================================

/**
 * Types of events that can occur in the prompt lifecycle
 */
export const PROMPT_EVENT_TYPES = [
  'activation',
  'deactivation',
  'rollback',
  'edit',
  'hotfix',
  'experiment_start',
  'experiment_stop',
  'approval_added',
  'version_created',
  'version_cloned',
  'binding_created',
  'sync_completed',
] as const;
export type PromptEventType = (typeof PROMPT_EVENT_TYPES)[number];

/**
 * Event type display labels
 */
export const PROMPT_EVENT_LABELS: Record<PromptEventType, string> = {
  activation: 'Activated version',
  deactivation: 'Deactivated version',
  rollback: 'Rolled back version',
  edit: 'Edited version',
  hotfix: 'Applied hotfix',
  experiment_start: 'Started experiment',
  experiment_stop: 'Stopped experiment',
  approval_added: 'Added approval',
  version_created: 'Created version',
  version_cloned: 'Cloned version',
  binding_created: 'Created binding',
  sync_completed: 'Completed sync',
};

// ============================================================================
// EVAL TYPES
// ============================================================================

/**
 * Eval run statuses
 */
export const EVAL_RUN_STATUSES = ['pending', 'running', 'success', 'error'] as const;
export type EvalRunStatus = (typeof EVAL_RUN_STATUSES)[number];

/**
 * Feedback ratings for eval runs
 */
export const FEEDBACK_RATINGS = ['good', 'bad', 'neutral'] as const;
export type FeedbackRating = (typeof FEEDBACK_RATINGS)[number];

/**
 * Common feedback tags
 */
export const FEEDBACK_TAGS = [
  'too_generic',
  'too_wordy',
  'hallucination',
  'missed_risk',
  'great_coaching',
  'factually_incorrect',
  'off_topic',
  'inappropriate_tone',
  'excellent_quality',
] as const;
export type FeedbackTag = (typeof FEEDBACK_TAGS)[number];

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Get the badge color for a risk level
 */
export function getRiskBadgeColor(riskLevel: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };
  return colors[riskLevel];
}

/**
 * Get the badge color for a status
 */
export function getStatusBadgeColor(status: PromptStatus): string {
  const colors: Record<PromptStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    in_review: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-600',
    rolled_back: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-500',
  };
  return colors[status];
}

/**
 * Get the badge color for an environment
 */
export function getEnvBadgeColor(env: Environment): string {
  const colors: Record<Environment, string> = {
    dev: 'bg-blue-100 text-blue-800',
    prod: 'bg-purple-100 text-purple-800',
  };
  return colors[env];
}
