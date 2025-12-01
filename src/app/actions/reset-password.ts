'use server';

import { clerkClient } from '@clerk/nextjs/server';

export async function resetUserPassword(email: string, newPassword: string) {
  try {
    const client = await clerkClient();

    // Find user by email
    const users = await client.users.getUserList({ emailAddress: [email] });

    if (!users.data || users.data.length === 0) {
      throw new Error('User not found');
    }

    const user = users.data[0];

    // Update user's password using Clerk API
    await client.users.updateUser(user.id, {
      password: newPassword,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to reset password');
  }
}
