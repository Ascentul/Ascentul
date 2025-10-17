export type TemplateBlockType =
  | "header"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "custom";

export interface TemplateDefinition {
  /** Stable template identifier used for assets */
  id: string;
  /** Human-readable slug shown in URLs */
  slug: string;
  /** Display name */
  name: string;
  /** Preview asset reference (relative filename or remote URL) */
  preview: string;
  /** Default resume page size */
  pageSize: "Letter" | "A4";
  /** Allowed block types */
  allowedBlocks: TemplateBlockType[];
  /** Optional description for the picker */
  description?: string;
}

/**
 * Template catalogue used to enrich Convex template records with preview metadata.
 * The `preview` field can be:
 * - A filename with extension (e.g., "grid-compact.png", "modern.svg", "template.webp")
 * - An absolute URL (e.g., "https://cdn.example.com/preview.png")
 * - Empty/null to use previewAssetId with default PNG extension
 *
 * Preview images are generated using scripts/generate-preview-pngs.js
 */
export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: "grid-compact",
    slug: "grid-compact",
    name: "Grid Compact",
    preview: "grid-compact.png",
    pageSize: "Letter",
    allowedBlocks: ["header", "summary", "experience", "education", "skills", "projects"],
    description: "Dense grid layout that maximizes space while keeping sections evenly aligned.",
  },
  {
    id: "minimal-serif",
    slug: "minimal-serif",
    name: "Minimal Serif",
    preview: "minimal-serif.png",
    pageSize: "Letter",
    allowedBlocks: ["header", "summary", "experience", "education", "skills"],
    description: "Elegant serif typography with generous spacing for senior roles and academics.",
  },
  {
    id: "modern-sidebar",
    slug: "modern-sidebar",
    name: "Modern Sidebar",
    preview: "modern-sidebar.png",
    pageSize: "A4",
    allowedBlocks: ["header", "summary", "experience", "projects", "skills"],
    description: "Contemporary two-column layout with a dedicated sidebar for quick facts.",
  },
];

const TEMPLATE_BY_SLUG = new Map(TEMPLATE_DEFINITIONS.map((template) => [template.slug, template]));

export interface TemplatePreviewSource {
  /** Stable identifier used when building external preview URLs */
  previewAssetId: string;
  /** Preview asset reference */
  preview: string;
}

export interface PreviewAugmentable {
  slug: string;
  preview?: string | null;
}

/**
 * Attach preview metadata to an arbitrary template-like object by looking up
 * the catalogue entry when Convex data does not already include it.
 *
 * Returns empty string for unknown templates - this is intentional behavior.
 * The empty preview will be handled downstream by getPreviewSrc() which uses
 * previewAssetId to construct a fallback path, and TemplateCard which shows
 * a FileText icon if the image fails to load.
 */
export function withTemplatePreview<T extends PreviewAugmentable>(
  template: T,
): T & TemplatePreviewSource {
  const definition = TEMPLATE_BY_SLUG.get(template.slug);

  // Prioritize non-empty template preview, then catalog preview, then empty string
  const preview = template.preview?.trim() || definition?.preview || "";

  return {
    ...template,
    preview,
    previewAssetId: definition?.id ?? template.slug,
  };
}

export function getTemplateDefinitionBySlug(slug: string): TemplateDefinition | undefined {
  return TEMPLATE_BY_SLUG.get(slug);
}
