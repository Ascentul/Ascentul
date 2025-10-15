# GEMINI.md

## Project Overview

This project is "Ascentul", a modern career development platform. It is built with Next.js 14 (App Router) for the frontend and backend, Clerk for user authentication, and Convex as the database. The UI is styled with Tailwind CSS, and Stripe is integrated for handling payments.

The platform provides features like career path generation, resume analysis, cover letter creation, interview tracking, and networking tools. It also includes an AI career coach. The application has a role-based access control system, with different roles for users, students, university admins, and super admins.

## Building and Running

To get the project running locally, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment:**
    Copy the `.env.example` file to `.env.local` and fill in the required environment variables for Clerk, Convex, and Stripe.
    ```bash
    cp .env.example .env.local
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

### Other Key Commands

*   **Build for Production:**
    ```bash
    npm run build
    ```

*   **Start Production Server:**
    ```bash
    npm run start
    ```

*   **Run Tests:**
    ```bash
    npm run test
    ```

## Development Conventions

*   **Authentication:** User authentication and route protection are handled by Clerk. Use Clerk's hooks and middleware for managing user sessions and protecting routes.
*   **Database:** All data access should be done through Convex queries and mutations. The database schema is defined in `convex/schema.ts`.
*   **Styling:** The UI is built with Tailwind CSS. Use the brand color utilities like `bg-primary` and `text-primary` for consistent styling.
*   **Documentation:** All project documentation is located in the `docs/` directory. New documentation should be added there, and outdated documentation should be moved to `docs/legacy/`.
*   **Code Quality:** Run the linter to ensure code quality and consistency.
    ```bash
    npm run lint
    ```
*   **Type Checking:** Run the TypeScript compiler to check for type errors.
    ```bash
    npm run type-check
    ```
