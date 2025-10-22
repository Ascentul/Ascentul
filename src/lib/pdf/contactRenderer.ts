/**
 * Contact rendering utilities for PDF export
 *
 * Phase 8: Supports optional clickable links for contact information
 */

/**
 * HTML escape utility to prevent XSS in PDF generation
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Contact field types supported in PDF export
 */
export type ContactFieldType = 'email' | 'phone' | 'location' | 'link';

/**
 * Render a contact field with optional clickable link support
 *
 * @param value - The contact value (e.g., "john@example.com", "+1-555-0100")
 * @param type - The type of contact field
 * @param options - Rendering options
 * @returns HTML string for the contact field
 *
 * @example
 * renderContactField('john@example.com', 'email', { clickableLinks: true })
 * // Returns: '<a href="mailto:john@example.com">john@example.com</a>'
 *
 * renderContactField('+1-555-0100', 'phone', { clickableLinks: false })
 * // Returns: '+1-555-0100' (HTML-escaped)
 */
export function renderContactField(
  value: string,
  type: ContactFieldType,
  options: { clickableLinks?: boolean } = {}
): string {
  const { clickableLinks = false } = options;

  if (!value) return '';

  switch (type) {
    case 'email':
      return clickableLinks
        ? `<a href="mailto:${escapeHTML(value)}">${escapeHTML(value)}</a>`
        : escapeHTML(value);

    case 'phone': {
      // Remove whitespace from phone number for tel: protocol
      const telValue = value.replace(/\s/g, '');
      return clickableLinks
        ? `<a href="tel:${escapeHTML(telValue)}">${escapeHTML(value)}</a>`
        : escapeHTML(value);
    }

    case 'link':
      return clickableLinks
        ? `<a href="${escapeHTML(value)}">${escapeHTML(value)}</a>`
        : escapeHTML(value);

    case 'location':
      // Location is never clickable
      return escapeHTML(value);

    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown contact field type: ${_exhaustive}`);
    }
  }
}

/**
 * Contact data from resume header block
 */
export interface ContactData {
  email?: string;
  phone?: string;
  location?: string;
}

/**
 * Link object for rendering external links (portfolio, LinkedIn, etc.)
 */
export interface ContactLink {
  url: string;
  label: string;
}

/**
 * Build contact parts array from contact data, filtering out empty fields
 *
 * This function implements the actual validation logic used in PDF export:
 * - Extracts email, phone, and location from contact data
 * - Filters out empty/falsy values
 * - Renders each field with optional clickable links
 * - Returns array of rendered contact parts
 *
 * @param contact - Contact data object (may be undefined or have missing fields)
 * @param options - Rendering options
 * @returns Array of rendered contact field HTML strings
 *
 * @example
 * buildContactParts({ email: 'john@example.com', phone: '555-1234' }, { clickableLinks: true })
 * // Returns: ['<a href="mailto:john@example.com">john@example.com</a>', '<a href="tel:555-1234">555-1234</a>']
 *
 * buildContactParts({ email: '', phone: '555-1234', location: 'NYC' })
 * // Returns: ['555-1234', 'NYC'] (empty email filtered out)
 */
export function buildContactParts(
  contact: ContactData | undefined,
  options: { clickableLinks?: boolean } = {}
): string[] {
  const email = contact?.email || '';
  const phone = contact?.phone || '';
  const location = contact?.location || '';

  const contactParts: string[] = [];

  if (email) {
    contactParts.push(renderContactField(email, 'email', options));
  }
  if (phone) {
    contactParts.push(renderContactField(phone, 'phone', options));
  }
  if (location) {
    contactParts.push(renderContactField(location, 'location', options));
  }

  return contactParts;
}

/**
 * Render a contact link (portfolio, LinkedIn, etc.)
 *
 * @param link - The link object with url and label
 * @param options - Rendering options
 * @returns HTML string for the link
 *
 * @example
 * renderContactLink({ url: 'https://linkedin.com/in/johndoe', label: 'LinkedIn' }, { clickableLinks: true })
 * // Returns: '<a href="https://linkedin.com/in/johndoe">LinkedIn</a>'
 */
export function renderContactLink(
  link: ContactLink,
  options: { clickableLinks?: boolean } = {}
): string {
  const { clickableLinks = false } = options;

  return clickableLinks
    ? `<a href="${escapeHTML(link.url)}">${escapeHTML(link.label)}</a>`
    : escapeHTML(link.label);
}
