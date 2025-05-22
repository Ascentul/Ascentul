-- Ascentul Database Setup Script
-- Complete setup for all tables needed in the Ascentul career development platform

-- Start transaction for atomic setup
BEGIN;

-- Initial admin user setup (change the password before running in production)
INSERT INTO public.users (
  username, 
  password, 
  name, 
  email, 
  user_type, 
  role, 
  email_verified, 
  onboarding_completed
) VALUES (
  'admin',
  -- Default hashed password, change in production
  '$2b$10$dU/ToEDDa6Qe6jWsecgmxuq28Qf4iuW3QnKc6P02YnZ6TZL6iDDfO', -- 'changeme123'
  'Admin User',
  'admin@example.com',
  'admin',
  'admin',
  TRUE,
  TRUE
) ON CONFLICT (username) DO NOTHING;

-- Commit the transaction
COMMIT;

-- Output success message
\echo 'Database setup completed successfully' 