'use client';

import type { ReactNode } from 'react';
import type { Block } from '@/lib/resume-types';
import type { VisualTheme } from '@/features/resume/themes/visual-theme-types';
import { SIDEBAR_WIDTHS } from '@/features/resume/themes/visual-theme-types';
import { getSidebarClasses, isDarkColor } from '@/features/resume/themes/ensure-contrast';

export interface TemplateRendererProps {
  templateSlug: string;
  blocks: Block[];
  renderBlock: (block: Block) => ReactNode;
  theme?: VisualTheme;
}

/**
 * TemplateRenderer - Renders blocks with template layout AND visual theme
 *
 * Combines:
 * - Template layouts (grid, sidebar, timeline, etc.)
 * - Visual themes (colors, typography, spacing)
 * - Export-safe styling
 */
export function TemplateRenderer({
  templateSlug,
  blocks,
  renderBlock,
  theme,
}: TemplateRendererProps) {
  // Group blocks by type for template-specific layouts
  const blocksByType = blocks.reduce((acc, block) => {
    if (!acc[block.type]) acc[block.type] = [];
    acc[block.type].push(block);
    return acc;
  }, {} as Record<string, Block[]>);

  const headerBlocks = blocksByType.header || [];
  const summaryBlocks = blocksByType.summary || [];
  const experienceBlocks = blocksByType.experience || [];
  const educationBlocks = blocksByType.education || [];
  const skillsBlocks = blocksByType.skills || [];
  const projectsBlocks = blocksByType.projects || [];
  const customBlocks = blocksByType.custom || [];

  // Apply theme classes
  const pageClasses = theme?.components.page || 'bg-white text-gray-800';
  const sidebarConfig = theme?.components.sidebar;
  const sidebarWidth = sidebarConfig?.width ? SIDEBAR_WIDTHS[sidebarConfig.width] : 'w-[240px]';

  // Helper to wrap sections with theme styling
  const SectionHeader = ({ title }: { title: string }) => {
    if (!theme?.components.sectionHeader) {
      return <h2 className="text-xl font-bold mb-3">{title}</h2>;
    }

    const { title: titleClass, underline, underlineClass, gapClass } = theme.components.sectionHeader;

    return (
      <div className={gapClass || 'mb-3'}>
        <h2 className={titleClass}>{title}</h2>
        {underline && <div className={underlineClass || 'h-[2px] w-10 bg-gray-300 mt-1'} />}
      </div>
    );
  };

  // Render with sidebar if theme has sidebar enabled
  if (sidebarConfig?.enabled) {
    const isLeft = sidebarConfig.align === 'left';
    const sidebarBg = theme?.palette.surfaceAlt || '#0B1F3B';
    const sidebarClasses = getSidebarClasses(sidebarBg);

    // Calculate widths (816px = 8.5in at 96dpi)
    const sidebarWidthPx = sidebarConfig.width === 'narrow' ? 200 :
                           sidebarConfig.width === 'wide' ? 280 : 248;
    const mainWidthPx = 816 - sidebarWidthPx;

    // Sidebar blocks (typically header, skills, education)
    const sidebarBlocks = [
      ...headerBlocks,
      ...skillsBlocks,
      ...educationBlocks,
    ];

    // Main content blocks
    const mainBlocks = [
      ...summaryBlocks,
      ...experienceBlocks,
      ...projectsBlocks,
      ...customBlocks,
    ];

    return (
      <div className="relative w-full h-full overflow-hidden">
        {/* Sidebar - Full height, absolute positioned */}
        <aside
          className={`absolute top-0 h-full ${isLeft ? 'left-0' : 'right-0'} px-7 py-8 [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white [&_h4]:!text-white [&_p]:!text-white [&_a]:!text-white`}
          style={{
            width: `${sidebarWidthPx}px`,
            backgroundColor: sidebarBg,
            color: isDarkColor(sidebarBg) ? 'white' : 'rgb(31, 41, 55)',
          }}
        >
          <div className="space-y-6">
            {sidebarBlocks.map((block) => (
              <div key={block._id}>
                {renderBlock(block)}
              </div>
            ))}
          </div>
        </aside>

        {/* Main content - Full height, absolute positioned */}
        <main
          className={`absolute top-0 h-full px-10 py-8 ${isLeft ? 'right-0' : 'left-0'}`}
          style={{ width: `${mainWidthPx}px` }}
        >
          <div className="space-y-6">
            {mainBlocks.map((block) => (
              <div key={block._id}>
                {renderBlock(block)}
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Layout rendering based on template slug (without sidebar)
  switch (templateSlug) {
    case 'grid-compact':
      return (
        <div className={`grid-compact-template space-y-3 px-10 py-8 ${pageClasses}`}>
          {headerBlocks.map((block) => renderBlock(block))}
          {summaryBlocks.map((block) => renderBlock(block))}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              {experienceBlocks.map((block) => renderBlock(block))}
              {projectsBlocks.map((block) => renderBlock(block))}
            </div>
            <div className="space-y-3">
              {educationBlocks.map((block) => renderBlock(block))}
              {skillsBlocks.map((block) => renderBlock(block))}
              {customBlocks.map((block) => renderBlock(block))}
            </div>
          </div>
        </div>
      );

    case 'minimal-serif':
      return (
        <div className={`minimal-serif-template space-y-8 px-10 py-8 ${pageClasses}`}>
          <div className="space-y-6">
            {headerBlocks.map((block) => renderBlock(block))}
          </div>
          <div className="space-y-6 text-lg leading-relaxed">
            {summaryBlocks.map((block) => renderBlock(block))}
          </div>
          <div className="space-y-8">
            {experienceBlocks.map((block) => renderBlock(block))}
            {educationBlocks.map((block) => renderBlock(block))}
            {skillsBlocks.map((block) => renderBlock(block))}
            {customBlocks.map((block) => renderBlock(block))}
          </div>
        </div>
      );

    case 'modern-clean':
      return (
        <div className={`modern-clean-template space-y-5 px-10 py-8 ${pageClasses}`}>
          <div className={theme?.components.sectionHeader.underlineClass ? 'border-b-2 pb-4' : ''}>
            {headerBlocks.map((block) => renderBlock(block))}
          </div>
          <div className="bg-muted/20 p-4 rounded-lg">
            {summaryBlocks.map((block) => renderBlock(block))}
          </div>
          <div className="space-y-5">
            {experienceBlocks.map((block) => renderBlock(block))}
            {projectsBlocks.map((block) => renderBlock(block))}
            {educationBlocks.map((block) => renderBlock(block))}
            {skillsBlocks.map((block) => renderBlock(block))}
            {customBlocks.map((block) => renderBlock(block))}
          </div>
        </div>
      );

    case 'product-designer':
      return (
        <div className={`product-designer-template px-10 py-8 ${pageClasses}`}>
          <div className="mb-6">
            {headerBlocks.map((block) => renderBlock(block))}
          </div>

          {projectsBlocks.length > 0 && (
            <div className="mb-6">
              <SectionHeader title="Featured Projects" />
              <div className="grid grid-cols-2 gap-4">
                {projectsBlocks.map((block) => renderBlock(block))}
              </div>
            </div>
          )}

          <div className="space-y-5">
            {summaryBlocks.map((block) => renderBlock(block))}
            {experienceBlocks.map((block) => renderBlock(block))}
            {educationBlocks.map((block) => renderBlock(block))}
            {skillsBlocks.map((block) => renderBlock(block))}
            {customBlocks.map((block) => renderBlock(block))}
          </div>
        </div>
      );

    case 'timeline':
      return (
        <div className={`timeline-template px-10 py-8 ${pageClasses}`}>
          <div className="mb-6">
            {headerBlocks.map((block) => renderBlock(block))}
          </div>

          {summaryBlocks.map((block) => renderBlock(block))}

          <div className="relative pl-8 border-l-2 border-primary space-y-6 mt-6">
            {experienceBlocks.map((block) => (
              <div key={block._id} className="relative">
                <div className="absolute -left-[33px] w-4 h-4 rounded-full bg-primary border-2 border-white" />
                {renderBlock(block)}
              </div>
            ))}

            {educationBlocks.map((block) => (
              <div key={block._id} className="relative">
                <div className="absolute -left-[33px] w-4 h-4 rounded-full bg-primary border-2 border-white" />
                {renderBlock(block)}
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {skillsBlocks.map((block) => renderBlock(block))}
            {projectsBlocks.map((block) => renderBlock(block))}
            {customBlocks.map((block) => renderBlock(block))}
          </div>
        </div>
      );

    default:
      // Default single column layout with theme styling
      return (
        <div className={`default-template space-y-6 px-10 py-8 ${pageClasses}`}>
          {blocks.map((block) => renderBlock(block))}
        </div>
      );
  }
}
