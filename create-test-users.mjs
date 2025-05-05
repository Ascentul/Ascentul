/**
 * Test User Creation Script for Ascentul/CareerTracker
 * 
 * This script creates test users with different roles for testing role-based access control.
 */

import crypto from 'crypto';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';

// Configure Neon PostgreSQL connection
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

// Create a password hash using the same method as in the application
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${hashedPassword}.${salt}`;
}

async function createTestUsers() {
  // Get database connection string from environment variables
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔄 Connecting to PostgreSQL database...');
  
  // Create a new pool with the connection string
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    // Test the connection
    const testResult = await pool.query('SELECT 1 as test');
    console.log('✅ Database connection successful:', testResult.rows[0]);
    
    // Prepare test users with different roles
    const testUsers = [
      {
        email: 'user@test.com',
        password: hashPassword('test1234'),
        name: 'Regular User',
        username: 'testuser',
        user_type: 'regular',
        role: 'user',
        subscription_status: 'active',
        subscription_plan: 'free'
      },
      {
        email: 'student@univ.edu',
        password: hashPassword('test1234'),
        name: 'University Student',
        username: 'unistudent',
        user_type: 'university_user',
        role: 'university_user',
        subscription_status: 'active',
        subscription_plan: 'free'
      },
      {
        email: 'admin@univ.edu',
        password: hashPassword('test1234'),
        name: 'University Admin',
        username: 'uniadmin',
        user_type: 'university_admin',
        role: 'university_admin',
        subscription_status: 'active',
        subscription_plan: 'free'
      },
      {
        email: 'staff@ascentul.io',
        password: hashPassword('test1234'),
        name: 'Ascentul Staff',
        username: 'staffmember',
        user_type: 'staff',
        role: 'staff',
        subscription_status: 'active',
        subscription_plan: 'free'
      },
      {
        email: 'superadmin@dev.ascentul',
        password: hashPassword('test1234'),
        name: 'Super Admin',
        username: 'superadmin',
        user_type: 'admin',
        role: 'super_admin',
        subscription_status: 'active',
        subscription_plan: 'free'
      }
    ];
    
    console.log('🔄 Creating test users in the database...');
    
    // Insert each test user, handling conflicts on email
    for (const user of testUsers) {
      const { email, password, name, username, user_type, role, subscription_status, subscription_plan } = user;
      
      try {
        // Check if user already exists
        const existingUser = await pool.query('SELECT id, username FROM users WHERE email = $1 OR username = $2', [email, username]);
        
        if (existingUser.rowCount > 0) {
          console.log(`⚠️ User with email ${email} or username ${username} already exists. Updating password and role...`);
          
          // Update existing user, preserving their username
          await pool.query(
            'UPDATE users SET password = $1, role = $2, user_type = $3 WHERE email = $4',
            [password, role, user_type, email]
          );
          
          console.log(`✅ Updated user: ${name} (${email}) with role: ${role}`);
        } else {
          // Insert new user with timestamp added to username to avoid conflicts
          const timestampedUsername = `${username}_${Date.now().toString().substring(7)}`;
          
          const insertResult = await pool.query(
            `INSERT INTO users (
              email, password, name, username, user_type, role, 
              subscription_status, subscription_plan, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING id`,
            [email, password, name, timestampedUsername, user_type, role, subscription_status, subscription_plan]
          );
          
          console.log(`✅ Created new user: ${name} (${email}) with role: ${role}, ID: ${insertResult.rows[0].id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${email}:`, error.message);
      }
    }
    
    console.log('\n🎉 All test users have been created successfully!');
    console.log('\n📝 Test Account Credentials:');
    console.log('--------------------------------');
    
    for (const user of testUsers) {
      console.log(`🔹 ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: test1234`);
      console.log(`   Role: ${user.role}`);
      console.log('--------------------------------');
    }
    
    // Also write to a file
    let fileContent = `📘 Test Account Credentials (Replit Dev Environment)

`;
    
    for (const user of testUsers) {
      fileContent += `🔹 ${user.name}
Email: ${user.email}
Password: test1234
Role: ${user.role}

`;
    }
    
    fileContent += `
🛠️ Notes:
- These accounts are safe to reset or override at any time.
- Use them for QA testing across role-based login, dashboards, and access control flows.`;
    
    fs.writeFileSync('test-accounts.txt', fileContent);
    console.log('\n✅ Credentials also saved to test-accounts.txt');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the script
createTestUsers().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});