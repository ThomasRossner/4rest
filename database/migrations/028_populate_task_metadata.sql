-- Populate existing tasks with random metadata values
-- This migration fills the new metadata fields (category, difficulty, time_required, location_tool, event_group)
-- with random values for all existing tasks

DO $$
DECLARE
    _task_id UUID;
    _category task_category_enum;
    _difficulty task_difficulty_enum;
    _time_required task_time_required_enum;
    _location_tool task_location_tool_enum;
    _event_group VARCHAR(255);
    _random_num INTEGER;
BEGIN
    -- Loop through all tasks
    FOR _task_id IN SELECT id FROM tasks LOOP
        -- Generate random category (1-4)
        _random_num := floor(random() * 4) + 1;
        CASE _random_num
            WHEN 1 THEN _category := 'Kommunikation & Netzwerke';
            WHEN 2 THEN _category := 'Mensch & soziales Umfeld';
            WHEN 3 THEN _category := 'Natur & Umweltschutz';
            WHEN 4 THEN _category := 'Ressourcenverbrauch & Materialeinsatz';
        END CASE;

        -- Generate random difficulty (1-5)
        _random_num := floor(random() * 5) + 1;
        CASE _random_num
            WHEN 1 THEN _difficulty := 'sehr einfach';
            WHEN 2 THEN _difficulty := 'einfach';
            WHEN 3 THEN _difficulty := 'mittel';
            WHEN 4 THEN _difficulty := 'schwer';
            WHEN 5 THEN _difficulty := 'sehr schwer';
        END CASE;

        -- Generate random time_required (1-5)
        _random_num := floor(random() * 5) + 1;
        CASE _random_num
            WHEN 1 THEN _time_required := '1-3 Min';
            WHEN 2 THEN _time_required := '3-10 Min';
            WHEN 3 THEN _time_required := '10-30 Min';
            WHEN 4 THEN _time_required := '30-60 Min';
            WHEN 5 THEN _time_required := '60+ Min';
        END CASE;

        -- Generate random location_tool (1-4)
        _random_num := floor(random() * 4) + 1;
        CASE _random_num
            WHEN 1 THEN _location_tool := 'Umgebung';
            WHEN 2 THEN _location_tool := 'Hotel';
            WHEN 3 THEN _location_tool := 'egal';
            WHEN 4 THEN _location_tool := 'Smartphone/PC';
        END CASE;

        -- event_group: 70% chance to be NULL, 30% chance to have a value
        IF random() < 0.7 THEN
            _event_group := NULL;
        ELSE
            -- Generate a simple event/group name
            _random_num := floor(random() * 5) + 1;
            CASE _random_num
                WHEN 1 THEN _event_group := 'Sommeraktion 2024';
                WHEN 2 THEN _event_group := 'Nachhaltigkeitswoche';
                WHEN 3 THEN _event_group := 'Team Challenge';
                WHEN 4 THEN _event_group := 'Umweltschutz Initiative';
                WHEN 5 THEN _event_group := 'Gastgruppen Programm';
            END CASE;
        END IF;

        -- Update the task with random values
        UPDATE tasks
        SET 
            category = _category,
            difficulty = _difficulty,
            time_required = _time_required,
            location_tool = _location_tool,
            event_group = _event_group
        WHERE id = _task_id;
    END LOOP;

    RAISE NOTICE 'Metadata populated for all tasks';
END $$;

