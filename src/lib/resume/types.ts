// Shared type definitions for resume blocks
// These match the validator schemas in @/lib/validators/resume

export type HeaderContactLink = {
  label: string;
  url: string;
};

export type HeaderData = {
  fullName: string;
  title?: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    links?: HeaderContactLink[];
  };
};

export type SummaryData = {
  paragraph: string;
};

export type ExperienceItem = {
  company: string;
  role: string;
  start?: string;
  end?: string; // Can be "Present" for current roles
  location?: string;
  bullets?: string[];
};

export type ExperienceData = {
  items: ExperienceItem[];
};

export type EducationItem = {
  school: string;
  degree?: string;
  end?: string; // Graduation date
  details?: string[];
  // TODO: Consolidate ID fields for cleaner architecture
  // Currently supports both id and _id for multi-source compatibility:
  // - id: Used by client-side generated items (UUID)
  // - _id: Used by Convex database documents
  // Future improvement: Normalize to single ID field at data boundary layer
  id?: string;
  _id?: string;
};

export type EducationData = {
  items: EducationItem[];
};

export type SkillsData =
  | { primary: string[]; secondary?: string[] }
  | { primary?: string[]; secondary: string[] };

export type ProjectItem = {
  name: string;
  description: string;
  bullets?: string[];
};

export type ProjectsData = {
  items: ProjectItem[];
};

export type CustomData = {
  heading: string;
  content?: string; // Freeform text content
  bullets?: string[]; // Alternative: bullet list format
  // Note: Validator requires either content or bullets to be present (see @/lib/validators/resume.ts)
};

// Helper function to format date ranges
export function fmtDates(start?: string, end?: string): string {
  if (!start && !end) return '';
  const normalizedEnd = end?.trim();
  if (!start) return normalizedEnd || '';
  if (!normalizedEnd || normalizedEnd === 'Present') return `${start} to Present`;
  return `${start} to ${normalizedEnd}`;
}
