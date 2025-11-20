-- 03_data_migration.sql
-- Migrates existing single-supervisor data to the new junction tables

-- 1. Migrate Checklist Items
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checklist_items' AND column_name = 'assigned_supervisor_id') THEN
        INSERT INTO checklist_item_assignments (checklist_item_id, supervisor_id)
        SELECT id, assigned_supervisor_id
        FROM checklist_items
        WHERE assigned_supervisor_id IS NOT NULL
        ON CONFLICT (checklist_item_id, supervisor_id) DO NOTHING;
    END IF;
END $$;

-- 2. Migrate Classrooms
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classrooms' AND column_name = 'supervisor_id') THEN
        INSERT INTO classroom_supervisors (classroom_id, supervisor_id)
        SELECT id, supervisor_id
        FROM classrooms
        WHERE supervisor_id IS NOT NULL
        ON CONFLICT (classroom_id, supervisor_id) DO NOTHING;
    END IF;
END $$;
