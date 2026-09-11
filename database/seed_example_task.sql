-- Example task seed
-- Task: Bring your reusable bottle
-- Only insert if task with this QR code doesn't already exist

INSERT INTO tasks (
  title,
  description,
  type,
  points,
  qr_code,
  co2_savings_kg,
  active,
  location_id
)
SELECT
  'Bring your reusable bottle',
  'Fill your bottle at the lobby water station and scan the QR code.',
  'qr',
  20,
  'QR-LOBBY-WATER-001',
  0.15,
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE qr_code = 'QR-LOBBY-WATER-001' AND active = TRUE
);


