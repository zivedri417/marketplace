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
    <div className="min-h-screen bg-[#efe9dc] text-[#14120e] pt-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className={monoLabelClass}>Search</div>
          <h1 className="mt-2 font-serif text-[44px] leading-none tracking-tight">
            {query ? `Results for “${query}”` : 'Search the marketplace'}
          </h1>
          {query && (
            <p className="text-[#14120e]/55 mt-3 text-[15px]">
              {products.length + users.length} match{products.length + users.length === 1 ? '' : 'es'} found.
            </p>
          )}
        </div>

        {!query ? (
          <div className="py-16 px-8 text-center border border-dashed border-[#14120e]/25 text-[#14120e]/55">
            Type something into the search bar to find items and people.
          </div>
        ) : !hasResults ? (
          <div className="py-16 px-8 text-center border border-dashed border-[#14120e]/25">
            <div className="w-[52px] h-[52px] mx-auto border border-[#14120e]/25 flex items-center justify-center">
              <SearchX className="w-6 h-6 text-[#14120e]/70" />
            </div>
            <div className="mt-4 font-serif text-2xl text-[#14120e]">No matches for “{query}”</div>
            <div className="mt-2 text-sm text-[#14120e]/55">Try a different spelling, or a broader term.</div>
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
                      <div className="w-11 h-11 flex-shrink-0 border border-[#14120e] flex items-center justify-center font-serif text-lg text-[#14120e]">
                        {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 font-semibold text-[#14120e]/90 truncate">{u.full_name || 'Anonymous User'}</div>
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
    </div>
  )
}
