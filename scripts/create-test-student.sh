#!/bin/bash

# Create Test Student for Advisor Testing
# This script creates a test student account in Clerk and sets up all necessary data in Convex

set -e

echo "🚀 Creating Test Student Account for Advisor Testing"
echo "===================================================="
echo ""

# Default values
STUDENT_EMAIL="${STUDENT_EMAIL:-test.student@ascentful.io}"
ADVISOR_EMAIL="${ADVISOR_EMAIL:-test.advisor@ascentful.io}"
PASSWORD="${SEED_TEST_PASSWORD:-TestPassword2025}"

echo "📧 Student Email: $STUDENT_EMAIL"
echo "📧 Advisor Email: $ADVISOR_EMAIL"
echo ""

# Validate required environment variables
if [ -z "$CLERK_SECRET_KEY" ]; then
  echo "❌ Error: CLERK_SECRET_KEY environment variable is not set"
  echo ""
  echo "Please set it in your .env.local file or export it:"
  echo "  export CLERK_SECRET_KEY='your_clerk_secret_key'"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_CONVEX_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable is not set"
  echo ""
  echo "Please set it in your .env.local file or export it:"
  echo "  export NEXT_PUBLIC_CONVEX_URL='your_convex_url'"
  exit 1
fi

echo ""

# Step 1: Create Clerk accounts if they don't exist
echo "Step 1: Creating Clerk accounts..."
echo "-----------------------------------"

# Create student account in Clerk
node -e "
const https = require('https');

async function createClerkUser(email, role) {
  const data = JSON.stringify({
    email_address: [email],
    password: '$PASSWORD',
    first_name: 'Test',
    last_name: role === 'student' ? 'Student' : 'Advisor',
    skip_password_checks: true,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.clerk.com',
      path: '/v1/users',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.CLERK_SECRET_KEY,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const user = JSON.parse(body);
          console.log('✓ Created Clerk user:', email, '(ID:', user.id + ')');
          resolve(user);
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
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    await createClerkUser('$STUDENT_EMAIL', 'student');
    await createClerkUser('$ADVISOR_EMAIL', 'advisor');
  } catch (error) {
    console.error('❌ Error creating Clerk users:', error.message);
    process.exit(1);
  }
})();
"

echo ""

# Step 2: Set roles in Clerk metadata
echo "Step 2: Setting roles in Clerk..."
echo "-----------------------------------"

# Get user IDs and set metadata
node -e "
const https = require('https');

async function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.clerk.com',
      path: '/v1/users?email_address=' + encodeURIComponent(email),
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + process.env.CLERK_SECRET_KEY,
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const data = JSON.parse(body);
          const users = Array.isArray(data) ? data : (data.data || []);
          resolve(users[0]);
        } else {
          reject(new Error('Failed to find user'));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function setMetadata(userId, role) {
  const data = JSON.stringify({
    public_metadata: { role }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.clerk.com',
      path: '/v1/users/' + userId + '/metadata',
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + process.env.CLERK_SECRET_KEY,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✓ Set role=' + role + ' for user', userId);
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

(async () => {
  try {
    const student = await findUserByEmail('$STUDENT_EMAIL');
    if (student) {
      await setMetadata(student.id, 'student');
    } else {
      console.log('⚠️  Warning: Student not found in Clerk, skipping role assignment');
    }

    const advisor = await findUserByEmail('$ADVISOR_EMAIL');
    if (advisor) {
      await setMetadata(advisor.id, 'advisor');
    } else {
      console.log('⚠️  Warning: Advisor not found in Clerk, skipping role assignment');
    }
  } catch (error) {
    console.error('❌ Error setting roles:', error.message);
    process.exit(1);
  }
})();
"

echo ""

# Step 3: Wait for Convex sync (Clerk webhook)
echo "Step 3: Waiting for Convex sync..."
echo "-----------------------------------"
echo "⏳ Waiting for Clerk webhook to sync users to Convex..."

# Poll for user existence in Convex (max 30 seconds)
POLL_COUNT=0
MAX_POLLS=30
ADVISOR_SYNCED=false

while [ $POLL_COUNT -lt $MAX_POLLS ]; do
  # Check if advisor exists in Convex via query
  if npx convex run users:getUserByEmail "{\"email\": \"$ADVISOR_EMAIL\"}" 2>/dev/null | grep -q "\"email\""; then
    echo "✓ Users synced to Convex"
    ADVISOR_SYNCED=true
    break
  fi

  POLL_COUNT=$((POLL_COUNT + 1))
  echo -n "."
  sleep 1
done
echo ""

if [ "$ADVISOR_SYNCED" = false ]; then
  echo ""
  echo "⚠️  Warning: Users may not have synced to Convex yet (waited ${MAX_POLLS}s)"
  echo "   This can happen if:"
  echo "   - Clerk webhook is not configured"
  echo "   - Network latency is high"
  echo "   - Webhook processing is delayed"
  echo ""
  echo "   Continuing anyway... The seed script will handle missing users."
  echo ""
fi

echo ""

# Step 4: Run Convex seeding script
echo "Step 4: Creating test data in Convex..."
echo "-----------------------------------"
npx convex run seed_test_student:createTestStudent "{\"studentEmail\": \"$STUDENT_EMAIL\", \"advisorEmail\": \"$ADVISOR_EMAIL\"}"

echo ""
echo "✅ Test student setup complete!"
echo ""
echo "=================================================="
echo "Test Credentials:"
echo "=================================================="
echo ""
echo "Student Account:"
echo "  Email:    $STUDENT_EMAIL"
echo "  Password: $PASSWORD"
echo ""
echo "Advisor Account:"
echo "  Email:    $ADVISOR_EMAIL"
echo "  Password: $PASSWORD"
echo ""
echo "=================================================="
echo "What's been created:"
echo "=================================================="
echo ""
echo "✓ Student and Advisor accounts in Clerk"
echo "✓ Student profile linked to advisor"
echo "✓ Sample resume with work experience"
echo "✓ 3 job applications (Google, Microsoft, Amazon)"
echo "✓ 3 career development goals"
echo "✓ 3 follow-up tasks from advisor"
echo "✓ 1 upcoming advisor session"
echo ""
echo "=================================================="
echo "Next steps:"
echo "=================================================="
echo ""
echo "1. Open http://localhost:3001"
echo "2. Sign in as student: $STUDENT_EMAIL"
echo "3. Test student features:"
echo "   - View/edit resume"
echo "   - Track job applications"
echo "   - See advisor follow-ups"
echo "   - View upcoming sessions"
echo ""
echo "4. Sign in as advisor: $ADVISOR_EMAIL"
echo "5. Test advisor features:"
echo "   - View student profile"
echo "   - Review student resume"
echo "   - Create follow-ups"
echo "   - Schedule sessions"
echo ""
