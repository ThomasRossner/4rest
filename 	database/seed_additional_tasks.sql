-- Additional tasks seed
-- These tasks are added based on the user's requirements
-- Points will be calculated automatically based on difficulty and time_required

-- Helper: Get location ID (defaults to 'Online' if not found)
DO $$
DECLARE
  online_location_id UUID;
  hotel_location_id UUID;
BEGIN
  SELECT id INTO online_location_id FROM locations WHERE name = 'Online' LIMIT 1;
  SELECT id INTO hotel_location_id FROM locations WHERE name = 'Berlin Lobby' LIMIT 1;
  
  -- If locations don't exist, create them
  IF online_location_id IS NULL THEN
    INSERT INTO locations (name, description, is_online, active)
    VALUES ('Online', 'Online location for tasks', TRUE, TRUE)
    RETURNING id INTO online_location_id;
  END IF;
END $$;

-- 1. Instagram
INSERT INTO tasks (
  title, description, type, points, qr_code, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'Instagram',
  'Folge uns auf Instagram und gebe den Code hier ein, der auf unserem Profil steht (noch zu definieren)',
  'qr',
  0, -- Will be calculated automatically
  'INSTAGRAM-CODE-001',
  'Kommunikation & Netzwerke',
  'sehr einfach',
  '1-3 Min',
  'Smartphone/PC',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Instagram'
);

-- 2. LinkedIn
INSERT INTO tasks (
  title, description, type, points, qr_code, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'LinkedIn',
  'Folge uns auf LinkedIn und gebe den Code hier ein, der auf unserem Profil steht (noch zu definieren)',
  'qr',
  0,
  'LINKEDIN-CODE-001',
  'Kommunikation & Netzwerke',
  'sehr einfach',
  '1-3 Min',
  'Smartphone/PC',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'LinkedIn'
);

-- 3. Facebook
INSERT INTO tasks (
  title, description, type, points, qr_code, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'Facebook',
  'Folge uns auf Facebook und gebe den Code hier ein, der auf unserem Profil steht (noch zu definieren)',
  'qr',
  0,
  'FACEBOOK-CODE-001',
  'Kommunikation & Netzwerke',
  'sehr einfach',
  '1-3 Min',
  'Smartphone/PC',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Facebook'
);

-- 4. Margalädla
INSERT INTO tasks (
  title, description, type, points, survey_questions, survey_type, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'Margalädla',
  'Kaufe etwas in unserem Hotelshop und du erhältst den Einkaufswert als Punkte',
  'survey',
  0,
  '[{"type":"text","question":"Wie hoch war der Einkaufswert?","required":true}]'::jsonb,
  'mixed',
  'Ressourcenverbrauch & Materialeinsatz',
  'mittel',
  '3-10 Min',
  'Hotel',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Margalädla'
);

-- 5. Fehlerfinden
INSERT INTO tasks (
  title, description, type, points, photo_required, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'Fehlerfinden',
  'Hast du einen Fehler in unserer App gefunden? Dann schreibe ihn uns hier hinein oder lade einen Screenshot hoch.',
  'photo',
  0,
  true,
  'Kommunikation & Netzwerke',
  'mittel',
  '1-3 Min',
  'Smartphone/PC',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Fehlerfinden'
);

-- 6. Anreise
INSERT INTO tasks (
  title, description, type, points, survey_questions, survey_type, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'Anreise',
  'Wie bist du zu uns gekommen? Trage die Entfernung in KM, Ort und Verkehrmittel ein.',
  'survey',
  0,
  '[{"type":"text","question":"Entfernung in KM","required":true},{"type":"text","question":"Ort","required":true},{"type":"single_choice","question":"Verkehrsmittel","options":["Auto","Zug","Bus","Fahrrad","Zu Fuß","Anderes"],"required":true}]'::jsonb,
  'mixed',
  'Ressourcenverbrauch & Materialeinsatz',
  'einfach',
  '3-10 Min',
  'Smartphone/PC',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Anreise'
);

-- 7. Müllsammeln
INSERT INTO tasks (
  title, description, type, points, survey_questions, survey_type, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'Müllsammeln',
  'Sammle Müll bei einem Spaziergang. An der Rezeption erzählst du von uns eine Mülltüte und Karte. Gib den Müllbeutel bei uns ab, wenn du wieder zurück bist.',
  'survey',
  0,
  '[{"type":"text","question":"Hast du den Müllbeutel bei der Rezeption abgegeben?","required":true}]'::jsonb,
  'text',
  'Natur & Umweltschutz',
  'mittel',
  '30-60 Min',
  'Umgebung',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Müllsammeln'
);

