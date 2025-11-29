#!/usr/bin/env node
/**
 * Create Clerk Users Utility
 *
 * Creates test users in Clerk for development/testing purposes.
 *
 * Usage:
 *   node scripts/utils/create-clerk-users.js
 *
 * Required environment variables:
 *   - CLERK_SECRET_KEY: Clerk API secret key
 *   - STUDENT_EMAIL: Email for student account
 *   - ADVISOR_EMAIL: Email for advisor account
 *   - PASSWORD: Password for both accounts
 */

const https = require('https');

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const studentEmail = process.env.STUDENT_EMAIL;
const advisorEmail = process.env.ADVISOR_EMAIL;
const password = process.env.PASSWORD;

if (!CLERK_SECRET_KEY) {
  console.error('❌ Missing CLERK_SECRET_KEY environment variable.');
  process.exit(1);
}

if (!studentEmail) {
  console.error('❌ Missing STUDENT_EMAIL environment variable.');
  process.exit(1);
}

if (!advisorEmail) {
  console.error('❌ Missing ADVISOR_EMAIL environment variable.');
  process.exit(1);
}

if (!password) {
  console.error('❌ Missing PASSWORD environment variable.');
  process.exit(1);
}

/**
 * Create a user in Clerk
 * @param {string} email - User email
 * @param {string} role - Role identifier for naming (student/advisor)
 * @returns {Promise<object|null>} Created user or null if already exists
 */
async function createClerkUser(email, role) {
  const data = JSON.stringify({
    email_address: [email],
    password: password,
    first_name: 'Test',
    last_name: role === 'student' ? 'Student' : 'Advisor',
    skip_password_checks: true,
    public_metadata: { role: role },
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.clerk.com',
      path: '/v1/users',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + CLERK_SECRET_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 10000  // 10 second timeout
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const user = JSON.parse(body);
            console.log('✓ Created Clerk user:', email, '(ID:', user.id + ')');
            resolve(user);
          } catch (parseError) {
            reject(new Error('Failed to parse Clerk API response: ' + parseError.message));
          }
        } else if (res.statusCode === 422 || res.statusCode === 409) {
          console.log('✓ User already exists:', email);
          resolve(null);
        } else if (res.statusCode === 401) {
          reject(new Error('Authentication failed. Check CLERK_SECRET_KEY is correct.'));
        } else {
          reject(new Error('Clerk API error (HTTP ' + res.statusCode + '): ' + body));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request to Clerk API timed out'));
    });
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    await createClerkUser(studentEmail, 'student');
    await createClerkUser(advisorEmail, 'advisor');
    console.log('✓ Clerk user creation complete');
  } catch (error) {
    console.error('❌ Error creating Clerk users:', error.message);
    process.exit(1);
  }
}

main();
