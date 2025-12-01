import { convexTest } from 'convex-test';
import { expect, test, describe } from 'vitest';
import schema from '../schema';
import { api } from '../_generated/api';

describe('universities', () => {
  describe('updateUniversitySettings', () => {
    test('should allow university admin to update their institution settings', async () => {
      const t = convexTest(schema);

      // Create university
      const uniId = await t.mutation(api.universities.createUniversity, {
        name: 'Test University',
        slug: 'test-uni',
        license_plan: 'Pro',
        license_seats: 1000,
        status: 'active',
      });

      // Create university admin
      await t.mutation(api.users.createUser, {
        clerkId: 'uni-admin',
        email: 'admin@testuni.edu',
        name: 'University Admin',
        role: 'university_admin',
      });

      // Assign university to admin
      await t.mutation(api.universities.assignUniversityToUser, {
        userClerkId: 'uni-admin',
        universitySlug: 'test-uni',
        makeAdmin: true,
      });

      // Update university settings
      const result = await t.mutation(api.universities.updateUniversitySettings, {
        clerkId: 'uni-admin',
        universityId: uniId,
        settings: {
          name: 'Updated Test University',
          description: 'A great institution',
          website: 'https://testuni.edu',
          contact_email: 'contact@testuni.edu',
          max_students: 5000,
          license_seats: 2000,
        },
      });

      expect(result.success).toBe(true);

      // Verify settings were saved
      const uni = await t.query(api.universities.getUniversityBySlug, {
        slug: 'test-uni',
      });

      expect(uni?.name).toBe('Updated Test University');
      expect(uni?.description).toBe('A great institution');
      expect(uni?.website).toBe('https://testuni.edu');
      expect(uni?.contact_email).toBe('contact@testuni.edu');
      expect(uni?.max_students).toBe(5000);
      expect(uni?.license_seats).toBe(2000);
    });

    test('should allow super admin to update any university settings', async () => {
      const t = convexTest(schema);

      const uniId = await t.mutation(api.universities.createUniversity, {
        name: 'Another University',
        slug: 'another-uni',
        license_plan: 'Basic',
        license_seats: 500,
        status: 'active',
      });

      await t.mutation(api.users.createUser, {
        clerkId: 'super-admin',
        email: 'super@admin.com',
        name: 'Super Admin',
        role: 'super_admin',
      });

      await t.mutation(api.universities.updateUniversitySettings, {
        clerkId: 'super-admin',
        universityId: uniId,
        settings: {
          description: 'Updated by super admin',
          max_students: 10000,
        },
      });

      const uni = await t.query(api.universities.getUniversityBySlug, {
        slug: 'another-uni',
      });

      expect(uni?.description).toBe('Updated by super admin');
      expect(uni?.max_students).toBe(10000);
    });

    test('should reject unauthorized users', async () => {
      const t = convexTest(schema);

      const uniId = await t.mutation(api.universities.createUniversity, {
        name: 'Protected University',
        slug: 'protected-uni',
        license_plan: 'Enterprise',
        license_seats: 10000,
        status: 'active',
      });

      await t.mutation(api.users.createUser, {
        clerkId: 'regular-user',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
      });

      await expect(
        t.mutation(api.universities.updateUniversitySettings, {
          clerkId: 'regular-user',
          universityId: uniId,
          settings: {
            name: 'Hacked Name',
          },
        }),
      ).rejects.toThrow('Unauthorized');
    });

    test('should prevent university admin from updating other universities', async () => {
      const t = convexTest(schema);

      const uni1Id = await t.mutation(api.universities.createUniversity, {
        name: 'University 1',
        slug: 'uni-1',
        license_plan: 'Pro',
        license_seats: 1000,
        status: 'active',
      });

      const uni2Id = await t.mutation(api.universities.createUniversity, {
        name: 'University 2',
        slug: 'uni-2',
        license_plan: 'Pro',
        license_seats: 1000,
        status: 'active',
      });

      await t.mutation(api.users.createUser, {
        clerkId: 'uni1-admin',
        email: 'admin@uni1.edu',
        name: 'Uni 1 Admin',
        role: 'university_admin',
      });

      await t.mutation(api.universities.assignUniversityToUser, {
        userClerkId: 'uni1-admin',
        universitySlug: 'uni-1',
        makeAdmin: true,
      });

      // Try to update uni2 as uni1 admin
      await expect(
        t.mutation(api.universities.updateUniversitySettings, {
          clerkId: 'uni1-admin',
          universityId: uni2Id,
          settings: {
            name: 'Unauthorized change',
          },
        }),
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getUniversitySettings', () => {
    test('should return university settings for authenticated user', async () => {
      const t = convexTest(schema);

      const uniId = await t.mutation(api.universities.createUniversity, {
        name: 'Settings Test University',
        slug: 'settings-uni',
        license_plan: 'Pro',
        license_seats: 1000,
        status: 'active',
        admin_email: 'admin@settingsuni.edu',
      });

      await t.mutation(api.users.createUser, {
        clerkId: 'student-user',
        email: 'student@settingsuni.edu',
        name: 'Student User',
      });

      await t.mutation(api.universities.assignUniversityToUser, {
        userClerkId: 'student-user',
        universitySlug: 'settings-uni',
      });

      const settings = await t.query(api.universities.getUniversitySettings, {
        clerkId: 'student-user',
      });

      expect(settings).toBeDefined();
      expect(settings?.name).toBe('Settings Test University');
      expect(settings?._id).toStrictEqual(uniId);
    });

    test('should return null for users without university', async () => {
      const t = convexTest(schema);

      await t.mutation(api.users.createUser, {
        clerkId: 'no-uni-user',
        email: 'nouni@example.com',
        name: 'No University User',
      });

      const settings = await t.query(api.universities.getUniversitySettings, {
        clerkId: 'no-uni-user',
      });

      expect(settings).toBeNull();
    });
  });
});
