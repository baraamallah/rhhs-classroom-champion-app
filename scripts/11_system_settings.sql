-- ============================================================================
-- 11_system_settings.sql
-- System Settings Table for Auto-Archive and Other System Configurations
-- ============================================================================

-- Create system_settings table if not exists
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Insert default settings
INSERT INTO system_settings (key, value, description)
VALUES 
  ('auto_archive_enabled', 'true', 'Enable automatic monthly archiving of evaluations')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description)
VALUES 
  ('last_archive_date', 'null', 'Last date when auto-archive was performed (YYYY-MM-DD)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description)
VALUES 
  ('auto_archive_day', '1', 'Day of month to perform auto-archive (1-28)')
ON CONFLICT (key) DO NOTHING;

-- Grant permissions
GRANT SELECT ON system_settings TO authenticated;
GRANT ALL ON system_settings TO service_role;

-- RLS Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Super admins and admins can read all settings
CREATE POLICY "Admins can read system settings"
ON system_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin')
    AND users.is_active = true
  )
);

-- Only super admins can update settings
CREATE POLICY "Super admins can update system settings"
ON system_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

-- Only super admins can insert settings
CREATE POLICY "Super admins can insert system settings"
ON system_settings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

COMMENT ON TABLE system_settings IS 'System-wide configuration settings';
COMMENT ON COLUMN system_settings.key IS 'Unique setting key';
COMMENT ON COLUMN system_settings.value IS 'Setting value stored as JSONB for flexibility';
COMMENT ON COLUMN system_settings.description IS 'Human-readable description of the setting';
