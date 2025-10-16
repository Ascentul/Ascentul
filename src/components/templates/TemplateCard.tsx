import { useState } from 'react';
import Image from 'next/image';
import { Check, FileText } from 'lucide-react';
import { getPreviewSrc } from '@/lib/templates/getPreviewSrc';
import type { TemplatePreviewSource } from '@/lib/templates';
import clsx from 'clsx';

export interface TemplateSummary extends TemplatePreviewSource {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  pageSize?: string | null;
  allowedBlocks: string[];
  preview?: string | null;
}

export interface TemplateCardProps {
  template: TemplateSummary;
  isSelected?: boolean;
  disabled?: boolean;
  onSelect?: (slug: string) => void;
}

export function TemplateCard({ template, isSelected = false, disabled = false, onSelect }: TemplateCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const previewSrc = getPreviewSrc({
    preview: template.preview ?? '',
    previewAssetId: template.previewAssetId,
  });

  const canShowImage = Boolean(previewSrc) && !hasImageError;
  const handleSelect = () => {
    if (!disabled) {
      onSelect?.(template.slug);
    }
  };

  return (
    <article
      className={clsx(
        'flex h-full flex-col gap-3 rounded-xl border p-4 transition-all duration-200',
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary'
          : 'border-border hover:border-primary/40 hover:shadow-md',
        disabled && 'cursor-not-allowed opacity-60',
      )}
      aria-disabled={disabled}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border bg-gray-50">
        {canShowImage ? (
      <>
        {!isImageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />
        )}
        <Image
          src={previewSrc}
          alt={template.name}
          width={480}
          height={300}
          className="rounded-lg border object-cover w-full h-full bg-gray-50"
          onError={() => setHasImageError(true)}
          onLoadingComplete={() => setIsImageLoaded(true)}
        />
      </>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-muted-foreground"
            data-testid="template-fallback-icon"
          >
            <FileText className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
        {isSelected && (
          <span className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{template.name}</h4>
          {template.description && (
            <p className="text-xs text-muted-foreground">{template.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{template.pageSize ?? 'Letter'}</span>
          <span>{template.allowedBlocks.length} block{template.allowedBlocks.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div className="mt-auto flex justify-end">
        <button
          type="button"
          onClick={handleSelect}
          disabled={disabled}
          aria-label={`Select ${template.name} template`}
          aria-pressed={isSelected}
          className={clsx(
            'inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
            disabled
              ? 'cursor-not-allowed opacity-50'
              : isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-white hover:border-primary hover:text-primary',
          )}
        >
          {isSelected ? 'Selected' : 'Select'}
        </button>
      </div>
    </article>
  );
}
