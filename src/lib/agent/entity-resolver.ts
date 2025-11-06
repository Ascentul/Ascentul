/**
 * Universal Entity Resolution System
 *
 * Resolves user-provided identifiers (names, descriptions) to Convex IDs
 * across all entity types (goals, applications, contacts, projects, etc.)
 *
 * Features:
 * - Fuzzy matching with phrase removal
 * - Multi-field search
 * - Automatic clarification prompt generation
 * - Confidence scoring
 */

import { Id } from '../../../convex/_generated/dataModel'

// Re-export from route.ts for consistency
function normalizeLabel(value: string, removePhrases: string[] = []) {
  if (!value) return ''
  let normalized = value.toLowerCase()
  for (const phrase of removePhrases) {
    normalized = normalized.replace(new RegExp(phrase, 'gi'), ' ')
  }
  return normalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function findMatchingRecords<T extends Record<string, unknown>>({
  rawIdentifier,
  items,
  fields,
  removePhrases = [],
}: {
  rawIdentifier: string
  items: T[]
  fields: (keyof T)[]
  removePhrases?: string[]
}) {
  const normalizedQuery = normalizeLabel(rawIdentifier, removePhrases)
  const fallbackQuery = rawIdentifier.trim().toLowerCase()
  const queryTokens = normalizedQuery.split(' ').filter(Boolean)

  return items.filter((item) => {
    const candidateRaw = fields
      .map((field) => (item[field] ? String(item[field]) : ''))
      .filter(Boolean)
      .join(' ')

    if (!candidateRaw) return false

    const normalizedCandidate = normalizeLabel(candidateRaw, removePhrases)
    const candidateLower = candidateRaw.toLowerCase()

    if (normalizedCandidate && normalizedCandidate.includes(normalizedQuery)) {
      return true
    }

    if (queryTokens.length > 0 && queryTokens.every((token) => normalizedCandidate.includes(token))) {
      return true
    }

    if (fallbackQuery && candidateLower.includes(fallbackQuery)) {
      return true
    }

    return false
  })
}

// ============================================================================
// Entity Type Configurations
// ============================================================================

type EntityType =
  | 'goal'
  | 'application'
  | 'contact'
  | 'project'
  | 'cover_letter'
  | 'resume'
  | 'interview_stage'
  | 'followup'

interface EntityConfig {
  searchFields: string[]
  removePhrases: string[]
  displayFields: string[]
  idField: string
}

const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
  goal: {
    searchFields: ['title', 'description'],
    removePhrases: ['goal'],
    displayFields: ['title'],
    idField: '_id',
  },
  application: {
    searchFields: ['company', 'jobTitle', 'job_title'],
    removePhrases: ['application', 'job', 'position'],
    displayFields: ['company', 'jobTitle', 'job_title'],
    idField: '_id',
  },
  contact: {
    searchFields: ['name', 'company', 'position'],
    removePhrases: ['contact'],
    displayFields: ['name', 'company', 'position'],
    idField: '_id',
  },
  project: {
    searchFields: ['title', 'description'],
    removePhrases: ['project'],
    displayFields: ['title', 'company'],
    idField: '_id',
  },
  cover_letter: {
    searchFields: ['name', 'job_title', 'company_name'],
    removePhrases: ['cover letter', 'draft'],
    displayFields: ['name', 'job_title', 'company_name'],
    idField: '_id',
  },
  resume: {
    searchFields: ['title'],
    removePhrases: ['resume'],
    displayFields: ['title'],
    idField: '_id',
  },
  interview_stage: {
    searchFields: ['title', 'location'],
    removePhrases: ['interview', 'stage'],
    displayFields: ['title', 'scheduled_at'],
    idField: '_id',
  },
  followup: {
    searchFields: ['description', 'type'],
    removePhrases: ['follow-up', 'followup', 'task'],
    displayFields: ['description', 'due_date'],
    idField: '_id',
  },
}

// ============================================================================
// Resolution Results
// ============================================================================

export interface EntityResolutionResult<T = any> {
  // Success case - exactly one match found
  success: true
  id: string
  entity: T
  displayName: string
}

export interface EntityResolutionError {
  // Error cases
  success: false
  error: 'not_found' | 'multiple_matches' | 'invalid_identifier'
  message: string
  clarificationPrompt?: string
  matches?: Array<{
    id: string
    displayName: string
  }>
}

export type EntityResolution<T = any> = EntityResolutionResult<T> | EntityResolutionError

// ============================================================================
// Core Resolution Function
// ============================================================================

/**
 * Resolve a user-provided identifier to a specific entity
 *
 * @param identifier - User's description/name of the entity
 * @param entities - Array of entities to search
 * @param entityType - Type of entity being resolved
 * @returns Resolution result with ID or error with clarification prompt
 */
