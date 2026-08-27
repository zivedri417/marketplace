import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  // Fetch active products (available or in auction)
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      offers ( amount )
    `)
    .in('status', ['AVAILABLE', 'AUCTION'])
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-purple-500/30 pt-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Marketplace</h1>
            <p className="text-gray-400 mt-2">Discover unique items from our community.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {!products || products.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
              No items available right now. Be the first to list one!
            </div>
          ) : (
            products.map((item: any) => {
              const highestOffer = item.offers?.length > 0 ? Math.max(...item.offers.map((o: any) => o.amount)) : null
              return (
                <Link href={`/products/${item.id}`} key={item.id} className="block bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-colors group cursor-pointer">
                  <div className="aspect-[4/3] bg-black/50 relative">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">No Image</div>
                    )}
                    {item.is_auction && (
                      <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">AUCTION</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-white truncate text-lg">{item.title}</h3>
                    <div className="mt-2 text-indigo-400 font-bold">
                      {item.is_auction ? (
                        highestOffer ? `Highest Offer: $${(highestOffer/100).toFixed(2)}` : `Starting: $${(item.price/100).toFixed(2)}`
                      ) : (
                        `$${(item.price/100).toFixed(2)}`
                      )}
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </main>
      
      {/* Abstract Background */}
      <div className="fixed top-[-50%] left-[-20%] w-[100%] h-[100%] rounded-full bg-indigo-900/20 blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-50%] right-[-20%] w-[100%] h-[100%] rounded-full bg-fuchsia-900/20 blur-[150px] pointer-events-none -z-10" />
    </div>
  )
}
