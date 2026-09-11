-- Demo-Konten für Tests (z. B. luise.bio). Passwort für alle: Test123!
-- Hash erzeugt mit bcryptjs (10 Runden), identisch zum Backend-Login.
-- Idempotent: legt fehlende Konten an, setzt bei vorhandenen E-Mail Passwort/Rolle/Verifizierung.

INSERT INTO users (
  email,
  password_hash,
  name,
  role,
  user_type,
  points,
  email_verified,
  active
) VALUES
  (
    'admin@example.com',
    '$2a$10$9kGOgbOQtbsYO4wKMFsCqODqTAokO0eOkeYapuNS5BY8vn18JSLKq',
    'Demo Admin',
    'administrator',
    'explorer',
    0,
    TRUE,
    TRUE
  ),
  (
    'rezeption@example.com',
    '$2a$10$9kGOgbOQtbsYO4wKMFsCqODqTAokO0eOkeYapuNS5BY8vn18JSLKq',
    'Demo Rezeption',
    'rezeption',
    'explorer',
    0,
    TRUE,
    TRUE
  ),
  (
    'redaktion@example.com',
    '$2a$10$9kGOgbOQtbsYO4wKMFsCqODqTAokO0eOkeYapuNS5BY8vn18JSLKq',
    'Demo Redaktion',
    'redaktion',
    'explorer',
    0,
    TRUE,
    TRUE
  ),
  (
    'demo@example.com',
    '$2a$10$9kGOgbOQtbsYO4wKMFsCqODqTAokO0eOkeYapuNS5BY8vn18JSLKq',
    'Demo Gast',
    'guest',
    'explorer',
    0,
    TRUE,
    TRUE
  )
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  user_type = EXCLUDED.user_type,
  email_verified = TRUE,
  active = TRUE,
  deleted_at = NULL,
  updated_at = CURRENT_TIMESTAMP;
