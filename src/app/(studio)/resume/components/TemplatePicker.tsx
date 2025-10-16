"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Loader2, Layout } from "lucide-react";
import { withTemplatePreview } from "@/lib/templates";
import { TemplateCard } from "@/components/templates/TemplateCard";

interface TemplatePickerProps {
  currentTemplateSlug?: string;
  onChangeTemplate: (slug: string) => void;
  disabled?: boolean;
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
        {templates.map((template) => {
          const enriched = withTemplatePreview(template);
          return (
            <TemplateCard
              key={template.id}
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
