-- Create 50 tasks for employee@example.com, each worth 20 points
-- Then complete all tasks for that user (including tree planting and points)

DO $$
DECLARE
  user_id_val UUID;
  location_id_val UUID;
  task_id_val UUID;
  task_counter INTEGER;
  task_title TEXT;
  points_total INTEGER := 0;
  edge_padding NUMERIC := 0.5;
  area_spacing NUMERIC := 20.0;
  min_distance NUMERIC := 1.0;
  primary_origin_x NUMERIC;
  primary_origin_z NUMERIC;
  grid_cols INTEGER;
  user_index INTEGER;
  col INTEGER;
  row_idx INTEGER;
  grid_size INTEGER;
  max_trees_per_block INTEGER := 8;
  max_trees_for_grid INTEGER;
  center_offset NUMERIC;
  start_x NUMERIC;
  start_z NUMERIC;
  block_x NUMERIC;
  block_z NUMERIC;
  block_min_x NUMERIC;
  block_max_x NUMERIC;
  block_min_z NUMERIC;
  block_max_z NUMERIC;
  new_x NUMERIC;
  new_z NUMERIC;
  attempts INTEGER;
  max_attempts INTEGER := 200;
  valid_position BOOLEAN;
  conflict_count INTEGER;
  block_count INTEGER;
  new_tree_id UUID;
  initial_stage TEXT := 'sapling';
  initial_growth_points INTEGER := 1;
  initial_size NUMERIC;
  existing_tree_id UUID;
