-- Migration: Add Authentication Support
-- This migration updates RLS policies to require authentication
-- Run this in your Supabase SQL Editor after setting up authentication

-- Drop existing policies that allow all operations
DROP POLICY IF EXISTS "Allow all operations on items" ON items;
DROP POLICY IF EXISTS "Allow all operations on orders" ON orders;
DROP POLICY IF EXISTS "Allow all operations on order_items" ON order_items;
DROP POLICY IF EXISTS "Allow all operations on draft_orders" ON draft_orders;
DROP POLICY IF EXISTS "Allow all operations on qr_codes" ON qr_codes;

-- Create new policies that require authentication
-- Items: Allow authenticated users to read and manage items
CREATE POLICY "Authenticated users can view items" ON items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert items" ON items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update items" ON items
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete items" ON items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Orders: Allow authenticated users to read and manage orders
CREATE POLICY "Authenticated users can view orders" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert orders" ON orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete orders" ON orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- Order Items: Allow authenticated users to read and manage order items
CREATE POLICY "Authenticated users can view order_items" ON order_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert order_items" ON order_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update order_items" ON order_items
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete order_items" ON order_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Draft Orders: Allow authenticated users to read and manage draft orders
CREATE POLICY "Authenticated users can view draft_orders" ON draft_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert draft_orders" ON draft_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update draft_orders" ON draft_orders
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete draft_orders" ON draft_orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- QR Codes: Allow authenticated users to read and manage QR codes
CREATE POLICY "Authenticated users can view qr_codes" ON qr_codes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert qr_codes" ON qr_codes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update qr_codes" ON qr_codes
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete qr_codes" ON qr_codes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Note: After running this migration, make sure to:
-- 1. Configure session duration in Supabase Dashboard > Authentication > Settings
--    Set "JWT expiry" to 2592000 seconds (30 days / 1 month)
-- 2. Create the initial user using the create_user.sql script or via the Supabase Dashboard

