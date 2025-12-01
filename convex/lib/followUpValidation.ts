/**
 * Follow-up Relationship Validation
 *
 * This module provides validation for the dual-field pattern used in the follow_ups table.
 * The table uses both generic (related_type/related_id) and typed (application_id/contact_id)
 * fields for flexibility and referential integrity.
 *
 * DUAL-FIELD PATTERN:
 * - Generic fields (related_type, related_id): Flexible cross-entity queries
 * - Typed fields (application_id, contact_id): Convex referential integrity
 *
 * Validators ensure consistency between these fields to prevent:
 * - Setting related_type='application' without application_id
 * - Setting application_id without related_type='application'
 * - Mismatches between related_id and typed field values
 */

import { Id } from '../_generated/dataModel';

/**
 * Relationship types supported by follow_ups
 */
export type FollowUpRelatedType = 'application' | 'contact' | 'session' | 'review' | 'general';

/**
 * Input data for relationship validation
 */
export interface FollowUpRelationshipInput {
  related_type?: FollowUpRelatedType;
  related_id?: string;
  application_id?: Id<'applications'>;
  contact_id?: Id<'networking_contacts'>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Validates consistency between generic and typed relationship fields in follow_ups.
 *
 * Rules:
 * 1. If related_type='application', application_id must be set
 * 2. If related_type='contact', contact_id must be set
 * 3. If application_id is set, related_type must be 'application'
 * 4. If contact_id is set, related_type must be 'contact'
 * 5. related_id should match the typed field value when both are set
 * 6. related_type='session', 'review', 'general' don't require typed fields (not supported yet)
 *
 * @param data - The relationship fields to validate
 * @returns Validation result with error message if invalid
 */
export function validateFollowUpRelationship(data: FollowUpRelationshipInput): ValidationResult {
  const warnings: string[] = [];

  // Rule 1: application related_type requires application_id
  if (data.related_type === 'application' && !data.application_id) {
    return {
      valid: false,
      error:
        "application_id is required when related_type='application'. Both generic and typed fields must be set for consistency.",
    };
  }

  // Rule 2: contact related_type requires contact_id
  if (data.related_type === 'contact' && !data.contact_id) {
    return {
      valid: false,
      error:
        "contact_id is required when related_type='contact'. Both generic and typed fields must be set for consistency.",
    };
  }

  // Rule 3: application_id requires related_type='application'
  if (data.application_id && data.related_type !== 'application') {
    return {
      valid: false,
      error: `related_type must be 'application' when application_id is set. Got: '${data.related_type ?? 'undefined'}'`,
    };
  }

  // Rule 4: contact_id requires related_type='contact'
  if (data.contact_id && data.related_type !== 'contact') {
    return {
      valid: false,
      error: `related_type must be 'contact' when contact_id is set. Got: '${data.related_type ?? 'undefined'}'`,
    };
  }

  // Rule 5: Verify related_id matches typed field (if both are set)
  if (data.related_type === 'application' && data.related_id && data.application_id) {
    if (data.related_id !== data.application_id) {
      return {
        valid: false,
        error: `related_id ('${data.related_id}') does not match application_id ('${data.application_id}'). These must be identical.`,
      };
    }
  }

  if (data.related_type === 'contact' && data.related_id && data.contact_id) {
    if (data.related_id !== data.contact_id) {
      return {
        valid: false,
        error: `related_id ('${data.related_id}') does not match contact_id ('${data.contact_id}'). These must be identical.`,
      };
    }
  }

  // Rule 6: Warn if related_type is set but related_id is missing (non-critical)
  if (data.related_type && !data.related_id) {
    warnings.push(
      `related_id is not set but related_type='${data.related_type}'. ` +
        `Consider setting related_id for composite index queries.`,
    );
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validates and throws if relationship fields are inconsistent.
 * Use this in mutations before inserting/updating follow_ups.
 *
 * @param data - The relationship fields to validate
 * @throws Error if validation fails
 */
export function assertFollowUpRelationshipValid(data: FollowUpRelationshipInput): void {
  const result = validateFollowUpRelationship(data);
  if (!result.valid) {
    throw new Error(`Invalid follow-up relationship: ${result.error}`);
  }
  // Log warnings but don't fail (for debugging)
  if (result.warnings?.length) {
    console.warn('[follow_ups validation]', result.warnings.join('; '));
  }
}

/**
 * Helper to build consistent relationship fields for application-related follow-ups.
 * Use this when creating follow-ups linked to applications.
 *
 * @param applicationId - The application ID
 * @returns Object with all required relationship fields set consistently
 */
export function buildApplicationRelationship(applicationId: Id<'applications'>) {
  return {
    related_type: 'application' as const,
    related_id: applicationId as string,
    application_id: applicationId,
  };
}

/**
 * Helper to build consistent relationship fields for contact-related follow-ups.
 * Use this when creating follow-ups linked to networking contacts.
 *
 * @param contactId - The networking contact ID
 * @returns Object with all required relationship fields set consistently
 */
export function buildContactRelationship(contactId: Id<'networking_contacts'>) {
  return {
    related_type: 'contact' as const,
    related_id: contactId as string,
    contact_id: contactId,
  };
}

/**
 * Helper to build relationship fields for session/review/general follow-ups.
 * These types don't have typed ID fields yet.
 *
 * @param relatedType - The type ('session', 'review', or 'general')
 * @param relatedId - Optional ID string for the related entity
 * @returns Object with generic relationship fields set
 */
export function buildGenericRelationship(
  relatedType: 'session' | 'review' | 'general',
  relatedId?: string,
) {
  return {
    related_type: relatedType,
    related_id: relatedId,
  };
}
