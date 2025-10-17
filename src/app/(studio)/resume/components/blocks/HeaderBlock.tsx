import type { HeaderContactLink, HeaderData } from '@/lib/resume/types';
import { BlockSuggestions } from '../BlockSuggestions';
import type { ContentSuggestion } from '@/lib/ai/suggestions';

interface HeaderBlockProps {
  data: HeaderData;
  isSelected?: boolean;
  suggestions?: ContentSuggestion[];
  blockId?: string;
}

export function HeaderBlock({ data, isSelected, suggestions, blockId }: HeaderBlockProps) {
  const { fullName, title, contact } = data;
  const { email, phone, location, links } = contact || {};
  const safeLinks: HeaderContactLink[] = Array.isArray(links)
    ? (links as unknown[]).map((entry) => {
        if (!entry) {
          return null;
        }
        if (typeof entry === 'string') {
          const trimmed = entry.trim();
          if (!trimmed) {
            return null;
          }
          return { label: trimmed, url: trimmed };
        }
        if (typeof entry === 'object') {
          const linkObject = entry as HeaderContactLink & { label?: string; url?: string };
          const normalizedUrl = typeof linkObject.url === 'string' ? linkObject.url.trim() : '';
          if (!normalizedUrl) {
            return null;
          }
          const normalizedLabel =
            typeof linkObject.label === 'string' && linkObject.label.trim().length > 0
              ? linkObject.label.trim()
              : normalizedUrl;
          return { label: normalizedLabel, url: normalizedUrl };
        }
        return null;
      }).filter((link): link is HeaderContactLink => Boolean(link))
    : [];

  return (
    <header
      className={`pb-6 border-b border-neutral-200 transition-all ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-md' : ''
      }`}
      aria-label="Resume header"
    >
      {/* Full Name */}
      {fullName && (
        <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight mb-1">
          {fullName}
        </h1>
      )}

      {/* Job Title */}
      {title && (
        <p className="text-base text-neutral-600 mb-3">
          {title}
        </p>
      )}

      {/* Contact Info */}
      {contact && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
          {email && (
            <a
              href={`mailto:${email}`}
              className="hover:text-primary transition-colors"
              aria-label={`Email: ${email}`}
            >
              {email}
            </a>
          )}
          {phone && (
            <span aria-label={`Phone: ${phone}`}>
              {phone}
            </span>
          )}
          {location && (
            <span aria-label={`Location: ${location}`}>
              {location}
            </span>
          )}
          {safeLinks.length > 0 && safeLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label={`${link.label} (opens in new window)`}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* Show suggestions when block is selected */}
      {isSelected && suggestions && suggestions.length > 0 && blockId && (
        <BlockSuggestions
          blockId={blockId}
          suggestions={suggestions}
        />
      )}
    </header>
  );
}
