-- Allow multiple reviews per reviewer
-- review_policy_update.sql capped reviewers at one review per person (seller_id,
-- reviewer_id unique). That limit is removed — a user can now review the same person
-- more than once.

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_seller_id_reviewer_id_key;
