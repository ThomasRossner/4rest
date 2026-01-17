-- Migration: Photo Task Verification
-- Date: 2026-01-16
-- This migration adds verification workflow for photo tasks

DO $$
BEGIN
  -- Step 1: Add verification fields to user_tasks table
  ALTER TABLE user_tasks
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id);

  -- Step 2: Create gallery_images table for approved photos
  CREATE TABLE IF NOT EXISTS gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_task_id UUID NOT NULL REFERENCES user_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES users(id)
  );

  -- Step 3: Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_user_tasks_verification_status ON user_tasks(verification_status);
  CREATE INDEX IF NOT EXISTS idx_user_tasks_photo_url ON user_tasks(photo_url) WHERE photo_url IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_gallery_images_user_id ON gallery_images(user_id);
  CREATE INDEX IF NOT EXISTS idx_gallery_images_task_id ON gallery_images(task_id);
  CREATE INDEX IF NOT EXISTS idx_gallery_images_user_task_id ON gallery_images(user_task_id);

  -- Step 4: Set verification_status for existing photo tasks
  -- Existing completed photo tasks should be marked as 'approved' if they have a photo_url
  UPDATE user_tasks
  SET verification_status = 'approved'
  WHERE photo_url IS NOT NULL
    AND verification_status = 'pending'
    AND EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = user_tasks.task_id 
      AND tasks.type = 'photo'
    );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error during photo task verification migration: %', SQLERRM;
  RAISE;
END $$;
