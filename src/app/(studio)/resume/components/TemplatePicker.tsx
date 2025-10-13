'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { FileText, Loader2, AlertCircle } from 'lucide-react';

interface TemplatePickerProps {
  onSelect: (slug: string) => void;
}

interface Template {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl?: string;
  pageSize?: string;
  allowedBlocks: string[];
}

interface TemplateCardProps {
  template: Template;
  onSelect: (slug: string) => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template.slug)}
      aria-label={`Choose ${template.name}`}
      className="w-full text-left rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      {/* Thumbnail */}
      <div className="mb-3 flex h-32 items-center justify-center rounded bg-gray-50">
        {template.thumbnailUrl ? (
          <img
            src={template.thumbnailUrl}
            alt={template.name}
            className="h-full w-full rounded object-cover"
          />
        ) : (
          <FileText className="h-8 w-8 text-gray-400" aria-hidden="true" />
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="font-medium text-sm">{template.name}</h3>
        <div className="text-xs text-gray-500 space-y-0.5">
          {template.pageSize && <p>Page: {template.pageSize}</p>}
          <p>{template.allowedBlocks.length} block types</p>
        </div>
      </div>
    </button>
  );
}

export default function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const router = useRouter();
  const [seedError, setSeedError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const templates = useQuery(api.builder_templates.listTemplatesAll, {});

  const handleSeed = async () => {
    setSeedError(null);
    setIsSeeding(true);

    try {
      const response = await fetch('/api/dev/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to seed templates');
      }

      // Convex will automatically update the query when data changes
      router.refresh();
    } catch (error: unknown) {
      setSeedError(error instanceof Error ? error.message : 'Failed to seed templates. Please try again.');
    } finally {
      setIsSeeding(false);
    }
  };

  // Loading state
  if (templates === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Loading templates...</span>
        </div>
      </div>
    );
  }

  // Error state (if query fails)
  if (templates === null) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-3" aria-hidden="true" />
        <p className="text-sm font-medium text-gray-900 mb-2">Could not load templates</p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="text-sm text-blue-600 hover:text-blue-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state with seed action
  if (templates.length === 0) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">No templates found</h2>
          <p className="text-sm text-gray-500">
            Seed default templates and themes to get started.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSeed}
            disabled={isSeeding}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
          >
            {isSeeding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Seeding...</span>
              </>
            ) : (
              <span>Seed now</span>
            )}
          </button>

          {seedError && (
            <div className="text-sm text-red-600" role="alert">
              {seedError}
            </div>
          )}

          <p className="text-xs text-gray-500">
            This one time seed adds several modern templates.
          </p>
        </div>
      </div>
    );
  }

  // Normal state - show template grid
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
