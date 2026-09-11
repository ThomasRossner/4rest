-- Per-user task collection marks (bookmarks)
-- Stores which tasks a user has marked for their personal "Sammlung" hub section.
-- One row per (user, task); a unique constraint enforces idempotent toggling.
CREATE TABLE IF NOT EXISTS task_collection_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT task_collection_marks_user_task_unique UNIQUE (user_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_collection_marks_user ON task_collection_marks(user_id);
CREATE INDEX IF NOT EXISTS idx_task_collection_marks_task ON task_collection_marks(task_id);

COMMENT ON TABLE task_collection_marks IS 'Per-user bookmarked tasks shown in the tasks hub "Sammlung" section.';
