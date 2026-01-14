-- Script to remove duplicate tasks (same title and location_id)
-- Keeps the most recent task (by created_at) and deletes all older duplicates

DO $$
DECLARE
    duplicate_record RECORD;
    kept_task_id UUID;
    deleted_count INTEGER := 0;
BEGIN
    -- Find all duplicate groups (same title and location_id)
    FOR duplicate_record IN
        SELECT title, location_id, COUNT(*) as count
        FROM tasks
        WHERE active = TRUE
        GROUP BY title, location_id
        HAVING COUNT(*) > 1
    LOOP
        -- For each duplicate group, keep the most recent task (by created_at)
        -- and delete all older ones
        SELECT id INTO kept_task_id
        FROM tasks
        WHERE title = duplicate_record.title
          AND location_id = duplicate_record.location_id
          AND active = TRUE
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- Delete all other tasks in this group
        DELETE FROM tasks
        WHERE title = duplicate_record.title
          AND location_id = duplicate_record.location_id
          AND active = TRUE
          AND id != kept_task_id;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        RAISE NOTICE 'Removed % duplicate(s) for task "%" at location % (kept task %)', 
            deleted_count, duplicate_record.title, duplicate_record.location_id, kept_task_id;
    END LOOP;
    
    RAISE NOTICE 'Duplicate removal completed.';
END $$;

-- Show remaining tasks to verify
SELECT title, location_id, COUNT(*) as count
FROM tasks
WHERE active = TRUE
GROUP BY title, location_id
HAVING COUNT(*) > 1
ORDER BY count DESC;
