-- ============================================================================
-- 25_security_and_performance_hardening.sql
--
-- IMPORTANT DEPLOYMENT ORDER:
-- Deploy the updated Next.js application (Phases 1 & 2, which route staff
-- reads through authenticated Server Actions) BEFORE executing this migration
-- in the Supabase SQL Editor.
--
-- What this migration fixes:
-- 1. Revokes PUBLIC / anon / authenticated EXECUTE on SECURITY DEFINER archive RPCs
-- 2. Locks down public.users (revokes anon SELECT & authenticated password_hash read)
-- 3. Locks down internal tables (evaluation_undo_logs, classroom_supervisors,
--    checklist_item_assignments) from unauthenticated anon reads
-- 4. Drops duplicate daily unique index on evaluations (migration 22 vs 24)
-- 5. Adds composite indexes for evaluation history and supervisor lookup queries
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LOCK DOWN SECURITY DEFINER ARCHIVE RPCS (SERVICE ROLE ONLY)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'create_named_academic_archive'
  ) THEN
    REVOKE ALL ON FUNCTION public.create_named_academic_archive(text, text, text, jsonb, jsonb, uuid)
      FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.create_named_academic_archive(text, text, text, jsonb, jsonb, uuid)
      TO service_role;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'archive_monthly_evaluations'
  ) THEN
    REVOKE ALL ON FUNCTION public.archive_monthly_evaluations(timestamp with time zone)
      FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.archive_monthly_evaluations(timestamp with time zone)
      TO service_role;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'archive_selective_evaluations'
  ) THEN
    REVOKE ALL ON FUNCTION public.archive_selective_evaluations(uuid[], timestamp with time zone)
      FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.archive_selective_evaluations(uuid[], timestamp with time zone)
      TO service_role;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. LOCK DOWN public.users (ELIMINATE ANON READ & PASSWORD_HASH EXPOSURE)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "Allow public read on users" ON public.users;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.users;
DROP POLICY IF EXISTS "users_select_service_or_admin" ON public.users;

CREATE POLICY "users_select_service_or_admin" ON public.users
  FOR SELECT USING (
    (SELECT auth.role()) = 'service_role'
    OR (SELECT auth.uid()) = id
    OR public.is_admin()
  );

-- Completely revoke anon access to users and column-restrict password_hash for authenticated
REVOKE ALL ON public.users FROM anon;
REVOKE SELECT (password_hash) ON public.users FROM authenticated;

-- ----------------------------------------------------------------------------
-- 3. LOCK DOWN INTERNAL STAFF TABLES FROM ANON REST ACCESS
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.evaluation_undo_logs FROM anon;

DROP POLICY IF EXISTS "classroom_supervisors_select_policy" ON public.classroom_supervisors;
CREATE POLICY "classroom_supervisors_select_policy" ON public.classroom_supervisors
  FOR SELECT USING (
    (SELECT auth.role()) = 'service_role'
    OR (SELECT auth.uid()) = supervisor_id
    OR public.is_admin()
  );
REVOKE ALL ON public.classroom_supervisors FROM anon;

DROP POLICY IF EXISTS "checklist_assignments_select_policy" ON public.checklist_item_assignments;
CREATE POLICY "checklist_assignments_select_policy" ON public.checklist_item_assignments
  FOR SELECT USING (
    (SELECT auth.role()) = 'service_role'
    OR (SELECT auth.uid()) = supervisor_id
    OR public.is_admin()
  );
REVOKE ALL ON public.checklist_item_assignments FROM anon;

-- Ensure service_role retains full access to all public tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ----------------------------------------------------------------------------
-- 4. REMOVE DUPLICATE UNIQUE INDEX (MIGRATION 22 vs MIGRATION 24)
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_evaluations_classroom_daily_unique;

-- ----------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES FOR HISTORY, LEADERBOARD & SUPERVISOR LOOKUPS
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_evaluations_date_classroom
  ON public.evaluations (evaluation_date DESC, classroom_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_supervisor_date
  ON public.evaluations (supervisor_id, evaluation_date DESC);

CREATE INDEX IF NOT EXISTS idx_archive_evals_date_classroom
  ON public.archive_evaluations (evaluation_date DESC, classroom_id);

CREATE INDEX IF NOT EXISTS idx_acad_archive_evals_date_classroom
  ON public.academic_archive_evaluations (evaluation_date DESC, classroom_id);

CREATE INDEX IF NOT EXISTS idx_classroom_supervisors_supervisor
  ON public.classroom_supervisors (supervisor_id, classroom_id);

CREATE INDEX IF NOT EXISTS idx_checklist_assignments_item_supervisor
  ON public.checklist_item_assignments (checklist_item_id, supervisor_id);

SELECT 'Migration 25 applied: RLS/RPC lockdown and performance indexes active.' AS status;
