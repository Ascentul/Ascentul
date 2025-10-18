/**
 * Represents a cached thumbnail entry.
 */
export interface ThumbnailCacheEntry {
  /** Base64-encoded data URL of the thumbnail image */
  dataUrl: string;
  /** Timestamp (milliseconds) when the thumbnail was last refreshed */
  lastUpdated: number;
}

// NOTE: Each dataURL may consume several hundred KB of memory. Monitor usage if this cap is raised.
const MAX_CACHE_SIZE = 100;
const cache = new Map<string, ThumbnailCacheEntry>();

export function getCachedThumbnail(documentId: string, lastUpdated?: number | null): string | null {
  if (lastUpdated == null) {
    return null;
  }
  const entry = cache.get(documentId);
  if (!entry) {
    return null;
  }

  if (entry.lastUpdated === lastUpdated) {
    // Move entry to end of Map for LRU tracking
    cache.delete(documentId);
    cache.set(documentId, entry);
    return entry.dataUrl;
  }

  cache.delete(documentId);
  return null;
}

export function setCachedThumbnail(documentId: string, lastUpdated: number | null | undefined, dataUrl: string): void {
  if (lastUpdated == null) {
    return;
  }
  const isUpdate = cache.has(documentId);
  if (isUpdate) {
    cache.delete(documentId);
  } else {
    evictOldestIfNeeded();
  }
  cache.set(documentId, { dataUrl, lastUpdated });
}

export function invalidateThumbnail(documentId: string): void {
  cache.delete(documentId);
}

export function clearThumbnailCache(): void {
  cache.clear();
}

function evictOldestIfNeeded(): void {
  while (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey === undefined) {
      break;
    }
    cache.delete(oldestKey);
  }
}
