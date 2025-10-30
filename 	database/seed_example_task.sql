-- Example task seed
-- Task: Bring your reusable bottle

INSERT INTO tasks (
  title,
  description,
  type,
  points,
  qr_code,
  co2_savings_kg,
  active
) VALUES (
  'Bring your reusable bottle',
  'Fill your bottle at the lobby water station and scan the QR code.',
  'qr',
  20,
  'QR-LOBBY-WATER-001',
  0.15,
  true
)
ON CONFLICT DO NOTHING;


