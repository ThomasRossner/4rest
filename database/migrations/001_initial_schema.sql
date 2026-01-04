-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'stakeholder',
    user_type VARCHAR(50) NOT NULL DEFAULT 'explorer',
    points INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'video', 'qr', 'photo', 'quiz'
    points INTEGER NOT NULL DEFAULT 0,
    video_url TEXT,
    quiz_questions JSONB,
    qr_code VARCHAR(255),
    photo_required BOOLEAN DEFAULT FALSE,
    co2_savings_kg DECIMAL(10, 2) DEFAULT 0,
    external_id VARCHAR(255), -- For HotelKit and other integrations
    active BOOLEAN DEFAULT TRUE,
    allowed_roles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    allowed_user_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    allowed_hotel_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User tasks (completion tracking)
CREATE TABLE IF NOT EXISTS user_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    photo_url TEXT,
    quiz_answers JSONB,
    points_earned INTEGER DEFAULT 0,
    UNIQUE(user_id, task_id)
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- 'discount', 'voucher', 'benefit', 'team_event'
    voucher_code VARCHAR(255),
    external_api_id VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    allowed_roles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    allowed_user_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    allowed_hotel_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reward redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    voucher_code VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' -- 'pending', 'used', 'expired'
);

-- Forest data (trees placement)
CREATE TABLE IF NOT EXISTS forest_trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tree_type VARCHAR(50) DEFAULT 'default',
    position_x DECIMAL(10, 2) NOT NULL,
    position_y DECIMAL(10, 2) NOT NULL,
    position_z DECIMAL(10, 2) NOT NULL,
    planted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    task_id UUID REFERENCES tasks(id)
);

-- Statistics cache
CREATE TABLE IF NOT EXISTS statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(255) NOT NULL UNIQUE,
    metric_value DECIMAL(15, 2) NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_forest_trees_user_id ON forest_trees(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(active);
