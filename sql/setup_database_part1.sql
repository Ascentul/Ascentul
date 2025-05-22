-- Ascentul Database Setup Script (Part 1)
-- Core User and Authentication Tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sessions table for session storage
CREATE TABLE IF NOT EXISTS public.sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);

-- Create index for expiration-based queries
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON public.sessions (expire);

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  user_type VARCHAR NOT NULL DEFAULT 'regular',
  role VARCHAR DEFAULT 'user',
  university_id INTEGER,
  university_name VARCHAR,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  rank VARCHAR DEFAULT 'Career Explorer',
  profile_image VARCHAR,
  location VARCHAR,
  remote_preference VARCHAR,
  career_summary TEXT,
  linkedin_url VARCHAR,
  subscription_plan VARCHAR NOT NULL DEFAULT 'free',
  subscription_status VARCHAR NOT NULL DEFAULT 'inactive',
  subscription_cycle VARCHAR DEFAULT 'monthly',
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  subscription_expires_at TIMESTAMPTZ,
  needs_username BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR,
  verification_expires TIMESTAMPTZ,
  pending_email VARCHAR,
  pending_email_token VARCHAR,
  pending_email_expires TIMESTAMPTZ,
  password_last_changed TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  status VARCHAR NOT NULL DEFAULT 'active',
  due_date TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  checklist JSONB DEFAULT '[]',
  xp_reward INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create work_history table
CREATE TABLE IF NOT EXISTS public.work_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company VARCHAR NOT NULL,
  position VARCHAR NOT NULL,
  location VARCHAR,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  current_job BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  achievements VARCHAR[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create education_history table
CREATE TABLE IF NOT EXISTS public.education_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  institution VARCHAR NOT NULL,
  degree VARCHAR NOT NULL,
  field_of_study VARCHAR NOT NULL,
  location VARCHAR,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  current BOOLEAN NOT NULL DEFAULT FALSE,
  gpa VARCHAR,
  description TEXT,
  achievements VARCHAR[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  template VARCHAR NOT NULL DEFAULT 'standard',
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create cover_letters table
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  job_title VARCHAR,
  template VARCHAR NOT NULL DEFAULT 'standard',
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR NOT NULL,
  xp_reward INTEGER NOT NULL,
  required_action VARCHAR NOT NULL,
  required_value INTEGER NOT NULL
);

-- Create user_achievements junction table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
); 