-- ============================================================================
-- 24_database_evaluations_and_archives_upgrade.sql
-- Production-Grade Data Integrity & Evaluation Log Hardening
-- 
-- 1. Hardens 'evaluations' against cascade deletion (ON DELETE RESTRICT)
-- 2. Prevents duplicate same-day evaluations at the database level
-- 3. Self-contains 'archive_evaluations' with denormalized classroom/supervisor names
-- 4. Protects 'monthly_winners' and 'evaluation_undo_logs' from cascade deletion
-- 5. Atomic server-side stored procedure for fast, zero-data-loss monthly archiving
-- 6. Safeguard triggers preventing hard-deletion of referenced classrooms/supervisors
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENHANCE ARCHIVE_EVALUATIONS (IMMUTABLE LOGS)
-- ----------------------------------------------------------------------------

-- Add denormalized detail columns to archive_evaluations if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_evaluations' AND column_name = 'classroom_name') THEN
    ALTER TABLE public.archive_evaluations ADD COLUMN classroom_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_evaluations' AND column_name = 'classroom_grade') THEN
    ALTER TABLE public.archive_evaluations ADD COLUMN classroom_grade text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_evaluations' AND column_name = 'classroom_division') THEN
    ALTER TABLE public.archive_evaluations ADD COLUMN classroom_division text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'archive_evaluations' AND column_name = 'supervisor_name') THEN
    ALTER TABLE public.archive_evaluations ADD COLUMN supervisor_name text;
  END IF;
END $$;

-- Backfill missing names in archive_evaluations from classrooms and users
UPDATE public.archive_evaluations a
SET
  classroom_name = COALESCE(a.classroom_name, c.name, ac.name, 'Unknown'),
  classroom_grade = COALESCE(a.classroom_grade, c.grade, ac.grade, ''),
  classroom_division = COALESCE(a.classroom_division, c.division, ac.division, ''),
  supervisor_name = COALESCE(a.supervisor_name, u.name, 'Unknown')
FROM (SELECT id, name, grade, division FROM public.classrooms) c
FULL OUTER JOIN (SELECT id, name, grade, division FROM public.archive_classrooms) ac ON ac.id = c.id
FULL OUTER JOIN (SELECT id, name FROM public.users) u ON true
WHERE (a.classroom_id = c.id OR a.classroom_id = ac.id)
  AND (a.supervisor_id = u.id)
  AND (a.classroom_name IS NULL OR a.supervisor_name IS NULL);

-- Fallback backfill for any rows where one side was unmatched
UPDATE public.archive_evaluations a
SET
  classroom_name = COALESCE(a.classroom_name, c.name, 'Unknown'),
  classroom_grade = COALESCE(a.classroom_grade, c.grade, ''),
  classroom_division = COALESCE(a.classroom_division, c.division, '')
FROM public.classrooms c
WHERE a.classroom_id = c.id AND a.classroom_name IS NULL;

UPDATE public.archive_evaluations a
SET supervisor_name = COALESCE(a.supervisor_name, u.name, 'Unknown')
FROM public.users u
WHERE a.supervisor_id = u.id AND a.supervisor_name IS NULL;

-- Ensure default "Unknown" if classroom or supervisor was completely removed prior to migration
UPDATE public.archive_evaluations
SET 
  classroom_name = COALESCE(classroom_name, 'Unknown'),
  classroom_grade = COALESCE(classroom_grade, ''),
  classroom_division = COALESCE(classroom_division, ''),
  supervisor_name = COALESCE(supervisor_name, 'Unknown')
WHERE classroom_name IS NULL OR supervisor_name IS NULL;

