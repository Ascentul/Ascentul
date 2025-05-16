# Setting Up Supabase for Ascentul

This guide will help you set up and integrate Supabase with the Ascentul application. Supabase is a fully managed open source alternative to Firebase that provides a PostgreSQL database, authentication, real-time subscriptions, and storage.

## Prerequisites

- A Supabase account (sign up at [https://supabase.com](https://supabase.com))
- Node.js v16+ installed on your development machine
- Git installed on your development machine

## Step 1: Create a Supabase Project

1. Log in to the [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Enter a name for your project
4. Set a secure database password
5. Choose a region closest to your users
6. Click "Create New Project"

## Step 2: Create Database Tables

After your project is created, you'll need to set up the database schema. You can use the SQL editor in the Supabase dashboard:

1. Go to the SQL Editor in your Supabase dashboard
2. Create the basic tables needed by copying the schemas from our schema.ts file:

```sql
-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'regular',
  role TEXT DEFAULT 'user',
  university_id INTEGER,
  university_name TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  rank TEXT DEFAULT 'Career Explorer',
  profile_image TEXT,
  location TEXT,
  remote_preference TEXT,
  career_summary TEXT,
  linkedin_url TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'free',
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  subscription_cycle TEXT DEFAULT 'monthly',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_expires_at TIMESTAMP,
  needs_username BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verification_expires TIMESTAMP,
  pending_email TEXT,
  pending_email_token TEXT,
  pending_email_expires TIMESTAMP,
  password_last_changed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create skills table
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  proficiency_level INTEGER NOT NULL,
  year_of_experience INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create languages table
CREATE TABLE languages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  proficiency_level TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create sessions table for authentication
CREATE TABLE sessions (
  sid TEXT PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX idx_sessions_expire ON sessions (expire);
```

## Step 3: Get Your Supabase Credentials

1. In your Supabase dashboard, go to Project Settings
2. Click on API in the sidebar
3. You'll find your:
   - API URL (Project URL)
   - anon/public key (API Key)
   - service_role key (for admin operations)

## Step 4: Configure Environment Variables

Create a `.env` file in the root of your project with the following variables:

```
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Session Secret
SESSION_SECRET=a_random_secret_for_session_encryption

# Other app settings
PORT=3000
NODE_ENV=development
```

Replace the placeholders with your actual Supabase credentials.

## Step 5: Run the Application

With Supabase configured, you can now run the application:

```bash
npm install
npm run dev
```

## Testing the Connection

When the application starts, it will check the connection to Supabase. You should see logs confirming:

- "Using Supabase for session storage"
- "Supabase connection successful"

## Troubleshooting

If you encounter any issues:

1. Verify your Supabase credentials in the `.env` file
2. Check that your IP address is not restricted in Supabase
3. Ensure the required tables have been created correctly
4. Look at the console logs for specific error messages

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client Documentation](https://supabase.com/docs/reference/javascript/introduction) 