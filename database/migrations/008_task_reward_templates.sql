-- Task templates were deprecated; ensure legacy table is removed via migration 009.

CREATE TABLE IF NOT EXISTS reward_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL DEFAULT 0,
  reward_type VARCHAR(50) NOT NULL,
  voucher_code VARCHAR(255),
  external_api_id VARCHAR(255),
  allowed_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  allowed_user_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  allowed_hotel_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO reward_templates (name, title, description, points_cost, reward_type, voucher_code)
VALUES
  ('coffee_voucher', 'Free Coffee Voucher', 'Enjoy a free coffee at the lobby bar.', 15, 'benefit', 'COFFEE-ON-US'),
  ('spa_discount', 'Spa Discount', 'Get 20% off any spa treatment.', 40, 'discount', NULL)
ON CONFLICT (name) DO NOTHING;

