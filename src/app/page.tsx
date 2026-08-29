import { createClient } from '@/lib/supabase/server'
import { ProductGrid, type Filter } from '@/features/products/components/ProductGrid'

const KNOWN_FILTERS: Filter[] = ['all', 'auctions', 'buy-now', 'newest']

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { filter: rawFilter } = await searchParams
  const initialFilter = KNOWN_FILTERS.find(f => f === rawFilter)

  const supabase = await createClient()

  // Fetch active products (available, in auction, or an ended auction still awaiting
  // seller cleanup — an ended auction is never deleted automatically, just marked ENDED)
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      offers ( amount ),
      category:category_id ( name )
    `)
    .in('status', ['AVAILABLE', 'AUCTION', 'ENDED'])
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#07070b] text-white pt-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-end mb-8 gap-6 flex-wrap">
          <div>
            <h1 className="text-[34px] font-bold tracking-tight">Discover unique items</h1>
            <p className="text-white/55 mt-2 text-[15px]">Fresh listings and live auctions from our community.</p>
          </div>
        </div>

        <ProductGrid products={products || []} initialFilter={initialFilter} />
      </main>

      {/* Abstract Background */}
      <div className="fixed top-[-50%] left-[-20%] w-[100%] h-[100%] rounded-full bg-indigo-900/20 blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-50%] right-[-20%] w-[100%] h-[100%] rounded-full bg-fuchsia-900/20 blur-[150px] pointer-events-none -z-10" />
    </div>
  )
}