BEGIN
  -- Get user ID for employee@example.com
  SELECT id INTO user_id_val FROM users WHERE email = 'employee@example.com';
  
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'User with email employee@example.com not found';
  END IF;
  
  RAISE NOTICE 'Found user: %', user_id_val;
  
  -- Get default "Online" location ID
  SELECT id INTO location_id_val FROM locations WHERE name = 'Online' LIMIT 1;
  
  IF location_id_val IS NULL THEN
    RAISE EXCEPTION 'Default "Online" location not found';
  END IF;
  
  RAISE NOTICE 'Using location: %', location_id_val;
  
  -- Calculate user's primary origin (same logic as backend)
  SELECT COUNT(*) INTO user_index
  FROM (
    SELECT id FROM users ORDER BY created_at ASC LIMIT 1000
  ) u
  WHERE u.id <= user_id_val;
  
  user_index := user_index - 1;
  SELECT COUNT(*) INTO grid_cols FROM users LIMIT 1000;
  grid_cols := GREATEST(1, CEIL(SQRT(grid_cols::NUMERIC)));
  col := user_index % grid_cols;
  row_idx := FLOOR(user_index / grid_cols);
  primary_origin_x := col * area_spacing;
  primary_origin_z := row_idx * area_spacing;
  
  -- Create 50 tasks and complete them
  FOR task_counter IN 1..50 LOOP
    task_title := 'Test Task ' || task_counter;
    
    -- Create task
    INSERT INTO tasks (
      title,
      description,
      type,
      points,
      location_id,
      active,
      recurrence,
      allowed_roles,
      allowed_user_types,
      allowed_hotel_ids
    )
    VALUES (
      task_title,
      'Automated test task #' || task_counter,
      'video',
      20,
      location_id_val,
      TRUE,
      'once',
      ARRAY[]::user_role_enum[],
      ARRAY[]::user_type_enum[],
      ARRAY[]::hotel_id_enum[]
    )
    RETURNING id INTO task_id_val;
    
    -- Complete the task
    INSERT INTO user_tasks (
      user_id,
      task_id,
      points_earned,
      completed_at
    )
    VALUES (
      user_id_val,
      task_id_val,
      20,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id, task_id) DO NOTHING;
    
    points_total := points_total + 20;
    
    -- Plant a tree for this task
    -- Get current tree count
    SELECT COUNT(*) INTO block_count
    FROM forest_trees
    WHERE user_id = user_id_val;
    
    -- Calculate required grid size
    grid_size := 2;
    max_trees_for_grid := grid_size * grid_size * max_trees_per_block;
    
    WHILE block_count >= max_trees_for_grid LOOP
      grid_size := grid_size + 1;
      max_trees_for_grid := grid_size * grid_size * max_trees_per_block;
    END LOOP;
    
    -- Calculate grid start position (centered)
    center_offset := FLOOR(-(grid_size - 1) / 2.0) * area_spacing;
    start_x := primary_origin_x + center_offset;
    start_z := primary_origin_z + center_offset;
    
    -- Find available block
    DECLARE
      found_block BOOLEAN := FALSE;
      row_offset INTEGER;
      col_offset INTEGER;
      current_block_count INTEGER;
      initial_size_base NUMERIC := 0.3;
    BEGIN
      FOR row_offset IN 0..grid_size - 1 LOOP
        FOR col_offset IN 0..grid_size - 1 LOOP
          block_x := start_x + col_offset * area_spacing;
          block_z := start_z + row_offset * area_spacing;
          
          -- Count trees in this block
          SELECT COUNT(*) INTO current_block_count
          FROM forest_trees
          WHERE user_id = user_id_val
            AND FLOOR(position_x / area_spacing) * area_spacing = block_x
            AND FLOOR(position_z / area_spacing) * area_spacing = block_z;
          
          IF current_block_count < max_trees_per_block THEN
            -- Calculate bounds
            block_min_x := block_x + edge_padding;
            block_max_x := block_x + area_spacing - edge_padding;
            block_min_z := block_z + edge_padding;
            block_max_z := block_z + area_spacing - edge_padding;
            
            -- Try to find valid position
            valid_position := FALSE;
            attempts := 0;
            
            WHILE NOT valid_position AND attempts < max_attempts LOOP
              new_x := block_min_x + (random() * (block_max_x - block_min_x));
              new_z := block_min_z + (random() * (block_max_z - block_min_z));
              
              new_x := GREATEST(block_min_x, LEAST(new_x, block_max_x));
              new_z := GREATEST(block_min_z, LEAST(new_z, block_max_z));
              
              -- Check conflicts
              SELECT COUNT(*) INTO conflict_count
              FROM forest_trees
              WHERE user_id = user_id_val
                AND ABS(position_x - new_x) < min_distance
                AND ABS(position_z - new_z) < min_distance;
              
              IF conflict_count = 0 THEN
                valid_position := TRUE;
              END IF;
              
              attempts := attempts + 1;
            END LOOP;
            
            -- If no valid position, use block center
            IF NOT valid_position THEN
              new_x := block_x + area_spacing / 2.0;
              new_z := block_z + area_spacing / 2.0;
              new_x := GREATEST(block_min_x, LEAST(new_x, block_max_x));
              new_z := GREATEST(block_min_z, LEAST(new_z, block_max_z));
            END IF;
            
            -- Generate size for sapling stage (0.25 to 0.35)
            initial_size := initial_size_base + (random() * 0.1);
            
            -- Insert tree
            INSERT INTO forest_trees (
              user_id,
              task_id,
              position_x,
              position_y,
              position_z,
              growth_points,
              stage,
              size
            )
            VALUES (
              user_id_val,
              task_id_val,
              new_x,
              0,
              new_z,
              initial_growth_points,
              initial_stage,
              initial_size
            )
            RETURNING id INTO new_tree_id;
            
            found_block := TRUE;
            EXIT;
          END IF;
        END LOOP;
        
        IF found_block THEN
          EXIT;
        END IF;
      END LOOP;
      
      -- If we couldn't plant a tree, that's okay - just log it
      IF NOT found_block THEN
        RAISE NOTICE 'Could not plant tree for task %', task_counter;
      END IF;
    END;
    
    -- Add growth points to a random existing tree (not the one we just planted)
    SELECT id INTO existing_tree_id
    FROM forest_trees
    WHERE user_id = user_id_val
      AND id != COALESCE(new_tree_id, '00000000-0000-0000-0000-000000000000'::UUID)
    ORDER BY random()
    LIMIT 1;
    
    IF existing_tree_id IS NOT NULL THEN
      UPDATE forest_trees
      SET growth_points = growth_points + 20
      WHERE id = existing_tree_id;
    END IF;
    
    IF task_counter % 10 = 0 THEN
      RAISE NOTICE 'Progress: % tasks created and completed...', task_counter;
    END IF;
  END LOOP;
  
  -- Update user points
  UPDATE users 
  SET points = COALESCE(points, 0) + points_total 
  WHERE id = user_id_val;
  
  -- Get final counts
  SELECT COUNT(*) INTO block_count FROM forest_trees WHERE user_id = user_id_val;
  SELECT points INTO task_counter FROM users WHERE id = user_id_val;
  
  RAISE NOTICE 'Completed! Created 50 tasks and completed them all for user %', user_id_val;
  RAISE NOTICE 'Total points awarded: % (user now has % points)', points_total, task_counter;
  RAISE NOTICE 'Total trees planted: %', block_count;
END $$;
