"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { withTemplatePreview } from "@/lib/templates";
import { TemplateCard } from "@/components/templates/TemplateCard";

interface TemplatePickerProps {
  currentTemplate: string;
  onTemplateChange: (slug: string) => void;
}

export function TemplatePicker({ currentTemplate, onTemplateChange }: TemplatePickerProps) {
  const templates = useQuery(api.builder_templates.listTemplatesAll);

  if (!templates) {
    return <div className="text-sm text-muted-foreground">Loading templates...</div>;
  }

  const templateCards = useMemo(
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
