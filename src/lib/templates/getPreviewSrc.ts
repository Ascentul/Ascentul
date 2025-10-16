export interface PreviewSourceInput {
  preview: string | null | undefined;
  /** Non-empty asset identifier used to build preview paths */
  previewAssetId: string;
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
 * 2. If NEXT_PUBLIC_PREVIEW_BASE_URL is defined, construct `${base}/${previewAssetId}.png`.
 * 3. Otherwise fall back to the local `/public/previews` directory.
 */
export function getPreviewSrc({ preview, previewAssetId }: PreviewSourceInput): string {
  if (!previewAssetId || previewAssetId.trim().length === 0) {
    throw new Error("previewAssetId must be a non-empty string");
  }

  const trimmedPreview = (preview ?? "").trim();

  if (trimmedPreview && isHttpUrl(trimmedPreview)) {
    return trimmedPreview;
  }

  const remoteBase = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL;
  if (remoteBase && previewAssetId) {
    const cleanBase = normalizeBaseUrl(remoteBase);
    return `${cleanBase}/${previewAssetId}.png`;
  }

  if (!trimmedPreview) {
    return `${PUBLIC_PREVIEW_DIR}/${previewAssetId}.png`;
  }

  if (trimmedPreview.startsWith("/")) {
    return trimmedPreview;
  }

  return `${PUBLIC_PREVIEW_DIR}/${trimmedPreview}`;
}
