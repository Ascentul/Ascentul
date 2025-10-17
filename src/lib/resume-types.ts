import type { Id } from '../../convex/_generated/dataModel';

export interface HeaderContactLink {
  label: string;
  url: string;
}

// Block data types
export interface HeaderData {
  fullName: string;
  title?: string;
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
    links?: HeaderContactLink[];
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
  // TODO: Consolidate ID fields for cleaner architecture
  // Currently supports both id and _id for multi-source compatibility:
  // - id: Used by client-side generated items (UUID)
  // - _id: Used by Convex database documents
  // Future improvement: Normalize to single ID field at data boundary layer
  id?: string;
  _id?: string;
}

export interface EducationData {
  items: EducationItem[];
}

export type SkillsData =
  | { primary: string[]; secondary?: string[] }
  | { primary?: string[]; secondary: string[] };

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

  // Validate optional title field
  if (data.title !== undefined && typeof data.title !== 'string') {
    return false;
  }

  // Validate contact structure if present
  if (data.contact !== undefined) {
    const contact = data.contact;

    // Contact must be an object
    if (typeof contact !== 'object' || contact === null) {
      return false;
    }

    // Validate optional contact fields
    if (contact.email !== undefined && typeof contact.email !== 'string') {
      return false;
    }
    if (contact.phone !== undefined && typeof contact.phone !== 'string') {
      return false;
    }
    if (contact.location !== undefined && typeof contact.location !== 'string') {
      return false;
    }

    // Validate links structure if present
    if (contact.links !== undefined) {
      if (!Array.isArray(contact.links)) {
        return false;
      }

      const normalizedLinks = coerceHeaderLinks(contact.links);
      return normalizedLinks.length === contact.links.length;
    }
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
  if (!data || typeof data !== 'object') {
    return false;
  }

  const rawPrimary = (data as { primary?: unknown }).primary;
  const rawSecondary = (data as { secondary?: unknown }).secondary;

  const hasPrimaryArray =
    Array.isArray(rawPrimary) && rawPrimary.every((skill: unknown) => typeof skill === 'string');
  const hasSecondaryArray =
    Array.isArray(rawSecondary) && rawSecondary.every((skill: unknown) => typeof skill === 'string');

  // Allow one side to be omitted, but at least one array must be present.
  const primaryValid = rawPrimary === undefined || hasPrimaryArray;
  const secondaryValid = rawSecondary === undefined || hasSecondaryArray;

  return (hasPrimaryArray || hasSecondaryArray) && primaryValid && secondaryValid;
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

export function coerceHeaderLinks(value: unknown): HeaderContactLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const links: HeaderContactLink[] = [];

  for (const entry of value) {
    if (!entry) {
      continue;
    }

    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (!trimmed) {
        continue;
      }
      links.push({ label: trimmed, url: trimmed });
      continue;
    }

    if (typeof entry === 'object') {
      const labelValue = (entry as { label?: unknown }).label;
      const urlValue = (entry as { url?: unknown }).url;
      if (typeof urlValue !== 'string') {
        continue;
      }
      const normalizedUrl = urlValue.trim();
      if (!normalizedUrl) {
        continue;
      }
      const normalizedLabel =
        typeof labelValue === 'string' && labelValue.trim().length > 0
          ? labelValue.trim()
          : normalizedUrl;

      links.push({ label: normalizedLabel, url: normalizedUrl });
    }
  }

  return links;
}

export function normalizeHeaderData(data: HeaderData): HeaderData {
  const contact = data.contact;
  if (!contact) {
    return data;
  }

  const rawLinks = (contact as { links?: unknown }).links;
  if (rawLinks === undefined) {
    return data;
  }

  const normalizedLinks = coerceHeaderLinks(rawLinks);

  // Check if links are already normalized (no change needed)
  if (Array.isArray(contact.links)) {
    const sameLength = contact.links.length === normalizedLinks.length;
    const sameEntries =
      sameLength &&
      contact.links.every(
        (link, index) =>
          link.label === normalizedLinks[index]?.label &&
          link.url === normalizedLinks[index]?.url,
      );

    if (sameEntries) {
      return data;
    }
  }

  // If normalization resulted in empty links, remove the field
  if (normalizedLinks.length === 0) {
    const { links: _unusedLinks, ...restContact } = contact as Record<string, unknown>;
    return {
      ...data,
      contact: Object.keys(restContact).length > 0 ? (restContact as HeaderData['contact']) : undefined,
    };
  }

  // Apply normalized links
  return {
    ...data,
    contact: {
      ...contact,
      links: normalizedLinks,
    },
  };
}

export function normalizeResumeBlock(block: Block): Block {
  if (block.type !== 'header') {
    return block;
  }

  const normalizedData = normalizeHeaderData(block.data);
  if (normalizedData === block.data) {
    return block;
  }

  return {
    ...block,
    data: normalizedData,
  };
}
