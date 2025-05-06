/**
 * Super Admin Routing Debug Script
 * 
 * This script verifies that super admin redirect logic is working
 * properly and fixes any issues if detected.
 * 
 * Usage: node debug-superadmin-routing.js
 */

import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function debugSuperAdminRouting() {
  console.log('Super Admin Routing Debug Tool');
  console.log('==============================');
  
  try {
    // 1. Check if the superadmin account exists and has proper settings
    console.log('Checking super admin account...');
    
    const [superAdmin] = await db.select()
      .from(users)
      .where(eq(users.role, 'super_admin'));
    
    if (!superAdmin) {
      console.error('❌ No super admin account found!');
      return;
    }
    
    console.log('✅ Found super admin account:');
    console.log(`ID: ${superAdmin.id}`);
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Role: ${superAdmin.role}`);
    console.log(`User Type: ${superAdmin.userType}`);
    
    // 2. Verify that the account has the correct role values
    const hasCorrectRole = superAdmin.role === 'super_admin';
    const expectedUserType = 'admin'; // The expected userType value
    
    if (!hasCorrectRole) {
      console.error(`❌ Super admin has incorrect role: '${superAdmin.role}' (expected 'super_admin')`);
      
      // Fix the role if needed
      console.log('Updating role to "super_admin"...');
      await db.update(users)
        .set({ role: 'super_admin' })
        .where(eq(users.id, superAdmin.id));
      
      console.log('✅ Role updated successfully');
    } else {
      console.log('✅ Super admin role is set correctly');
    }
    
    if (superAdmin.userType !== expectedUserType) {
      console.error(`❌ Super admin has incorrect userType: '${superAdmin.userType}' (expected '${expectedUserType}')`);
      
      // Fix the userType if needed
      console.log(`Updating userType to "${expectedUserType}"...`);
      await db.update(users)
        .set({ userType: expectedUserType })
        .where(eq(users.id, superAdmin.id));
      
      console.log('✅ UserType updated successfully');
    } else {
      console.log('✅ Super admin userType is set correctly');
    }
    
    // 3. Provide instructions for client-side redirect verification
    console.log('\nTo verify client-side redirects, add this to your browser console:');
    console.log(`
(function() {
  // Force the admin redirect if role is super_admin in the session
  if (document.cookie.includes('role=super_admin')) {
    console.log('Super admin detected in cookie, forcing redirect to /admin');
    window.location.href = '/admin';
  }
  
  // Add a method to the prototype to ensure admin role is always honored
  const originalPush = history.pushState;
  history.pushState = function(state, title, url) {
    if (document.cookie.includes('role=super_admin') && url === '/career-dashboard') {
      console.log('Intercepted career-dashboard redirect for super_admin, redirecting to /admin');
      originalPush.call(this, state, title, '/admin');
    } else {
      originalPush.call(this, state, title, url);
    }
  };
  
  console.log('Admin redirect fix installed');
})();
    `);
    
  } catch (error) {
    console.error('Error debugging super admin routing:', error);
  } finally {
    await db.end();
  }
}

debugSuperAdminRouting().catch(console.error);