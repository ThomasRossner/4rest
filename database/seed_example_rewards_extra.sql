-- Extra example rewards seed

-- Discount reward
INSERT INTO rewards (
  title, description, points_cost, reward_type, voucher_code, active, location_id
) SELECT
  '10% Restaurant Discount',
  'Get 10% off at the hotel restaurant.',
  40,
  'discount',
  'FOOD-10OFF',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = '10% Restaurant Discount'
);

-- Benefit reward
INSERT INTO rewards (
  title, description, points_cost, reward_type, voucher_code, active, location_id
) SELECT
  'Late Checkout',
  'Enjoy late checkout until 2 PM.',
  60,
  'benefit',
  NULL,
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Late Checkout'
);

-- Team event reward
INSERT INTO rewards (
  title, description, points_cost, reward_type, voucher_code, active, location_id
) SELECT
  'Team Coffee Break',
  'Organized team coffee break for your department.',
  120,
  'team_event',
  NULL,
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Team Coffee Break'
);


