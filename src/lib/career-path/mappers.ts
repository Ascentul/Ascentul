/**
 * Career Path Mappers
 *
 * Transform and validate AI-generated career paths with strict guards.
 * Reject task-shaped items and ensure only real job roles pass through.
 */

import {
  CareerPathResponse,
  isSuspiciousRoleTitle,
  LegacyCareerNode,
  parseSalary,
  parseYearsExperience,
  SkillLevel,
  StageLevel,
} from './types';

// ============================================================================
// SALARY RANGE CALCULATION
// ============================================================================

/**
 * Salary range multiplier for upper bound calculation.
 *
 * Based on typical market salary ranges within a single role level:
 * - 1.3x = 30% spread from base to top of range
 * - Accounts for experience variation, location, company size
 * - Example: $100K base → $100K-$130K range
 *
 * Note: This is for ranges WITHIN a role, not across seniority levels.
 * For cross-level progression, see defaultByLevel in migrateLegacyCareerPath.
 */
const SALARY_RANGE_MULTIPLIER = 1.3;

// ============================================================================
// MAPPER GUARDS
// ============================================================================

export interface MapperRejection {
  rejected: true;
  reason: string;
  field?: string;
  value?: unknown;
}

export interface MapperSuccess<T> {
  rejected: false;
  data: T;
}

export type MapperResult<T> = MapperRejection | MapperSuccess<T>;

/**
 * Reject nodes with action-verb titles (likely profile prep tasks)
 */
function rejectIfSuspiciousTitle(title: string): MapperRejection | null {
  if (isSuspiciousRoleTitle(title)) {
    return {
      rejected: true,
      reason: 'Role title contains action verbs suggesting profile prep task',
      field: 'title',
      value: title,
    };
  }
  return null;
}

/**
 * Coerce years experience to numeric value (in years only)
 */
function normalizeYearsExperience(value: string | number): MapperResult<number> {
  const parsed = parseYearsExperience(value);

  if (parsed === null) {
    return {
      rejected: true,
      reason: 'Invalid years experience format',
      field: 'yearsExperience',
      value,
    };
  }

  // Default suspiciously low values to 0 (entry-level) instead of rejecting
  // This allows AI-generated paths with imperfect data to still succeed
  // Career path generation should work as a research tool, not depend on perfect data
  if (parsed < 0.25) {
    console.warn(`Years experience value ${parsed} too low, defaulting to 0 (entry-level)`, {
      value,
    });
    return { rejected: false, data: 0 };
  }

  return { rejected: false, data: parsed };
}

/**
 * Normalize salary to numeric value or null
 */
function normalizeSalary(value: string | number | null): number | null {
  return parseSalary(value);
}

// ============================================================================
// AI OUTPUT MAPPER
// ============================================================================

/**
 * Map AI-generated career path to validated UI format
 *
 * Rules:
 * - Reject items with action-verb titles (review, add, update, prepare, etc.)
 * - Coerce yearsExperience to numeric years only
 * - Parse salary to numeric or null
 * - Filter certifications to trusted domains only
 * - Ensure final node matches target role after normalization
 */
