-- Additional rewards seed
-- These rewards are added based on the user's requirements

-- Helper: Get location ID (defaults to 'Online' if not found)
DO $$
DECLARE
  online_location_id UUID;
  luise_location_id UUID;
BEGIN
  SELECT id INTO online_location_id FROM locations WHERE name = 'Online' LIMIT 1;
  SELECT id INTO luise_location_id FROM locations WHERE name = 'Luise' LIMIT 1;
  
  -- If locations don't exist, create them
  IF online_location_id IS NULL THEN
    INSERT INTO locations (name, description, is_online, active)
    VALUES ('Online', 'Online location for rewards', TRUE, TRUE)
    RETURNING id INTO online_location_id;
  END IF;
  
  IF luise_location_id IS NULL THEN
    INSERT INTO locations (name, description, is_online, active)
    VALUES ('Luise', 'Luise location', FALSE, TRUE)
    RETURNING id INTO luise_location_id;
  END IF;
END $$;

-- 1. Roll the Dice
INSERT INTO rewards (
  title, description, points_cost, reward_type, reward_art, kategorie,
  active, location_id, recurrence, moegliche_punkte, zielgruppe
) SELECT
  'Roll the Dice',
  'Würfel. Bei einer 6 ist dein Aufenthalt/Eine Nacht umsonst (Nur Übernachtung, nicht Frühstück etc.)',
  200,
  'discount',
  'Rabatt',
  'Hotel',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Roll the Dice'
);

-- 2. Zimmerupgrade
INSERT INTO rewards (
  title, description, points_cost, reward_type, reward_art, kategorie,
  active, location_id, recurrence, moegliche_punkte, zielgruppe
) SELECT
  'Zimmerupgrade',
  'Ein Zimmerupgrade bei der nächsten Übernachtung oder sofort (wenn bei Anreise eingelöst wird)',
  150,
  'benefit',
  'Add-on',
  'Hotel',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Zimmerupgrade'
);

-- 3. Freigetränk (Bier, Glas Wein, Limo)
INSERT INTO rewards (
  title, description, points_cost, reward_type, reward_art, kategorie,
  active, location_id, recurrence, moegliche_punkte, zielgruppe
) SELECT
  'Freigetränk',
  'Ein Freigetränk (Bier, Glas Wein, Limo)',
  50,
  'benefit',
  'physisches Geschenk',
  'Hotel',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Freigetränk' AND description = 'Ein Freigetränk (Bier, Glas Wein, Limo)'
);

-- 4. Freigetränk (Flasche Wein/Sekt)
INSERT INTO rewards (
  title, description, points_cost, reward_type, reward_art, kategorie,
  active, location_id, recurrence, moegliche_punkte, zielgruppe
) SELECT
  'Freigetränk',
  'Flasche Wein/Sekt',
  100,
  'benefit',
  'physisches Geschenk',
  'Hotel',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Freigetränk' AND description = 'Flasche Wein/Sekt'
);

-- 5. Garagenplatz
INSERT INTO rewards (
  title, description, points_cost, reward_type, reward_art, kategorie,
  active, location_id, recurrence, moegliche_punkte, zielgruppe
) SELECT
  'Garagenplatz',
  'Parkplatz in der Garage umsonst',
  80,
  'benefit',
  'Add-on',
  'Hotel',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Garagenplatz'
);

-- 6. Fahrrad
INSERT INTO rewards (
  title, description, points_cost, reward_type, reward_art, kategorie,
  active, location_id, recurrence, moegliche_punkte, zielgruppe
) SELECT
  'Fahrrad',
  'Fahrrad für einen Tag umsonst',
  60,
  'benefit',
  'Add-on',
  'Hotel',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Fahrrad'
);

-- 7. Snackbox
INSERT INTO rewards (
  title, description, points_cost, reward_type, reward_art, kategorie,
  active, location_id, recurrence, moegliche_punkte, zielgruppe
) SELECT
  'Snackbox',
  'Snacks (Chips & Popcorn)',
  40,
  'benefit',
  'physisches Geschenk',
  'Hotel',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Snackbox'
);

-- 8. Shoppingrabatt (Hundsgemütlich 5%)
INSERT INTO rewards (
  title, description, points_cost, reward_type, reward_art, kategorie,
  active, location_id, recurrence, moegliche_punkte, zielgruppe
) SELECT
  'Shoppingrabatt',
  'Hundsgemütlich 5%',
  70,
  'discount',
  'Rabatt',
  'nicht Hotel',
  true,
  (SELECT id FROM locations WHERE name = 'Luise' LIMIT 1),
  'once',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Shoppingrabatt' AND description = 'Hundsgemütlich 5%'
);

-- 9. Shoppingrabatt (Hotelshop 5%)
INSERT INTO rewards (
  title, description, points_cost, reward_type, reward_art, kategorie,
  active, location_id, recurrence, moegliche_punkte, zielgruppe
) SELECT
  'Shoppingrabatt',
  'Hotelshop 5%',
  70,
  'discount',
  'Rabatt',
  'Hotel',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Shoppingrabatt' AND description = 'Hotelshop 5%'
);

-- 10. Aromabad
INSERT INTO rewards (
  title, description, points_cost, reward_type, reward_art, kategorie,
  active, location_id, recurrence, moegliche_punkte, zielgruppe
) SELECT
  'Aromabad',
  'Genieße unser Aromabad im PrivateSpa',
  120,
  'benefit',
  'Erlebnis',
  'Hotel',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM rewards WHERE title = 'Aromabad'
);
