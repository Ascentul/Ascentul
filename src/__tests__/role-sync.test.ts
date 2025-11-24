/**
 * Role Definition Synchronization Test
 *
 * This test ensures that role definitions stay in sync between:
 * - src/lib/constants/roles.ts (Next.js frontend)
 * - convex/lib/roleValidation.ts (Convex backend)
 *
 * Due to module boundary restrictions, these files cannot share imports,
 * so this test validates they haven't diverged.
 */

import { VALID_USER_ROLES } from '@/lib/constants/roles'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Role Definition Synchronization', () => {
  it('should have matching role definitions between frontend and Convex', () => {
    // Read the Convex roleValidation.ts file
    const convexFilePath = join(process.cwd(), 'convex', 'lib', 'roleValidation.ts')
    const convexFileContent = readFileSync(convexFilePath, 'utf-8')

    // Extract ROLE_VALUES array from Convex file using regex
    // WARNING: This regex depends on exact formatting of convex/lib/roleValidation.ts
    // If the file format changes, this test will break
    const roleValuesMatch = convexFileContent.match(
      /const ROLE_VALUES = \[([\s\S]*?)\] as const/
    )

    if (!roleValuesMatch) {
      throw new Error('Could not find ROLE_VALUES in convex/lib/roleValidation.ts')
    }

    // Parse the roles from the Convex file
    const convexRolesString = roleValuesMatch[1]
    const convexRoles = convexRolesString
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('"'))
      .map(line => line.replace(/^"|",$|",$/g, ''))

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
