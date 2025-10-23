'use client';

/**
 * @deprecated This component is being phased out in favor of LeftSidebarNav + content panels.
 * The horizontal toggle has been removed. This wrapper now only provides the panel container.
 */

interface SidebarProps {
  activeTab: 'layers' | 'themes' | 'templates' | 'coaching';
  children: React.ReactNode;
  showCoaching?: boolean;
}

export function Sidebar({ activeTab, children }: SidebarProps) {
  return (
    <div className="h-full flex flex-col bg-background border-r w-80">
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
