#!/bin/bash

# This script tests the user profile endpoint to verify Supabase auth integration

echo "Testing /api/users/me endpoint with development token..."

# Base URL - adjust if your dev server runs on a different port
BASE_URL="http://localhost:3000"

# Test the endpoint with the dev_token that should trigger the development fallback
echo "1. TEST WITH DEV TOKEN (should work in development mode):"
curl $BASE_URL/api/users/me -H "Authorization: Bearer dev_token" -s | jq .

echo ""
echo "2. TEST WITHOUT TOKEN (should work in development mode if fallback is enabled):"
curl $BASE_URL/api/users/me -s | jq .

echo ""
echo "Note: If the endpoint returns a 500 error, check the server logs for more details."
echo "If the endpoint works correctly, you should see user details instead of an error."
