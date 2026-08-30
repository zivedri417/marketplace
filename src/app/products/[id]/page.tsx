import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductClient } from '@/features/products/components/ProductClient'
import { createAdminClient, isExpiredAuction, resolveExpiredAuction } from '@/features/products/resolveAuction'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase.from('products').select('title').eq('id', id).single()
  return {
    title: product ? `${product.title} | Marketplace` : 'Item Not Found',
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch product and its relations
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      seller:seller_id ( id, full_name, avatar_url ),
      category:category_id ( name ),
      offers ( amount, buyer_id, created_at, buyer:buyer_id ( full_name ) )
    `)
    .eq('id', id)
    .single()

  if (!product) {
    notFound()
  }

  // Seller's rating, for the seller card — same aggregate the profile page computes.
  const { data: sellerReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('seller_id', product.seller_id)
  const sellerReviewCount = sellerReviews?.length || 0
  const sellerRating = sellerReviewCount > 0
    ? sellerReviews!.reduce((acc, r) => acc + r.rating, 0) / sellerReviewCount
    : 0

  // The auction cron may not have run yet (e.g. it never fires in local dev), so resolve an
  // expired auction the moment anyone loads its page — same result, no missed deadline.
  if (isExpiredAuction(product)) {
    const supabaseAdmin = createAdminClient()
    if (supabaseAdmin) {
      try {
        await resolveExpiredAuction(supabaseAdmin, { id: product.id, seller_id: product.seller_id, title: product.title })
        product.status = 'ENDED'
      } catch (err) {
        console.error(`Failed to resolve expired auction ${product.id}:`, err)
      }
    }
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#efe9dc] text-[#14120e] pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductClient product={product} currentUser={user} sellerRating={sellerRating} sellerReviewCount={sellerReviewCount} />
      </div>
    </div>
  )
}