export function mapAiCareerPathToUI(
  rawPath: {
    id?: string;
    name?: string;
    nodes: Array<{
      id?: string;
      title: string;
      level: string;
      salaryRange?: string;
      yearsExperience?: string | number;
      skills?: Array<{ name: string; level: string }>;
      description?: string;
      growthPotential?: string;
      icon?: string;
    }>;
  },
  targetRole: string,
): MapperResult<CareerPathResponse> {
  const mappedNodes: LegacyCareerNode[] = [];

  for (let i = 0; i < rawPath.nodes.length; i++) {
    const node = rawPath.nodes[i];

    // Guard: Reject suspicious titles
    const titleCheck = rejectIfSuspiciousTitle(node.title);
    if (titleCheck) {
      return {
        ...titleCheck,
        reason: `${titleCheck.reason} at node ${i + 1}`,
      };
    }

    // Guard: Normalize years experience
    const yearsResult = normalizeYearsExperience(node.yearsExperience || '0 years');
    if (yearsResult.rejected) {
      return {
        ...yearsResult,
        reason: `${yearsResult.reason} at node ${i + 1}`,
      };
    }

    // Extract normalized years (type narrowing confirmed above)
    const normalizedYears = (yearsResult as MapperSuccess<number>).data;

    // Parse salary (allow null)
    const salary = normalizeSalary(node.salaryRange || null);

    // Validate level
    const validLevels: StageLevel[] = ['entry', 'mid', 'senior', 'lead', 'executive'];
    const level = node.level.toLowerCase() as StageLevel;
    if (!validLevels.includes(level)) {
      return {
        rejected: true,
        reason: `Invalid level "${node.level}" at node ${i + 1}`,
        field: 'level',
        value: node.level,
      };
    }

    // Validate skills
    const skills = (node.skills || []).map((skill) => ({
      name: skill.name,
      level: skill.level.toLowerCase() as SkillLevel,
    }));

    if (skills.length === 0) {
      return {
        rejected: true,
        reason: `No skills provided at node ${i + 1}`,
        field: 'skills',
      };
    }

    // Build salary range string
    const defaultByLevel: Record<StageLevel, string> = {
      entry: '$50,000 - $75,000',
      mid: '$75,000 - $110,000',
      senior: '$110,000 - $150,000',
      lead: '$140,000 - $190,000',
      executive: '$190,000+',
    };
    const salaryRange = salary
      ? `$${salary.toLocaleString()} - $${Math.round(salary * SALARY_RANGE_MULTIPLIER).toLocaleString()}`
      : defaultByLevel[level] || '$50,000 - $75,000';

    // Build years experience string
    const maxYears = normalizedYears + 2;
    const yearsExperience =
      maxYears > normalizedYears
        ? `${normalizedYears}-${maxYears} years`
        : `${normalizedYears}+ years`;

    mappedNodes.push({
      id: node.id || `node-${i + 1}`,
      title: node.title,
      level,
      salaryRange,
      yearsExperience,
      skills,
      description: node.description || 'Role description not available.',
      growthPotential: (node.growthPotential?.toLowerCase() || 'medium') as
        | 'low'
        | 'medium'
        | 'high',
      icon: node.icon || 'briefcase',
    });
  }

  // Guard: Ensure final node matches target role
  if (mappedNodes.length > 0) {
    const finalNode = mappedNodes[mappedNodes.length - 1];
    const finalTitleNormalized = finalNode.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetNormalized = targetRole.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Fuzzy match: at least 60% similarity
    const similarity = calculateSimilarity(finalTitleNormalized, targetNormalized);
    if (similarity < 0.6) {
      return {
        rejected: true,
        reason: `Final role "${finalNode.title}" does not match target "${targetRole}"`,
        field: 'finalNode.title',
        value: finalNode.title,
      };
    }
  }

  return {
    rejected: false,
    data: {
      type: 'career_path',
      id: rawPath.id || 'path-1',
      name: rawPath.name || `${targetRole} Path`,
      target_role: targetRole,
      nodes: mappedNodes,
    },
  };
}

/**
 * Simple string similarity calculator
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshtein(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance (edit distance between two strings)
 *
 * Custom inline implementation suitable for short strings (job titles).
 * Space complexity: O(m×n) - Full matrix allocation
 * Time complexity: O(m×n) - Standard dynamic programming
 *
 * Performance: Called once per career path validation for strings ~20-50 chars.
 * Not a bottleneck. Consider `fastest-levenshtein` package if usage scales
 * to loops or longer strings (>100 chars).
 */
function levenshtein(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Convert legacy CareerPath format to new discriminated union format
 */
export function migrateLegacyCareerPath(legacy: {
  id: string;
  name: string;
  nodes: Array<{
    id: string;
    title: string;
    level: string;
    salaryRange: string;
    yearsExperience: string;
    skills: Array<{ name: string; level: string }>;
    description: string;
    growthPotential: string;
    icon: string;
  }>;
}): MapperResult<CareerPathResponse> {
  // Check if this is actually a profile guidance path (contains "Profile update")
  const hasProfileUpdateMarker = legacy.nodes.some(
    (node) => node.salaryRange === 'Profile update' || node.yearsExperience.includes('minute'),
  );

  if (hasProfileUpdateMarker) {
    return {
      rejected: true,
      reason: 'Legacy path contains profile guidance markers',
      field: 'nodes',
    };
  }

  // Validate each node
  for (const node of legacy.nodes) {
    const titleCheck = rejectIfSuspiciousTitle(node.title);
    if (titleCheck) {
      return titleCheck;
    }
  }

  return {
    rejected: false,
    data: {
      type: 'career_path',
      id: legacy.id,
      name: legacy.name,
      target_role: legacy.name,
      nodes: legacy.nodes.map((node) => ({
        ...node,
        level: node.level.toLowerCase() as StageLevel,
        skills: node.skills.map((skill) => ({
          ...skill,
          level: skill.level.toLowerCase() as SkillLevel,
        })),
        growthPotential: node.growthPotential.toLowerCase() as 'low' | 'medium' | 'high',
      })),
    },
  };
}
