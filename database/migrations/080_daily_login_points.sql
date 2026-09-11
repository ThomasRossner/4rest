-- Award daily points on login (once per user per day)

CREATE TABLE IF NOT EXISTS daily_login_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_awarded INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, login_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_login_points_user_date
  ON daily_login_points(user_id, login_date);
