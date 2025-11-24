/**
 * Role Definition Synchronization Test
 *
 * This test ensures that role definitions stay in sync between:
 * - src/lib/constants/roles.ts (Next.js frontend)
 * - convex/lib/roleValidation.ts (Convex backend)
 *
 * Due to module boundary restrictions, these files cannot share imports,
 * so this test validates they haven't diverged.
 *
 * IMPLEMENTATION NOTE:
 * This test uses regex-based parsing which is more robust than the original
 * but still has limitations. For production systems at scale, consider:
 * - Option 1: Generate a convex/.generated/roles.json file during build
 * - Option 2: Use TypeScript Compiler API or AST parsing
 * - Option 3: Add a build-time validation script that fails CI if roles diverge
 *
 * The current approach handles most formatting variations but may break with:
 * - Complex multi-line strings
 * - Non-standard array formatting
 * - Heavy use of block comments within the array
 */

import { VALID_USER_ROLES } from '@/lib/constants/roles'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Role Definition Synchronization', () => {
  it('should have matching role definitions between frontend and Convex', () => {
    // Read the Convex roleValidation.ts file
    const convexFilePath = join(process.cwd(), 'convex', 'lib', 'roleValidation.ts')
    const convexFileContent = readFileSync(convexFilePath, 'utf-8')

    // Extract ROLE_VALUES array from Convex file using more robust regex
    // This regex handles:
    // - Different quote styles (single or double)
    // - Whitespace variations
    // - Comments within the array
    // - Trailing commas
    const roleValuesMatch = convexFileContent.match(
      /const\s+ROLE_VALUES\s*=\s*\[([\s\S]*?)\]\s*as\s+const/
    )

    if (!roleValuesMatch) {
      throw new Error('Could not find ROLE_VALUES in convex/lib/roleValidation.ts')
    }

    // Parse the roles from the Convex file
    // More robust parsing that handles various formatting styles
    const convexRolesString = roleValuesMatch[1]
    const convexRoles = convexRolesString
      .split('\n')
      .map(line => line.trim())
      // Remove inline comments
      .map(line => line.replace(/\/\/.*$/, '').trim())
      // Filter lines that start with quotes (single or double)
      .filter(line => line.match(/^["'][\w_]+["']/))
      // Extract the actual role string value
      .map(line => {
        const match = line.match(/^["']([\w_]+)["']/)
        return match ? match[1] : null
      })
      .filter((role): role is string => role !== null)

    // Get frontend roles
    const frontendRoles = [...VALID_USER_ROLES]

    // Compare arrays
    expect(convexRoles).toEqual(frontendRoles)
  })

  it('should have all expected roles defined', () => {
    const expectedRoles = [
      'super_admin',
      'university_admin',
      'advisor',
      'student',
      'individual',
      'staff',
      'user',
    ]

    expect([...VALID_USER_ROLES]).toEqual(expectedRoles)
  })
})
