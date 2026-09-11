-- TICKET-015: Öffentliche Aufgaben ohne Login (article_quiz, survey)

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS allow_public_completion BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN tasks.allow_public_completion IS 'Wenn TRUE: Task über GET/POST /tasks/public/:id ohne JWT erreichbar (nur article_quiz/survey).';

CREATE TABLE IF NOT EXISTS guest_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_session_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completion_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  merged_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  merged_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT guest_task_completions_unique_session_task UNIQUE (guest_session_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_guest_task_completions_session ON guest_task_completions(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_guest_task_completions_merged ON guest_task_completions(merged_at) WHERE merged_at IS NULL;
