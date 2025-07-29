-- Simple migration to add essential usage tracking columns
-- Execute this in Supabase SQL Editor

-- Add last_login timestamp
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add login count for tracking total number of logins
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Add total session time in milliseconds
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_session_time BIGINT DEFAULT 0;

-- Add account status column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' 
CHECK (account_status IN ('active', 'inactive', 'suspended', 'banned'));

-- Update existing users to have default values
UPDATE users 
SET 
  login_count = 1,
  account_status = CASE 
    WHEN subscription_status = 'active' THEN 'active'
    WHEN subscription_status = 'suspended' THEN 'suspended'
    ELSE 'inactive'
  END,
  last_login = created_at,
  total_session_time = 0
WHERE login_count IS NULL OR account_status IS NULL;
