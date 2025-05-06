// Script to ensure the super admin account is properly set up
// Run with: node ensure-super-admin.js

const { Pool } = require('pg');
const crypto = require('crypto');

// Create a pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function ensureSuperAdmin() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Check if super admin exists
    const checkResult = await client.query(
      `SELECT id, username, email, user_type, role FROM users WHERE email = 'superadmin@dev.ascentul'`
    );
    
    if (checkResult.rows.length === 0) {
      console.log('Super admin account not found, creating...');
      
      // Generate a salt and hash the password
      const password = 'admin123'; // Default password for super admin
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      const securePassword = `${hashedPassword}.${salt}`;
      
      // Create super admin account
      const insertResult = await client.query(
        `INSERT INTO users (
          username, email, name, password, user_type, role, profile_image,
          subscription_status, subscription_plan, xp, level, rank, email_verified
        ) VALUES (
          'superadmin_022694', 'superadmin@dev.ascentul', 'Super Admin',
          $1, 'admin', 'super_admin', NULL,
          'active', 'pro', 1000, 5, 'Master', true
        ) RETURNING id, username, email, user_type, role`,
        [securePassword]
      );
      
      console.log('Super admin account created:', insertResult.rows[0]);
    } else {
      console.log('Super admin account found:', checkResult.rows[0]);
      
      // Ensure the super admin has the correct role and user_type
      await client.query(
        `UPDATE users SET role = 'super_admin', user_type = 'admin'
         WHERE email = 'superadmin@dev.ascentul'`
      );
      
      console.log('Super admin account updated with correct role and user_type');
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Super admin account ensured successfully');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error ensuring super admin account:', error);
  } finally {
    client.release();
    pool.end();
  }
}

ensureSuperAdmin();