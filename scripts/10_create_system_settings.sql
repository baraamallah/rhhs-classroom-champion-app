-- ============================================================================
-- 10_create_system_settings.sql
-- Create system_settings table for application configuration
-- ============================================================================

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON system_settings(updated_at);

-- Add comments
COMMENT ON TABLE system_settings IS 'Stores system-wide configuration settings';
COMMENT ON COLUMN system_settings.key IS 'Unique key identifier for the setting';
COMMENT ON COLUMN system_settings.value IS 'JSON value of the setting (can be any JSON type)';
COMMENT ON COLUMN system_settings.description IS 'Human-readable description of what this setting controls';
COMMENT ON COLUMN system_settings.updated_by IS 'User who last updated this setting';
