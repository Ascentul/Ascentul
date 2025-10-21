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
 * **Phase 5 Implementation:**
 * Currently returns a single-column layout for all templates.
 * The `_templateSlug` parameter is unused but reserved for future phases.
 *
 * **Future Phases:**
 * When template-specific layouts are added, this function may return `null`
 * for unknown templates. At that point, the return type should be changed to
 * `LayoutDefinition | null` and callers should handle the null case.
 *
 * @param _templateSlug - Template slug (reserved for future template lookup)
 * @returns Single-column layout definition
 */
export function getDefaultLayout(_templateSlug: string): LayoutDefinition {
  // For Phase 5, all templates use the same single-column layout
  // Future phases can look up template-specific layouts from a registry
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
