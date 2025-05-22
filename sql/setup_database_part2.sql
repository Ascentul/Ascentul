-- Ascentul Database Setup Script (Part 2)
-- AI Coaching and Interview-related Tables

-- Create ai_coach_conversations table
CREATE TABLE IF NOT EXISTS public.ai_coach_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ai_coach_messages table
CREATE TABLE IF NOT EXISTS public.ai_coach_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES public.ai_coach_conversations(id) ON DELETE CASCADE,
  is_user BOOLEAN NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create xp_history table
CREATE TABLE IF NOT EXISTS public.xp_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source VARCHAR NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create certifications table
CREATE TABLE IF NOT EXISTS public.certifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  issuing_organization VARCHAR NOT NULL,
  issue_date VARCHAR NOT NULL,
  expiration_date VARCHAR,
  credential_id VARCHAR,
  credential_url VARCHAR,
  description TEXT,
  skills VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_personal_achievements table
CREATE TABLE IF NOT EXISTS public.user_personal_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  achievement_date TIMESTAMPTZ NOT NULL,
  issuing_organization VARCHAR,
  proof_url VARCHAR,
  skills VARCHAR,
  category VARCHAR NOT NULL DEFAULT 'professional',
  icon VARCHAR DEFAULT 'award',
  xp_value INTEGER NOT NULL DEFAULT 50,
  is_highlighted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create interview_questions table
CREATE TABLE IF NOT EXISTS public.interview_questions (
  id SERIAL PRIMARY KEY,
  category VARCHAR NOT NULL,
  question TEXT NOT NULL,
  suggested_answer TEXT,
  difficulty_level INTEGER NOT NULL DEFAULT 1
);

-- Create interview_practice table
CREATE TABLE IF NOT EXISTS public.interview_practice (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  confidence INTEGER,
  practice_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create interview_processes table
CREATE TABLE IF NOT EXISTS public.interview_processes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name VARCHAR NOT NULL,
  position VARCHAR NOT NULL,
  location VARCHAR,
  job_description TEXT,
  contact_name VARCHAR,
  contact_email VARCHAR,
  contact_phone VARCHAR,
  job_link VARCHAR,
  resume_id INTEGER,
  application_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR NOT NULL DEFAULT 'not_started',
  notes TEXT,
  follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create job_applications table (will be referenced by interview_stages)
CREATE TABLE IF NOT EXISTS public.job_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_title VARCHAR NOT NULL,
  company VARCHAR NOT NULL,
  location VARCHAR,
  job_posting_url VARCHAR,
  job_description TEXT,
  salary_range VARCHAR,
  application_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR NOT NULL DEFAULT 'applied',
  notes TEXT,
  resume_id INTEGER,
  cover_letter_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create interview_stages table
CREATE TABLE IF NOT EXISTS public.interview_stages (
  id SERIAL PRIMARY KEY,
  process_id INTEGER REFERENCES public.interview_processes(id) ON DELETE CASCADE,
  application_id INTEGER REFERENCES public.job_applications(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  location VARCHAR,
  interviewers VARCHAR[],
  notes TEXT,
  feedback TEXT,
  outcome VARCHAR,
  next_steps TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (process_id IS NOT NULL OR application_id IS NOT NULL)
);

-- Create followup_actions table
CREATE TABLE IF NOT EXISTS public.followup_actions (
  id SERIAL PRIMARY KEY,
  process_id INTEGER REFERENCES public.interview_processes(id) ON DELETE CASCADE,
  application_id INTEGER REFERENCES public.job_applications(id) ON DELETE CASCADE,
  stage_id INTEGER REFERENCES public.interview_stages(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
); 