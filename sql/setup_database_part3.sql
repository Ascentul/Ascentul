-- Ascentul Database Setup Script (Part 3)
-- Mentoring, Networking and Career Path Tables

-- Create mentor_chat_conversations table
CREATE TABLE IF NOT EXISTS public.mentor_chat_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  category VARCHAR NOT NULL DEFAULT 'general',
  mentor_persona VARCHAR NOT NULL DEFAULT 'career_coach',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create mentor_chat_messages table
CREATE TABLE IF NOT EXISTS public.mentor_chat_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES public.mentor_chat_conversations(id) ON DELETE CASCADE,
  is_user BOOLEAN NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role VARCHAR
);

-- Create contact_messages table for user support
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create universities table
CREATE TABLE IF NOT EXISTS public.universities (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  domain VARCHAR NOT NULL UNIQUE,
  country VARCHAR NOT NULL,
  state VARCHAR,
  city VARCHAR,
  address VARCHAR,
  website VARCHAR,
  logo_url VARCHAR,
  primary_color VARCHAR DEFAULT '#4A56E2',
  license_seats INTEGER DEFAULT 50,
  license_used INTEGER DEFAULT 0,
  subscription_tier VARCHAR NOT NULL DEFAULT 'basic',
  subscription_status VARCHAR NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create invites table
CREATE TABLE IF NOT EXISTS public.invites (
  id SERIAL PRIMARY KEY,
  email VARCHAR NOT NULL,
  invite_code VARCHAR NOT NULL UNIQUE,
  role VARCHAR NOT NULL DEFAULT 'user',
  university_id INTEGER REFERENCES public.universities(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create skills table
CREATE TABLE IF NOT EXISTS public.skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  category VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR DEFAULT 'code',
  popularity INTEGER DEFAULT 0,
  is_technical BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create languages table
CREATE TABLE IF NOT EXISTS public.languages (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  iso_code VARCHAR(10) NOT NULL UNIQUE,
  proficiency_levels JSONB NOT NULL DEFAULT '[
    {"value": "elementary", "label": "Elementary"}, 
    {"value": "limited", "label": "Limited Working"}, 
    {"value": "professional", "label": "Professional Working"}, 
    {"value": "full_professional", "label": "Full Professional"}, 
    {"value": "native", "label": "Native/Bilingual"}
  ]'::jsonb,
  icon VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_skills junction table
CREATE TABLE IF NOT EXISTS public.user_skills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency INTEGER NOT NULL DEFAULT 1,
  years_experience NUMERIC(4,1) DEFAULT 0,
  is_highlighted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Create user_languages junction table
CREATE TABLE IF NOT EXISTS public.user_languages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  language_id INTEGER NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  proficiency VARCHAR NOT NULL DEFAULT 'elementary',
  is_native BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, language_id)
);

-- Create networking_contacts table
CREATE TABLE IF NOT EXISTS public.networking_contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  company VARCHAR,
  position VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  linkedin_url VARCHAR,
  notes TEXT,
  contact_source VARCHAR,
  relationship VARCHAR,
  relationship_strength INTEGER DEFAULT 1,
  importance INTEGER DEFAULT 3,
  last_contact_date TIMESTAMPTZ,
  next_contact_date TIMESTAMPTZ,
  tags VARCHAR[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create contact_interactions table
CREATE TABLE IF NOT EXISTS public.contact_interactions (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES public.networking_contacts(id) ON DELETE CASCADE,
  interaction_type VARCHAR NOT NULL,
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  outcome TEXT,
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMPTZ,
  follow_up_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create career_paths table
CREATE TABLE IF NOT EXISTS public.career_paths (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  estimated_time_months INTEGER,
  difficulty VARCHAR NOT NULL DEFAULT 'intermediate',
  median_salary INTEGER,
  growth_potential VARCHAR,
  required_education VARCHAR[],
  key_skills VARCHAR[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_career_paths junction table
CREATE TABLE IF NOT EXISTS public.user_career_paths (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  career_path_id INTEGER NOT NULL REFERENCES public.career_paths(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_completion_date TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, career_path_id)
);

-- Create job_listings table
CREATE TABLE IF NOT EXISTS public.job_listings (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  company VARCHAR NOT NULL,
  location VARCHAR,
  description TEXT NOT NULL,
  requirements TEXT,
  salary_range VARCHAR,
  job_type VARCHAR,
  remote_option BOOLEAN DEFAULT FALSE,
  application_url VARCHAR,
  posting_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  source VARCHAR NOT NULL,
  source_id VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
); 