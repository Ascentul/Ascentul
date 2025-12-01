/**
 * Seed Test University
 *
 * Creates a test university and assigns test users to it.
 * Run with: npx convex run dev/seedTestUniversity:seed
 */

import { mutation } from '../_generated/server';

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Test university data
    const testUniversity = {
      name: 'Acme University',
      slug: 'acme-university',
      logo_url:
        'https://ui-avatars.com/api/?name=AU&background=5371FF&color=fff&size=128&bold=true',
      description: 'A test university for development purposes',
      website: 'https://acme-university.edu',
      contact_email: 'admin@acme-university.edu',
      license_plan: 'Enterprise' as const,
      license_seats: 100,
      license_used: 3,
      max_students: 1000,
      license_start: now,
      license_end: now + 365 * 24 * 60 * 60 * 1000, // 1 year from now
      status: 'active' as const,
      is_test: true,
      created_at: now,
      updated_at: now,
    };

    // Check if test university already exists
    const existing = await ctx.db
      .query('universities')
      .withIndex('by_slug', (q) => q.eq('slug', testUniversity.slug))
      .first();

    let universityId;

    if (existing) {
      console.log(`Test university "${testUniversity.name}" already exists`);
      universityId = existing._id;

      // Update the logo if it's missing
      if (!existing.logo_url) {
        await ctx.db.patch(existing._id, { logo_url: testUniversity.logo_url });
        console.log('Updated university with logo_url');
      }
    } else {
      // Create the test university
      universityId = await ctx.db.insert('universities', testUniversity);
      console.log(`Created test university "${testUniversity.name}"`);
    }

    // Test user emails to assign
    const testUserEmails: Array<{
      email: string;
      expectedRole: 'student' | 'advisor' | 'university_admin';
    }> = [
      { email: 'test.user+student@ascentful.io', expectedRole: 'student' },
      { email: 'test.user+advisor@ascentful.io', expectedRole: 'advisor' },
      { email: 'test.user+uadmin@ascentful.io', expectedRole: 'university_admin' },
    ];

    const results = [];

    for (const { email, expectedRole } of testUserEmails) {
      // Find user by email
      const user = await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', email))
        .first();

      if (!user) {
        results.push({ email, status: 'not_found' });
        console.log(`User not found: ${email}`);
        continue;
      }

      // Update user's university_id and role
      await ctx.db.patch(user._id, {
        university_id: universityId,
        role: expectedRole,
        updated_at: now,
      });

      results.push({ email, status: 'assigned', userId: user._id, role: expectedRole });
      console.log(`Assigned ${email} to university with role ${expectedRole}`);
    }

    return {
      universityId,
      universityName: testUniversity.name,
      logoUrl: testUniversity.logo_url,
      usersProcessed: results,
    };
  },
});
