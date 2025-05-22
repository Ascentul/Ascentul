# Ascentul Database Setup

This guide provides instructions for setting up the Ascentul database in your Supabase project.

## Prerequisites

- A Supabase account with a project created
- PostgreSQL client installed (psql)
- Supabase connection string

## Setup Options

### Option 1: Running the Complete Script in Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Navigate to your project
3. Go to the SQL Editor section
4. Create a new query
5. Copy the contents of `sql/setup_database.sql`
6. Paste into the SQL Editor
7. Run the query to set up all tables

### Option 2: Running From Local Environment

1. Connect to your Supabase database using the connection string:

```bash
psql "postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

2. Once connected, run the main setup script:

```sql
\i 'sql/setup_database.sql'
```

### Option 3: Running Individual Parts

You can run the database setup in parts if needed:

1. Part 1: Core User and Authentication Tables

```sql
\i 'sql/setup_database_part1.sql'
```

2. Part 2: AI Coaching and Interview-related Tables

```sql
\i 'sql/setup_database_part2.sql'
```

3. Part 3: Mentoring, Networking and Career Path Tables

```sql
\i 'sql/setup_database_part3.sql'
```

4. Part 4: Reviews, Recommendations, and Final Tables

```sql
\i 'sql/setup_database_part4.sql'
```

## Default Admin User

The script creates a default admin user with the following credentials:

- Username: `admin`
- Password: `changeme123`
- Email: `admin@example.com`

**Important:** Change the default admin password immediately after setup.

## Database Schema

The database setup includes the following main tables:

- `sessions` - For storing user session data
- `users` - Core user account information
- `goals` - User's career and learning goals
- `work_history` - User work experience records
- `education_history` - User education records
- `resumes` - User resume documents
- `cover_letters` - User cover letter documents
- `achievements` - Platform achievement definitions
- `user_achievements` - User-earned achievements
- `ai_coach_conversations` - AI coaching session records
- `ai_coach_messages` - Messages in AI coaching sessions
- `interview_questions` - Interview question bank
- `interview_practice` - User interview practice sessions
- `interview_processes` - Interview process tracking
- `job_applications` - User job application records
- `networking_contacts` - User networking contacts
- `skills` - Available skills for user profiles
- `languages` - Available languages for user profiles
- `career_paths` - Career path information
- `recommendations` - Personalized user recommendations

And many junction tables for relationships between these core entities.

## Performance Optimizations

The setup includes several indexes for performance optimization:

- Indexes on user foreign keys to speed up relationship queries
- Indexes on status fields for filtering operations
- Indexes on date fields for time-based queries

## Troubleshooting

If you encounter any issues with the setup:

1. **Constraint Violations**: If you're running parts of the script separately, ensure you run them in order (1-4) as later parts depend on tables created in earlier parts.

2. **Permission Issues**: Ensure your Supabase user has permissions to create tables and indexes.

3. **PostgreSQL Version Compatibility**: The script is designed for PostgreSQL 14+, which Supabase uses. If you're using a different version, some syntax may need adjustment.

## Backup Recommendations

We recommend enabling automatic backups in your Supabase project settings to protect your data.
