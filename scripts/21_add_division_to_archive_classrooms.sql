-- Migration: Ensure 'division' column exists on archive_classrooms
-- Fixes HTTP 400 Bad Request error if custom queries request the division column

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'archive_classrooms' 
        AND column_name = 'division'
    ) THEN
        ALTER TABLE public.archive_classrooms ADD COLUMN division text;
        RAISE NOTICE 'Added division column to archive_classrooms';
    ELSE
        RAISE NOTICE 'division column already exists on archive_classrooms';
    END IF;
END $$;
