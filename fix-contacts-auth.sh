#!/bin/bash

# This script updates contact routes to properly use the Supabase authenticated user ID

echo "Fixing contacts.ts user ID references..."

# Update all instances of user ID retrieval to use the standard pattern
sed -i '' 's/const userId = (req as any)\.user?\.id;/const userId = req.userId ? parseInt(req.userId) : (req as any).user?.id;/g' src/backend/contacts.ts

echo "Changes complete. Please test the contacts API endpoints."
