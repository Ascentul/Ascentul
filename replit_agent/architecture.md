# Architecture Overview

## Overview

Ascentul/CareerTracker is a comprehensive career development platform that helps users track job applications, create resumes, practice interviews, and receive AI-powered career coaching. The application supports multiple user roles (regular users, university students, university administrators, staff, and system administrators) with role-specific views and functionality.

The system is built with a modern React frontend and Node.js/Express backend, utilizing PostgreSQL for data storage, and integrating several AI-powered features powered by OpenAI's GPT models.

## System Architecture

The application follows a standard client-server architecture:

1. **Frontend**: React application built with TypeScript
2. **Backend**: Express.js server with TypeScript
3. **Database**: PostgreSQL database accessed via Drizzle ORM
4. **AI Services**: OpenAI integration for various AI-powered features
5. **External APIs**: Integrations with services like Adzuna for job listings, Stripe for payments, and Mailgun for email

### Architecture Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │ ◄─────► │  Express Server │ ◄─────► │   PostgreSQL    │
│                 │         │                 │         │                 │
└─────────────────┘         └────────┬────────┘         └─────────────────┘
                                     │
                                     │
                            ┌────────▼────────┐
                            │  External APIs  │
                            │  - OpenAI       │
                            │  - Stripe       │
                            │  - Mailgun      │
                            │  - Adzuna       │
                            └─────────────────┘
```

## Key Components

### Frontend

1. **Client Application**
   - Built with React and TypeScript
   - Uses a component-based architecture
   - Routes for different user types (admin, university, regular user)
   - Uses shadcn/ui components with Radix UI primitives
   - State management via React Query for server state

2. **Authentication**
   - Session-based authentication
   - Different login workflows based on user type
   - Role-based route protection

3. **User Interfaces**
   - Role-specific dashboards and layouts
   - Admin dashboard for system administrators
   - University admin dashboard for university administrators
   - Career dashboard for regular users
   - Responsive design for different screen sizes

### Backend

1. **API Server**
   - Express.js application 
   - TypeScript for type safety
   - Route handlers for different features

2. **Authentication & Authorization**
   - Session-based authentication using express-session
   - PostgreSQL session store for persistence
   - Role-based access control for API endpoints

3. **Database Access**
   - Drizzle ORM for database interactions
   - PostgreSQL database (via Neon's serverless Postgres)
   - Defined schemas in shared/schema.ts

4. **AI Integrations**
   - OpenAI GPT models for various features
   - Interview practice analysis
   - AI career coach
   - Resume and cover letter generation
   - Career path recommendations

5. **External Service Integrations**
   - Stripe for payment processing
   - Mailgun for email notifications
   - Adzuna API for job listings
   - PDF parsing for resume uploads

## Data Flow

### Authentication Flow

1. User submits login credentials
2. Server validates credentials and creates a session
3. User is redirected to the appropriate dashboard based on role
4. Subsequent requests include session cookies for authentication
5. Protected routes check session validity and user role

### Job Application Flow

1. User searches for jobs via the integrated job search
2. User selects a job and creates an application
3. Application is stored in the database
4. User can track application status and add notes
5. User can use AI features to generate cover letters or prepare for interviews

### AI Career Coaching Flow

1. User interacts with AI coach via chat interface
2. Backend sends requests to OpenAI API
3. Responses are processed and returned to the user
4. Conversations are stored for future reference

## Data Model

The application uses a relational data model with key entities:

1. **Users**
   - Core user data (id, email, password, name)
   - User type and role for authorization
   - Subscription information

2. **Career Data**
   - Work history
   - Education history
   - Skills
   - Languages
   - Career goals

3. **Job Applications**
   - Application tracking
   - Resumes and cover letters
   - Interview notes and tracking

4. **AI Interactions**
   - AI coach conversations
   - OpenAI usage logs
   - Generated content

## External Dependencies

1. **Database**
   - PostgreSQL (via Neon serverless Postgres)
   - Drizzle ORM for database access
   - Connect-pg-simple for session storage

2. **Authentication**
   - Express-session for session management
   - Crypto for password hashing

3. **AI Services**
   - OpenAI SDK for API access
   - Custom wrappers for tracking and logging

4. **Payment Processing**
   - Stripe for subscription payments
   - Custom handlers for webhooks

5. **Email Services**
   - Mailgun.js for email delivery
   - Email templates for notifications

6. **Job Data**
   - Adzuna API for job listings
   - Custom interfaces for job data

7. **File Processing**
   - PDF.js for PDF parsing
   - Multer for file uploads

## Deployment Strategy

The application is configured for deployment on Replit, with:

1. **Build Process**
   - Vite for frontend bundling
   - esbuild for backend bundling

2. **Environment Configuration**
   - Environment variables for sensitive configuration
   - Fallbacks for development environments

3. **Scaling Considerations**
   - Serverless database connection
   - API rate limiting for external services
   - Usage monitoring for AI services

4. **Development Workflow**
   - Node.js 20 for development
   - PostgreSQL 16 for database
   - Replit workflows for streamlined development

## Testing Strategy

The application includes:

1. **Test Users**
   - Scripts to create test users with different roles
   - Convenience utilities for testing

2. **Debug Tools**
   - Logging for API requests and responses
   - Debug endpoints for troubleshooting

## Security Considerations

1. **Authentication**
   - Session-based authentication
   - Password hashing with salt
   - Email verification

2. **Authorization**
   - Role-based access control
   - Route guards for protected routes

3. **API Security**
   - Input validation with Zod schemas
   - API key protection for external services