-- 8. Support your local shops
INSERT INTO tasks (
  title, description, type, points, qr_code, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'Support your local shops',
  'Wir haben bei einigen Shops QR-Codes hinterlegt. Besuche Sie und du bekommst dafür von uns Punkte :)',
  'qr',
  0,
  'SHOP-VISIT-001',
  'Mensch & soziales Umfeld',
  'mittel',
  '60+ Min',
  'Umgebung',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Support your local shops'
);

-- 9. Pflanze einen Baum
INSERT INTO tasks (
  title, description, type, points, photo_required, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'Pflanze einen Baum',
  'Hast du die Möglichkeit einen Baum zu Pflanzen? Dann schicke uns davon ein Bild mit einem Schild auf dem steht "XYZ noch zu definieren" und lade es hoch',
  'photo',
  0,
  true,
  'Natur & Umweltschutz',
  'schwer',
  '60+ Min',
  'egal',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Pflanze einen Baum'
);

-- 10. Male uns ein Bild
INSERT INTO tasks (
  title, description, type, points, photo_required, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'Male uns ein Bild',
  'Male ein Bild von einem Ort im Hotel, der dir besonders gut gefällt.',
  'photo',
  0,
  true,
  'Kommunikation & Netzwerke',
  'schwer',
  '30-60 Min',
  'Hotel',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Male uns ein Bild'
);

-- 11. TripAdvisor
INSERT INTO tasks (
  title, description, type, points, photo_required, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'TripAdvisor',
  'Bewerte uns auf TripAdvisor und schicke uns einen Screenshot',
  'photo',
  0,
  true,
  'Kommunikation & Netzwerke',
  'einfach',
  '10-30 Min',
  'Smartphone/PC',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'TripAdvisor'
);

-- 12. Google
INSERT INTO tasks (
  title, description, type, points, photo_required, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'Google',
  'Bewerte uns auf Google und schicke uns einen Screenshot',
  'photo',
  0,
  true,
  'Kommunikation & Netzwerke',
  'einfach',
  '10-30 Min',
  'Smartphone/PC',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Google'
);

-- 13. Fair Fashion
INSERT INTO tasks (
  title, description, type, points, photo_required, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'Fair Fashion',
  'Trägst du ein Fair Fashion Kleidungstück? Schicke uns ein Bild von deinem Look und der Marke!',
  'photo',
  0,
  true,
  'Ressourcenverbrauch & Materialeinsatz',
  'schwer',
  '1-3 Min',
  'Smartphone/PC',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Fair Fashion'
);

-- 14. Was sind die IDGs?
INSERT INTO tasks (
  title, description, type, points, video_url, quiz_questions, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'Was sind die IDGs?',
  'Kurzvideo über die IDGs mit Frage am Ende',
  'video',
  0,
  NULL, -- Video URL to be added later
  '[{"question":"Was sind die IDGs?","options":["Option 1","Option 2","Option 3"],"correctAnswer":"Option 1"}]'::jsonb,
  'Mensch & soziales Umfeld',
  'einfach',
  '1-3 Min',
  'Smartphone/PC',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'Was sind die IDGs?'
);

-- 15. CO2 - Wieviel ist das eigentlich?
INSERT INTO tasks (
  title, description, type, points, video_url, quiz_questions, category, difficulty, time_required, location_tool,
  active, location_id, recurrence, zielgruppe
) SELECT
  'CO2 - Wieviel ist das eigentlich?',
  'Kurzvideo über CO2, die Menge (z.B. in Luftballons) von verschiedenen Dingen',
  'video',
  0,
  NULL, -- Video URL to be added later
  '[{"question":"Wie viel CO2 produziert...?","options":["Option 1","Option 2","Option 3"],"correctAnswer":"Option 1"}]'::jsonb,
  'Kommunikation & Netzwerke',
  'einfach',
  '1-3 Min',
  'Smartphone/PC',
  true,
  (SELECT id FROM locations WHERE name = 'Online' LIMIT 1),
  'once',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE title = 'CO2 - Wieviel ist das eigentlich?'
);
