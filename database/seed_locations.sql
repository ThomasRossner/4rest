-- Seed physical (non-online) locations for tasks and rewards
INSERT INTO locations (name, description, is_online, address, latitude, longitude, active)
VALUES
  (
    'Berlin Lobby',
    'Main lobby area for in-person challenges and rewards pick-up.',
    FALSE,
    'Alexanderplatz 5, 10178 Berlin, Germany',
    52.521900,
    13.413200,
    TRUE
  ),
  (
    'Vienna Rooftop Garden',
    'Open-air collaboration space on level 8 with city views.',
    FALSE,
    'Mariahilfer Straße 15, 1060 Wien, Austria',
    48.198600,
    16.349400,
    TRUE
  )
ON CONFLICT (name) DO UPDATE
SET
  description = EXCLUDED.description,
  is_online = EXCLUDED.is_online,
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  updated_at = CURRENT_TIMESTAMP;

