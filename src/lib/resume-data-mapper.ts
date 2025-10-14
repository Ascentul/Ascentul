import type {
  HeaderData,
  SummaryData,
  ExperienceData,
  EducationData,
  SkillsData,
  ProjectsData,
  BlockData,
} from './resume-types';

/**
 * Profile snapshot structure from Convex profiles.getMyProfile
 */
export interface ProfileSnapshot {
  fullName: string;
  title?: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    links?: Array<{ label: string; url: string }>;
  };
  experience: Array<{
    company: string;
    role: string;
    location?: string;
    start: string;
    end?: string;
    bullets?: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    field?: string;
    location?: string;
    end?: string;
    details?: string[];
  }>;
  skills: {
    primary?: string[];
    secondary?: string[];
  };
  projects?: Array<{
    name: string;
    description?: string;
    bullets?: string[];
  }>;
}

/**
 * Block with type information for creation
 */
export interface BlockWithType {
  type: 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'custom';
  data: BlockData;
  order: number;
  locked: boolean;
}

/**
 * Main transformer: converts profile snapshot to resume blocks
 * @param profile - User's profile data from Convex
 * @returns Array of blocks ready to be inserted into resume
 */
export function profileToBlocks(profile: ProfileSnapshot | null): BlockWithType[] {
  if (!profile) return [];

  const blocks: BlockWithType[] = [];
  let order = 0;

  // 1. Header - always include (required)
  const headerBlock = createHeaderBlock(profile);
  if (headerBlock) {
    blocks.push({
      type: 'header',
      data: headerBlock,
      order: order++,
      locked: false,
    });
  }

  // 2. Summary - skip for now, let AI generate later
  // (We don't have summary in profile data)

  // 3. Experience - only if data exists
  const experienceBlock = createExperienceBlock(profile);
  if (experienceBlock) {
    blocks.push({
      type: 'experience',
      data: experienceBlock,
      order: order++,
      locked: false,
    });
  }

  // 4. Education - only if data exists
  const educationBlock = createEducationBlock(profile);
  if (educationBlock) {
    blocks.push({
      type: 'education',
      data: educationBlock,
      order: order++,
      locked: false,
    });
  }

  // 5. Skills - only if data exists
  const skillsBlock = createSkillsBlock(profile);
  if (skillsBlock) {
    blocks.push({
      type: 'skills',
      data: skillsBlock,
      order: order++,
      locked: false,
    });
  }

  // 6. Projects - only if data exists
  const projectsBlock = createProjectsBlock(profile);
  if (projectsBlock) {
    blocks.push({
      type: 'projects',
      data: projectsBlock,
      order: order++,
      locked: false,
    });
  }

  return blocks;
}

/**
 * Migrate legacy string[] links to new {label, url} format
 * Handles backward compatibility during migration period
 */
function migrateLegacyLinks(links: any): Array<{ label: string; url: string }> {
  if (!links || !Array.isArray(links)) return [];

  return links.map((link) => {
    // If already in new format
    if (typeof link === 'object' && link.label && link.url) {
      return { label: link.label, url: link.url };
    }

    // If legacy string format, try to extract label from URL
    if (typeof link === 'string') {
      try {
        const url = new URL(link);
        const hostname = url.hostname.replace(/^www\./i, '');
        // Use hostname as label for legacy links
        return { label: hostname, url: link };
      } catch {
        // If not a valid URL, use the string as both label and url
        return { label: link, url: link };
      }
    }

    // Fallback for unexpected formats
    return { label: String(link), url: String(link) };
  });
}

/**
 * Create header block from profile
 */
function createHeaderBlock(profile: ProfileSnapshot): HeaderData | null {
  if (!profile.fullName) return null;

  return {
    fullName: profile.fullName,
    title: profile.title || '',
    contact: {
      email: profile.contact.email,
      phone: profile.contact.phone,
      location: profile.contact.location,
      links: migrateLegacyLinks(profile.contact.links as any),
    },
  };
}

/**
 * Create experience block from profile
 */
function createExperienceBlock(profile: ProfileSnapshot): ExperienceData | null {
  if (!profile.experience || profile.experience.length === 0) return null;

  const items = profile.experience.map((exp) => ({
    company: exp.company,
    role: exp.role,
    location: exp.location,
    start: exp.start,
    end: exp.end || '', // Empty string if current position
    bullets: exp.bullets || [],
  }));

  return { items };
}

/**
 * Create education block from profile
 */
function createEducationBlock(profile: ProfileSnapshot): EducationData | null {
  if (!profile.education || profile.education.length === 0) return null;

  const items = profile.education.map((edu) => ({
    school: edu.school,
    degree: edu.degree,
    location: edu.location,
    end: edu.end || '',
    details: edu.details || [],
  }));

  return { items };
}

/**
 * Create skills block from profile
 */
function createSkillsBlock(profile: ProfileSnapshot): SkillsData | null {
  const primary = profile.skills?.primary;
  const secondary = profile.skills?.secondary;
  const hasPrimary = primary && primary.length > 0;
  const hasSecondary = secondary && secondary.length > 0;

  if (!hasPrimary && !hasSecondary) return null;

  return {
    primary: primary || [],
    secondary: secondary || [],
  };
}

/**
 * Create projects block from profile
 */
function createProjectsBlock(profile: ProfileSnapshot): ProjectsData | null {
  if (!profile.projects || profile.projects.length === 0) return null;

  const items = profile.projects.map((proj) => ({
    name: proj.name,
    description: proj.description || '',
    bullets: proj.bullets || [],
  }));

  return { items };
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  dataQuality: 'complete' | 'partial' | 'minimal';
}

/**
 * Validate profile data quality
 * @param profile - Profile snapshot to validate
 * @returns Validation result with warnings and errors
 */
export function validateProfileData(profile: ProfileSnapshot | null): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!profile) {
    return {
      isValid: false,
      warnings: [],
      errors: ['No profile data available'],
      dataQuality: 'minimal',
    };
  }

  // Check required fields
  if (!profile.fullName || profile.fullName.trim() === '') {
    errors.push('Full name is required');
  }

  // Check recommended fields
  if (!profile.title) {
    warnings.push('Job title is missing - consider adding one');
  }

  if (!profile.contact.email) {
    warnings.push('Email is missing - highly recommended');
  }

  if (!profile.experience || profile.experience.length === 0) {
    warnings.push('No work experience - resume will be limited');
  }

  if (!profile.education || profile.education.length === 0) {
    warnings.push('No education history - consider adding at least one entry');
  }

  const primarySkills = profile.skills?.primary;
  if (!primarySkills || primarySkills.length < 3) {
    warnings.push('Add at least 3-5 skills for a stronger resume');
  }

  // Determine data quality
  let dataQuality: 'complete' | 'partial' | 'minimal' = 'complete';

  if (errors.length > 0 || warnings.length >= 4) {
    dataQuality = 'minimal';
  } else if (warnings.length >= 2) {
    dataQuality = 'partial';
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    dataQuality,
  };
}

/**
 * Count how many blocks will be created from profile
 */
export function countBlocksFromProfile(profile: ProfileSnapshot | null): number {
  if (!profile) return 0;

  let count = 0;

  if (profile.fullName) count++; // Header
  if (profile.experience && profile.experience.length > 0) count++;
  if (profile.education && profile.education.length > 0) count++;

  const primary = profile.skills?.primary;
  const secondary = profile.skills?.secondary;
  const hasPrimary = primary && primary.length > 0;
  const hasSecondary = secondary && secondary.length > 0;
  if (hasPrimary || hasSecondary) count++;

  if (profile.projects && profile.projects.length > 0) count++;

  return count;
}