-- High-performance indexes on archive_evaluations
CREATE INDEX IF NOT EXISTS idx_archive_evaluations_archived_at ON public.archive_evaluations(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_evaluations_eval_date ON public.archive_evaluations(evaluation_date DESC);
CREATE INDEX IF NOT EXISTS idx_archive_evaluations_room ON public.archive_evaluations(classroom_id);
CREATE INDEX IF NOT EXISTS idx_archive_evaluations_division ON public.archive_evaluations(classroom_division);


-- ----------------------------------------------------------------------------
-- 2. ENHANCE MONTHLY_WINNERS (HISTORICAL TRANSPARENCY)
-- ----------------------------------------------------------------------------

-- Add classroom_name and classroom_grade to monthly_winners
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'monthly_winners' AND column_name = 'classroom_name') THEN
    ALTER TABLE public.monthly_winners ADD COLUMN classroom_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'monthly_winners' AND column_name = 'classroom_grade') THEN
    ALTER TABLE public.monthly_winners ADD COLUMN classroom_grade text;
  END IF;
END $$;

-- Backfill monthly_winners
UPDATE public.monthly_winners mw
SET 
  classroom_name = COALESCE(mw.classroom_name, c.name, 'Unknown'),
  classroom_grade = COALESCE(mw.classroom_grade, c.grade, '')
FROM public.classrooms c
WHERE mw.classroom_id = c.id
  AND (mw.classroom_name IS NULL OR mw.classroom_grade IS NULL);

-- Change monthly_winners FK from CASCADE to RESTRICT so deleting a classroom doesn't wipe past winners
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO v_constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'monthly_winners'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'classroom_id'
  LIMIT 1;

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.monthly_winners DROP CONSTRAINT %I', v_constraint_name);
    ALTER TABLE public.monthly_winners 
      ADD CONSTRAINT monthly_winners_classroom_id_fkey 
      FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE RESTRICT;
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 3. AUDIT LOGS (EVALUATION_UNDO_LOGS) PRESERVATION
-- ----------------------------------------------------------------------------

-- Ensure audit logs are NEVER deleted when a classroom or supervisor is removed
DO $$
DECLARE
  r RECORD;
