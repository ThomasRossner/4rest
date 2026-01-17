-- Migration: Replace allowed_roles with allowed_teams and allowed_contests
-- Date: 2026-01-16
-- This migration removes role-based filtering and introduces team/contest-based filtering for tasks and rewards

-- Tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS allowed_teams UUID[] DEFAULT ARRAY[]::UUID[],
  ADD COLUMN IF NOT EXISTS allowed_contests UUID[] DEFAULT ARRAY[]::UUID[];

-- Rewards
ALTER TABLE rewards
  ADD COLUMN IF NOT EXISTS allowed_teams UUID[] DEFAULT ARRAY[]::UUID[],
  ADD COLUMN IF NOT EXISTS allowed_contests UUID[] DEFAULT ARRAY[]::UUID[];

-- Reward templates (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reward_templates') THEN
    ALTER TABLE reward_templates
      ADD COLUMN IF NOT EXISTS allowed_teams UUID[] DEFAULT ARRAY[]::UUID[],
      ADD COLUMN IF NOT EXISTS allowed_contests UUID[] DEFAULT ARRAY[]::UUID[];
  END IF;
END $$;

-- Step 2: Remove old role-based columns
-- Note: allowed_user_types and allowed_hotel_ids are kept for now (can be removed later if not needed)
ALTER TABLE tasks DROP COLUMN IF EXISTS allowed_roles;
ALTER TABLE rewards DROP COLUMN IF EXISTS allowed_roles;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reward_templates') THEN
    ALTER TABLE reward_templates DROP COLUMN IF EXISTS allowed_roles;
  END IF;
END $$;

-- Step 3: Create function to automatically deactivate tasks/rewards when teams/contests are deleted
  CREATE OR REPLACE FUNCTION deactivate_tasks_for_deleted_team()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Deactivate tasks that only had this team assigned
    UPDATE tasks
    SET active = FALSE
    WHERE OLD.id = ANY(allowed_teams)
      AND (
        -- Only this team was assigned
        array_length(allowed_teams, 1) = 1
        OR
        -- No contests assigned either
        (allowed_contests IS NULL OR array_length(allowed_contests, 1) IS NULL OR array_length(allowed_contests, 1) = 0)
      );
    
    -- Remove the deleted team from allowed_teams arrays
    UPDATE tasks
    SET allowed_teams = array_remove(allowed_teams, OLD.id)
    WHERE OLD.id = ANY(allowed_teams);
    
    RETURN OLD;
  END;
  $$ LANGUAGE plpgsql;
  
  CREATE OR REPLACE FUNCTION deactivate_rewards_for_deleted_team()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Deactivate rewards that only had this team assigned
    UPDATE rewards
    SET active = FALSE
    WHERE OLD.id = ANY(allowed_teams)
      AND (
        array_length(allowed_teams, 1) = 1
        OR
        (allowed_contests IS NULL OR array_length(allowed_contests, 1) IS NULL OR array_length(allowed_contests, 1) = 0)
      );
    
    -- Remove the deleted team from allowed_teams arrays
    UPDATE rewards
    SET allowed_teams = array_remove(allowed_teams, OLD.id)
    WHERE OLD.id = ANY(allowed_teams);
    
    RETURN OLD;
  END;
  $$ LANGUAGE plpgsql;
  
  CREATE OR REPLACE FUNCTION deactivate_tasks_for_deleted_contest()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Deactivate tasks that only had this contest assigned
    UPDATE tasks
    SET active = FALSE
    WHERE OLD.id = ANY(allowed_contests)
      AND (
        array_length(allowed_contests, 1) = 1
        OR
        (allowed_teams IS NULL OR array_length(allowed_teams, 1) IS NULL OR array_length(allowed_teams, 1) = 0)
      );
    
    -- Remove the deleted contest from allowed_contests arrays
    UPDATE tasks
    SET allowed_contests = array_remove(allowed_contests, OLD.id)
    WHERE OLD.id = ANY(allowed_contests);
    
    RETURN OLD;
  END;
  $$ LANGUAGE plpgsql;
  
  CREATE OR REPLACE FUNCTION deactivate_rewards_for_deleted_contest()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Deactivate rewards that only had this contest assigned
    UPDATE rewards
    SET active = FALSE
    WHERE OLD.id = ANY(allowed_contests)
      AND (
        array_length(allowed_contests, 1) = 1
        OR
        (allowed_teams IS NULL OR array_length(allowed_teams, 1) IS NULL OR array_length(allowed_teams, 1) = 0)
      );
    
    -- Remove the deleted contest from allowed_contests arrays
    UPDATE rewards
    SET allowed_contests = array_remove(allowed_contests, OLD.id)
    WHERE OLD.id = ANY(allowed_contests);
    
    RETURN OLD;
  END;
  $$ LANGUAGE plpgsql;
  
  -- Step 4: Create triggers for automatic deactivation
  DROP TRIGGER IF EXISTS trigger_deactivate_tasks_on_team_delete ON teams;
  CREATE TRIGGER trigger_deactivate_tasks_on_team_delete
    AFTER DELETE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION deactivate_tasks_for_deleted_team();
  
  DROP TRIGGER IF EXISTS trigger_deactivate_rewards_on_team_delete ON teams;
  CREATE TRIGGER trigger_deactivate_rewards_on_team_delete
    AFTER DELETE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION deactivate_rewards_for_deleted_team();
  
  DROP TRIGGER IF EXISTS trigger_deactivate_tasks_on_contest_delete ON contests;
  CREATE TRIGGER trigger_deactivate_tasks_on_contest_delete
    AFTER DELETE ON contests
    FOR EACH ROW
    EXECUTE FUNCTION deactivate_tasks_for_deleted_contest();
  
  DROP TRIGGER IF EXISTS trigger_deactivate_rewards_on_contest_delete ON contests;
  CREATE TRIGGER trigger_deactivate_rewards_on_contest_delete
    AFTER DELETE ON contests
    FOR EACH ROW
    EXECUTE FUNCTION deactivate_rewards_for_deleted_contest();
  
  -- Step 5: Also deactivate when contests end (end_date is in the past)
  CREATE OR REPLACE FUNCTION deactivate_tasks_for_ended_contest()
  RETURNS TRIGGER AS $$
  BEGIN
    -- If contest end_date is set and in the past, deactivate related tasks
    IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
      UPDATE tasks
      SET active = FALSE
      WHERE NEW.id = ANY(allowed_contests)
        AND (
          array_length(allowed_contests, 1) = 1
          OR
          (allowed_teams IS NULL OR array_length(allowed_teams, 1) IS NULL OR array_length(allowed_teams, 1) = 0)
        );
    END IF;
    
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  CREATE OR REPLACE FUNCTION deactivate_rewards_for_ended_contest()
  RETURNS TRIGGER AS $$
  BEGIN
    -- If contest end_date is set and in the past, deactivate related rewards
    IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
      UPDATE rewards
      SET active = FALSE
      WHERE NEW.id = ANY(allowed_contests)
        AND (
          array_length(allowed_contests, 1) = 1
          OR
          (allowed_teams IS NULL OR array_length(allowed_teams, 1) IS NULL OR array_length(allowed_teams, 1) = 0)
        );
    END IF;
    
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  DROP TRIGGER IF EXISTS trigger_deactivate_tasks_on_contest_end ON contests;
  CREATE TRIGGER trigger_deactivate_tasks_on_contest_end
    AFTER UPDATE OF end_date ON contests
    FOR EACH ROW
    WHEN (NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE)
    EXECUTE FUNCTION deactivate_tasks_for_ended_contest();
  
DROP TRIGGER IF EXISTS trigger_deactivate_rewards_on_contest_end ON contests;
CREATE TRIGGER trigger_deactivate_rewards_on_contest_end
  AFTER UPDATE OF end_date ON contests
  FOR EACH ROW
  WHEN (NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE)
  EXECUTE FUNCTION deactivate_rewards_for_ended_contest();