export function resolveEntity<T extends Record<string, any>>(
  identifier: string | undefined,
  entities: T[],
  entityType: EntityType
): EntityResolution<T> {
  // Handle missing identifier
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    return {
      success: false,
      error: 'invalid_identifier',
      message: `No ${entityType} identifier provided. Please specify which ${entityType} you want to work with.`,
    }
  }

  // Handle empty entity list
  if (!entities || entities.length === 0) {
    return {
      success: false,
      error: 'not_found',
      message: `No ${entityType}s found. Use get_user_snapshot to see available ${entityType}s.`,
    }
  }

  const config = ENTITY_CONFIGS[entityType]
  if (!config) {
    return {
      success: false,
      error: 'invalid_identifier',
      message: `Unknown entity type: ${entityType}`,
    }
  }

  // Check if identifier looks like a Convex ID (16-32 alphanumeric chars)
  const CONVEX_ID_REGEX = /^[a-z0-9]{16,32}$/
  const looksLikeId = CONVEX_ID_REGEX.test(identifier)

  if (looksLikeId) {
    const match = entities.find((entity) => entity[config.idField] === identifier)
    if (match) {
      return {
        success: true,
        id: match[config.idField] as string,
        entity: match,
        displayName: formatDisplayName(match, config.displayFields),
      }
    }
    // If it looks like an ID but doesn't match, fall through to fuzzy search
  }

  // Perform fuzzy search
  const matches = findMatchingRecords({
    rawIdentifier: identifier,
    items: entities,
    fields: config.searchFields as (keyof T)[],
    removePhrases: config.removePhrases,
  })

  // No matches found
  if (matches.length === 0) {
    // Generate helpful suggestion with available entities
    const availableList = entities
      .slice(0, 5)
      .map((e) => `- ${formatDisplayName(e, config.displayFields)}`)
      .join('\n')
    const more = entities.length > 5 ? `\n... and ${entities.length - 5} more` : ''

    return {
      success: false,
      error: 'not_found',
      message: `I couldn't find a ${entityType} matching "${identifier}".`,
      clarificationPrompt: `Available ${entityType}s:\n${availableList}${more}\n\nPlease specify which one you'd like to work with.`,
    }
  }

  // Exactly one match - success!
  if (matches.length === 1) {
    const match = matches[0]
    return {
      success: true,
      id: match[config.idField] as string,
      entity: match,
      displayName: formatDisplayName(match, config.displayFields),
    }
  }

  // Multiple matches - need clarification
  const matchList = matches
    .map((m, idx) => `${idx + 1}. ${formatDisplayName(m, config.displayFields)}`)
    .join('\n')

  return {
    success: false,
    error: 'multiple_matches',
    message: `Multiple ${entityType}s match "${identifier}".`,
    clarificationPrompt: `I found ${matches.length} ${entityType}s matching "${identifier}":\n\n${matchList}\n\nPlease specify which one you'd like to work with by providing more details.`,
    matches: matches.map((m) => ({
      id: m[config.idField] as string,
      displayName: formatDisplayName(m, config.displayFields),
    })),
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format entity display name from configured fields
 */
function formatDisplayName(entity: Record<string, any>, fields: string[]): string {
  const parts = fields
    .map((field) => {
      const value = entity[field]
      // Handle dates
      if (field.includes('date') && typeof value === 'number') {
        return new Date(value).toLocaleDateString()
      }
      // Handle scheduled_at
      if (field === 'scheduled_at' && typeof value === 'number') {
        return `scheduled for ${new Date(value).toLocaleDateString()}`
      }
      return value ? String(value) : null
    })
    .filter(Boolean)

  return parts.join(' - ') || 'Unnamed'
}

/**
 * Convenience wrappers for common entity types
 */

export function resolveGoal(
  identifier: string | undefined,
  goals: any[]
): EntityResolution {
  return resolveEntity(identifier, goals, 'goal')
}

export function resolveApplication(
  identifier: string | undefined,
  applications: any[]
): EntityResolution {
  return resolveEntity(identifier, applications, 'application')
}

export function resolveContact(
  identifier: string | undefined,
  contacts: any[]
): EntityResolution {
  return resolveEntity(identifier, contacts, 'contact')
}

export function resolveProject(
  identifier: string | undefined,
  projects: any[]
): EntityResolution {
  return resolveEntity(identifier, projects, 'project')
}

export function resolveCoverLetter(
  identifier: string | undefined,
  coverLetters: any[]
): EntityResolution {
  return resolveEntity(identifier, coverLetters, 'cover_letter')
}

export function resolveResume(
  identifier: string | undefined,
  resumes: any[]
): EntityResolution {
  return resolveEntity(identifier, resumes, 'resume')
}

export function resolveInterviewStage(
  identifier: string | undefined,
  interviewStages: any[]
): EntityResolution {
  return resolveEntity(identifier, interviewStages, 'interview_stage')
}

export function resolveFollowup(
  identifier: string | undefined,
  followups: any[]
): EntityResolution {
  return resolveEntity(identifier, followups, 'followup')
}
