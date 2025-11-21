-- ============================================================================
-- 06_fix_archive_columns.sql
-- Fix missing columns in archive tables
-- ============================================================================

-- Add archived_at column to archive_evaluations if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_evaluations' AND column_name = 'archived_at') THEN
        ALTER TABLE archive_evaluations ADD COLUMN archived_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Add archived_at column to archive_classrooms if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_classrooms' AND column_name = 'archived_at') THEN
        ALTER TABLE archive_classrooms ADD COLUMN archived_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

SELECT 'Archive columns fixed' as status;
