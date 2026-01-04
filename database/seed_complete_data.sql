-- Complete seed data for database initialization
-- This file contains all current data from the database
-- Generated: 2026-01-04
-- 
-- IMPORTANT: Run migrations first (001-042), then this seed file
-- This seed file should be executed after all migrations are complete

-- Disable triggers temporarily to handle foreign key constraints
SET session_replication_role = 'replica';

-- ============================================================================
-- LOCATIONS
-- ============================================================================
-- Seed locations (must be first due to foreign key dependencies)
-- Note: IDs will be generated if not provided, but we use ON CONFLICT for idempotency
INSERT INTO locations (id, name, description, is_online, address, latitude, longitude, created_at, updated_at, active, category, category_description)
VALUES
  ('00cf0995-f83a-42e5-9153-2ab64ae1e769', 'Online', 'Default online location', true, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true, 'online', NULL),
  ('ac9fe69e-5b9c-42bf-b2a3-e9e1e0749a2f', 'Berlin Lobby', 'Main lobby area for in-person challenges and rewards pick-up.', false, 'Alexanderplatz 5, 10178 Berlin, Germany', 52.521900, 13.413200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true, 'physical', NULL),
  ('e99a9448-dc3d-43b7-b16c-fd798d3b0afd', 'Vienna Rooftop Garden', 'Open-air collaboration space on level 8 with city views.', false, 'Mariahilfer Straße 15, 1060 Wien, Austria', 48.198600, 16.349400, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true, 'physical', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TASK PARAMETERS
-- ============================================================================
-- Task parameters are already seeded in migration 033_parameter_tables.sql
-- But we ensure they exist with proper IDs and weights here
-- Note: These should match the values from migration 033
INSERT INTO task_parameters (id, parameter_type, value, display_order, active, created_at, updated_at, weight)
VALUES
  ('cd1c6a38-da55-4312-aa55-23e01e11d4b0', 'type', 'video', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('af2a35ab-4fd8-441e-b8e8-42fc8be5775c', 'type', 'quiz', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('660c240f-ffd0-4a70-a435-d12f91b6bdaa', 'type', 'article_quiz', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('d221eada-ebae-4b4d-9cc6-4104538abe46', 'type', 'survey', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('25686714-ab34-4d9a-a4fd-c83b35cd7095', 'type', 'qr', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('5feb19fb-8803-4d17-a4bd-ed35eefa86fb', 'type', 'photo', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('d3292064-428b-49f1-a8ae-333f4002788a', 'type', 'visit_location', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('668b2b21-28f5-4a3d-b53f-fe331512ca4a', 'category', 'Kommunikation & Netzwerke', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('22a69dab-3143-4158-9215-05e6efb6fd5a', 'category', 'Mensch & soziales Umfeld', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('af0b9e6e-7cd1-4a7e-b62b-ea4e6a00946e', 'category', 'Natur & Umweltschutz', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('a07c3c46-674b-4962-925d-9b861cf225ed', 'category', 'Ressourcenverbrauch & Materialeinsatz', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('5b2ccaf1-4c64-4d5a-b026-feb3f70a90a9', 'location_tool', 'Umgebung', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('150bdf31-9551-4122-b025-e0f9e87f5de1', 'location_tool', 'Hotel', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('2dfac2a4-b59a-494a-8f30-92364bbcdab1', 'location_tool', 'egal', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('cb4133f5-243b-47ac-a62a-8ed1fb2186d0', 'location_tool', 'Smartphone/PC', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('0311a73f-33ec-4a64-873a-9e5fec641b3c', 'zielgruppe', 'Mitarbeitende', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('879997e7-c014-4964-af60-d58c8f812d35', 'zielgruppe', 'Gäste', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('c7660c04-0185-4c14-9c01-86f1736c9f98', 'zielgruppe', 'Stakeholder', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('0b869b77-b5f3-4ef4-9e3c-c81a74993d14', 'difficulty', 'sehr einfach', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1.00),
  ('827e8cd4-e3a7-40e5-962b-c064fd675c3a', 'difficulty', 'einfach', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2.00),
  ('43fe0888-ace4-49c9-80c0-50d81bf43d6a', 'difficulty', 'mittel', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3.00),
  ('1f41392a-e5e5-4994-9cc1-ccd70fb96718', 'difficulty', 'schwer', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 4.00),
  ('9d70db51-d4a9-4a01-8f87-eaeaa0f0504f', 'difficulty', 'sehr schwer', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 5.00),
  ('3c0cb714-2ec1-44c7-97c5-85d154d9562d', 'time_required', '1-3 Min', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1.00),
  ('8c7fe189-0d15-4e12-8bcb-8d9cea315420', 'time_required', '3-10 Min', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2.00),
  ('3bcc2c5b-93c9-4061-bf60-97d68f6213b7', 'time_required', '10-30 Min', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3.00),
  ('de5d054e-44fa-405f-8813-8e15540f80b8', 'time_required', '30-60 Min', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 4.00),
  ('3818f8a5-e807-417d-ad0d-6cce3e59fe89', 'time_required', '60+ Min', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 5.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- REWARD PARAMETERS
-- ============================================================================
INSERT INTO reward_parameters (id, parameter_type, value, display_order, active, created_at, updated_at, weight)
VALUES
  ('88002acf-f04d-4f44-8f0d-a198d5f92ce7', 'reward_art', 'Rabatt', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('f314ea4b-fa36-4b1f-a228-1dd9f339392c', 'reward_art', 'Erlebnis', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('307aa8ee-29ab-40e5-a7a5-2d9f9c545df1', 'reward_art', 'Add-on', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('fabd4c72-bab7-4b18-8bfc-d767a6ca8406', 'reward_art', 'physisches Geschenk', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('66a379f2-4a06-440a-b472-90542b6d25e4', 'kategorie', 'Hotel', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('454175d3-039e-4499-98a0-fc196a6b6ba0', 'kategorie', 'nicht Hotel', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('35d60b7a-a422-4bdd-956f-f7f124c92b24', 'kategorie', 'Online', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0.00),
  ('bd99fbb5-bc1c-4ebd-89f1-4684fae2678a', 'kosten', 'niedrig', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1.00),
  ('ad766df2-f82c-49f1-a4bd-206dd7e65c01', 'kosten', 'mittel', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2.00),
  ('0d8917cc-58cd-4679-a3dc-5dd82808cb4c', 'kosten', 'hoch', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SYSTEM CONFIG
-- ============================================================================
INSERT INTO system_config (id, config_key, config_value, description, created_at, updated_at)
VALUES
  ('685d041b-e58b-43f9-8c33-cbe21488f095', 'points_calculation_factor', '2.5', 'Factor for calculating task points: (difficulty_weight * time_required_weight) * factor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('83ae226f-2934-45a4-a90d-c33563ee2f3b', 'reward_cost_calculation_factor', '1.5', 'Factor for calculating reward costs: kosten_weight * factor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ============================================================================
-- POST-SEED ACTIONS
-- ============================================================================
-- Recalculate task points based on current system configuration
-- This ensures all tasks have correct points after seeding
DO $$
DECLARE
  factor DECIMAL;
BEGIN
  SELECT config_value::DECIMAL INTO factor
  FROM system_config
  WHERE config_key = 'points_calculation_factor';
  
  IF factor IS NULL THEN
    factor := 2.5; -- Default value
  END IF;
  
  -- Update task points based on difficulty and time_required weights
  UPDATE tasks t
  SET points = GREATEST(1, ROUND(
    (SELECT COALESCE(weight, display_order::DECIMAL, 1) FROM task_parameters WHERE parameter_type = 'difficulty' AND value = t.difficulty::text LIMIT 1) *
    (SELECT COALESCE(weight, display_order::DECIMAL, 1) FROM task_parameters WHERE parameter_type = 'time_required' AND value = t.time_required::text LIMIT 1) *
    factor
  ))
  WHERE difficulty IS NOT NULL AND time_required IS NOT NULL;
END $$;
