import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/features/products/components/ProductGrid'
import { monoLabelClass } from '@/lib/ui'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: category } = await supabase.from('categories').select('name').eq('slug', slug).single()
  return {
    title: category ? `${category.name} | Marketplace` : 'Category Not Found',
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!category) {
    notFound()
  }

  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      offers ( amount ),
      category:category_id ( name )
    `)
    .eq('category_id', category.id)
    .in('status', ['AVAILABLE', 'AUCTION', 'ENDED'])
    .order('created_at', { ascending: false })

  const count = products?.length || 0

  return (
    <div className="min-h-screen bg-[#07070b] text-white pt-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className={monoLabelClass}>Category</div>
          <h1 className="mt-2 text-[34px] font-bold tracking-tight">{category.name}</h1>
          <p className="text-white/55 mt-2 text-[15px]">
            {count} item{count === 1 ? '' : 's'} listed in this category.
          </p>
        </div>

        <ProductGrid products={products || []} />
      </main>

      {/* Abstract Background */}
      <div className="fixed top-[-50%] left-[-20%] w-[100%] h-[100%] rounded-full bg-indigo-900/20 blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-50%] right-[-20%] w-[100%] h-[100%] rounded-full bg-fuchsia-900/20 blur-[150px] pointer-events-none -z-10" />
    </div>
  )
}
