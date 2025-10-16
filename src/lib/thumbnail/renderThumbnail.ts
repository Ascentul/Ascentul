import type { Id } from "../../../convex/_generated/dataModel";
import { getCachedThumbnail, setCachedThumbnail } from "./cache";
import type html2canvas from "html2canvas";

export interface RenderThumbnailOptions {
  documentId: Id<"builder_resumes"> | string;
  lastUpdated: number;
  width?: number;
  backgroundColor?: string;
  cacheResult?: boolean;
}

type Html2CanvasOptions = Parameters<typeof html2canvas>[1];

async function loadHtml2Canvas() {
  const module = await import("html2canvas");
  return module.default ?? module;
}

/**
 * Render the first resume page DOM element to a PNG data URL.
 * The rendered image is cached using the resume document identifier and last-updated timestamp.
 *
 * @throws {Error} When rendering fails due to:
 *   - CORS issues with external resources (images, fonts)
 *   - Canvas conversion failures
 *   - Large element rendering timeouts
 *   - Invalid element or environment
 */
export async function renderThumbnail(
  element: HTMLElement,
  { documentId, lastUpdated, width = 800, backgroundColor = "#ffffff", cacheResult = true }: RenderThumbnailOptions,
): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("renderThumbnail can only be executed in a browser environment");
  }

  if (!element) {
    throw new Error("renderThumbnail requires a valid HTMLElement");
  }

  const cacheKey = String(documentId);
  if (cacheResult) {
    const cached = getCachedThumbnail(cacheKey, lastUpdated);
    if (cached) {
      return cached;
    }
  }

  const html2canvas = await loadHtml2Canvas();
  const targetWidth = width;
  const referenceWidth = element.clientWidth || element.offsetWidth || targetWidth;
  const scale = referenceWidth > 0 ? targetWidth / referenceWidth : 1;

  const options: Html2CanvasOptions = {
    scale,
    useCORS: true,
    backgroundColor,
    logging: typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_DEBUG_UI === "1",
  };

  try {
    const canvas = await html2canvas(element, options);
    const dataUrl = canvas.toDataURL("image/png");

    if (cacheResult) {
      setCachedThumbnail(cacheKey, lastUpdated, dataUrl);
    }

    return dataUrl;
  } catch (error) {
    throw new Error(`Failed to render thumbnail: ${error instanceof Error ? error.message : String(error)}`);
  }
}
