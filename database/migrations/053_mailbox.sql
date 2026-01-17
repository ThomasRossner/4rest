-- Migration: Mailbox System
-- Date: 2026-01-16
-- This migration creates a mailbox system for in-app notifications

DO $$
BEGIN
  -- Create messages table
  CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'photo_rejection', 'photo_upload', 'system'
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    -- For photo-related messages, store reference to user_task
    user_task_id UUID REFERENCES user_tasks(id) ON DELETE CASCADE,
    -- Metadata for actions (e.g., approve/reject photo)
    action_data JSONB
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(user_id, read);
  CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_user_task_id ON messages(user_task_id) WHERE user_task_id IS NOT NULL;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error during mailbox migration: %', SQLERRM;
  RAISE;
END $$;
