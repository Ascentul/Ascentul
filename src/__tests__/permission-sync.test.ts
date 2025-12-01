/**
 * Permission Definition Synchronization Test
 *
 * This test ensures that permission definitions stay in sync between:
 * - src/components/auth/PermissionGate.tsx (Next.js frontend)
 * - convex/lib/permissions.ts (Convex backend)
 *
 * Due to module boundary restrictions (Convex can't import from Next.js src/,
 * and client components can't import from convex/), these files cannot share
 * imports directly. This test validates they haven't diverged.
 *
 * Run this test after modifying permissions in either location.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('Permission Definition Synchronization', () => {
  /**
   * Extract PERMISSIONS object from a TypeScript file
   * Uses regex-based parsing to handle the const object format
   */
  function extractPermissions(fileContent: string, varName: string): Record<string, string[]> {
    // Match the PERMISSIONS object declaration
    const objectMatch = fileContent.match(
      new RegExp(`(?:export\\s+)?const\\s+${varName}\\s*=\\s*\\{([\\s\\S]*?)\\}\\s*as\\s+const`),
    );

    if (!objectMatch) {
      throw new Error(`Could not find ${varName} in file`);
    }

    const objectContent = objectMatch[1];
    const permissions: Record<string, string[]> = {};

    // Match each permission line: 'permission.name': ['role1', 'role2', ...]
    // Handle both single-line and multi-line array formats
    const permissionRegex = /['"]([a-z_.]+)['"]\s*:\s*\[([^\]]*)\]/g;
    let match;

    while ((match = permissionRegex.exec(objectContent)) !== null) {
      const permissionName = match[1];
      const rolesString = match[2];

      // Extract role strings from the array
      const roles = rolesString
        .split(',')
        .map((r) => r.trim())
        .filter((r) => r.length > 0)
        .map((r) => {
          // Remove quotes and whitespace
          const roleMatch = r.match(/['"]([^'"]+)['"]/);
          return roleMatch ? roleMatch[1] : null;
        })
        .filter((r): r is string => r !== null);

      permissions[permissionName] = roles;
    }

    return permissions;
  }

  it('should have matching permission definitions between frontend and Convex', () => {
    // Read frontend permissions
    const frontendFilePath = join(process.cwd(), 'src', 'components', 'auth', 'PermissionGate.tsx');
    const frontendContent = readFileSync(frontendFilePath, 'utf-8');
    const frontendPermissions = extractPermissions(frontendContent, 'PERMISSIONS');

    // Read backend permissions
    const backendFilePath = join(process.cwd(), 'convex', 'lib', 'permissions.ts');
    const backendContent = readFileSync(backendFilePath, 'utf-8');
    const backendPermissions = extractPermissions(backendContent, 'PERMISSIONS');

    // Compare permission keys
    const frontendKeys = Object.keys(frontendPermissions).sort();
    const backendKeys = Object.keys(backendPermissions).sort();

    // Check that both have the same permission keys
    expect(frontendKeys).toEqual(backendKeys);

    // Check that each permission has the same roles
    for (const key of frontendKeys) {
      const frontendRoles = [...frontendPermissions[key]].sort();
      const backendRoles = [...backendPermissions[key]].sort();

      expect(frontendRoles).toEqual(backendRoles);
    }
  });

  it('should have all expected platform permissions defined in frontend', () => {
    const frontendFilePath = join(process.cwd(), 'src', 'components', 'auth', 'PermissionGate.tsx');
    const frontendContent = readFileSync(frontendFilePath, 'utf-8');
    const frontendPermissions = extractPermissions(frontendContent, 'PERMISSIONS');

    // Core platform permissions that must exist
    const expectedPlatformPermissions = [
      'platform.settings.view',
      'platform.settings.manage',
      'platform.users.view',
      'platform.users.manage',
    ];

    for (const permission of expectedPlatformPermissions) {
      // Use bracket notation to avoid dot being interpreted as path separator
      expect(frontendPermissions).toHaveProperty([permission]);
      expect(frontendPermissions[permission]).toContain('super_admin');
    }
  });

  it('should have all expected university permissions defined in frontend', () => {
    const frontendFilePath = join(process.cwd(), 'src', 'components', 'auth', 'PermissionGate.tsx');
    const frontendContent = readFileSync(frontendFilePath, 'utf-8');
    const frontendPermissions = extractPermissions(frontendContent, 'PERMISSIONS');

    // Core university permissions that must exist
    const expectedUniversityPermissions = [
      'university.settings.view',
      'university.settings.manage',
      'university.students.view',
      'university.students.manage',
    ];

    for (const permission of expectedUniversityPermissions) {
      // Use bracket notation to avoid dot being interpreted as path separator
      expect(frontendPermissions).toHaveProperty([permission]);
      // University permissions should include super_admin and university_admin
      expect(frontendPermissions[permission]).toContain('super_admin');
      expect(frontendPermissions[permission]).toContain('university_admin');
    }
  });

  it('should have self-only permissions restricted to appropriate roles', () => {
    const frontendFilePath = join(process.cwd(), 'src', 'components', 'auth', 'PermissionGate.tsx');
    const frontendContent = readFileSync(frontendFilePath, 'utf-8');
    const frontendPermissions = extractPermissions(frontendContent, 'PERMISSIONS');

    // Self-only permissions should only allow student/individual
    const selfOnlyPermissions = [
      'student.profile.edit',
      'student.applications.manage',
      'student.resumes.manage',
      'student.goals.manage',
    ];

    for (const permission of selfOnlyPermissions) {
      // Use bracket notation to avoid dot being interpreted as path separator
      expect(frontendPermissions).toHaveProperty([permission]);
      // These should be restricted - NOT include super_admin (ownership is checked separately)
      const roles = frontendPermissions[permission];
      expect(roles).toContain('student');
      expect(roles).toContain('individual');
      // Admins should NOT be in the raw permission - they use ownership override
      expect(roles).not.toContain('super_admin');
    }
  });
});
