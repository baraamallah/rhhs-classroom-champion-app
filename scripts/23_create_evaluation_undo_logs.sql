-- ============================================================================
-- 23_create_evaluation_undo_logs.sql
-- Create audit log table for undone evaluations and reverted points
-- ============================================================================

CREATE TABLE IF NOT EXISTS evaluation_undo_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL,
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  classroom_name text NOT NULL,
  grade text NOT NULL,
  division text,
  supervisor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supervisor_name text NOT NULL,
  reverted_points integer NOT NULL,
  max_score integer NOT NULL,
  items jsonb DEFAULT '{}'::jsonb,
  notes text,
  evaluation_date timestamptz NOT NULL,
  undone_at timestamptz NOT NULL DEFAULT now(),
  undone_by_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  undone_by_name text NOT NULL,
  reason text,
  restored_at timestamptz
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_evaluation_undo_logs_supervisor ON evaluation_undo_logs(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_undo_logs_classroom ON evaluation_undo_logs(classroom_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_undo_logs_undone_at ON evaluation_undo_logs(undone_at DESC);

-- Enable RLS
ALTER TABLE evaluation_undo_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view undo logs
CREATE POLICY "Allow authenticated users to read undo logs"
  ON evaluation_undo_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins and supervisors to insert undo logs
CREATE POLICY "Allow authenticated users to insert undo logs"
  ON evaluation_undo_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow admins and supervisors to update undo logs (e.g. mark restored)
CREATE POLICY "Allow authenticated users to update undo logs"
  ON evaluation_undo_logs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
