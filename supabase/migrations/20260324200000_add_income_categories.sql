-- Expand transactions_category_check to include income categories
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_category_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_category_check
  CHECK (category IN (
    'food', 'saas', 'transport', 'leisure', 'invest',
    'health', 'education', 'housing', 'other',
    'salary', 'freelance', 'rent_income', 'dividend', 'other_income'
  ));
