-- ============================================================================
-- 21_create_named_academic_archive.sql
-- Transactional Archive Creation: Dynamic Dedicated Table + Stable View Index
-- ============================================================================

-- 1. Ensure academic_archives tracks the dedicated table name with uniqueness
ALTER TABLE IF EXISTS public.academic_archives 
  ADD COLUMN IF NOT EXISTS table_name text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_academic_archives_table_name 
  ON public.academic_archives(table_name) 
  WHERE table_name IS NOT NULL;

-- 2. Transactional Function: Single Atomic RPC
CREATE OR REPLACE FUNCTION public.create_named_academic_archive(
  p_name text,
  p_academic_year text,
  p_description text,
  p_leaderboard_snapshot jsonb,
  p_division_champions jsonb,
  p_created_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_safe_table_name text;
  v_archive_id uuid;
  v_eval_count integer;
  v_classroom_count integer;
  v_table_exists boolean;
BEGIN
  -- 1. Validate inputs
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Archive name is required';
  END IF;

  -- 2. Generate sanitized physical table name
  -- Lowercase, replace non-alphanumeric with underscores, collapse underscores
  v_safe_table_name := regexp_replace(lower(trim(p_name)), '[^a-z0-9_]', '_', 'g');
  v_safe_table_name := regexp_replace(v_safe_table_name, '_+', '_', 'g');
  v_safe_table_name := trim(both '_' from v_safe_table_name);

  IF NOT v_safe_table_name LIKE 'archive_%' THEN
    v_safe_table_name := 'archive_' || v_safe_table_name;
  END IF;

  -- Limit to 63 chars (PostgreSQL identifier limit)
  v_safe_table_name := substring(v_safe_table_name FROM 1 FOR 63);

  -- 3. Collision Protection: Reject if table or archive with this table_name already exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = v_safe_table_name
  ) INTO v_table_exists;

  IF v_table_exists THEN
    RAISE EXCEPTION 'Archive table collision: A physical table named "%" already exists. Please choose a distinct archive name.', v_safe_table_name;
  END IF;

  IF EXISTS (SELECT 1 FROM public.academic_archives WHERE table_name = v_safe_table_name) THEN
    RAISE EXCEPTION 'Archive collision: An archive with table name "%" already exists in records.', v_safe_table_name;
  END IF;

  -- 4. Count active evaluations and classrooms
  SELECT count(*) INTO v_eval_count FROM public.evaluations;
  SELECT count(DISTINCT classroom_id) INTO v_classroom_count FROM public.evaluations;

  -- 5. Insert master metadata record into academic_archives
  INSERT INTO public.academic_archives (
    name,
    academic_year,
    description,
    total_evaluations,
    total_classrooms,
    leaderboard_snapshot,
    division_champions,
    table_name,
    created_by,
    archived_at
  ) VALUES (
    trim(p_name),
    COALESCE(NULLIF(trim(p_academic_year), ''), trim(p_name)),
    NULLIF(trim(p_description), ''),
    v_eval_count,
    v_classroom_count,
    COALESCE(p_leaderboard_snapshot, '[]'::jsonb),
    p_division_champions,
    v_safe_table_name,
    p_created_by,
    now()
  )
  RETURNING id INTO v_archive_id;

  -- 6. Dynamically CREATE dedicated physical archive table using safe identifier quoting (%I)
  EXECUTE format('
    CREATE TABLE public.%I (
      id uuid PRIMARY KEY,
      archive_id uuid NOT NULL,
      classroom_id uuid,
      classroom_name text,
      classroom_grade text,
      classroom_division text,
      supervisor_id uuid,
      supervisor_name text,
      evaluation_date timestamp with time zone,
      items jsonb,
      total_score integer,
      max_score integer,
      notes text,
      created_at timestamp with time zone,
      archived_at timestamp with time zone DEFAULT now()
    )', v_safe_table_name);

  -- 7. Configure explicit strict RLS on the dynamic table: Admins only
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_safe_table_name);
  
  EXECUTE format('
    CREATE POLICY "Allow admin read on %s"
      ON public.%I FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role IN (''admin'', ''super_admin'')
        )
      )', v_safe_table_name, v_safe_table_name);

  EXECUTE format('
    CREATE POLICY "Allow admin write on %s"
      ON public.%I FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role IN (''admin'', ''super_admin'')
        )
      )', v_safe_table_name, v_safe_table_name);

  -- 8. Populate both the dedicated physical table AND the stable view table (academic_archive_evaluations)
  IF v_eval_count > 0 THEN
    -- Copy to dedicated physical table
    EXECUTE format('
      INSERT INTO public.%I (
        id, archive_id, classroom_id, classroom_name, classroom_grade, classroom_division,
        supervisor_id, supervisor_name, evaluation_date, items, total_score, max_score, notes, created_at, archived_at
      )
      SELECT 
        e.id,
        %L,
        e.classroom_id,
        COALESCE(c.name, ''Unknown''),
        COALESCE(c.grade, ''''),
        COALESCE(c.division, ''''),
        e.supervisor_id,
        COALESCE(u.name, ''Unknown''),
        e.evaluation_date,
        e.items,
        e.total_score,
        e.max_score,
        e.notes,
        e.created_at,
        now()
      FROM public.evaluations e
      LEFT JOIN public.classrooms c ON c.id = e.classroom_id
      LEFT JOIN public.users u ON u.id = e.supervisor_id
    ', v_safe_table_name, v_archive_id);

    -- Copy to stable index table (academic_archive_evaluations)
    INSERT INTO public.academic_archive_evaluations (
      id, archive_id, classroom_id, classroom_name, classroom_grade, classroom_division,
      supervisor_id, supervisor_name, evaluation_date, items, total_score, max_score, notes, created_at, archived_at
    )
    SELECT 
      e.id,
      v_archive_id,
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
      now()
    FROM public.evaluations e
    LEFT JOIN public.classrooms c ON c.id = e.classroom_id
    LEFT JOIN public.users u ON u.id = e.supervisor_id;

    -- 9. Wipe live evaluations to reset the live leaderboard
    DELETE FROM public.evaluations;
  END IF;

  -- 10. Notify PostgREST in the background
  NOTIFY pgrst, 'reload schema';

  -- Return result object
  RETURN jsonb_build_object(
    'success', true,
    'archive_id', v_archive_id,
    'table_name', v_safe_table_name,
    'total_evaluations', v_eval_count,
    'total_classrooms', v_classroom_count
  );
END;
$$;

COMMENT ON FUNCTION public.create_named_academic_archive IS 'Creates a dedicated physical archive table, transfers current evaluations atomically, updates metadata, and resets live evaluations.';
