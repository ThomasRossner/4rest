-- Migration: Mailbox Messages
-- Date: 2026-01-16
-- This migration adds a mailbox system for in-app notifications

DO $$
BEGIN
  -- Create messages table
  CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'photo_rejection', 'photo_approval', 'photo_pending_review', 'system', etc.
    title VARCHAR(255) NOT NULL,
    content TEXT,
    metadata JSONB, -- For storing additional data like task_id, user_task_id, etc.
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
  CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
  CREATE INDEX IF NOT EXISTS idx_messages_user_read ON messages(user_id, read);

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error during mailbox messages migration: %', SQLERRM;
  RAISE;
END $$;
