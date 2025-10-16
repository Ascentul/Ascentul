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
 * The `preview` field points to PNG assets located in `/public/previews`.
 *
 * TODO: add preview images
 *  - public/previews/grid-compact.png
 *  - public/previews/minimal-serif.png
 *  - public/previews/modern-sidebar.png
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
 */
export function withTemplatePreview<T extends PreviewAugmentable>(
  template: T,
): T & TemplatePreviewSource {
  const definition = TEMPLATE_BY_SLUG.get(template.slug);
  const fallbackPreview = definition?.preview ?? "";
  const preview =
    typeof template.preview === "string" && template.preview.trim().length > 0
      ? template.preview
      : fallbackPreview;

  return {
    ...template,
    preview,
    previewAssetId: definition?.id ?? template.slug,
  };
}

export function getTemplateDefinitionBySlug(slug: string): TemplateDefinition | undefined {
  return TEMPLATE_BY_SLUG.get(slug);
}
