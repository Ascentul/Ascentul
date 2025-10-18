"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { withTemplatePreview } from "@/lib/templates";
import { TemplateCard } from "@/components/templates/TemplateCard";

type TemplateFromQuery = FunctionReturnType<typeof api.builder_templates.listTemplatesAll>[number];

interface TemplatePickerProps {
  currentTemplate: string;
  onTemplateChange: (slug: string) => void;
}

export function TemplatePicker({ currentTemplate, onTemplateChange }: TemplatePickerProps) {
  // Convex useQuery returns undefined while loading, or the data when ready
  // For per-query error handling without Error Boundaries, we rely on Convex's error handling:
  // - useQuery throws errors that are caught by Error Boundaries (current approach)
  // - Alternative: Use Convex's error state mechanisms if available in future versions
  //
  // Note: Wrapping useQuery in try/catch violates Rules of Hooks (hooks must be called unconditionally)
  // If you need inline error UI, consider:
  // 1. Wrapping this component with an Error Boundary
  // 2. Using Convex's error state API if/when available (check Convex docs for latest patterns)
  const templates = useQuery(api.builder_templates.listTemplatesAll);

  // Loading state
  if (templates === undefined) {
    return <div className="text-sm text-muted-foreground">Loading templates...</div>;
  }

  // Note: If templates query fails, the error will be caught by an Error Boundary
  // at a higher level in the component tree. To add custom error UI:
  // - Wrap <TemplatePicker /> with a React Error Boundary component
  // - Or check Convex documentation for the latest error handling patterns

  const templateCards = useMemo<ReturnType<typeof withTemplatePreview>[]>(
    () => templates.map((template) => withTemplatePreview(template)),
    [templates],
  );

  const header = (
    <div>
      <h3 className="font-semibold text-sm mb-2">Choose a Template</h3>
      <p className="text-xs text-muted-foreground">
        Select a layout for your resume
      </p>
    </div>
  );

  if (templateCards.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <div className="text-sm text-muted-foreground">
          No templates available.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}

      <div className="grid gap-3">
        {templateCards.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={currentTemplate === template.slug}
            onSelect={onTemplateChange}
          />
        ))}
      </div>
    </div>
  );
}
