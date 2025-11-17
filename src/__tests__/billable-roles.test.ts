/**
 * Tests for Billable Role Architecture
 *
 * This test suite verifies that:
 * 1. Helper functions correctly identify billable vs internal roles
 * 2. Role constants are properly defined
 * 3. No overlap between billable and internal roles
 */

import { BILLABLE_ROLES, INTERNAL_ROLES, LEGACY_ROLES, ALL_ROLES, isBillableRole, isInternalRole } from '@/../convex/lib/constants';

describe('Billable Role Constants', () => {
  describe('Role Arrays', () => {
    test('BILLABLE_ROLES contains expected roles', () => {
      expect(BILLABLE_ROLES).toEqual(['individual', 'student']);
    });

    test('INTERNAL_ROLES contains expected roles', () => {
      expect(INTERNAL_ROLES).toEqual([
        'super_admin',
        'staff',
        'university_admin',
        'advisor',
      ]);
    });

    test('LEGACY_ROLES contains expected roles', () => {
      expect(LEGACY_ROLES).toEqual(['user']);
    });

    test('ALL_ROLES combines all role types', () => {
      expect(ALL_ROLES).toHaveLength(
        BILLABLE_ROLES.length + INTERNAL_ROLES.length + LEGACY_ROLES.length
      );

      // Verify all billable roles are in ALL_ROLES
      BILLABLE_ROLES.forEach(role => {
        expect(ALL_ROLES).toContain(role);
      });

      // Verify all internal roles are in ALL_ROLES
      INTERNAL_ROLES.forEach(role => {
        expect(ALL_ROLES).toContain(role);
      });

      // Verify all legacy roles are in ALL_ROLES
      LEGACY_ROLES.forEach(role => {
        expect(ALL_ROLES).toContain(role);
      });
    });
  });

  describe('Role Separation', () => {
    test('No overlap between BILLABLE_ROLES and INTERNAL_ROLES', () => {
      const billableSet = new Set(BILLABLE_ROLES);
      const internalSet = new Set(INTERNAL_ROLES);

      BILLABLE_ROLES.forEach(role => {
        expect(internalSet.has(role)).toBe(false);
      });

      INTERNAL_ROLES.forEach(role => {
        expect(billableSet.has(role)).toBe(false);
      });
    });

    test('All roles are unique (no duplicates)', () => {
      const allRolesSet = new Set(ALL_ROLES);
      expect(allRolesSet.size).toBe(ALL_ROLES.length);
    });
  });
});

describe('isBillableRole()', () => {
  describe('Returns true for billable roles', () => {
    test('individual is billable', () => {
      expect(isBillableRole('individual')).toBe(true);
    });

    test('student is billable', () => {
      expect(isBillableRole('student')).toBe(true);
    });
  });

  describe('Returns false for internal roles', () => {
    test('super_admin is not billable', () => {
      expect(isBillableRole('super_admin')).toBe(false);
    });

    test('staff is not billable', () => {
      expect(isBillableRole('staff')).toBe(false);
    });

    test('university_admin is not billable', () => {
      expect(isBillableRole('university_admin')).toBe(false);
    });

    test('advisor is not billable', () => {
      expect(isBillableRole('advisor')).toBe(false);
    });
  });

  describe('Handles edge cases', () => {
    test('Returns false for legacy "user" role', () => {
      // Legacy role should not be billable (users should be migrated to "individual")
      expect(isBillableRole('user')).toBe(false);
    });

    test('Returns false for invalid role', () => {
      expect(isBillableRole('invalid_role')).toBe(false);
    });

    test('Returns false for empty string', () => {
      expect(isBillableRole('')).toBe(false);
    });

    test('Returns false for undefined (converted to string)', () => {
      expect(isBillableRole(undefined as any)).toBe(false);
    });
  });
});

describe('isInternalRole()', () => {
  describe('Returns true for internal roles', () => {
    test('super_admin is internal', () => {
      expect(isInternalRole('super_admin')).toBe(true);
    });

    test('staff is internal', () => {
      expect(isInternalRole('staff')).toBe(true);
    });

    test('university_admin is internal', () => {
      expect(isInternalRole('university_admin')).toBe(true);
    });

    test('advisor is internal', () => {
      expect(isInternalRole('advisor')).toBe(true);
    });
  });

  describe('Returns false for billable roles', () => {
    test('individual is not internal', () => {
      expect(isInternalRole('individual')).toBe(false);
    });

    test('student is not internal', () => {
      expect(isInternalRole('student')).toBe(false);
    });
  });

  describe('Handles edge cases', () => {
    test('Returns false for legacy "user" role', () => {
      expect(isInternalRole('user')).toBe(false);
    });

    test('Returns false for invalid role', () => {
      expect(isInternalRole('invalid_role')).toBe(false);
    });

    test('Returns false for empty string', () => {
      expect(isInternalRole('')).toBe(false);
    });

    test('Returns false for undefined (converted to string)', () => {
      expect(isInternalRole(undefined as any)).toBe(false);
    });
  });
});

