-- TICKET-009: Sperre bei falscher Quiz-Antwort (pro Frage)
CREATE TABLE IF NOT EXISTS quiz_question_locks (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL CHECK (question_index >= 0),
    locked_until TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (user_id, task_id, question_index)
);

CREATE INDEX IF NOT EXISTS idx_quiz_question_locks_locked_until
  ON quiz_question_locks (locked_until);
