# Supabase Setup for Ascentul

This guide will walk you through setting up Supabase for the Ascentul project.

## Prerequisites

1. A Supabase account (sign up at [https://supabase.com](https://supabase.com))
2. Node.js v16+ installed
3. Git repository cloned

## Step 1: Create a Supabase Project

1. Log in to the [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Enter a name for your project
4. Set a secure database password
5. Choose a region closest to your users
6. Click "Create New Project"

## Step 2: Get Supabase Credentials

1. In your Supabase dashboard, go to Project Settings
2. Click on API in the sidebar
3. Copy your:
   - API URL (Project URL)
   - anon/public key (API Key)
   - service_role key (for admin operations)

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root of your project with the following variables:

   ```
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Session Secret (generate a random string)
   SESSION_SECRET=your_random_session_secret

   # Other app settings
   PORT=3000
   NODE_ENV=development
   ```

2. Replace the placeholders with your actual values from Step 2

## Step 4: Run the Setup Script

We've included a script that will automatically set up the required tables in your Supabase project:

```bash
npm run setup:supabase
```

This script will:

- Connect to your Supabase project
- Create all necessary tables
- Output progress and any errors

## Step 5: Start the Application

Once the setup is complete, you can start the application:

```bash
npm run dev
```

## Common Issues and Troubleshooting

### Connection Error

- Verify that your Supabase credentials in the `.env` file are correct
- Check that your IP is not blocked in Supabase's access control

### SQL Execution Errors

- If you encounter errors with specific tables, you can check the Supabase SQL editor
- Look in the database logs in your Supabase dashboard

### Session Issues

- If sessions aren't persisting, ensure the `sessions` table was created correctly
- Check for any errors in the server logs

## Manual Setup

If you prefer to set up the tables manually, refer to `SUPABASE_SETUP.md` for the SQL schema you can execute in the Supabase SQL editor.
