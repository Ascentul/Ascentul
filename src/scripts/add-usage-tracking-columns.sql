-- Add usage tracking columns to users table
-- This migration adds columns for tracking user activity and session data

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
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended', 'banned'));

-- Create index on last_login for performance
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Create index on login_count for analytics
CREATE INDEX IF NOT EXISTS idx_users_login_count ON users(login_count);

-- Update existing users to have default values
UPDATE users 
SET 
  login_count = 1,
  account_status = CASE 
    WHEN subscription_status = 'active' THEN 'active'
    WHEN subscription_status = 'suspended' THEN 'suspended'
    ELSE 'inactive'
  END,
  last_login = created_at
WHERE login_count IS NULL OR account_status IS NULL;

-- Create a user_sessions table for detailed session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  duration_ms BIGINT,
  ip_address INET,
  user_agent TEXT,
  features_used TEXT[], -- Array of features used during session
  pages_visited TEXT[], -- Array of pages visited during session
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for user_sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start ON user_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_user_sessions_duration ON user_sessions(duration_ms);

-- Create a function to update user stats when sessions are added/updated
CREATE OR REPLACE FUNCTION update_user_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update user's total session time and login count
    UPDATE users 
    SET 
      total_session_time = (
        SELECT COALESCE(SUM(duration_ms), 0) 
        FROM user_sessions 
        WHERE user_id = NEW.user_id AND duration_ms IS NOT NULL
      ),
      login_count = (
        SELECT COUNT(*) 
        FROM user_sessions 
        WHERE user_id = NEW.user_id
      ),
      last_login = (
        SELECT MAX(session_start) 
        FROM user_sessions 
        WHERE user_id = NEW.user_id
      )
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user stats
DROP TRIGGER IF EXISTS trigger_update_user_session_stats ON user_sessions;
CREATE TRIGGER trigger_update_user_session_stats
  AFTER INSERT OR UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_session_stats();

-- Create a function to start a new session
CREATE OR REPLACE FUNCTION start_user_session(
  p_user_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO user_sessions (user_id, ip_address, user_agent)
  VALUES (p_user_id, p_ip_address, p_user_agent)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to end a session
CREATE OR REPLACE FUNCTION end_user_session(
  p_session_id UUID,
  p_features_used TEXT[] DEFAULT NULL,
  p_pages_visited TEXT[] DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_sessions 
  SET 
    session_end = NOW(),
    duration_ms = EXTRACT(EPOCH FROM (NOW() - session_start)) * 1000,
    features_used = COALESCE(p_features_used, features_used),
    pages_visited = COALESCE(p_pages_visited, pages_visited),
    updated_at = NOW()
  WHERE id = p_session_id AND session_end IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a function to track feature usage during a session
CREATE OR REPLACE FUNCTION track_feature_usage(
  p_session_id UUID,
  p_feature_name TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_sessions 
  SET 
    features_used = array_append(
      COALESCE(features_used, ARRAY[]::TEXT[]), 
      p_feature_name
    ),
    updated_at = NOW()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to track page visits during a session
CREATE OR REPLACE FUNCTION track_page_visit(
  p_session_id UUID,
  p_page_name TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_sessions 
  SET 
    pages_visited = array_append(
      COALESCE(pages_visited, ARRAY[]::TEXT[]), 
      p_page_name
    ),
    updated_at = NOW()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;
