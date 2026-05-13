-- Migration: Daily bun count and amount taken from shop (one row per day)
-- Run in Supabase SQL Editor after base schema (needs update_updated_at_column)

CREATE TABLE IF NOT EXISTS daily_bun_shop (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bun_date DATE NOT NULL,
  bun_count INTEGER NOT NULL CHECK (bun_count >= 0),
  bun_amount DECIMAL(10, 2) NOT NULL CHECK (bun_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bun_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_bun_shop_bun_date ON daily_bun_shop(bun_date DESC);

DROP TRIGGER IF EXISTS update_daily_bun_shop_updated_at ON daily_bun_shop;
CREATE TRIGGER update_daily_bun_shop_updated_at BEFORE UPDATE ON daily_bun_shop
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE daily_bun_shop ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on daily_bun_shop" ON daily_bun_shop;
CREATE POLICY "Allow all operations on daily_bun_shop" ON daily_bun_shop
  FOR ALL USING (true) WITH CHECK (true);


INSERT INTO daily_bun_shop (bun_date, bun_count, bun_amount) VALUES
  ('2026-04-04', 60, 420),
  ('2026-04-05', 50, 650),
  ('2026-04-07', 48, 384),
  ('2026-04-08', 40, 320),
  ('2026-04-09', 50, 400),
  ('2026-04-16', 40, 320),
  ('2026-04-17', 40, 320),
  ('2026-04-18', 50, 400),
  ('2026-04-19', 120, 960),
  ('2026-04-20', 50, 400),
  ('2026-04-22', 55, 440),
  ('2026-04-24', 46, 320),
  ('2026-04-25', 44, 330),
  ('2026-04-26', 60, 420),
  ('2026-04-27', 40, 280),
  ('2026-05-01', 60, 420),
  ('2026-05-02', 60, 420),
  ('2026-05-03', 50, 350),
  ('2026-05-04', 65, 455),
  ('2026-05-07', 60, 480),
  ('2026-05-08', 40, 320),
  ('2026-05-09', 30, 240),
  ('2026-05-10', 30, 240),
  ('2026-05-13', 40, 320)
ON CONFLICT (bun_date) DO UPDATE
  SET bun_count = EXCLUDED.bun_count,
      bun_amount = EXCLUDED.bun_amount;