#!/bin/bash

# Test Users Creation Script for Ascentul/CareerTracker
# This script creates test users with different roles for testing role-based access control

echo "🚀 Starting test user creation process..."

# Method 1: Using SQL script directly
echo "📊 Method 1: Using SQL script..."
echo "🔄 Executing SQL script against database..."

# Execute the SQL script against the database
psql $DATABASE_URL -f seed-test-users.sql

if [ $? -eq 0 ]; then
  echo "✅ SQL script executed successfully"
else
  echo "⚠️ SQL script execution failed, trying Node.js method"
fi

# Method 2: Using Node.js script
echo "📊 Method 2: Using Node.js script..."
echo "🔄 Running Node.js script to create users..."

# Execute the Node.js script
node create-test-users.js

if [ $? -eq 0 ]; then
  echo "✅ Node.js script executed successfully"
else
  echo "⚠️ Node.js script execution failed"
fi

# Create a summary of test accounts
echo "📋 Creating user accounts summary..."

cat << 'EOF' > test-accounts.txt
📘 Test Account Credentials (Replit Dev Environment)

🔹 Regular User
Email: user@test.com
Password: test1234
Role: user

🎓 University User
Email: student@univ.edu
Password: test1234
Role: university_user

🎓 University Admin
Email: admin@univ.edu
Password: test1234
Role: university_admin

🏢 Ascentul Staff
Email: staff@ascentul.io
Password: test1234
Role: staff

👑 Super Admin (Dev Account)
Email: superadmin@dev.ascentul
Password: test1234
Role: super_admin

🛠️ Notes:
- These accounts are safe to reset or override at any time.
- Use them for QA testing across role-based login, dashboards, and access control flows.
EOF

echo "✅ Test accounts summary written to test-accounts.txt"

# Verify users were created by querying the database
echo "🔍 Verifying created users in database..."

psql $DATABASE_URL -c "SELECT id, email, role, user_type FROM users WHERE email IN (
  'user@test.com', 
  'student@univ.edu', 
  'admin@univ.edu', 
  'staff@ascentul.io', 
  'superadmin@dev.ascentul'
);"

echo "✅ Test users creation process complete!"