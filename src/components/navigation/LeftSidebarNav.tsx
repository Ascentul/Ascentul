'use client';

import { Layers, Palette, LayoutTemplate, Lightbulb } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Detect platform for cross-platform keyboard shortcuts
const isMac = typeof window !== 'undefined' &&
  /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);
const modKey = isMac ? 'Cmd' : 'Ctrl';

type TabKey = 'layers' | 'themes' | 'templates' | 'coaching';

interface NavItem {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  shortcut: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'layers', label: 'Layers', icon: Layers, shortcut: 'L' },
  { key: 'themes', label: 'Themes', icon: Palette, shortcut: 'H' },
  { key: 'templates', label: 'Templates', icon: LayoutTemplate, shortcut: 'T' },
  { key: 'coaching', label: 'Coaching', icon: Lightbulb, shortcut: 'C' },
];

interface LeftSidebarNavProps {
  active: TabKey;
  onSelect: (key: TabKey) => void;
  showCoaching?: boolean;
}

export function LeftSidebarNav({
  active,
  onSelect,
  showCoaching = false,
}: LeftSidebarNavProps) {
  const visibleItems = NAV_ITEMS.filter(
    (item) => showCoaching || item.key !== 'coaching'
  );

  return (
    <aside
      className="h-full w-20 shrink-0 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="navigation"
      aria-label="Main navigation"
    >
      <TooltipProvider delayDuration={300}>
        <nav className="flex h-full flex-col items-center py-6 gap-3">
          {/* Navigation Items */}
          <div className="flex flex-col items-center gap-3 w-full px-3">
            {visibleItems.map(({ key, label, icon: Icon, shortcut }) => {
              const isActive = active === key;
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSelect(key)}
                      aria-label={label}
                      aria-pressed={isActive}
                      aria-current={isActive ? 'page' : undefined}
                      className={[
                        'group relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all',
                        'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                          : 'bg-card text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20',
                      ].join(' ')}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">{label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    <span>{label}</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      <span className="text-xs">{modKey}+⇧</span>
                      <span>{shortcut}</span>
                    </kbd>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Bottom Spacer - for future settings/profile button */}
          <div className="flex-1" />

          {/* Future: Settings or Profile Button */}
          {/* <div className="px-3 pb-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <Settings className="h-4 w-4" />
            </button>
          </div> */}
        </nav>
      </TooltipProvider>
    </aside>
  );
}
