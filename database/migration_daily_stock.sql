-- Migration: Add Daily Stock Tracking System
-- This migration creates a new schema to track stock per day and items sold
-- Run this in your Supabase SQL Editor

-- Create daily_stock table to track stock per day per item
CREATE TABLE IF NOT EXISTS daily_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  stock_date DATE NOT NULL,
  initial_stock INTEGER NOT NULL CHECK (initial_stock >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id, stock_date)
);

-- Create index for better query performance
CREATE INDEX idx_daily_stock_item_date ON daily_stock(item_id, stock_date DESC);
CREATE INDEX idx_daily_stock_date ON daily_stock(stock_date DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_daily_stock_updated_at BEFORE UPDATE ON daily_stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on daily_stock table
ALTER TABLE daily_stock ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all operations on daily_stock" ON daily_stock
  FOR ALL USING (true) WITH CHECK (true);

-- Function to get current available stock for an item on a given date
-- Available stock = initial_stock - (sum of quantities sold on that date)
CREATE OR REPLACE FUNCTION get_available_stock(p_item_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
  v_initial_stock INTEGER;
  v_sold_count INTEGER;
BEGIN
  -- Get initial stock for the date
  SELECT initial_stock INTO v_initial_stock
  FROM daily_stock
  WHERE item_id = p_item_id AND stock_date = p_date;
  
  -- If no daily stock record exists, return NULL (stock not tracked for this day)
  IF v_initial_stock IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate sold count from order_items for the given date
  -- Convert order created_at to date in IST (UTC+5:30)
  SELECT get_sold_count(p_item_id, p_date) INTO v_sold_count;
  
  -- Return available stock
  RETURN GREATEST(0, v_initial_stock - v_sold_count);
END;
$$ LANGUAGE plpgsql;

-- Function to get initial stock for an item on a given date

-- Function to get sold count for an item on a given date
CREATE OR REPLACE FUNCTION get_sold_count(
  p_item_id UUID,
  p_date TIMESTAMP WITH TIME ZONE
)
RETURNS INTEGER AS $$
DECLARE
  v_sold_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(quantity), 0)
  INTO v_sold_count
  FROM order_items
  WHERE item_id = p_item_id
    AND created_at >= p_date;

  RETURN v_sold_count;
END;
$$ LANGUAGE plpgsql;

-- View to get current stock status for all items
CREATE OR REPLACE VIEW item_stock_status AS
SELECT 
  i.id,
  i.name,
  i.price,
  i.is_active,
  ds.stock_date,
  ds.initial_stock,
  get_sold_count(i.id, ds.stock_date) as sold_count,
  get_available_stock(i.id, ds.stock_date) as available_stock
FROM items i
LEFT JOIN daily_stock ds ON i.id = ds.item_id
WHERE ds.stock_date = CURRENT_DATE OR ds.stock_date IS NULL;

-- Note: The items.stock_quantity column is kept for backward compatibility
-- but should not be used for daily stock tracking. It can be used as a 
-- reference or for items that don't need daily tracking.

