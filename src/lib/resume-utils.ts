/**
 * Shared utility functions for resume formatting and processing
 */

/**
 * Formats a date range for display on resumes
 * @param startDate - The start date string
 * @param endDate - The end date string
 * @param current - Whether this is a current position/education
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: string, endDate: string, current: boolean): string {
  if (current) return `${startDate} - Present`;
  return `${startDate} - ${endDate}`;
}

/**
 * Parses a description string into bullet points
 * Splits by newlines or bullet point characters and filters empty lines
 * @param description - The description text to parse (string or array)
 * @returns Array of parsed description lines
 */
export function parseDescription(description: string | string[]): string[] {
  if (!description) return [];

  // If already an array, return it cleaned up
  if (Array.isArray(description)) {
    return description
      .map(line => typeof line === 'string' ? line.trim() : String(line).trim())
      .filter(line => line.length > 0);
  }

  // Handle non-string values by converting to string
  const descriptionStr = typeof description === 'string' ? description : String(description);

  const lines = descriptionStr
    .split(/\n|•/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return lines;
}
