-- Script to create initial user: yummygut
-- This script creates a user with email/password authentication
-- Run this in your Supabase SQL Editor

-- Note: Supabase uses email-based authentication, so we'll create the user
-- with email "yummygut@yummygut.com" (or you can use any email format)
-- The username "yummygut" will be stored in the user metadata

-- Create user using Supabase Auth Admin API (this needs to be run via Supabase Dashboard or API)
-- SQL cannot directly create auth users, so use one of these methods:

-- METHOD 1: Via Supabase Dashboard (Recommended)
-- 1. Go to Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Email: yummygut@yummygut.com (or your preferred email)
-- 4. Password: 4yummygut@2025@bunmaska
-- 5. Auto Confirm User: Yes
-- 6. Click "Create user"
-- 7. After creation, update the user metadata:
--    UPDATE auth.users 
--    SET raw_user_meta_data = jsonb_build_object('username', 'yummygut')
--    WHERE email = 'yummygut@yummygut.com';

-- METHOD 2: Via Supabase Management API (using curl or Postman)
-- POST https://your-project.supabase.co/auth/v1/admin/users
-- Headers:
--   Authorization: Bearer YOUR_SERVICE_ROLE_KEY
--   Content-Type: application/json
-- Body:
-- {
--   "email": "yummygut@yummygut.com",
--   "password": "4yummygut@2025@bunmaska",
--   "email_confirm": true,
--   "user_metadata": {
--     "username": "yummygut"
--   }
-- }

-- METHOD 3: Using Supabase CLI (if installed)
-- supabase auth users create yummygut@yummygut.com --password "4yummygut@2025@bunmaska" --email-confirm

-- After creating the user, you can update metadata with this SQL:
-- (Replace 'yummygut@yummygut.com' with the actual email you used)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object('username', 'yummygut')
WHERE email = 'yummygut@yummygut.com';

-- Verify the user was created:
SELECT id, email, raw_user_meta_data, created_at 
FROM auth.users 
WHERE email = 'yummygut@yummygut.com';

