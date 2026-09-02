-- ============================================================================
-- 14_create_academic_archives.sql
-- Long-Term Academic Year Archives & Historical Leaderboard Storage
-- ============================================================================

-- 1. Master Table: Academic Year / Named Archive Sets
CREATE TABLE IF NOT EXISTS academic_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                    -- e.g. "Academic Year 2025-2026"
  academic_year text,                    -- e.g. "2025-2026"
  description text,
  total_evaluations integer DEFAULT 0,
  total_classrooms integer DEFAULT 0,
  leaderboard_snapshot jsonb NOT NULL,   -- Complete final leaderboard rankings by division
  division_champions jsonb,              -- Top classroom winner per division
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  archived_at timestamp with time zone DEFAULT now()
);

-- 2. Detail Table: Archived Evaluations linked to Archive Set
CREATE TABLE IF NOT EXISTS academic_archive_evaluations (
  id uuid PRIMARY KEY,
  archive_id uuid REFERENCES academic_archives(id) ON DELETE CASCADE,
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
);

-- 3. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_academic_archives_date ON academic_archives(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_academic_archive_eval_archive ON academic_archive_evaluations(archive_id);
CREATE INDEX IF NOT EXISTS idx_academic_archive_eval_classroom ON academic_archive_evaluations(classroom_id);
CREATE INDEX IF NOT EXISTS idx_academic_archive_eval_division ON academic_archive_evaluations(classroom_division);

-- 4. Enable RLS
ALTER TABLE academic_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_archive_evaluations ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Public or authenticated users can read academic archives for historical transparency
CREATE POLICY "Allow public read on academic_archives"
  ON academic_archives FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on academic_archive_evaluations"
  ON academic_archive_evaluations FOR SELECT
  USING (true);

-- Only admins/super_admins can manage archives
CREATE POLICY "Allow admins all on academic_archives"
  ON academic_archives FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Allow admins all on academic_archive_evaluations"
  ON academic_archive_evaluations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

COMMENT ON TABLE academic_archives IS 'Stores long-term named academic year archives with complete leaderboard snapshots';
COMMENT ON TABLE academic_archive_evaluations IS 'Stores detailed evaluation records belonging to an academic archive';
