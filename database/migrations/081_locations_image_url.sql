-- Add image_url column for locations
-- Stores an uploadable image for a location, shown as a hub place tile background
-- and in the location-filtered task list header.
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN locations.image_url IS 'Public URL of the uploaded location image (served from /uploads). Optional; falls back to the MapPin icon in the UI.';
