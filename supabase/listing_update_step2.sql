-- STEP 2: Schema Updates
-- IMPORTANT: Run this file ONLY AFTER Step 1 has completed successfully.

-- 1. Create Categories Table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and Policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone." ON public.categories FOR SELECT USING (true);
-- Only admins can insert/update, but for this project we'll assume it's seeded by us directly.

-- Seed Categories
INSERT INTO public.categories (name, slug) VALUES
  ('Fashion & Apparel', 'fashion-apparel'),
  ('Sports & Fitness', 'sports-fitness'),
  ('Electronics & Tech', 'electronics-tech'),
  ('Vehicles & Transportation', 'vehicles-transportation'),
  ('Academics & Books', 'academics-books'),
  ('Miscellaneous / Other', 'miscellaneous-other')
ON CONFLICT (slug) DO NOTHING;

-- 2. Alter Products Table
ALTER TABLE public.products 
  DROP COLUMN price, -- Dropping to change type safely
  ADD COLUMN price INTEGER NOT NULL DEFAULT 0, -- Cents
  ADD COLUMN category_id UUID REFERENCES public.categories(id),
  ADD COLUMN location TEXT NOT NULL DEFAULT '',
  ADD COLUMN is_auction BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN minimum_price INTEGER, -- Cents
  ADD COLUMN auction_deadline TIMESTAMP WITH TIME ZONE;

-- 3. Create Offers Table (for Auctions)
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- Cents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and Policies for Offers
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Offers are viewable by product seller and the offer creator."
  ON public.offers FOR SELECT
  USING (
    auth.uid() = buyer_id OR 
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = offers.product_id AND p.seller_id = auth.uid())
  );

CREATE POLICY "Authenticated users can insert offers on auctions."
  ON public.offers FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = buyer_id AND
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = offers.product_id AND p.status = 'AUCTION'::product_status)
  );

-- Indexes
CREATE INDEX products_category_id_idx ON public.products(category_id);
CREATE INDEX offers_product_id_idx ON public.offers(product_id);

-- 4. Storage setup
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'product-images' );
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'product-images' AND auth.uid() = owner );
