#!/bin/bash

# Test script for Supabase authentication flows
# This script provides commands to test various authentication flows after the migration

echo "====================== SUPABASE AUTH TESTING ======================"
echo "Use the following curl commands to test Supabase authentication flows"
echo ""

# Base URL - adjust if your dev server runs on a different port
BASE_URL="http://localhost:3000"

echo "1. TEST LOGIN FLOW:"
echo "curl -X POST $BASE_URL/api/auth/login -H \"Content-Type: application/json\" -d '{\"email\":\"test@example.com\",\"password\":\"yourpassword\"}'"
echo ""

echo "2. TEST PROTECTED ROUTE (after login, replace TOKEN with the token from login response):"
echo "curl $BASE_URL/api/user/me -H \"Authorization: Bearer TOKEN\""
echo ""

echo "3. TEST USER RETRIEVAL:"
echo "curl $BASE_URL/api/user/1 -H \"Authorization: Bearer TOKEN\""
echo ""

echo "4. TEST ADMIN ROUTE (requires admin role):"
echo "curl $BASE_URL/api/admin/users -H \"Authorization: Bearer TOKEN\""
echo ""

echo "5. TEST CONTACTS API (with dev_token for development mode):"
echo "curl $BASE_URL/api/contacts/all-followups -H \"Authorization: Bearer dev_token\""
echo ""

echo "6. TEST LOGOUT:"
echo "curl -X POST $BASE_URL/api/auth/logout -H \"Authorization: Bearer TOKEN\""
echo ""

echo "Expected behavior after migration:"
echo "- Login should return a Supabase JWT token"
echo "- Protected routes should reject requests without a valid token"
echo "- Admin routes should check user roles correctly"
echo "- No mention of sessions in any response"
echo ""

echo "====================== END TESTING GUIDE ======================"
