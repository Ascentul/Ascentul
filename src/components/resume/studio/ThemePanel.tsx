'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import type { Id } from '../../../../convex/_generated/dataModel';

interface ThemePanelProps {
  currentThemeId?: Id<'builder_resume_themes'>;
  onThemeChange: (themeId: Id<'builder_resume_themes'>) => void;
}

export function ThemePanel({ currentThemeId, onThemeChange }: ThemePanelProps) {
  const themes = useQuery(api.builder_themes.listThemes);

  if (!themes) {
    return <div className="text-sm text-muted-foreground">Loading themes...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-2">Choose a Theme</h3>
        <p className="text-xs text-muted-foreground">
          Customize fonts and colors for your resume
        </p>
      </div>

      <div className="space-y-3">
        {themes.map((theme) => (
          <Card
            key={theme.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              currentThemeId === theme.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onThemeChange(theme.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-sm">{theme.name}</h4>
                {currentThemeId === theme.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>

              {/* Font Preview */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Heading: </span>
                  <span style={{ fontFamily: theme.fonts.heading }}>
                    {theme.fonts.heading}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Body: </span>
                  <span style={{ fontFamily: theme.fonts.body }}>
                    {theme.fonts.body}
                  </span>
                </div>
              </div>

              {/* Color Preview */}
              <div className="flex gap-2 mt-3">
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: theme.colors.primary }}
                  title="Primary"
                />
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: theme.colors.text }}
                  title="Text"
                />
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: theme.colors.accent }}
                  title="Accent"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
