-- Disable email confirmation requirement
-- This allows users to sign in immediately after registration without confirming their email

UPDATE auth.config 
SET email_confirm_required = false 
WHERE id = 1;

-- Alternative approach if the above doesn't work:
-- You may need to update this via the Supabase dashboard instead
-- Go to Authentication > Settings > Email confirmation = OFF
