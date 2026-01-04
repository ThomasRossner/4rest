-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    address TEXT,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (is_online = TRUE AND address IS NULL AND latitude IS NULL AND longitude IS NULL)
        OR
        (is_online = FALSE AND address IS NOT NULL AND latitude IS NOT NULL AND longitude IS NOT NULL)
    )
);

-- Insert default online location (idempotent)
INSERT INTO locations (name, description, is_online)
VALUES ('Online', 'Default online location', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Add location references to tasks and rewards
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_id UUID;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS location_id UUID;

DO $$
DECLARE
    default_location_id UUID;
BEGIN
    SELECT id INTO default_location_id FROM locations WHERE name = 'Online' LIMIT 1;

    IF default_location_id IS NULL THEN
        INSERT INTO locations (name, description, is_online)
        VALUES ('Online', 'Default online location', TRUE)
        RETURNING id INTO default_location_id;
    END IF;

    UPDATE tasks SET location_id = default_location_id WHERE location_id IS NULL;
    UPDATE rewards SET location_id = default_location_id WHERE location_id IS NULL;
END $$;

ALTER TABLE tasks
    ALTER COLUMN location_id SET NOT NULL,
    ADD CONSTRAINT fk_tasks_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT;

ALTER TABLE rewards
    ALTER COLUMN location_id SET NOT NULL,
    ADD CONSTRAINT fk_rewards_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_tasks_location_id ON tasks(location_id);
CREATE INDEX IF NOT EXISTS idx_rewards_location_id ON rewards(location_id);

