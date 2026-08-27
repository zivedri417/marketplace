import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductClient } from '@/features/products/components/ProductClient'

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
      offers ( amount, buyer_id, created_at )
    `)
    .eq('id', id)
    .single()

  if (!product) {
    notFound()
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductClient product={product} currentUser={user} />
      </div>
    </div>
  )
}
