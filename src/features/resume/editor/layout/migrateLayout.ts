import type { LayoutDefinition, LayoutMigrationArgs, LayoutMigrationResult } from '@/lib/templates';

/**
 * Execute layout migration using the target layout's migration function
 *
 * @param targetLayout - Layout definition to migrate to
 * @param args - Migration arguments (block IDs and types)
 * @returns Migration result with region assignments and overflow
 */
export function migrateLayout(
  targetLayout: LayoutDefinition,
  args: LayoutMigrationArgs
): LayoutMigrationResult {
  return targetLayout.migrateMapContent(args);
}

/**
 * Get default layout from template definitions
 *
 * @param templateSlug - Template slug to find
 * @returns Default single-column layout or null
 */
export function getDefaultLayout(templateSlug: string): LayoutDefinition | null {
  // For Phase 5, all templates use the same single-column layout
  // Future phases can look up template-specific layouts
  return {
    id: 'single-column',
    name: 'Single Column',
    regions: [{ id: 'main', label: 'Main Content', semantic: 'main' }],
    migrateMapContent: ({ blockIds }) => ({
      regionAssignments: { main: blockIds },
      overflow: [],
    }),
  };
}
