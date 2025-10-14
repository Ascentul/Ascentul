'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { FileText, Loader2, Check, Layout } from 'lucide-react';
import Image from 'next/image';
import { getPreviewSrc, hasPreview } from '@/lib/template-preview';

interface TemplatePickerProps {
  currentTemplateSlug?: string;
  onChangeTemplate: (slug: string) => void;
  disabled?: boolean;
}

interface Template {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl?: string;
  pageSize?: string;
  allowedBlocks: string[];
}

export function TemplatePicker({ currentTemplateSlug, onChangeTemplate, disabled }: TemplatePickerProps) {
  const templates = useQuery(api.builder_templates.listTemplatesAll, {});

  // Loading state
  if (templates === undefined) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-foreground">
          <Layout className="w-4 h-4" />
          Templates
        </h3>
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading templates...
        </div>
      </div>
    );
  }

  // Empty state
  if (!templates || templates.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-foreground">
          <Layout className="w-4 h-4" />
          Templates
        </h3>
        <div className="text-sm text-muted-foreground py-8 text-center">
          No templates available
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-foreground">
        <Layout className="w-4 h-4" />
        Templates
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={currentTemplateSlug === template.slug}
            onSelect={() => !disabled && onChangeTemplate(template.slug)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function TemplateCard({ template, isSelected, onSelect, disabled }: TemplateCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const showPreview = hasPreview(template);
  const previewSrc = showPreview ? getPreviewSrc(template) : '';

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      aria-label={`Choose ${template.name} template`}
      className={`group relative flex flex-col gap-2.5 p-3 border rounded-xl transition-all duration-200 ${
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary shadow-sm'
          : 'border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-md hover:scale-[1.02]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Thumbnail */}
      <div className="aspect-[8.5/11] bg-muted rounded-lg flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 relative">
        {showPreview && previewSrc ? (
          <>
            {/* Skeleton loader */}
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted" />
            )}

            {/* Preview image */}
            <Image
              src={previewSrc}
              alt={`${template.name} template preview`}
              width={340}
              height={440}
              className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
              decoding="async"
            />
          </>
        ) : (
          <FileText
            className="h-8 w-8 text-gray-400 transition-colors group-hover:text-gray-500"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-xs truncate flex-1">{template.name}</h3>
          {isSelected && (
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {template.allowedBlocks.length} blocks
        </p>
      </div>
    </button>
  );
}
