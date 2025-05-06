-- First check the current state of the super admin account
SELECT id, username, email, user_type, role FROM users WHERE email = 'superadmin@dev.ascentul';

-- Ensure the super admin account has the correct role value
UPDATE users SET role = 'super_admin' WHERE email = 'superadmin@dev.ascentul';

-- Also ensure the userType value is consistent
UPDATE users SET user_type = 'admin' WHERE email = 'superadmin@dev.ascentul';

-- Verify the changes
SELECT id, username, email, user_type, role FROM users WHERE email = 'superadmin@dev.ascentul';