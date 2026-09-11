-- Populate existing rewards with random metadata values

DO $$
DECLARE
    reward_record RECORD;
    arts reward_art_enum[] := ARRAY['Rabatt', 'Erlebnis', 'Add-on', 'physisches Geschenk'];
    kategorien reward_kategorie_enum[] := ARRAY['Hotel', 'nicht Hotel'];
    kosten_stufen reward_kosten_enum[] := ARRAY['niedrig', 'mittel', 'hoch'];
    random_index INTEGER;
    random_punkte INTEGER;
BEGIN
    FOR reward_record IN SELECT id, points_cost FROM rewards LOOP
        -- Assign random reward_art
        random_index := floor(random() * array_length(arts, 1)) + 1;
        UPDATE rewards SET reward_art = arts[random_index] WHERE id = reward_record.id;

        -- Assign random kategorie
        random_index := floor(random() * array_length(kategorien, 1)) + 1;
        UPDATE rewards SET kategorie = kategorien[random_index] WHERE id = reward_record.id;

        -- Assign random kosten based on points_cost
        IF reward_record.points_cost IS NOT NULL THEN
            IF reward_record.points_cost <= 50 THEN
                UPDATE rewards SET kosten = 'niedrig' WHERE id = reward_record.id;
            ELSIF reward_record.points_cost <= 150 THEN
                UPDATE rewards SET kosten = 'mittel' WHERE id = reward_record.id;
            ELSE
                UPDATE rewards SET kosten = 'hoch' WHERE id = reward_record.id;
            END IF;
        ELSE
            random_index := floor(random() * array_length(kosten_stufen, 1)) + 1;
            UPDATE rewards SET kosten = kosten_stufen[random_index] WHERE id = reward_record.id;
        END IF;

        -- Assign random moegliche_punkte (between points_cost and points_cost * 2, or random if points_cost is null)
        IF reward_record.points_cost IS NOT NULL THEN
            random_punkte := reward_record.points_cost + floor(random() * reward_record.points_cost);
            UPDATE rewards SET moegliche_punkte = random_punkte WHERE id = reward_record.id;
        ELSE
            random_punkte := floor(random() * 200) + 10;
            UPDATE rewards SET moegliche_punkte = random_punkte WHERE id = reward_record.id;
        END IF;

        -- Optionally assign random event_group (e.g., 30% chance)
        IF random() < 0.3 THEN
            UPDATE rewards SET event_group = 'Event ' || floor(random() * 5 + 1)::TEXT WHERE id = reward_record.id;
        END IF;
    END LOOP;
    RAISE NOTICE 'Metadata populated for all rewards';
END $$;