describe('Business Logic Tests', () => {
  describe('Metrics Filtering Logic', () => {
    // Simulate user filtering for investor metrics
    const mockUsers = [
      { id: 1, name: 'Alice', role: 'individual', is_test_user: false },
      { id: 2, name: 'Bob', role: 'student', is_test_user: false },
      { id: 3, name: 'Charlie', role: 'super_admin', is_test_user: false },
      { id: 4, name: 'Diana', role: 'staff', is_test_user: false },
      { id: 5, name: 'Eve', role: 'university_admin', is_test_user: false },
      { id: 6, name: 'Frank', role: 'advisor', is_test_user: false },
      { id: 7, name: 'Grace', role: 'individual', is_test_user: true }, // Test user
    ];

    test('Filter for billable users (investor metrics)', () => {
      const billableUsers = mockUsers.filter(
        u => !u.is_test_user && isBillableRole(u.role)
      );

      expect(billableUsers).toHaveLength(2); // Alice, Bob
      expect(billableUsers.map(u => u.name)).toEqual(['Alice', 'Bob']);
    });

    test('Filter for internal users (admin visibility)', () => {
      const internalUsers = mockUsers.filter(
        u => !u.is_test_user && isInternalRole(u.role)
      );

      expect(internalUsers).toHaveLength(4); // Charlie, Diana, Eve, Frank
      expect(internalUsers.map(u => u.name)).toEqual([
        'Charlie',
        'Diana',
        'Eve',
        'Frank',
      ]);
    });

    test('Filter for test users', () => {
      const testUsers = mockUsers.filter(u => u.is_test_user);

      expect(testUsers).toHaveLength(1); // Grace
      expect(testUsers[0].name).toBe('Grace');
    });

    test('Verify no user is both billable and internal', () => {
      mockUsers
        .filter(u => !u.is_test_user)
        .forEach(user => {
          const isBillable = isBillableRole(user.role);
          const isInternal = isInternalRole(user.role);

          // A user can be neither (legacy role), but never both
          if (isBillable) {
            expect(isInternal).toBe(false);
          }
          if (isInternal) {
            expect(isBillable).toBe(false);
          }
        });
    });
  });

  describe('MRR Calculation Tests', () => {
    const MONTHLY_RATE = 30;
    const ANNUAL_RATE = 20; // $240/year = $20/month
    const ANNUAL_PERCENTAGE = 0.65;
    const WEIGHTED_AVG = ANNUAL_RATE * ANNUAL_PERCENTAGE + MONTHLY_RATE * (1 - ANNUAL_PERCENTAGE);

    const mockPremiumUsers = [
      { id: 1, role: 'individual', subscription_plan: 'premium', is_test_user: false },
      { id: 2, role: 'student', subscription_plan: 'premium', is_test_user: false },
      { id: 3, role: 'super_admin', subscription_plan: 'premium', is_test_user: false }, // Should NOT count
      { id: 4, role: 'staff', subscription_plan: 'premium', is_test_user: false }, // Should NOT count
    ];

    test('MRR only counts billable premium users', () => {
      const billablePremiumUsers = mockPremiumUsers.filter(
        u => !u.is_test_user && isBillableRole(u.role) && u.subscription_plan === 'premium'
      );

      const mrr = Math.round(billablePremiumUsers.length * WEIGHTED_AVG);

      expect(billablePremiumUsers).toHaveLength(2); // Only Alice and Bob
      expect(mrr).toBe(Math.round(2 * WEIGHTED_AVG)); // 2 * $23.50 = $47
    });

    test('MRR excludes internal roles even with premium plans', () => {
      const internalPremiumUsers = mockPremiumUsers.filter(
        u => isInternalRole(u.role) && u.subscription_plan === 'premium'
      );

      expect(internalPremiumUsers).toHaveLength(2); // Charlie (super_admin), Diana (staff)

      // These users should NOT contribute to MRR
      const billablePremiumUsers = mockPremiumUsers.filter(
        u => !u.is_test_user && isBillableRole(u.role) && u.subscription_plan === 'premium'
      );

      expect(internalPremiumUsers.every(u => !billablePremiumUsers.includes(u))).toBe(true);
    });
  });

  describe('University Seat Utilization Tests', () => {
    const mockUniversityUsers = [
      { id: 1, role: 'student', subscription_plan: 'university', university_id: 'uni1', is_test_user: false },
      { id: 2, role: 'student', subscription_plan: 'university', university_id: 'uni1', is_test_user: false },
      { id: 3, role: 'university_admin', subscription_plan: 'university', university_id: 'uni1', is_test_user: false },
      { id: 4, role: 'advisor', subscription_plan: 'university', university_id: 'uni1', is_test_user: false },
    ];

    test('University seat utilization only counts billable students', () => {
      const billableUniversityUsers = mockUniversityUsers.filter(
        u =>
          !u.is_test_user &&
          u.subscription_plan === 'university' &&
          u.university_id === 'uni1' &&
          isBillableRole(u.role)
      );

      expect(billableUniversityUsers).toHaveLength(2); // Only 2 students
      expect(billableUniversityUsers.every(u => u.role === 'student')).toBe(true);
    });

    test('University admins and advisors not counted in seat utilization', () => {
      const internalUniversityUsers = mockUniversityUsers.filter(
        u => isInternalRole(u.role) && u.university_id === 'uni1'
      );

      expect(internalUniversityUsers).toHaveLength(2); // Admin and advisor

      // They should NOT count toward seat utilization
      const billableUniversityUsers = mockUniversityUsers.filter(
        u => !u.is_test_user && isBillableRole(u.role) && u.subscription_plan === 'university'
      );

      expect(internalUniversityUsers.every(u => !billableUniversityUsers.includes(u))).toBe(true);
    });
  });
});
