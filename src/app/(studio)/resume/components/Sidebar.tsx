'use client';

import { Layers, Palette, Layout, Lightbulb } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarProps {
  activeTab: 'layers' | 'themes' | 'templates' | 'coaching';
  onTabChange: (tab: 'layers' | 'themes' | 'templates' | 'coaching') => void;
  children: React.ReactNode;
  showCoaching?: boolean;
}

export function Sidebar({ activeTab, onTabChange, children, showCoaching = false }: SidebarProps) {
  const gridCols = showCoaching ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Segmented Control */}
      <div className="flex-shrink-0 p-4 border-b" role="tablist" aria-label="Sidebar panels">
        <div className={`min-w-0 grid ${gridCols} gap-1 p-1 rounded-xl border bg-muted/30 shadow-sm`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                id="layers-tab"
                role="tab"
                aria-selected={activeTab === 'layers'}
                aria-current={activeTab === 'layers' ? 'page' : undefined}
                aria-controls="layers-panel"
                onClick={() => onTabChange('layers')}
                data-active={activeTab === 'layers'}
                className="min-w-0 overflow-hidden inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary data-[active=true]:bg-white data-[active=true]:text-foreground data-[active=true]:shadow-md"
              >
                <Layers className="w-4 h-4 flex-shrink-0" />
                <span className="block max-w-full truncate">Layers</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">
                Cmd+Shift+L <span className="text-muted-foreground">(Ctrl+Shift+L on Windows)</span>
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                id="themes-tab"
                role="tab"
                aria-selected={activeTab === 'themes'}
                aria-current={activeTab === 'themes' ? 'page' : undefined}
                aria-controls="themes-panel"
                onClick={() => onTabChange('themes')}
                data-active={activeTab === 'themes'}
                className="min-w-0 overflow-hidden inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary data-[active=true]:bg-white data-[active=true]:text-foreground data-[active=true]:shadow-md"
              >
                <Palette className="w-4 h-4 flex-shrink-0" />
                <span className="block max-w-full truncate">Themes</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">
                Cmd+Shift+H <span className="text-muted-foreground">(Ctrl+Shift+H on Windows)</span>
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                id="templates-tab"
                role="tab"
                aria-selected={activeTab === 'templates'}
                aria-current={activeTab === 'templates' ? 'page' : undefined}
                aria-controls="templates-panel"
                onClick={() => onTabChange('templates')}
                data-active={activeTab === 'templates'}
                className="min-w-0 overflow-hidden inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary data-[active=true]:bg-white data-[active=true]:text-foreground data-[active=true]:shadow-md"
              >
                <Layout className="w-4 h-4 flex-shrink-0" />
                <span className="block max-w-full truncate">Templates</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">
                Cmd+Shift+T <span className="text-muted-foreground">(Ctrl+Shift+T on Windows)</span>
              </p>
            </TooltipContent>
          </Tooltip>

          {showCoaching && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  id="coaching-tab"
                  role="tab"
                  aria-selected={activeTab === 'coaching'}
                  aria-current={activeTab === 'coaching' ? 'page' : undefined}
                  aria-controls="coaching-panel"
                  onClick={() => onTabChange('coaching')}
                  data-active={activeTab === 'coaching'}
                  className="min-w-0 overflow-hidden inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary data-[active=true]:bg-white data-[active=true]:text-foreground data-[active=true]:shadow-md"
                >
                  <Lightbulb className="w-4 h-4 flex-shrink-0" />
                  <span className="block max-w-full truncate">Coaching</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">AI-powered suggestions</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        role="tabpanel"
        id={`${activeTab}-panel`}
        aria-labelledby={`${activeTab}-tab`}
        tabIndex={0}
        className="flex-1 overflow-y-auto"
      >
        {children}
      </div>
    </div>
  );
}
