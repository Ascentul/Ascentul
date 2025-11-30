#!/usr/bin/env node
/**
 * Set Clerk Roles Utility
 *
 * Sets roles and metadata for test users in Clerk.
 *
 * Usage:
 *   node scripts/utils/set-clerk-roles.js
 *
 * Required environment variables:
 *   - CLERK_SECRET_KEY: Clerk API secret key
 *   - STUDENT_EMAIL: Email for student account
 *   - ADVISOR_EMAIL: Email for advisor account
 *   - ADVISOR_UNIVERSITY_ID: University ID for advisor assignment
 */

const https = require('https');

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const studentEmail = process.env.STUDENT_EMAIL;
const advisorEmail = process.env.ADVISOR_EMAIL;
const advisorUniversityId = process.env.ADVISOR_UNIVERSITY_ID;

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

if (!advisorUniversityId) {
  console.error('❌ Missing ADVISOR_UNIVERSITY_ID environment variable. Advisor role requires university_id.');
  process.exit(1);
}

/**
 * Find a user by email in Clerk
 * @param {string} email - User email to search for
 * @returns {Promise<object|undefined>} User object or undefined if not found
 */
async function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.clerk.com',
      path: '/v1/users?email_address=' + encodeURIComponent(email),
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + CLERK_SECRET_KEY,
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const data = JSON.parse(body);
          const users = Array.isArray(data) ? data : (data.data || []);
          resolve(users[0]);
        } else if (res.statusCode === 401) {
          reject(new Error('Authentication failed. Check CLERK_SECRET_KEY is correct.'));
        } else {
          reject(new Error('Failed to find user: HTTP ' + res.statusCode));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

/**
 * Update Clerk metadata with role and university assignment.
 * Advisor role requires a university_id; student does not.
 * @param {string} userId - Clerk user ID
 * @param {object} metadata - Metadata object with role and optional university_id
 */
async function setMetadata(userId, metadata) {
  if (!metadata || !metadata.role) {
    throw new Error('Metadata with role is required');
  }

  if (metadata.role === 'advisor' && !metadata.university_id) {
    throw new Error('Advisor role requires university_id (ADVISOR_UNIVERSITY_ID)');
  }

  const data = JSON.stringify({
    public_metadata: {
      role: metadata.role,
      ...(metadata.university_id ? { university_id: metadata.university_id } : {}),
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.clerk.com',
      path: '/v1/users/' + userId + '/metadata',
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + CLERK_SECRET_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✓ Set role=' + metadata.role + ' for user', userId);
          resolve();
        } else if (res.statusCode === 401) {
          reject(new Error('Authentication failed. Check CLERK_SECRET_KEY is correct.'));
        } else {
          reject(new Error('Clerk API error (HTTP ' + res.statusCode + '): ' + body));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    const student = await findUserByEmail(studentEmail);
    if (student) {
      await setMetadata(student.id, { role: 'student' });
    } else {
      console.log('⚠️  Warning: Student not found in Clerk, skipping role assignment');
    }

    const advisor = await findUserByEmail(advisorEmail);
    if (advisor) {
      await setMetadata(advisor.id, { role: 'advisor', university_id: advisorUniversityId });
    } else {
      console.log('⚠️  Warning: Advisor not found in Clerk, skipping role assignment');
    }

    console.log('✓ Clerk role assignment complete');
  } catch (error) {
    console.error('❌ Error setting roles:', error.message);
    process.exit(1);
  }
}

main();
