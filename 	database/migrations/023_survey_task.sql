-- Add survey fields for survey task type
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS survey_questions JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS survey_type VARCHAR(50);

-- Add survey_responses column to user_tasks for storing survey answers
ALTER TABLE user_tasks ADD COLUMN IF NOT EXISTS survey_responses JSONB;

-- Add comments to document the new task type
COMMENT ON COLUMN tasks.survey_questions IS 'Survey questions array for survey tasks (JSONB)';
COMMENT ON COLUMN tasks.survey_type IS 'Survey type: single_choice, multiple_choice, text, rating, or mixed';
COMMENT ON COLUMN user_tasks.survey_responses IS 'Survey responses for survey tasks (JSONB)';
