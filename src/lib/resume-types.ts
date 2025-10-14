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
  end?: string;
  details?: string[];
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

// Union type for all block data
export type BlockData =
  | HeaderData
  | SummaryData
  | ExperienceData
  | EducationData
  | SkillsData
  | ProjectsData
  | CustomData;

// Block type
export interface Block {
  _id: Id<"resume_blocks">;
  resumeId: Id<"builder_resumes">;
  type: 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'custom';
  data: BlockData;
  order: number;
  locked: boolean;
}

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
  return data && Array.isArray(data.items);
}

export function isEducationData(data: any): data is EducationData {
  return data && Array.isArray(data.items);
}

export function isSkillsData(data: any): data is SkillsData {
  return (
    data &&
    ((Array.isArray(data.primary) && data.primary.length > 0) ||
     (Array.isArray(data.secondary) && data.secondary.length > 0))
  );
}

export function isProjectsData(data: any): data is ProjectsData {
  return data && Array.isArray(data.items);
}

export function isCustomData(data: any): data is CustomData {
  return data && typeof data.heading === 'string' && Array.isArray(data.bullets);
}
