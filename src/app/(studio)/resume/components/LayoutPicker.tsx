'use client';

import { useMemo } from 'react';
import { Columns, Check } from 'lucide-react';
import type { LayoutDefinition } from '@/lib/templates';
import { TEMPLATE_DEFINITIONS } from '@/lib/templates';

interface LayoutPickerProps {
  currentTemplateSlug?: string;
  currentLayoutId?: string;
  onChangeLayout: (layout: LayoutDefinition) => void;
  disabled?: boolean;
}

const getLayoutButtonClasses = (isCurrent: boolean, isDisabled: boolean) => {
  const baseClasses =
    'w-full text-left p-4 rounded-xl border transition-all duration-200';

  let stateClasses: string;
  if (isCurrent) {
    stateClasses = 'border-primary bg-primary/5 ring-2 ring-primary shadow-sm';
  } else if (isDisabled) {
    stateClasses = 'border-border';
  } else {
    stateClasses = 'border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-md hover:scale-[1.02]';
  }

  const interactionClasses = isDisabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  return `${baseClasses} ${stateClasses} ${interactionClasses}`;
};

/**
 * LayoutPicker - UI component for switching resume layouts
 *
 * Displays available layouts for the current template and allows instant switching.
 * Phase 5: All templates use single-column layout. Future phases add multi-column layouts.
 *
 * @example
 * <LayoutPicker
 *   currentTemplateSlug="grid-compact"
 *   currentLayoutId="single-column"
 *   onChangeLayout={(layout) => editorActions.switchLayout(layout)}
 * />
 */
export const LayoutHeader = () => (
  <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-foreground">
    <Columns className="w-4 h-4" />
    Layout
  </h3>
);

function LayoutPicker({
  currentTemplateSlug,
  currentLayoutId,
  onChangeLayout,
  disabled,
}: LayoutPickerProps) {
  // Find layouts for current template
  const availableLayouts = useMemo(() => {
    const template = TEMPLATE_DEFINITIONS.find((t) => t.slug === currentTemplateSlug);
    return template?.layouts ?? [];
  }, [currentTemplateSlug]);

  // Empty state - no template selected
  if (!currentTemplateSlug) {
    return (
      <div className="p-4">
        <LayoutHeader />
        <div className="text-sm text-muted-foreground py-8 text-center">
          Select a template to view layouts
        </div>
      </div>
    );
  }

  // Empty state - template has no layouts
  if (availableLayouts.length === 0) {
    return (
      <div className="p-4">
        <LayoutHeader />
        <div className="text-sm text-muted-foreground py-8 text-center">
          No layouts available for this template
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <LayoutHeader />
      <div className="space-y-3">
        {availableLayouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => onChangeLayout(layout)}
            disabled={disabled}
            aria-pressed={currentLayoutId === layout.id}
            aria-label={`Select ${layout.name} layout`}
            className={getLayoutButtonClasses(
              currentLayoutId === layout.id,
              Boolean(disabled),
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{layout.name}</p>
                  {currentLayoutId === layout.id && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>

                {/* Layout region preview */}
                <p className="text-xs text-muted-foreground mt-1">
                  {layout.regions.length === 1
                    ? 'Single column'
                    : `${layout.regions.length} regions`}
                </p>
              </div>

              {/* Visual preview (simplified for Phase 5) */}
              <div className="flex gap-1 items-center flex-shrink-0">
                {layout.regions.map((region) => (
                  <div
                    key={region.id}
                    className="w-6 h-8 border border-muted-foreground/30 rounded-sm bg-muted/50"
                    title={region.label || region.id}
                  />
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
