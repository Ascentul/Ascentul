/**
 * Career Profile DTO
 *
 * Type definition for the profile data returned by convex/profiles.ts::getMyProfile()
 * Used as input for profile-to-resume mapping
 *
 * @version 1.0
 */

export interface CareerProfileDTO {
  /**
   * Schema version for future migrations
   * @example "1.0"
   */
  version?: string;

  /** Full name of the user */
  fullName: string;

  /** Job title or professional headline */
  title?: string;

  /** Contact information */
  contact: {
    email?: string;
    phone?: string; // E.164 format preferred (e.g., +14155551234)
    location?: string; // City, State/Country
    links: Array<{
      label: string; // e.g., "LinkedIn", "GitHub", "Portfolio"
      url: string; // Full URL with protocol
    }>;
  };

  /**
   * Professional bio / career summary
   * Maps to summary block in resume
   */
  bio?: string;

  /** Work experience history */
  experience: Array<{
    company: string;
    role: string;
    location?: string;
    start?: string; // Date string (e.g., "Jan 2020" or ISO format)
    end?: string; // Date string or undefined for current positions
    bullets: string[]; // Achievement bullets
  }>;

  /** Education history */
  education: Array<{
    school: string;
    degree: string;
    field?: string; // Field of study
    end?: string; // Graduation date
    details: string[]; // GPA, honors, coursework, etc.
  }>;

  /** Skills organized by proficiency */
  skills: {
    primary: string[]; // Core/proficient skills
    secondary?: string[]; // Secondary/learning skills
  };

  /** Portfolio projects */
  projects: Array<{
    name: string;
    description?: string;
    bullets: string[]; // Technologies, achievements, links
  }>;
}

/**
 * Type guard to check if an object is a valid CareerProfileDTO
 */
export function isCareerProfileDTO(obj: unknown): obj is CareerProfileDTO {
  if (typeof obj !== 'object' || obj === null) return false;

  const profile = obj as Partial<CareerProfileDTO>;

  return (
    typeof profile.fullName === 'string' &&
    typeof profile.contact === 'object' &&
    profile.contact !== null &&
    Array.isArray(profile.contact.links) &&
    profile.contact.links.every(
      (link) =>
        typeof link === 'object' &&
        link !== null &&
        typeof link.label === 'string' &&
        typeof link.url === 'string'
    ) &&
    Array.isArray(profile.experience) &&
    profile.experience.every(
      (exp) =>
        typeof exp === 'object' &&
        exp !== null &&
        typeof exp.company === 'string' &&
        typeof exp.role === 'string' &&
        Array.isArray(exp.bullets)
    ) &&
    Array.isArray(profile.education) &&
    profile.education.every(
      (edu) =>
        typeof edu === 'object' &&
        edu !== null &&
        typeof edu.school === 'string' &&
        typeof edu.degree === 'string' &&
        Array.isArray(edu.details)
    ) &&
    typeof profile.skills === 'object' &&
    profile.skills !== null &&
    Array.isArray(profile.skills.primary) &&
    profile.skills.primary.every((skill) => typeof skill === 'string') &&
    Array.isArray(profile.projects) &&
    profile.projects.every(
      (proj) =>
        typeof proj === 'object' &&
        proj !== null &&
        typeof proj.name === 'string' &&
        Array.isArray(proj.bullets)
    )
  );
}
