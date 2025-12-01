import { convexTest } from 'convex-test';
import { expect, test, describe, beforeEach } from 'vitest';
import schema from '../schema';
import { api } from '../_generated/api';

describe('users mutations', () => {
  describe('updateUser', () => {
    test('should update user profile with all fields', async () => {
      const t = convexTest(schema);

      // Create a test user
      const userId = await t.mutation(api.users.createUser, {
        clerkId: 'test-clerk-id',
        email: 'test@example.com',
        name: 'Test User',
      });

      // Update user with new profile fields
      await t.mutation(api.users.updateUser, {
        clerkId: 'test-clerk-id',
        updates: {
          name: 'Updated Name',
          email: 'updated@example.com',
          bio: 'This is my bio',
          job_title: 'Software Engineer',
          company: 'Test Company',
          location: 'San Francisco',
          website: 'https://example.com',
        },
      });

      // Query updated user
      const updatedUser = await t.query(api.users.getUserByClerkId, {
        clerkId: 'test-clerk-id',
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.email).toBe('updated@example.com');
      expect(updatedUser?.bio).toBe('This is my bio');
      expect(updatedUser?.job_title).toBe('Software Engineer');
      expect(updatedUser?.company).toBe('Test Company');
      expect(updatedUser?.location).toBe('San Francisco');
      expect(updatedUser?.website).toBe('https://example.com');
    });

    test('should persist profile fields across multiple updates', async () => {
      const t = convexTest(schema);

      await t.mutation(api.users.createUser, {
        clerkId: 'test-clerk-id-2',
        email: 'test2@example.com',
        name: 'Test User 2',
      });

      // First update
      await t.mutation(api.users.updateUser, {
        clerkId: 'test-clerk-id-2',
        updates: {
          bio: 'Initial bio',
          company: 'Company A',
        },
      });

      // Second update - different fields
      await t.mutation(api.users.updateUser, {
        clerkId: 'test-clerk-id-2',
        updates: {
          job_title: 'Manager',
          location: 'New York',
        },
      });

      const user = await t.query(api.users.getUserByClerkId, {
        clerkId: 'test-clerk-id-2',
      });

      // All fields should be preserved
      expect(user?.bio).toBe('Initial bio');
      expect(user?.company).toBe('Company A');
      expect(user?.job_title).toBe('Manager');
      expect(user?.location).toBe('New York');
    });

    test('should throw error for non-existent user', async () => {
      const t = convexTest(schema);

      await expect(
        t.mutation(api.users.updateUser, {
          clerkId: 'non-existent',
          updates: { name: 'Test' },
        }),
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateUserById', () => {
    test('should update user by ID with new profile fields', async () => {
      const t = convexTest(schema);

      const userId = await t.mutation(api.users.createUser, {
        clerkId: 'test-clerk-id-3',
        email: 'test3@example.com',
        name: 'Test User 3',
      });

      await t.mutation(api.users.updateUserById, {
        id: userId,
        updates: {
          bio: 'Updated bio',
          website: 'https://mysite.com',
        },
      });

      const user = await t.query(api.users.getUserByClerkId, {
        clerkId: 'test-clerk-id-3',
      });

      expect(user?.bio).toBe('Updated bio');
      expect(user?.website).toBe('https://mysite.com');
    });
  });
});
