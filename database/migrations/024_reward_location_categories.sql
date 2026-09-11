-- Add category and category_description fields to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS category_description TEXT;

-- Setze Default-Kategorien basierend auf is_online
UPDATE locations SET category = CASE 
  WHEN is_online = TRUE THEN 'online'
  ELSE 'physical'
END WHERE category IS NULL;

-- Optional: Constraint für gültige Kategorien
-- ALTER TABLE locations ADD CONSTRAINT check_category 
--   CHECK (category IN ('online', 'hotel_reception', 'hotel_restaurant', 'external', 'physical'));

