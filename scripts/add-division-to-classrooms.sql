-- Add division column to classrooms table
ALTER TABLE classrooms 
ADD COLUMN IF NOT EXISTS division TEXT;

-- Add check constraint to ensure valid divisions
ALTER TABLE classrooms 
ADD CONSTRAINT valid_division CHECK (division IN ('High School', 'Intermediate', 'Kindergarten', 'Preschool'));

-- Comment on column
COMMENT ON COLUMN classrooms.division IS 'The school division the classroom belongs to (High School, Intermediate, Kindergarten, Preschool)';
