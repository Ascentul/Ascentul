/**
 * Profile-to-Resume Mapper
 *
 * Maps a CareerProfileDTO to a ResumeDocument with full field coverage and fallbacks.
 *
 * MAPPING RULES:
 * 1. fullName → header.data.fullName (placeholder: "Full Name" if empty)
 * 2. title → header.data.title (optional)
 * 3. email → header.data.contact.email (validated, placeholder if invalid)
 * 4. phone → header.data.contact.phone (normalized for display, E.164 in metadata if present)
 * 5. location → header.data.contact.location
 * 6. links → header.data.contact.links (validated URLs, invalid rendered as text chips)
 * 7. bio → summary.data.paragraph (placeholder if empty, styled with text-gray-500 italic)
 * 8. skills → skills.data.{primary,secondary} (always included, placeholder if empty)
 * 9. experience[] → experience.data.items (skipped if empty array)
 * 10. education[] → education.data.items (skipped if empty array)
 * 11. projects[] → projects.data.items (skipped if empty array)
 *
 * BLOCK ORDERING:
 * - Header: order 0 (always first)
 * - Summary: order 1 (if bio exists)
 * - Experience: order 2 (if items.length > 0)
 * - Skills: order 3 (always included)
 * - Education: order 4 (if items.length > 0)
 * - Projects: order 5 (if items.length > 0)
 *
 * PHONE NORMALIZATION:
 * - Input: E.164 format (e.g., +14155551234)
 * - Output: Display format based on country code
 *   - US: (415) 555-1234
 *   - UK: +44 20 1234 5678
 *   - Fallback: Display as-is if format unknown
 * - Metadata: Store original E.164 in phoneE164 (custom extension)
 *
 * LINK VALIDATION:
 * - Use URL constructor to validate
 * - Invalid URLs: Filter out, log warning only if NEXT_PUBLIC_DEBUG_UI=true
 * - Valid URLs: Include with label
 *
 * PLACEHOLDERS:
 * - Empty fields produce visible placeholders (not null/undefined)
 * - Summary placeholder: "Write a brief professional summary highlighting your key strengths..."
 * - Placeholder styling: text-gray-500 italic (applied in UI layer)
 */

import type { CareerProfileDTO } from '@/types/profile';
import type { ResumeDocument, ResumeBlock } from '@/types/resume';
import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js';
import { z } from 'zod';

export interface ProfileToResumeOptions {
  /** Country code for phone number formatting (ISO 3166-1 alpha-2) */
  country?: string;

  /** Override default resume title */
  title?: string;

  /** Template slug (default: "modern-minimal") */
  templateSlug?: string;
}

/**
 * Default placeholder text for empty summary
 */
export const SUMMARY_PLACEHOLDER =
  'Write a brief professional summary highlighting your key strengths, experience, and career goals.';

/**
 * Validate if a string is a valid HTTP/HTTPS URL
 */
function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalize phone number for display based on country code
 * Preserves E.164 format in metadata
 */
function normalizePhone(
  phone: string | undefined,
  country?: string
): { display: string; e164?: string } | undefined {
  if (!phone) return undefined;

  try {
    const phoneNumber = parsePhoneNumber(
      phone,
      country ? (country.toUpperCase() as CountryCode) : undefined
    );

    return {
      display: phoneNumber.formatInternational(),
      e164: phoneNumber.format('E.164'),
    };
  } catch {
    return { display: phone };
  }
}

/**
 * Validate email format (basic check)
 */
const emailSchema = z.string().email();

function isValidEmail(email: string | undefined): boolean {
  if (!email) return false;
  return emailSchema.safeParse(email).success;
}

/**
 * Map CareerProfileDTO to ResumeDocument
 *
 * @param profile - User profile data from convex/profiles.ts::getMyProfile()
 * @param opts - Options for customization (country code, title, template)
 * @returns ResumeDocument with mapped blocks
 *
 * @example
 * ```typescript
 * const profile = await getMyProfile();
 * const resume = profileToResume(profile, { country: 'US', title: 'Software Engineer Resume' });
 * ```
 */
