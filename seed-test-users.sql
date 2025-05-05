-- Test Users Seed Script for Ascentul/CareerTracker
-- This script creates test users with different roles for testing role-based access control

-- Note: This script assumes pre-hashed passwords. 
-- The format is hash.salt where hash is a pbkdf2 hash (64 bytes, sha512, 1000 iterations)

-- Create test users for all roles
DO $$
DECLARE
    -- These are pre-hashed values of 'test1234' using the same algorithm as the app
    -- In a real implementation, you'd generate these dynamically
    hashed_password TEXT := '7b5970740de0960beb2d2bf053743a4764e7970abb9b1a57323e5fd5b6ebdc1e8ef1b289a27ea2105dda4c8d6417dbe6c97ddd3eb3c61b152bd1cf86c261d7c9.f6a0c765ca9ac3c3a04116fcb9f86348';
BEGIN
    -- Regular user
    INSERT INTO users (
        email, password, name, username, user_type, role, 
        subscription_status, subscription_plan, created_at
    ) VALUES (
        'user@test.com', 
        hashed_password, 
        'Regular User', 
        'testuser', 
        'regular', 
        'user', 
        'active', 
        'free', 
        NOW()
    )
    ON CONFLICT (email) 
    DO UPDATE SET 
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        user_type = EXCLUDED.user_type;
    
    -- University user (student)
    INSERT INTO users (
        email, password, name, username, user_type, role, 
        subscription_status, subscription_plan, created_at
    ) VALUES (
        'student@univ.edu', 
        hashed_password, 
        'University Student', 
        'unistudent', 
        'university_user', 
        'university_user', 
        'active', 
        'free', 
        NOW()
    )
    ON CONFLICT (email) 
    DO UPDATE SET 
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        user_type = EXCLUDED.user_type;
    
    -- University admin
    INSERT INTO users (
        email, password, name, username, user_type, role, 
        subscription_status, subscription_plan, created_at
    ) VALUES (
        'admin@univ.edu', 
        hashed_password, 
        'University Admin', 
        'uniadmin', 
        'university_admin', 
        'university_admin', 
        'active', 
        'free', 
        NOW()
    )
    ON CONFLICT (email) 
    DO UPDATE SET 
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        user_type = EXCLUDED.user_type;
    
    -- Staff member
    INSERT INTO users (
        email, password, name, username, user_type, role, 
        subscription_status, subscription_plan, created_at
    ) VALUES (
        'staff@ascentul.io', 
        hashed_password, 
        'Ascentul Staff', 
        'staffmember', 
        'staff', 
        'staff', 
        'active', 
        'free', 
        NOW()
    )
    ON CONFLICT (email) 
    DO UPDATE SET 
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        user_type = EXCLUDED.user_type;
    
    -- Super admin
    INSERT INTO users (
        email, password, name, username, user_type, role, 
        subscription_status, subscription_plan, created_at
    ) VALUES (
        'superadmin@dev.ascentul', 
        hashed_password, 
        'Super Admin', 
        'superadmin', 
        'admin', 
        'super_admin', 
        'active', 
        'free', 
        NOW()
    )
    ON CONFLICT (email) 
    DO UPDATE SET 
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        user_type = EXCLUDED.user_type;

    RAISE NOTICE 'Test users created successfully';
END $$;