BEGIN
  -- If evaluation_undo_logs exists, ensure FKs are ON DELETE SET NULL instead of CASCADE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evaluation_undo_logs') THEN
    -- Make IDs nullable so SET NULL works
    ALTER TABLE public.evaluation_undo_logs ALTER COLUMN classroom_id DROP NOT NULL;
    ALTER TABLE public.evaluation_undo_logs ALTER COLUMN supervisor_id DROP NOT NULL;
    ALTER TABLE public.evaluation_undo_logs ALTER COLUMN undone_by_id DROP NOT NULL;

    FOR r IN (
      SELECT tc.constraint_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'evaluation_undo_logs'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) LOOP
      EXECUTE format('ALTER TABLE public.evaluation_undo_logs DROP CONSTRAINT %I', r.constraint_name);
    END LOOP;

    ALTER TABLE public.evaluation_undo_logs 
      ADD CONSTRAINT evaluation_undo_logs_classroom_id_fkey 
      FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE SET NULL;

    ALTER TABLE public.evaluation_undo_logs 
      ADD CONSTRAINT evaluation_undo_logs_supervisor_id_fkey 
      FOREIGN KEY (supervisor_id) REFERENCES public.users(id) ON DELETE SET NULL;

    ALTER TABLE public.evaluation_undo_logs 
      ADD CONSTRAINT evaluation_undo_logs_undone_by_id_fkey 
      FOREIGN KEY (undone_by_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 4. HARDEN LIVE 'EVALUATIONS' TABLE (INTEGRITY WORKHORSE)
-- ----------------------------------------------------------------------------

-- Change evaluations FKs from CASCADE to RESTRICT:
-- A classroom or supervisor with active evaluations cannot be hard-deleted!
DO $$
DECLARE
  v_class_fk text;
  v_super_fk text;
BEGIN
  -- Find classroom_id FK constraint name
  SELECT tc.constraint_name INTO v_class_fk
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'evaluations'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'classroom_id'
  LIMIT 1;

  IF v_class_fk IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.evaluations DROP CONSTRAINT %I', v_class_fk);
  END IF;

  ALTER TABLE public.evaluations 
    ADD CONSTRAINT evaluations_classroom_id_fkey 
    FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE RESTRICT;

  -- Find supervisor_id FK constraint name
  SELECT tc.constraint_name INTO v_super_fk
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'evaluations'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'supervisor_id'
  LIMIT 1;

  IF v_super_fk IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.evaluations DROP CONSTRAINT %I', v_super_fk);
  END IF;

  ALTER TABLE public.evaluations 
    ADD CONSTRAINT evaluations_supervisor_id_fkey 
    FOREIGN KEY (supervisor_id) REFERENCES public.users(id) ON DELETE RESTRICT;
END $$;

-- 1 evaluation per classroom per day unique index (database-enforced lock)
-- Uses UTC date of evaluation_date to prevent race conditions & double-evaluations
CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluations_one_per_day 
  ON public.evaluations (classroom_id, (CAST(evaluation_date AT TIME ZONE 'UTC' AS date)));


-- ----------------------------------------------------------------------------
-- 5. ATOMIC SERVER-SIDE MONTHLY ARCHIVE RPC FUNCTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.archive_monthly_evaluations(
  p_archived_at timestamp with time zone DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_archived_at timestamp with time zone;
BEGIN
  v_archived_at := COALESCE(p_archived_at, now());

  -- 1. Insert all live evaluations into archive_evaluations with frozen names
  WITH moved_rows AS (
    INSERT INTO public.archive_evaluations (
      id,
      classroom_id,
      classroom_name,
      classroom_grade,
      classroom_division,
      supervisor_id,
      supervisor_name,
      evaluation_date,
      items,
      total_score,
      max_score,
      notes,
      created_at,
      archived_at
    )
    SELECT 
      e.id,
      e.classroom_id,
      COALESCE(c.name, 'Unknown'),
      COALESCE(c.grade, ''),
      COALESCE(c.division, ''),
      e.supervisor_id,
      COALESCE(u.name, 'Unknown'),
      e.evaluation_date,
      e.items,
      e.total_score,
      e.max_score,
      e.notes,
      e.created_at,
      v_archived_at
    FROM public.evaluations e
    LEFT JOIN public.classrooms c ON c.id = e.classroom_id
    LEFT JOIN public.users u ON u.id = e.supervisor_id
    ON CONFLICT (id) DO UPDATE SET
      classroom_name = EXCLUDED.classroom_name,
      classroom_grade = EXCLUDED.classroom_grade,
      classroom_division = EXCLUDED.classroom_division,
      supervisor_name = EXCLUDED.supervisor_name,
      archived_at = EXCLUDED.archived_at
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM moved_rows;

  -- 2. Wipe live evaluations only if rows were copied (or if live table is already 0)
  IF v_count > 0 THEN
    DELETE FROM public.evaluations;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'archived_count', v_count,
    'archived_at', v_archived_at
  );
END;
$$;

COMMENT ON FUNCTION public.archive_monthly_evaluations IS 'Atomically archives all active evaluations into archive_evaluations with frozen classroom/supervisor names and resets live evaluations.';


-- ----------------------------------------------------------------------------
-- 6. ATOMIC SELECTIVE EVALUATIONS ARCHIVE RPC FUNCTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.archive_selective_evaluations(
  p_evaluation_ids uuid[],
  p_archived_at timestamp with time zone DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_archived_at timestamp with time zone;
BEGIN
  IF p_evaluation_ids IS NULL OR array_length(p_evaluation_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No evaluation IDs provided');
  END IF;

  v_archived_at := COALESCE(p_archived_at, now());

  -- 1. Insert selected rows into archive_evaluations
  WITH moved_rows AS (
    INSERT INTO public.archive_evaluations (
      id,
      classroom_id,
      classroom_name,
      classroom_grade,
      classroom_division,
      supervisor_id,
      supervisor_name,
      evaluation_date,
      items,
      total_score,
      max_score,
      notes,
      created_at,
      archived_at
    )
    SELECT 
      e.id,
      e.classroom_id,
      COALESCE(c.name, 'Unknown'),
      COALESCE(c.grade, ''),
      COALESCE(c.division, ''),
      e.supervisor_id,
      COALESCE(u.name, 'Unknown'),
      e.evaluation_date,
      e.items,
      e.total_score,
      e.max_score,
      e.notes,
      e.created_at,
      v_archived_at
    FROM public.evaluations e
    LEFT JOIN public.classrooms c ON c.id = e.classroom_id
    LEFT JOIN public.users u ON u.id = e.supervisor_id
    WHERE e.id = ANY(p_evaluation_ids)
    ON CONFLICT (id) DO UPDATE SET
      classroom_name = EXCLUDED.classroom_name,
      classroom_grade = EXCLUDED.classroom_grade,
      classroom_division = EXCLUDED.classroom_division,
      supervisor_name = EXCLUDED.supervisor_name,
      archived_at = EXCLUDED.archived_at
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM moved_rows;

  -- 2. Delete selected rows from live table
  DELETE FROM public.evaluations WHERE id = ANY(p_evaluation_ids);

  RETURN jsonb_build_object(
    'success', true,
    'archived_count', v_count,
    'archived_at', v_archived_at
  );
END;
$$;


-- ----------------------------------------------------------------------------
-- 7. SAFEGUARD TRIGGERS (PREVENT ACCIDENTAL HARD DELETIONS)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_classroom_hard_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent hard-delete if referenced in any archive
  IF EXISTS (SELECT 1 FROM public.archive_evaluations WHERE classroom_id = OLD.id LIMIT 1) THEN
    RAISE EXCEPTION 'Cannot hard-delete classroom "%": It is referenced in archived evaluation logs. Use soft-delete (is_active = false) instead.', OLD.name;
  END IF;

  IF EXISTS (SELECT 1 FROM public.academic_archive_evaluations WHERE classroom_id = OLD.id LIMIT 1) THEN
    RAISE EXCEPTION 'Cannot hard-delete classroom "%": It is referenced in academic year archives. Use soft-delete (is_active = false) instead.', OLD.name;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_classroom_hard_delete ON public.classrooms;
CREATE TRIGGER trg_prevent_classroom_hard_delete
  BEFORE DELETE ON public.classrooms
  FOR EACH ROW
  EXECUTE FUNCTION public.check_classroom_hard_delete();

CREATE OR REPLACE FUNCTION public.check_user_hard_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent hard-delete if referenced in any archive
  IF EXISTS (SELECT 1 FROM public.archive_evaluations WHERE supervisor_id = OLD.id LIMIT 1) THEN
    RAISE EXCEPTION 'Cannot hard-delete user "%": They are referenced in archived evaluation logs. Use soft-delete (is_active = false) instead.', OLD.name;
  END IF;

  IF EXISTS (SELECT 1 FROM public.academic_archive_evaluations WHERE supervisor_id = OLD.id LIMIT 1) THEN
    RAISE EXCEPTION 'Cannot hard-delete user "%": They are referenced in academic year archives. Use soft-delete (is_active = false) instead.', OLD.name;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_hard_delete ON public.users;
CREATE TRIGGER trg_prevent_user_hard_delete
  BEFORE DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_hard_delete();


-- ----------------------------------------------------------------------------
-- 8. GRANT PERMISSIONS TO SERVICE ROLE & AUTHENTICATED
-- ----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.archive_monthly_evaluations TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.archive_selective_evaluations TO authenticated, service_role;

SELECT 'Migration 24 applied successfully: Evaluations, Archives, and Historical Records fully protected!' AS status;
