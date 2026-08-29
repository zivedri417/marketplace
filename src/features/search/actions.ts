'use server'

import { createClient } from '@/lib/supabase/server'

export interface ProductSearchResult {
  id: string
  title: string
  price: number
  images: string[]
  is_auction: boolean
  status: string
}

export interface UserSearchResult {
  id: string
  full_name: string | null
  avatar_url: string | null
}

// Backs both the navbar's live suggestions and the /search results page — ranked by
// trigram similarity (see supabase/search_similarity_update.sql), so it tolerates typos
// and near-misses rather than requiring an exact substring.
export async function searchMarketplace(
  query: string,
  limit = 6
): Promise<{ products: ProductSearchResult[]; users: UserSearchResult[] }> {
  const q = query.trim()
  if (!q) return { products: [], users: [] }

  const supabase = await createClient()

  const [{ data: products, error: productsError }, { data: users, error: usersError }] = await Promise.all([
    supabase.rpc('search_products', { query: q, match_limit: limit }),
    supabase.rpc('search_profiles', { query: q, match_limit: limit }),
  ])

  if (productsError) console.error('Product search error:', productsError)
  if (usersError) console.error('User search error:', usersError)

  return { products: products || [], users: users || [] }
}
