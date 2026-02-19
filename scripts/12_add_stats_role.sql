-- Migration: Add 'stats' role to users table check constraint
-- This script updates the existing check constraint on the users table to allow the 'stats' role.

DO $$
BEGIN
    -- Drop the existing check constraint if it exists
    -- We use a DO block to handle cases where the constraint name might vary or it might have been already updated

    -- In PostgreSQL, inline constraints often get names like 'users_role_check'
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

    -- Add the new constraint with 'stats' included
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'supervisor', 'viewer', 'stats'));

    RAISE NOTICE 'Role check constraint updated to include "stats" role.';
END $$;
