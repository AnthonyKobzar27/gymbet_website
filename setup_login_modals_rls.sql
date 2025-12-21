-- Setup RLS policies for login_modals table
-- Run this script in your Supabase SQL Editor

-- Step 1: Enable Row Level Security on the table
ALTER TABLE login_modals ENABLE ROW LEVEL SECURITY;

-- Step 2: Create a SELECT policy that allows users to read their own login_modals rows
-- This policy matches the user_hash in login_modals with the hash in profiles table
-- where the profile's user_id matches the authenticated user's ID
CREATE POLICY "Users can read their own login modals"
ON login_modals
FOR SELECT
USING (
  user_hash = (
    SELECT hash 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Step 3: (Optional) Create a DELETE policy so users can delete their own rows
-- This is needed for the modal's close functionality
CREATE POLICY "Users can delete their own login modals"
ON login_modals
FOR DELETE
USING (
  user_hash = (
    SELECT hash 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'login_modals';

