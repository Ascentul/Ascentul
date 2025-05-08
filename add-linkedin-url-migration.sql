-- Migration to add linkedin_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;