import type { Id } from '../../convex/_generated/dataModel';

// Block data types
export interface HeaderData {
  fullName: string;
  title?: string;
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
    links?: Array<{
      label: string;
      url: string;
    }>;
  };
}

export interface SummaryData {
  paragraph: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  location?: string;
  start?: string;
  end?: string;
  bullets?: string[];
}

export interface ExperienceData {
  items: ExperienceItem[];
}

export interface EducationItem {
  school: string;
  degree?: string;
  location?: string;
  start?: string;
  end?: string;
  details?: string[];
  id?: string;
  _id?: string;
}

export interface EducationData {
  items: EducationItem[];
}

export interface SkillsData {
  primary?: string[];
  secondary?: string[];
}

export interface ProjectItem {
  name: string;
  description: string;
  bullets: string[];
}

export interface ProjectsData {
  items: ProjectItem[];
}

export interface CustomData {
  heading: string;
  bullets: string[];
}

/**
 * Spatial frame assigned to a block when positioned on the editor canvas.
 * Coordinates are in inches at 96 DPI unless otherwise specified.
 *
 * @property x Horizontal offset from the page left margin
 * @property y Vertical offset from the page top margin
 * @property w Block width (must be positive)
 * @property h Block height (must be positive)
 * @property pageId Identifier of the page containing this block
 */
export interface BlockFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  pageId: string;
}

// Union type for all block data
export type BlockData =
  | HeaderData
  | SummaryData
  | ExperienceData
  | EducationData
  | SkillsData
  | ProjectsData
  | CustomData;

// Base interface for common block properties
interface BlockBase {
  _id: Id<"resume_blocks">;
  resumeId: Id<"builder_resumes">;
  order: number;
  locked: boolean;
  frame?: BlockFrame;
}

// Block type using discriminated unions for type safety
export type Block =
  | (BlockBase & { type: 'header'; data: HeaderData })
  | (BlockBase & { type: 'summary'; data: SummaryData })
  | (BlockBase & { type: 'experience'; data: ExperienceData })
  | (BlockBase & { type: 'education'; data: EducationData })
  | (BlockBase & { type: 'skills'; data: SkillsData })
  | (BlockBase & { type: 'projects'; data: ProjectsData })
  | (BlockBase & { type: 'custom'; data: CustomData });

// Type guards
export function isHeaderData(data: any): data is HeaderData {
  if (!data || typeof data.fullName !== 'string') {
    return false;
  }

  // Validate links structure if present
  if (data.contact?.links) {
    if (!Array.isArray(data.contact.links)) {
      return false;
    }

    // Validate each link has required label and url properties
    return data.contact.links.every(
      (link: any) =>
        typeof link === 'object' &&
        link !== null &&
        typeof link.label === 'string' &&
        typeof link.url === 'string'
    );
  }

  return true;
}

export function isSummaryData(data: any): data is SummaryData {
  return data && typeof data.paragraph === 'string';
}

export function isExperienceData(data: any): data is ExperienceData {
  return (
    data &&
    Array.isArray(data.items) &&
    data.items.every(
      (item: any) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.company === 'string' &&
        typeof item.role === 'string' &&
        (item.location === undefined || typeof item.location === 'string') &&
        (item.start === undefined || typeof item.start === 'string') &&
        (item.end === undefined || typeof item.end === 'string') &&
        (item.bullets === undefined || (Array.isArray(item.bullets) && item.bullets.every((b: any) => typeof b === 'string')))
    )
  );
}

export function isEducationData(data: any): data is EducationData {
  return (
    data &&
    Array.isArray(data.items) &&
    data.items.every(
      (item: any) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.school === 'string' &&
        (item.degree === undefined || typeof item.degree === 'string') &&
        (item.location === undefined || typeof item.location === 'string') &&
        (item.start === undefined || typeof item.start === 'string') &&
        (item.end === undefined || typeof item.end === 'string') &&
        (item.details === undefined || (Array.isArray(item.details) && item.details.every((d: any) => typeof d === 'string')))
    )
  );
}

export function isSkillsData(data: any): data is SkillsData {
  if (!data) return false;

  const primaryValid = data.primary === undefined ||
    (Array.isArray(data.primary) && data.primary.every((skill: any) => typeof skill === 'string'));
  const secondaryValid = data.secondary === undefined ||
    (Array.isArray(data.secondary) && data.secondary.every((skill: any) => typeof skill === 'string'));

  return primaryValid && secondaryValid;
}

export function isProjectsData(data: any): data is ProjectsData {
  return (
    data &&
    Array.isArray(data.items) &&
    data.items.every(
      (item: any) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.name === 'string' &&
        typeof item.description === 'string' &&
        Array.isArray(item.bullets) &&
        item.bullets.every((bullet: any) => typeof bullet === 'string')
    )
  );
}

export function isCustomData(data: any): data is CustomData {
  return (
    data &&
    typeof data.heading === 'string' &&
    Array.isArray(data.bullets) &&
    data.bullets.every((bullet: any) => typeof bullet === 'string')
  );
}
