/**
 * Tests for admin user creation and activation flow
 */

import { convexTest } from 'convex-test';
import { expect, test, describe, beforeEach } from 'vitest';
import { api } from '../_generated/api';
import schema from '../schema';

describe('Admin User Creation', () => {
  let t: any;

  beforeEach(async () => {
    t = convexTest(schema);
  });

  describe('createUserByAdmin', () => {
    test('super admin can create users', async () => {
      // Create super admin
      const adminId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          clerkId: 'admin_123',
          email: 'admin@ascentul.io',
          name: 'Admin User',
          role: 'super_admin',
          subscription_plan: 'premium',
          subscription_status: 'active',
          onboarding_completed: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // Create new user
      const result = await t.mutation(api.admin_users.createUserByAdmin, {
        adminClerkId: 'admin_123',
        email: 'newuser@university.edu',
        name: 'New User',
        role: 'user',
      });

      expect(result.userId).toBeDefined();
      expect(result.activationToken).toBeDefined();
      expect(result.tempPassword).toBeDefined();
      expect(result.message).toContain('successfully');

      // Verify user was created with correct fields
      const user = await t.run(async (ctx: any) => {
        return await ctx.db.get(result.userId);
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('newuser@university.edu');
      expect(user.name).toBe('New User');
      expect(user.role).toBe('user');
      expect(user.account_status).toBe('pending_activation');
      expect(user.activation_token).toBeDefined();
      expect(user.activation_expires_at).toBeGreaterThan(Date.now());
      expect(user.temp_password).toBeDefined();
      expect(user.created_by_admin).toBe(true);
      expect(user.clerkId).toContain('pending_');
    });

    test('university admin can create users for their university', async () => {
      // Create university
      const universityId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('universities', {
          name: 'Test University',
          slug: 'test-university',
          license_plan: 'Pro',
          license_seats: 100,
          license_used: 0,
          license_start: Date.now(),
          status: 'active',
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // Create university admin
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          clerkId: 'uni_admin_123',
          email: 'uniadmin@university.edu',
          name: 'University Admin',
          role: 'university_admin',
          university_id: universityId,
          subscription_plan: 'university',
          subscription_status: 'active',
          onboarding_completed: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // Create student for same university
      const result = await t.mutation(api.admin_users.createUserByAdmin, {
        adminClerkId: 'uni_admin_123',
        email: 'student@university.edu',
        name: 'Student User',
        role: 'user',
        university_id: universityId,
      });

      expect(result.userId).toBeDefined();

      // Verify student has correct university
      const student = await t.run(async (ctx: any) => {
        return await ctx.db.get(result.userId);
      });

      expect(student.university_id).toBe(universityId);
      expect(student.subscription_plan).toBe('university');
    });

    test('university admin cannot create users for different university', async () => {
      // Create two universities
      const university1 = await t.run(async (ctx: any) => {
        return await ctx.db.insert('universities', {
          name: 'University 1',
          slug: 'university-1',
          license_plan: 'Pro',
          license_seats: 100,
          license_used: 0,
          license_start: Date.now(),
          status: 'active',
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      const university2 = await t.run(async (ctx: any) => {
        return await ctx.db.insert('universities', {
          name: 'University 2',
          slug: 'university-2',
          license_plan: 'Pro',
          license_seats: 100,
          license_used: 0,
          license_start: Date.now(),
          status: 'active',
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // Create university admin for university 1
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          clerkId: 'uni_admin_456',
          email: 'admin@university1.edu',
          name: 'University 1 Admin',
          role: 'university_admin',
          university_id: university1,
          subscription_plan: 'university',
          subscription_status: 'active',
          onboarding_completed: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // Attempt to create user for university 2
      await expect(
        t.mutation(api.admin_users.createUserByAdmin, {
          adminClerkId: 'uni_admin_456',
          email: 'student@university2.edu',
          name: 'Student User',
          university_id: university2,
        }),
      ).rejects.toThrow('Unauthorized');
    });

    test('regular user cannot create users', async () => {
      // Create regular user
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          clerkId: 'user_789',
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user',
          subscription_plan: 'free',
          subscription_status: 'active',
          onboarding_completed: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // Attempt to create user
      await expect(
        t.mutation(api.admin_users.createUserByAdmin, {
          adminClerkId: 'user_789',
          email: 'newuser@example.com',
          name: 'New User',
        }),
      ).rejects.toThrow('Unauthorized');
    });

    test('cannot create user with duplicate email', async () => {
      // Create super admin
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          clerkId: 'admin_abc',
          email: 'admin@ascentul.io',
          name: 'Admin User',
          role: 'super_admin',
          subscription_plan: 'premium',
          subscription_status: 'active',
          onboarding_completed: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // Create existing user
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          clerkId: 'existing_user',
          email: 'existing@example.com',
          name: 'Existing User',
          role: 'user',
          subscription_plan: 'free',
          subscription_status: 'active',
          onboarding_completed: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // Attempt to create duplicate
      await expect(
        t.mutation(api.admin_users.createUserByAdmin, {
          adminClerkId: 'admin_abc',
          email: 'existing@example.com',
          name: 'Duplicate User',
        }),
      ).rejects.toThrow('already exists');
    });

    test('activation token and temp password are generated correctly', async () => {
      // Create super admin
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          clerkId: 'admin_def',
          email: 'admin@ascentul.io',
          name: 'Admin User',
          role: 'super_admin',
          subscription_plan: 'premium',
          subscription_status: 'active',
          onboarding_completed: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      const result = await t.mutation(api.admin_users.createUserByAdmin, {
        adminClerkId: 'admin_def',
        email: 'testuser@example.com',
        name: 'Test User',
      });

      // Verify token format
      expect(result.activationToken).toMatch(/^act_\d+_[a-z0-9]+$/);

      // Verify password format (12 characters)
      expect(result.tempPassword).toHaveLength(12);
      expect(result.tempPassword).toMatch(/^[A-HJ-NP-Za-hj-np-z2-9!@#$%^&*]+$/);
    });
  });

  describe('activateUserAccount', () => {
    test('user can activate account with valid token', async () => {
      // Create pending user
      const activationToken = 'act_123456_testtoken';
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          clerkId: `pending_${activationToken}`,
          email: 'newuser@example.com',
          name: 'New User',
          role: 'user',
          subscription_plan: 'free',
          subscription_status: 'active',
          account_status: 'pending_activation',
          activation_token: activationToken,
          activation_expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000,
          temp_password: 'TempPass123!',
          created_by_admin: true,
          onboarding_completed: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // Activate account
      const result = await t.mutation(api.admin_users.activateUserAccount, {
        activationToken,
        clerkId: 'clerk_realuser_123',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('activated');
      expect(result.user.email).toBe('newuser@example.com');

      // Verify user was updated
      const user = await t.run(async (ctx: any) => {
        return await ctx.db.get(userId);
      });

      expect(user.clerkId).toBe('clerk_realuser_123');
      expect(user.account_status).toBe('active');
      expect(user.activation_token).toBeUndefined();
      expect(user.activation_expires_at).toBeUndefined();
      expect(user.temp_password).toBeUndefined();
    });

    test('cannot activate with invalid token', async () => {
      await expect(
        t.mutation(api.admin_users.activateUserAccount, {
          activationToken: 'invalid_token',
          clerkId: 'clerk_user_456',
        }),
      ).rejects.toThrow('Invalid activation token');
    });

    test('cannot activate with expired token', async () => {
      const activationToken = 'act_789_expired';
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          clerkId: `pending_${activationToken}`,
          email: 'expired@example.com',
          name: 'Expired User',
          role: 'user',
          subscription_plan: 'free',
          subscription_status: 'active',
          account_status: 'pending_activation',
          activation_token: activationToken,
          activation_expires_at: Date.now() - 1000, // Expired
          temp_password: 'TempPass123!',
          created_by_admin: true,
          onboarding_completed: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      await expect(
        t.mutation(api.admin_users.activateUserAccount, {
          activationToken,
          clerkId: 'clerk_user_789',
        }),
      ).rejects.toThrow('expired');
    });

    test('cannot activate already active account', async () => {
      const activationToken = 'act_999_active';
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          clerkId: 'clerk_active_user',
          email: 'active@example.com',
          name: 'Active User',
          role: 'user',
          subscription_plan: 'free',
          subscription_status: 'active',
          account_status: 'active',
          activation_token: activationToken,
          activation_expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000,
          created_by_admin: true,
          onboarding_completed: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      await expect(
        t.mutation(api.admin_users.activateUserAccount, {
          activationToken,
          clerkId: 'clerk_different_id',
        }),
      ).rejects.toThrow('already activated');
    });
  });

  describe('getPendingActivations', () => {
    test('super admin can see all pending activations', async () => {
      // Create super admin
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          clerkId: 'super_admin_123',
          email: 'superadmin@ascentul.io',
          name: 'Super Admin',
          role: 'super_admin',
          subscription_plan: 'premium',
          subscription_status: 'active',
          onboarding_completed: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // Create pending users
      await t.run(async (ctx: any) => {
        await ctx.db.insert('users', {
          clerkId: 'pending_user1',
          email: 'pending1@example.com',
          name: 'Pending User 1',
          role: 'user',
          subscription_plan: 'free',
          subscription_status: 'active',
          account_status: 'pending_activation',
          activation_token: 'token1',
          activation_expires_at: Date.now() + 1000000,
          created_by_admin: true,
          onboarding_completed: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        });

        await ctx.db.insert('users', {
          clerkId: 'pending_user2',
          email: 'pending2@example.com',
          name: 'Pending User 2',
          role: 'user',
          subscription_plan: 'free',
          subscription_status: 'active',
          account_status: 'pending_activation',
          activation_token: 'token2',
          activation_expires_at: Date.now() + 1000000,
          created_by_admin: true,
          onboarding_completed: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      const result = await t.mutation(api.admin_users.getPendingActivations, {
        adminClerkId: 'super_admin_123',
      });

      expect(result).toHaveLength(2);
      expect(result[0].email).toBeDefined();
      expect(result[0].name).toBeDefined();
      expect(result[0].activation_expires_at).toBeDefined();
    });

    test("university admin only sees their university's pending activations", async () => {
      // Create universities
      const uni1 = await t.run(async (ctx: any) => {
        return await ctx.db.insert('universities', {
          name: 'University 1',
          slug: 'uni-1',
          license_plan: 'Pro',
          license_seats: 100,
          license_used: 0,
          license_start: Date.now(),
          status: 'active',
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      const uni2 = await t.run(async (ctx: any) => {
        return await ctx.db.insert('universities', {
          name: 'University 2',
          slug: 'uni-2',
          license_plan: 'Pro',
          license_seats: 100,
          license_used: 0,
          license_start: Date.now(),
          status: 'active',
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // Create university admin
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          clerkId: 'uni_admin_111',
          email: 'admin@uni1.edu',
          name: 'Uni1 Admin',
          role: 'university_admin',
          university_id: uni1,
          subscription_plan: 'university',
          subscription_status: 'active',
          onboarding_completed: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // Create pending users for both universities
      await t.run(async (ctx: any) => {
        await ctx.db.insert('users', {
          clerkId: 'pending_uni1',
          email: 'student@uni1.edu',
          name: 'Uni1 Student',
          role: 'user',
          university_id: uni1,
          subscription_plan: 'university',
          subscription_status: 'active',
          account_status: 'pending_activation',
          activation_token: 'token_uni1',
          activation_expires_at: Date.now() + 1000000,
          created_by_admin: true,
          onboarding_completed: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        });

        await ctx.db.insert('users', {
          clerkId: 'pending_uni2',
          email: 'student@uni2.edu',
          name: 'Uni2 Student',
          role: 'user',
          university_id: uni2,
          subscription_plan: 'university',
          subscription_status: 'active',
          account_status: 'pending_activation',
          activation_token: 'token_uni2',
          activation_expires_at: Date.now() + 1000000,
          created_by_admin: true,
          onboarding_completed: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      const result = await t.mutation(api.admin_users.getPendingActivations, {
        adminClerkId: 'uni_admin_111',
      });

      // Should only see uni1 student
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('student@uni1.edu');
    });

    test('regular user cannot view pending activations', async () => {
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          clerkId: 'regular_user',
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user',
          subscription_plan: 'free',
          subscription_status: 'active',
          onboarding_completed: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      await expect(
        t.mutation(api.admin_users.getPendingActivations, {
          adminClerkId: 'regular_user',
        }),
      ).rejects.toThrow('Unauthorized');
    });
  });
});
