-- Ascentul Database Setup Script (Part 4)
-- Reviews, Recommendations, and Final Tables

-- Create application_wizard_steps table
CREATE TABLE IF NOT EXISTS public.application_wizard_steps (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_type VARCHAR NOT NULL,
  step_title VARCHAR NOT NULL,
  step_description TEXT,
  step_data JSONB,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS public.recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  source VARCHAR NOT NULL,
  source_id VARCHAR,
  metadata JSONB,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create daily_recommendations table
CREATE TABLE IF NOT EXISTS public.daily_recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recommendations JSONB NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create user_reviews table
CREATE TABLE IF NOT EXISTS public.user_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  source VARCHAR NOT NULL DEFAULT 'app',
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  current BOOLEAN NOT NULL DEFAULT FALSE,
  url VARCHAR,
  repository_url VARCHAR,
  project_image VARCHAR,
  skills VARCHAR[],
  category VARCHAR DEFAULT 'personal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  subject VARCHAR NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'open',
  priority VARCHAR NOT NULL DEFAULT 'medium',
  category VARCHAR NOT NULL DEFAULT 'general',
  assigned_to INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create support_ticket_messages table
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  is_staff BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  value JSONB NOT NULL,
  category VARCHAR NOT NULL DEFAULT 'general',
  description TEXT,
  is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create skill_stacker_plans table
CREATE TABLE IF NOT EXISTS public.skill_stacker_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  skill_id INTEGER REFERENCES public.skills(id) ON DELETE SET NULL,
  skill_name VARCHAR NOT NULL, -- Denormalized for convenience
  target_level INTEGER NOT NULL DEFAULT 3 CHECK (target_level >= 1 AND target_level <= 5),
  start_level INTEGER NOT NULL DEFAULT 1 CHECK (start_level >= 1 AND start_level <= 5),
  current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 5),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  tasks JSONB NOT NULL DEFAULT '[]',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_end_date TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON public.sessions (expire);

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (username);
CREATE INDEX IF NOT EXISTS idx_users_university_id ON public.users (university_id);

-- Work history indexes
CREATE INDEX IF NOT EXISTS idx_work_history_user_id ON public.work_history (user_id);

-- Education history indexes
CREATE INDEX IF NOT EXISTS idx_education_history_user_id ON public.education_history (user_id);

-- Resume and cover letter indexes
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes (user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON public.cover_letters (user_id);

-- Job application indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications (status);

-- Certification indexes
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON public.certifications (user_id);

-- Skills and languages indexes
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills (user_id);
CREATE INDEX IF NOT EXISTS idx_user_languages_user_id ON public.user_languages (user_id);

-- Contact indexes
CREATE INDEX IF NOT EXISTS idx_networking_contacts_user_id ON public.networking_contacts (user_id);
CREATE INDEX IF NOT EXISTS idx_networking_contacts_next_contact ON public.networking_contacts (next_contact_date);

-- Career path indexes
CREATE INDEX IF NOT EXISTS idx_user_career_paths_user_id ON public.user_career_paths (user_id);

-- Recommendation indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON public.recommendations (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_recommendations_user_id_date ON public.daily_recommendations (user_id, date);

-- Comment on tables
COMMENT ON TABLE public.sessions IS 'Stores session data for the application';
COMMENT ON TABLE public.users IS 'Stores user account information';
COMMENT ON TABLE public.goals IS 'User career and learning goals';
COMMENT ON TABLE public.work_history IS 'User work experience records';
COMMENT ON TABLE public.education_history IS 'User education records';
COMMENT ON TABLE public.resumes IS 'User resume documents';
COMMENT ON TABLE public.cover_letters IS 'User cover letter documents';
COMMENT ON TABLE public.job_applications IS 'User job application records';
COMMENT ON TABLE public.networking_contacts IS 'User networking contacts';
COMMENT ON TABLE public.skills IS 'Available skills for user profiles';
COMMENT ON TABLE public.user_skills IS 'Skills associated with user profiles';
COMMENT ON TABLE public.career_paths IS 'Career path information and resources'; 