-- Example reward seed
-- Reward: Free Coffee

INSERT INTO rewards (
  title,
  description,
  points_cost,
  reward_type,
  voucher_code,
  active,
  location_id
)
SELECT
  'Free Coffee',
  'Enjoy one free coffee at the hotel bar.',
  15,
  'voucher',
  'COFFEE-ON-US',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Free Coffee'
);


