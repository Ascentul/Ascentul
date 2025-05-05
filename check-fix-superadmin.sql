-- Check if the super admin account exists with the expected email
SELECT id, username, email, user_type, role FROM users WHERE email = 'superadmin@dev.ascentul' OR email = 'superadmin@dev.ascentul.com';

-- If the super admin account exists but has the wrong email, update it
UPDATE users SET email = 'superadmin@dev.ascentul' WHERE email = 'superadmin@dev.ascentul.com';

-- If the super admin account exists but doesn't have the correct role, update it
UPDATE users SET role = 'super_admin' WHERE (email = 'superadmin@dev.ascentul' OR email = 'superadmin@dev.ascentul.com') AND (role IS NULL OR role != 'super_admin');

-- Check super admin account after updates
SELECT id, username, email, user_type, role FROM users WHERE email = 'superadmin@dev.ascentul' OR email = 'superadmin@dev.ascentul.com';