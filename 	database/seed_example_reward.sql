-- Example reward seed
-- Reward: Free Coffee

INSERT INTO rewards (
  title,
  description,
  points_cost,
  reward_type,
  voucher_code,
  active
)
SELECT
  'Free Coffee',
  'Enjoy one free coffee at the hotel bar.',
  15,
  'voucher',
  'COFFEE-ON-US',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Free Coffee'
);


