// Shared type definitions for resume blocks
// These match the validator schemas in @/lib/validators/resume

export type HeaderData = {
  fullName: string;
  title?: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    links?: Array<{
      label: string;
      url: string;
    }>;
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
};

export type EducationData = {
  items: EducationItem[];
};

export type SkillsData = {
  primary?: string[];
  secondary?: string[];
};

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
  bullets: string[];
};

// Helper function to format date ranges
export function fmtDates(start?: string, end?: string): string {
  if (!start && !end) return '';
  if (!start) return end || '';
  if (!end || end.trim().length === 0) return `${start} to Present`;
  if (end === 'Present') return `${start} to Present`;
  return `${start} to ${end}`;
}
