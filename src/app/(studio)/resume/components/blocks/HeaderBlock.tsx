import type { HeaderContactLink, HeaderData } from '@/lib/resume/types';
import { BlockSuggestions } from '../BlockSuggestions';
import type { ContentSuggestion } from '@/lib/ai/suggestions';
import { ExternalLink } from 'lucide-react';

const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return /^(mailto:|tel:).+/.test(url) || /^https?:\/\/.+/.test(url);
  }
};

interface HeaderBlockProps {
  data: HeaderData;
  isSelected?: boolean;
  suggestions?: ContentSuggestion[];
  blockId?: string;
}

export function HeaderBlock({ data, isSelected, suggestions, blockId }: HeaderBlockProps) {
  const { fullName, title, contact } = data;
  const { email, phone, location, links } = contact || {};
  const rawLinks: unknown[] = Array.isArray(links) ? links : [];
  const safeLinks: HeaderContactLink[] = rawLinks
    .map((entry) => {
      if (!entry) {
        return null;
      }
      if (typeof entry === 'string') {
        const trimmed = entry.trim();
        if (!trimmed || !isValidUrl(trimmed)) {
          return null;
        }
        return { label: trimmed, url: trimmed };
      }
      if (typeof entry === 'object' && entry !== null) {
        const candidate = entry as Record<string, unknown>;
        const rawUrl = typeof candidate.url === 'string' ? candidate.url.trim() : '';
        if (!rawUrl || !isValidUrl(rawUrl)) {
          return null;
        }
        const rawLabel = typeof candidate.label === 'string' ? candidate.label.trim() : '';
        const normalizedLabel = rawLabel.length > 0 ? rawLabel : rawUrl;
        return { label: normalizedLabel, url: rawUrl };
      }
      return null;
    })
    .filter((link): link is HeaderContactLink => Boolean(link));

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
              className="hover:text-primary transition-colors inline-flex items-center gap-1"
              aria-label={`${link.label} (opens in new window)`}
            >
              {link.label}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          ))}
        </div>
      )}

      {/* Show suggestions when block is selected */}
      {isSelected && blockId && suggestions?.length > 0 && (
        <BlockSuggestions
          blockId={blockId}
          suggestions={suggestions}
        />
      )}
    </header>
  );
}
