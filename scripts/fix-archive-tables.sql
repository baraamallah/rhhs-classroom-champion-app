-- Fix archive tables by removing duplicates and adding primary keys

-- Remove duplicates from archive_evaluations (keep the oldest archived_at)
DELETE FROM archive_evaluations a
USING archive_evaluations b
WHERE a.id = b.id 
  AND a.ctid < b.ctid;

-- Remove duplicates from archive_classrooms (keep the oldest archived_at)
DELETE FROM archive_classrooms a
USING archive_classrooms b
WHERE a.id = b.id 
  AND a.ctid < b.ctid;

-- Add primary key to archive_evaluations
ALTER TABLE archive_evaluations ADD PRIMARY KEY (id);

-- Add primary key to archive_classrooms
ALTER TABLE archive_classrooms ADD PRIMARY KEY (id);
