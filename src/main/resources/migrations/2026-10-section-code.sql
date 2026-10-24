-- Run ONCE on the existing database BEFORE deploying the new backend.
-- Gives every section a code (IT21S1, IT21S2, IT21S3, ...) numbered per course in id order.
ALTER TABLE sections ADD COLUMN IF NOT EXISTS section_code VARCHAR(20);

UPDATE sections s
SET section_code = 'IT21S' || r.rn
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY id) AS rn
    FROM sections
) r
WHERE s.id = r.id AND (s.section_code IS NULL OR s.section_code = '');