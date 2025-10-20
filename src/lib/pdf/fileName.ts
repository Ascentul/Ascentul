/**
 * Phase 8: Generate PDF file name in format: FullName-Template-YYYYMMDD.pdf
 * @param fullName - User's full name from header block
 * @param templateSlug - Template identifier
 * @returns Sanitized file name
 */
export function generatePDFFileName(fullName: string, templateSlug: string): string {
  // Sanitize full name: remove spaces, special chars, keep alphanumeric and hyphens
  const sanitizedName = fullName
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '')
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
