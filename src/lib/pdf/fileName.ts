/**
 * Phase 8: Generate PDF file name in format: FullName-Template-YYYYMMDD.pdf
 *
 * @param fullName - User's full name from header block
 * @param templateSlug - Template identifier
 * @returns Sanitized file name
 *
 * @example
 * generatePDFFileName('John Doe', 'modern')
 * // => 'John-Doe-modern-20250121.pdf'
 *
 * generatePDFFileName('José García', 'classic')
 * // => 'José-García-classic-20250121.pdf'
 *
 * generatePDFFileName('  Multiple   Spaces  ', 'template')
 * // => 'Multiple-Spaces-template-20250121.pdf'
 */
export function generatePDFFileName(fullName: string, templateSlug: string): string {
  // Sanitize full name: preserve readability and international characters
  // - Replace spaces with hyphens for readability (John Doe → John-Doe)
  // - Preserve accented Latin characters (José García → José-García)
  // - Unicode ranges: \u00C0-\u024F (Latin Extended-A/B), \u1E00-\u1EFF (Latin Extended Additional)
  const sanitizedName = fullName
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF-]/g, '') // Keep alphanumeric, hyphens, and accented Latin
    .replace(/-+/g, '-') // Collapse multiple consecutive hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .slice(0, 50) // Limit length
    || 'Resume';

  // Format date as YYYYMMDD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Sanitize template slug
  const sanitizedTemplate = templateSlug
    .replace(/[^a-zA-Z0-9-]/g, '')
    .slice(0, 30)
    || 'template';

  return `${sanitizedName}-${sanitizedTemplate}-${dateStr}.pdf`;
}
