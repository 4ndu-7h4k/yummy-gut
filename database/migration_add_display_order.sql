-- Migration: Add display_order column to items table
-- Run this in your Supabase SQL Editor if you already have an existing database

-- Add display_order column
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0 CHECK (display_order >= 0);

-- Update existing items to have sequential order numbers based on creation time
UPDATE items 
SET display_order = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_number
  FROM items
) AS subquery
WHERE items.id = subquery.id;

-- Create index for better query performance when ordering
CREATE INDEX IF NOT EXISTS idx_items_display_order ON items(display_order);

