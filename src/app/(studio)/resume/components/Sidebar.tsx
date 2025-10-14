'use client';

import { Layers, Palette, Layout } from 'lucide-react';

interface SidebarProps {
  activeTab: 'layers' | 'themes' | 'templates';
  onTabChange: (tab: 'layers' | 'themes' | 'templates') => void;
  children: React.ReactNode;
}

export function Sidebar({ activeTab, onTabChange, children }: SidebarProps) {
  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Segmented Control */}
      <div className="flex-shrink-0 p-4 border-b" role="tablist" aria-label="Sidebar panels">
        <div className="min-w-0 grid grid-cols-3 gap-1 p-1 rounded-xl border bg-muted/30 shadow-sm">
          <button
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
          <button
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
          <button
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
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
