'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { Loader2, Palette, Check } from 'lucide-react';

interface ThemePanelProps {
  currentThemeId?: Id<"builder_resume_themes">;
  onChangeTheme: (themeId: Id<"builder_resume_themes">) => void;
  disabled?: boolean;
}

const getThemeButtonClasses = (isCurrent: boolean, isDisabled: boolean) => {
  const baseClasses =
    'w-full text-left p-4 rounded-xl border transition-all duration-200';

  const stateClasses = isCurrent
    ? 'border-primary bg-primary/5 ring-2 ring-primary shadow-sm'
    : isDisabled
      ? 'border-border'
      : 'border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-md hover:scale-[1.02]';

  const interactionClasses = isDisabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  return `${baseClasses} ${stateClasses} ${interactionClasses}`;
};

export function ThemePanel({ currentThemeId, onChangeTheme, disabled }: ThemePanelProps) {
  const themes = useQuery(api.builder_themes.listThemesAll, {});

  // Loading state
  if (themes === undefined) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Themes
        </h3>
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading themes...
        </div>
      </div>
    );
  }

  // Empty state
  if (themes.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Themes
        </h3>
        <div className="text-sm text-muted-foreground py-8 text-center">
          No themes available
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium mb-4 flex items-center gap-2 text-foreground">
        <Palette className="w-4 h-4" />
        Themes
      </h3>
      <div className="space-y-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onChangeTheme(theme.id)}
            disabled={disabled}
            className={getThemeButtonClasses(
              currentThemeId === theme.id,
              Boolean(disabled),
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{theme.name}</p>
                  {currentThemeId === theme.id && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>

                {/* Font Preview */}
                {theme.fonts && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {theme.fonts.heading || theme.fonts.body || 'Default fonts'}
                  </p>
                )}
              </div>

              {/* Color Swatches */}
              {theme.colors && (
                <div className="flex gap-1.5 flex-shrink-0">
                  {theme.colors.primary && (
                    <div
                      className="w-6 h-6 rounded-md border border-border shadow-sm transition-transform hover:scale-110"
                      style={{ backgroundColor: theme.colors.primary }}
                      title="Primary color"
                    />
                  )}
                  {theme.colors.secondary && (
                    <div
                      className="w-6 h-6 rounded-md border border-border shadow-sm transition-transform hover:scale-110"
                      style={{ backgroundColor: theme.colors.secondary }}
                      title="Secondary color"
                    />
                  )}
                  {theme.colors.accent && (
                    <div
                      className="w-6 h-6 rounded-md border border-border shadow-sm transition-transform hover:scale-110"
                      style={{ backgroundColor: theme.colors.accent }}
                      title="Accent color"
                    />
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
