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
- **Documentation**: README.md and REORGANIZATION.md

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
- Database: Postgres with Drizzle ORM
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