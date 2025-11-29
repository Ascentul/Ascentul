#!/bin/bash

# Create Test Student for Advisor Testing
# This script creates a test student account in Clerk and sets up all necessary data in Convex
# Requires: STUDENT_EMAIL, ADVISOR_EMAIL, ADVISOR_UNIVERSITY_ID, SEED_TEST_PASSWORD, CLERK_SECRET_KEY, NEXT_PUBLIC_CONVEX_URL
# Example:
#   STUDENT_EMAIL="student@example.com" \
#   ADVISOR_EMAIL="advisor@example.com" \
#   ADVISOR_UNIVERSITY_ID="university_id_here" \
#   SEED_TEST_PASSWORD="strongpassword" \
#   CLERK_SECRET_KEY="sk_test_..." \
#   NEXT_PUBLIC_CONVEX_URL="https://..." \
#   ./scripts/create-test-student.sh

set -e

echo "🚀 Creating Test Student Account for Advisor Testing"
echo "===================================================="
echo ""

# Check for required commands
if ! command -v jq &> /dev/null; then
  echo "❌ Error: 'jq' command is required but not installed"
  echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
  exit 1
fi

# Production safety check
if [ "$NODE_ENV" = "production" ] || [ "$VERCEL_ENV" = "production" ]; then
  echo "❌ SECURITY ERROR: This script must not be run in production!"
  echo "This script contains test passwords and is for development only."
  exit 1
fi

# Default values
STUDENT_EMAIL="${STUDENT_EMAIL:-test.student@ascentful.io}"
ADVISOR_EMAIL="${ADVISOR_EMAIL:-test.advisor@ascentful.io}"

echo "📧 Student Email: $STUDENT_EMAIL"
echo "📧 Advisor Email: $ADVISOR_EMAIL"
echo ""

# Validate required environment variables
if [ -z "$SEED_TEST_PASSWORD" ]; then
  echo "❌ Error: SEED_TEST_PASSWORD environment variable is not set"
  echo ""
  echo "Please set it in your .env.local file or export it:"
  echo "  export SEED_TEST_PASSWORD='your_strong_password'"
  exit 1
fi
PASSWORD="$SEED_TEST_PASSWORD"

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

if [ -z "$ADVISOR_UNIVERSITY_ID" ]; then
  echo "❌ Error: ADVISOR_UNIVERSITY_ID environment variable is not set"
  echo ""
  echo "Advisor role requires a university_id to be assigned."
  echo "Please set it in your .env.local file or export it:"
  echo "  export ADVISOR_UNIVERSITY_ID='your_university_id'"
  exit 1
fi

echo ""

# Step 1: Create Clerk accounts if they don't exist
echo "Step 1: Creating Clerk accounts..."
echo "-----------------------------------"

# Create student and advisor accounts in Clerk using extracted utility
STUDENT_EMAIL="$STUDENT_EMAIL" \
ADVISOR_EMAIL="$ADVISOR_EMAIL" \
PASSWORD="$PASSWORD" \
CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
node "$(dirname "$0")/utils/create-clerk-users.js"

echo ""

# Step 2: Set roles in Clerk metadata
echo "Step 2: Setting roles in Clerk..."
echo "-----------------------------------"

# Set roles and metadata using extracted utility
STUDENT_EMAIL="$STUDENT_EMAIL" \
ADVISOR_EMAIL="$ADVISOR_EMAIL" \
ADVISOR_UNIVERSITY_ID="$ADVISOR_UNIVERSITY_ID" \
CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
node "$(dirname "$0")/utils/set-clerk-roles.js"

echo ""

# Step 3: Wait for Convex sync (Clerk webhook)
echo "Step 3: Waiting for Convex sync..."
echo "-----------------------------------"
echo "⏳ Waiting for Clerk webhook to sync users to Convex..."

# Poll for user existence in Convex (max 30 seconds)
# We check the advisor account as a representative test of webhook functionality.
# If the advisor syncs successfully, the webhook is working and the student should also sync.
POLL_COUNT=0
MAX_POLLS=30
USERS_SYNCED=false

while [ $POLL_COUNT -lt $MAX_POLLS ]; do
  # Check if advisor exists in Convex via query using jq for robust JSON parsing
  if npx convex run users:getUserByEmail "{\"email\": \"$ADVISOR_EMAIL\"}" 2>/dev/null | jq -e '.email' > /dev/null 2>&1; then
    echo "✓ Users synced to Convex"
    USERS_SYNCED=true
    break
  fi

  POLL_COUNT=$((POLL_COUNT + 1))
  echo -n "."
  sleep 1
done
echo ""

if [ "$USERS_SYNCED" = false ]; then
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
npx convex run seed_test_student:createTestStudent "$(jq -n --arg s "$STUDENT_EMAIL" --arg a "$ADVISOR_EMAIL" '{studentEmail: $s, advisorEmail: $a}')"

echo ""
echo "✅ Test student setup complete!"
echo ""
echo "=================================================="
echo "Test Credentials:"
echo "=================================================="
echo ""
echo "Student Account:"
echo "  Email:    $STUDENT_EMAIL"
echo "  Password: (from SEED_TEST_PASSWORD env var)"
echo ""
echo "Advisor Account:"
echo "  Email:    $ADVISOR_EMAIL"
echo "  Password: (from SEED_TEST_PASSWORD env var)"
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
