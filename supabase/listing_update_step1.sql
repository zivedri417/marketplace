-- STEP 1: Alter Enum Type
-- IMPORTANT: Run this script by itself FIRST. Do not run any other code with it.
-- Postgres requires enum alterations to be committed before the table is modified.

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'product_status' AND e.enumlabel = 'AUCTION') THEN
    ALTER TYPE product_status ADD VALUE 'AUCTION';
  END IF;
END $$;
