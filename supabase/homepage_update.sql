-- Supabase Schema Update for User Homepage & Reviews

-- 1. Add buyer_id to products
ALTER TABLE public.products
ADD COLUMN buyer_id UUID REFERENCES public.profiles(id);

-- 2. Create Reviews Table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(product_id, reviewer_id) -- A buyer can only review a product once
);

-- 3. Enable RLS and Policies for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can view reviews
CREATE POLICY "Reviews are viewable by everyone."
  ON public.reviews FOR SELECT
  USING (true);

-- Only the buyer of a specific product can leave a review for it
CREATE POLICY "Buyers can insert a review for their purchased items."
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM public.products p 
      WHERE p.id = reviews.product_id 
      AND p.buyer_id = auth.uid() 
      AND p.seller_id = reviews.seller_id
    )
  );

-- Indexes for performance
CREATE INDEX reviews_seller_id_idx ON public.reviews(seller_id);
CREATE INDEX products_buyer_id_idx ON public.products(buyer_id);
