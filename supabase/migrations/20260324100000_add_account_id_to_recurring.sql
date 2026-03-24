-- Add account_id column to recurring_transactions table
ALTER TABLE recurring_transactions
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
