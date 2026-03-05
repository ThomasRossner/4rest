-- Example photo task seed
-- Task: Take a photo of the recycling station

INSERT INTO tasks (
  title,
  description,
  type,
  points,
  photo_required,
  co2_savings_kg,
  active,
  location_id
) SELECT
  'Recycling Station Photo',
  'Find the hotel recycling station and upload a photo as proof.',
  'photo',
  30,
  true,
  0.25,
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Recycling Station Photo'
);


