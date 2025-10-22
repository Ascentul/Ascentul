/**
 * Resume sorting utilities
 *
 * Provides consistent sorting behavior for resume lists
 */

/**
 * Resume record with optional updatedAt timestamp
 */
export interface SortableResume {
  _id: string;
  updatedAt?: number;
  [key: string]: unknown;
}

/**
 * Sort resumes by updatedAt timestamp in descending order (newest first)
 *
 * Treats missing updatedAt as 0, placing those records at the end.
 * Relies on stable sort for consistent ordering of equal timestamps.
 *
 * @param resumes - Array of resume records to sort
 * @returns New sorted array (does not mutate input)
 *
 * @example
 * const resumes = [
 *   { _id: '1', updatedAt: 1000 },
 *   { _id: '2', updatedAt: 3000 },
 *   { _id: '3', updatedAt: 2000 },
 * ];
 * const sorted = sortResumesByUpdatedAt(resumes);
 * // Returns: [{ _id: '2', ... }, { _id: '3', ... }, { _id: '1', ... }]
 *
 * @example
 * // Handles missing updatedAt
 * const resumes = [
 *   { _id: '1' },
 *   { _id: '2', updatedAt: 2000 },
 * ];
 * const sorted = sortResumesByUpdatedAt(resumes);
 * // Returns: [{ _id: '2', updatedAt: 2000 }, { _id: '1' }]
 */
export function sortResumesByUpdatedAt<T extends SortableResume>(
  resumes: T[]
): T[] {
  return [...resumes].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}
