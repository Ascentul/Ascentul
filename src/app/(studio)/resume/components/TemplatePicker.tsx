"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { Loader2, Layout } from "lucide-react";
import { withTemplatePreview } from "@/lib/templates";
import { TemplateCard } from "@/components/templates/TemplateCard";

type TemplateFromQuery = FunctionReturnType<typeof api.builder_templates.listTemplatesAll>[number];

interface TemplatePickerProps {
  currentTemplateSlug?: string;
  onChangeTemplate: (slug: string) => void;
  disabled?: boolean;
}

export function TemplatePicker({ currentTemplateSlug, onChangeTemplate, disabled }: TemplatePickerProps) {
  // Convex surfaces errors via React error boundaries; this hook returns undefined while loading
  const templates = useQuery(api.builder_templates.listTemplatesAll, {});

  // Memoize template enrichment to avoid re-running on every render
  const enrichedTemplates = useMemo(() => {
    return templates?.map((template) => withTemplatePreview(template)) ?? [];
  }, [templates]);

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
  if (enrichedTemplates.length === 0) {
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
        {enrichedTemplates.map((enriched) => {
          return (
            <TemplateCard
              key={enriched.id}
              template={enriched}
              isSelected={currentTemplateSlug === enriched.slug}
              onSelect={onChangeTemplate}
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
}
