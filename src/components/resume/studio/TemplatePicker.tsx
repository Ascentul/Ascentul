'use client';

import { useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Check } from 'lucide-react';

interface TemplatePickerProps {
  currentTemplate: string;
  onTemplateChange: (slug: string) => void;
}

export function TemplatePicker({ currentTemplate, onTemplateChange }: TemplatePickerProps) {
  const templates = useQuery(api.builder_templates.listTemplatesAll);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  if (!templates) {
    return <div className="text-sm text-muted-foreground">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-2">Choose a Template</h3>
        <p className="text-xs text-muted-foreground">
          Select a layout for your resume
        </p>
      </div>

      <div className="space-y-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              currentTemplate === template.slug ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onTemplateChange(template.slug)}
          >
            <CardContent className="p-4">
              {/* Template Preview */}
              {(() => {
                const previewBase = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL || '/previews';
                const previewUrl = template.thumbnailUrl || `${previewBase}/template-${template.slug}.png`;
                const hasError = imageErrors.has(template.id);

                return (
                  <>
                    {!hasError && (
                      <img
                        src={previewUrl}
                        alt={template.name}
                        className="w-full h-32 object-cover rounded mb-3"
                        onError={() =>
                          setImageErrors((prev) => {
                            const next = new Set(prev);
                            next.add(template.id);
                            return next;
                          })
                        }
                      />
                    )}
                    {hasError && (
                      <div className="w-full h-32 bg-muted rounded mb-3 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Template Info */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Page: {template.pageSize}</p>
                    <p>{template.allowedBlocks.length} block types</p>
                  </div>
                </div>
                {currentTemplate === template.slug && (
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
