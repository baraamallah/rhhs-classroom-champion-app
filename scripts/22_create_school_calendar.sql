-- ============================================================================
-- 22_create_school_calendar.sql
-- School Calendar Exceptions (Holidays, Dismissed Days) & Daily Evaluation Lock
-- ============================================================================

-- 1. Table for School Holidays and Non-Working Calendar Days
CREATE TABLE IF NOT EXISTS public.school_calendar_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_date date NOT NULL UNIQUE,
  reason text NOT NULL, -- e.g. "National Holiday", "Teacher Workshop", "Snow Day"
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_calendar_exceptions_date 
  ON public.school_calendar_exceptions(exception_date);

-- 2. Row Level Security for Calendar Exceptions
ALTER TABLE public.school_calendar_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on school_calendar_exceptions" ON public.school_calendar_exceptions;
CREATE POLICY "Allow public read on school_calendar_exceptions" 
  ON public.school_calendar_exceptions FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow admin all on school_calendar_exceptions" ON public.school_calendar_exceptions;
CREATE POLICY "Allow admin all on school_calendar_exceptions" 
  ON public.school_calendar_exceptions FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

-- Grants
GRANT SELECT ON public.school_calendar_exceptions TO anon, authenticated;
GRANT ALL ON public.school_calendar_exceptions TO service_role;

-- 3. Ensure 1 Evaluation Per Classroom Per Day
-- Deduplicate any existing duplicate evaluations on the same classroom and date (keeping the newest)
DELETE FROM public.evaluations a
USING public.evaluations b
WHERE a.created_at < b.created_at
  AND a.classroom_id = b.classroom_id
  AND (a.evaluation_date AT TIME ZONE 'UTC')::date = (b.evaluation_date AT TIME ZONE 'UTC')::date;

-- Create unique index to guarantee daily evaluation lock
CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluations_classroom_daily_unique 
  ON public.evaluations (classroom_id, ((evaluation_date AT TIME ZONE 'UTC')::date));

COMMENT ON TABLE public.school_calendar_exceptions IS 'Stores school holidays and dismissed dates that do not require daily supervisor inspections.';
COMMENT ON INDEX public.idx_evaluations_classroom_daily_unique IS 'Enforces at most one inspection per classroom per calendar date.';
