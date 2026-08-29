import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { searchMarketplace } from '@/features/search/actions'
import { ProductGrid } from '@/features/products/components/ProductGrid'
import { monoLabelClass, cardClass, cardHoverClass } from '@/lib/ui'

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  return {
    title: q ? `Search: ${q} | Marketplace` : 'Search | Marketplace',
  }
}

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q || '').trim()
  const { products, users } = query ? await searchMarketplace(query, 24) : { products: [], users: [] }
  const hasResults = products.length > 0 || users.length > 0

  return (
    <div className="min-h-screen bg-[#07070b] text-white pt-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className={monoLabelClass}>Search</div>
          <h1 className="mt-2 text-[34px] font-bold tracking-tight">
            {query ? `Results for “${query}”` : 'Search the marketplace'}
          </h1>
          {query && (
            <p className="text-white/55 mt-2 text-[15px]">
              {products.length + users.length} match{products.length + users.length === 1 ? '' : 'es'} found.
            </p>
          )}
        </div>

        {!query ? (
          <div className="py-16 px-8 text-center border border-dashed border-white/15 rounded-[22px] text-white/55">
            Type something into the search bar to find items and people.
          </div>
        ) : !hasResults ? (
          <div className="py-16 px-8 text-center border border-dashed border-white/15 rounded-[22px]">
            <div className="w-[52px] h-[52px] mx-auto rounded-2xl bg-gradient-to-br from-indigo-600/35 to-purple-600/35 border border-white/10 flex items-center justify-center">
              <SearchX className="w-6 h-6 text-white/70" />
            </div>
            <div className="mt-4 text-lg font-semibold text-white">No matches for “{query}”</div>
            <div className="mt-2 text-sm text-white/55">Try a different spelling, or a broader term.</div>
          </div>
        ) : (
          <div className="space-y-10">
            {users.length > 0 && (
              <section>
                <div className={`${monoLabelClass} mb-3`}>People</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {users.map(u => (
                    <Link
                      key={u.id}
                      href={`/user/${u.id}`}
                      className={`flex items-center gap-3 p-4 ${cardClass} ${cardHoverClass}`}
                    >
                      <div className="w-11 h-11 flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                        {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 font-semibold text-white/90 truncate">{u.full_name || 'Anonymous User'}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {products.length > 0 && (
              <section>
                <div className={`${monoLabelClass} mb-3`}>Items</div>
                <ProductGrid products={products} />
              </section>
            )}
          </div>
        )}
      </main>

      {/* Abstract Background */}
      <div className="fixed top-[-50%] left-[-20%] w-[100%] h-[100%] rounded-full bg-indigo-900/20 blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-50%] right-[-20%] w-[100%] h-[100%] rounded-full bg-fuchsia-900/20 blur-[150px] pointer-events-none -z-10" />
    </div>
  )
}
