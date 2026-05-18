-- Migration: Individual expenses (Juby, Anandu)
-- Run in Supabase SQL Editor after base schema (needs update_updated_at_column)

CREATE TABLE IF NOT EXISTS individual_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person VARCHAR(50) NOT NULL CHECK (person IN ('juby', 'anandu')),
  expense_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  notes TEXT,
  settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_individual_expenses_person ON individual_expenses(person);
CREATE INDEX IF NOT EXISTS idx_individual_expenses_expense_date ON individual_expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_individual_expenses_settled ON individual_expenses(settled);

DROP TRIGGER IF EXISTS update_individual_expenses_updated_at ON individual_expenses;
CREATE TRIGGER update_individual_expenses_updated_at BEFORE UPDATE ON individual_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE individual_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on individual_expenses" ON individual_expenses;
CREATE POLICY "Allow all operations on individual_expenses" ON individual_expenses
  FOR ALL USING (true) WITH CHECK (true);
