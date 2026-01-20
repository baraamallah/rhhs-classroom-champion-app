-- ============================================================================
-- 09_create_monthly_winners.sql
-- Create monthly winners table for tracking division winners each month
-- ============================================================================

-- Monthly Winners table
CREATE TABLE IF NOT EXISTS monthly_winners (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  division text NOT NULL CHECK (division IN ('Pre-School', 'Elementary', 'Middle School', 'High School', 'Technical Institute')),
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  total_score integer NOT NULL,
  average_score numeric(10, 2) NOT NULL,
  evaluation_count integer NOT NULL DEFAULT 0,
  declared_by uuid REFERENCES users(id),
  declared_at timestamp with time zone DEFAULT now(),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(division, year, month)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_winners_division ON monthly_winners(division);
CREATE INDEX IF NOT EXISTS idx_monthly_winners_year_month ON monthly_winners(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_winners_classroom ON monthly_winners(classroom_id);
CREATE INDEX IF NOT EXISTS idx_monthly_winners_declared_by ON monthly_winners(declared_by);

-- Enable RLS
ALTER TABLE monthly_winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow admins to manage, allow all authenticated to read)
CREATE POLICY "Allow admins to manage monthly winners"
  ON monthly_winners
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin')
      AND users.is_active = true
    )
  );

CREATE POLICY "Allow all authenticated to read monthly winners"
  ON monthly_winners
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE monthly_winners IS 'Stores monthly winners for each division. One winner per division per month.';
COMMENT ON COLUMN monthly_winners.division IS 'The school division (Pre-School, Elementary, Middle School, High School, Technical Institute)';
COMMENT ON COLUMN monthly_winners.year IS 'The year of the winning month (e.g., 2024)';
COMMENT ON COLUMN monthly_winners.month IS 'The month number (1-12)';
COMMENT ON COLUMN monthly_winners.total_score IS 'Total score achieved by the winning classroom';
COMMENT ON COLUMN monthly_winners.average_score IS 'Average score across all evaluations';
COMMENT ON COLUMN monthly_winners.evaluation_count IS 'Number of evaluations for this classroom in the winning month';
