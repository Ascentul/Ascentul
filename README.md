# Ascentul - Career Development Platform

## Project Structure

The codebase has been reorganized into a clean, maintainable structure:

```
/src
  /frontend         # React frontend application
  /backend          # Express backend application
  /config           # Configuration files
  /scripts          # Utility scripts
  /utils            # Shared utilities
  /types            # Shared TypeScript types
  /tests            # Test files
  /assets           # Static assets
```

## Root Directory

The root directory now contains only essential configuration files and directories:

- **Configuration files**: package.json, tsconfig.json, vite.config.ts, tailwind.config.ts, etc.
- **Source code**: All application code is organized within the src directory
- **Documentation**: README.md, REORGANIZATION.md, and SUPABASE_SETUP.md

## Getting Started

### Development

To run the application in development mode:

```bash
npm run dev
```

This will start both the frontend and backend in development mode.

### Building for Production

To build the application for production:

```bash
npm run build
```

This will build both the frontend and backend.

### Running in Production

To run the application in production mode:

```bash
npm start
```

## Dependencies

This project uses:

- Frontend: React, Tailwind CSS, Shadcn UI
- Backend: Express, TypeScript
- Database: Postgres with Drizzle ORM or Supabase
- Authentication: Passport
- API: OpenAI, Stripe, SendGrid

## Project Maintenance

To verify the project structure is correct, run the structure check script:

```bash
node src/scripts/test-structure.js
```

To fix any path or configuration issues, run the fix links script:

```bash
node src/scripts/fix-links.js
```

To fix schema import paths after reorganization:

```bash
node src/scripts/fix-schema-imports.js
```

## Database Setup

You can use either a direct PostgreSQL connection or Supabase for this application:

### Option 1: Direct PostgreSQL Connection

1. Create a `.env` file in the root directory
2. Add your database connection string:

```
DATABASE_URL=postgresql://username:password@localhost:5432/your_database
```

3. Run database migrations:

```bash
npm run db:push
``` 

### Option 2: Supabase Integration

Supabase provides a fully managed PostgreSQL database with authentication, real-time subscriptions, and storage.

1. Follow the setup instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
2. Add your Supabase credentials to the `.env` file:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

The application will automatically detect and use Supabase if these environment variables are set. 