export function profileToResume(
  profile: CareerProfileDTO,
  opts?: ProfileToResumeOptions
): ResumeDocument {
  const blocks: ResumeBlock[] = [];
  let currentOrder = 0;

  // Validate and normalize phone
  const phoneNormalized = normalizePhone(profile.contact.phone, opts?.country);

  // Validate and filter links
  const validLinks = (profile.contact.links || []).filter(link => {
    const isValid = isValidHttpUrl(link.url);
    if (!isValid && process.env.NEXT_PUBLIC_DEBUG_UI === 'true') {
      console.warn(`[profileToResume] Invalid link URL: ${link.url} (label: ${link.label})`);
    }
    return isValid;
  });

  // 1. HEADER BLOCK (always included, order: 0)
  blocks.push({
    type: 'header',
    order: currentOrder++,
    data: {
      fullName: profile.fullName || 'Full Name',
      title: profile.title,
      contact: {
        email: isValidEmail(profile.contact.email)
          ? profile.contact.email
          : undefined,
        phone: phoneNormalized?.display,
        location: profile.contact.location,
        links: validLinks,
      },
    },
    locked: false,
  });

  // 2. SUMMARY BLOCK (if bio exists, order: 1)
  if (profile.bio && profile.bio.trim().length > 0) {
    blocks.push({
      type: 'summary',
      order: currentOrder++,
      data: {
        paragraph: profile.bio.trim(),
      },
      locked: false,
    });
  }

  // 3. EXPERIENCE BLOCK (if items exist, order: 2)
  if (profile.experience && profile.experience.length > 0) {
    blocks.push({
      type: 'experience',
      order: currentOrder++,
      data: {
        items: profile.experience.map(exp => ({
          company: exp.company || 'Company Name',
          role: exp.role || 'Job Title',
          location: exp.location,
          start: exp.start,
          end: exp.end,
          bullets: exp.bullets || [],
        })),
      },
      locked: false,
    });
  }

  // 4. SKILLS BLOCK (always included, order: 3)
  blocks.push({
    type: 'skills',
    order: currentOrder++,
    data: {
      primary: profile.skills.primary || [],
      secondary: profile.skills.secondary || [],
    },
    locked: false,
  });

  // 5. EDUCATION BLOCK (if items exist, order: 4)
  if (profile.education && profile.education.length > 0) {
    blocks.push({
      type: 'education',
      order: currentOrder++,
      data: {
        items: profile.education.map(edu => ({
          school: edu.school || 'School Name',
          degree: edu.degree,
          end: edu.end,
          details: edu.details || [],
        })),
      },
      locked: false,
    });
  }

  // 6. PROJECTS BLOCK (if items exist, order: 5)
  if (profile.projects && profile.projects.length > 0) {
    blocks.push({
      type: 'projects',
      order: currentOrder++,
      data: {
        items: profile.projects.map(proj => ({
          name: proj.name || 'Project Name',
          description: proj.description || '',
          bullets: proj.bullets || [],
        })),
      },
      locked: false,
    });
  }

  // Return complete resume document
  return {
    title: opts?.title || `${profile.fullName || 'User'}'s Resume`,
    templateSlug: opts?.templateSlug || 'modern-minimal',
    blocks,
    version: 1,
  };
}

/**
 * Helper to check if a profile has sufficient data for resume generation
 * @param profile - Career profile to validate
 * @returns true if profile has at least name and one content section
 */
export function hasMinimalResumeData(profile: CareerProfileDTO): boolean {
  const hasName = Boolean(profile.fullName && profile.fullName.trim().length > 0);
  const hasContent =
    profile.experience.length > 0 ||
    profile.education.length > 0 ||
    profile.skills.primary.length > 0 ||
    profile.projects.length > 0 ||
    Boolean(profile.bio && profile.bio.trim().length > 0);

  return hasName && hasContent;
}
