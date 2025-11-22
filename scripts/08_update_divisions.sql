-- Update the check constraint for division
-- Drop both potential constraint names to be safe
ALTER TABLE classrooms DROP CONSTRAINT IF EXISTS classrooms_division_check;
ALTER TABLE classrooms DROP CONSTRAINT IF EXISTS valid_division;

ALTER TABLE classrooms
  ADD CONSTRAINT classrooms_division_check 
  CHECK (division IN ('Pre-School', 'Elementary', 'Middle School', 'High School', 'Technical Institute'));

-- Update the comment to reflect the new allowed values
COMMENT ON COLUMN classrooms.division IS 'The school division the classroom belongs to (Pre-School, Elementary, Middle School, High School, Technical Institute)';
