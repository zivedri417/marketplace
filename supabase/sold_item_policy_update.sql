-- Sold Item Policy Update
-- The owner's "delete" action no longer deletes a listing directly — it now marks it
-- SOLD, and a SOLD listing is only ever removed automatically, a month later.

-- 1. Track exactly when an item was marked sold, so the cleanup sweep (see
--    src/features/products/cleanupSoldProducts.ts) knows what's old enough to remove.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;

-- 2. Sellers can no longer delete their own listings directly — the only thing that
--    deletes a product row now is the automated cleanup (running as the service role,
--    which bypasses RLS regardless). Marking something SOLD is just a status update,
--    already covered by the existing "Users can update their own products." policy.
DROP POLICY IF EXISTS "Users can delete their own products." ON public.products;

-- Index to keep the cleanup sweep's lookup cheap.
CREATE INDEX IF NOT EXISTS products_status_sold_at_idx ON public.products(status, sold_at);
