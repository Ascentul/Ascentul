/** Supported image formats for template previews */
export type PreviewExtension = 'png' | 'jpg' | 'jpeg' | 'webp' | 'svg' | 'gif';

export interface PreviewSourceInput {
  preview: string | null | undefined;
  /** Non-empty asset identifier used to build preview paths */
  previewAssetId: string;
  /** File extension for preview images. Defaults to 'png'. Must be a supported image format without the dot. */
  extension?: PreviewExtension;
}

const PUBLIC_PREVIEW_DIR = "/previews";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, "");
}

/**
 * Resolve a preview image source for a template by applying the following priority:
 * 1. If the provided preview starts with http/https, return it as-is.
 * 2. If the provided preview includes a filename, use it directly.
 * 3. If NEXT_PUBLIC_PREVIEW_BASE_URL is defined, construct `${base}/${previewAssetId}.${extension}`.
 * 4. Otherwise fall back to the local `/public/previews` directory.
 *
 * @param extension - File extension (without dot). Must be a supported format: png, jpg, jpeg, webp, svg, or gif. Defaults to 'png'. Used only when preview is empty.
 */
export function getPreviewSrc({ preview, previewAssetId, extension = 'png' }: PreviewSourceInput): string {
  if (!previewAssetId || previewAssetId.trim().length === 0) {
    throw new Error("previewAssetId must be a non-empty string");
  }

  const trimmedPreview = (preview ?? "").trim();

  // Priority 1: Absolute HTTP(S) URLs
  if (trimmedPreview && isHttpUrl(trimmedPreview)) {
    return trimmedPreview;
  }

  // Priority 2: Relative paths starting with /
  if (trimmedPreview && trimmedPreview.startsWith("/")) {
    return trimmedPreview;
  }

  // Priority 3: Filename with extension (e.g., "grid-compact.png")
  if (trimmedPreview) {
    return `${PUBLIC_PREVIEW_DIR}/${encodeURIComponent(trimmedPreview)}`;
  }

  // Priority 4: Remote CDN fallback
  const remoteBase = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL;
  if (remoteBase) {
    const cleanBase = normalizeBaseUrl(remoteBase);
    return `${cleanBase}/${encodeURIComponent(previewAssetId)}.${extension}`;
  }

  // Priority 5: Local fallback with extension
  return `${PUBLIC_PREVIEW_DIR}/${encodeURIComponent(previewAssetId)}.${extension}`;
}
