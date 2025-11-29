// Shared Convex ID validation utilities (Crockford Base32: 0-9, A-H, J-N, P-T, V-Z; excludes I, L, O, U)
export const CONVEX_ID_REGEX = /^[0-9A-HJ-NP-TV-Z]+$/i;

export function isValidConvexId(id: string | null | undefined): id is string {
  return typeof id === 'string' && CONVEX_ID_REGEX.test(id.trim());
}
