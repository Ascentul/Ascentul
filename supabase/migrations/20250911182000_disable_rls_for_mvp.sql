-- Migration: Disable RLS for MVP to handle authorization at the application layer
-- Date: 2025-09-11
-- Note: Policies remain defined in the catalog; enforcement is disabled so we can re-enable later without losing policy definitions.

BEGIN;

-- Ensure RLS is disabled and not forced on key tables
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements NO FORCE ROW LEVEL SECURITY;

ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications NO FORCE ROW LEVEL SECURITY;

ALTER TABLE public.networking_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.networking_contacts NO FORCE ROW LEVEL SECURITY;

ALTER TABLE public.resumes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes NO FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements NO FORCE ROW LEVEL SECURITY;

COMMIT;
