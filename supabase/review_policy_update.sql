-- Review Policy Update
-- Old policy: only the buyer of a specific product could review the seller of that
-- product (one review per purchase). New policy: any authenticated user can leave one
-- review for any other user (never themselves) — no purchase required.

-- 1. product_id is no longer required — a review is between two users now, not tied
--    to a specific purchase.
ALTER TABLE public.reviews ALTER COLUMN product_id DROP NOT NULL;

-- 2. Replace the old "one review per product" uniqueness with "one review per
--    reviewer per target user".
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_product_id_reviewer_id_key;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_seller_id_reviewer_id_key UNIQUE (seller_id, reviewer_id);

-- 3. Enforce the two content rules at the DB level too (defense in depth, matching the
--    app-level checks): no self-reviews, and comments capped at 300 characters.
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_no_self_review;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_no_self_review CHECK (reviewer_id <> seller_id);

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_comment_length;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_comment_length CHECK (comment IS NULL OR char_length(comment) <= 300);

-- 4. Replace the purchase-gated insert policy with an open "review anyone but yourself" one.
DROP POLICY IF EXISTS "Buyers can insert a review for their purchased items." ON public.reviews;
CREATE POLICY "Any authenticated user can review any other user."
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = reviewer_id AND
    reviewer_id <> seller_id
  );
