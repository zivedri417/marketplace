-- Auction End Update
-- IMPORTANT: Run this script by itself, just like listing_update_step1.sql.
-- Postgres requires enum alterations to be committed before the new value can be used
-- elsewhere, so this must run (and finish) before the cron route writes 'ENDED' status.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'product_status' AND e.enumlabel = 'ENDED') THEN
    ALTER TYPE product_status ADD VALUE 'ENDED';
  END IF;
END $$;
