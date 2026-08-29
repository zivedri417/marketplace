-- Similarity search for products and profiles
-- Powers the navbar search bar: fuzzy/typo-tolerant matching (not just exact substring),
-- ranked by how close the match is.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes so the similarity search stays fast as the tables grow.
CREATE INDEX IF NOT EXISTS products_title_trgm_idx ON public.products USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_description_trgm_idx ON public.products USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_full_name_trgm_idx ON public.profiles USING gin (full_name gin_trgm_ops);

-- Ranked product matches: title/description, restricted to listings that are actually
-- browsable (mirrors the homepage's status filter). Combines a plain substring match
-- (so exact/short queries always work) with trigram similarity (so near-misses and
-- typos still surface), ordered by how close the match actually is.
CREATE OR REPLACE FUNCTION public.search_products(query TEXT, match_limit INT DEFAULT 8)
RETURNS SETOF public.products
LANGUAGE sql STABLE
AS $$
  SELECT *
  FROM public.products
  WHERE status IN ('AVAILABLE', 'AUCTION', 'ENDED')
    AND (
      title ILIKE '%' || query || '%'
      OR description ILIKE '%' || query || '%'
      OR title % query
      OR description % query
    )
  ORDER BY GREATEST(similarity(title, query), similarity(coalesce(description, ''), query)) DESC
  LIMIT match_limit;
$$;

-- Ranked user matches by full_name, same substring + trigram combination as above.
CREATE OR REPLACE FUNCTION public.search_profiles(query TEXT, match_limit INT DEFAULT 8)
RETURNS SETOF public.profiles
LANGUAGE sql STABLE
AS $$
  SELECT *
  FROM public.profiles
  WHERE full_name ILIKE '%' || query || '%' OR full_name % query
  ORDER BY similarity(full_name, query) DESC
  LIMIT match_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_products(TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles(TEXT, INT) TO anon, authenticated;
