'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PackageOpen } from 'lucide-react'
import { ProductCard } from './ProductCard'
import { pillButtonPrimary } from '@/lib/ui'

export type Filter = 'all' | 'auctions' | 'buy-now' | 'newest'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'auctions', label: 'Live auctions' },
  { id: 'buy-now', label: 'Buy now' },
  { id: 'newest', label: 'Newest' },
]

// Lets a link (e.g. the Auctions explainer page's "Browse live auctions" CTA) deep-link
// straight into a pre-selected filter via ?filter=auctions, instead of always opening on "All".
export function ProductGrid({ products, initialFilter }: { products: any[], initialFilter?: Filter }) {
  const [filter, setFilter] = useState<Filter>(
    initialFilter && FILTERS.some(f => f.id === initialFilter) ? initialFilter : 'all'
  )
  // Computed once on mount (not read directly during render) to stay a pure render.
  const [now] = useState(() => Date.now())

  const visible = useMemo(() => {
    let list = products
    if (filter === 'auctions') list = list.filter((p) => p.is_auction && p.status === 'AUCTION')
    if (filter === 'buy-now') list = list.filter((p) => !p.is_auction)
    if (filter === 'newest') list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return list
  }, [products, filter])

  return (
    <div>
      <div className="flex mb-6 border border-[#14120e] self-start w-fit font-mono text-[11px] tracking-[0.14em] uppercase">
        {FILTERS.map((f, idx) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-5 py-3 transition-colors ${idx > 0 ? 'border-l border-[#14120e]' : ''} ${
              filter === f.id
                ? 'bg-[#14120e] text-[#efe9dc]'
                : 'text-[#14120e]/70 hover:bg-[#14120e]/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="col-span-full py-16 px-8 text-center border border-dashed border-[#14120e]/25">
          <div className="w-[52px] h-[52px] mx-auto border border-[#14120e]/25 flex items-center justify-center">
            <PackageOpen className="w-6 h-6 text-[#14120e]/70" />
          </div>
          {products.length === 0 ? (
            <>
              <div className="mt-4 font-serif text-2xl text-[#14120e]">No items available right now</div>
              <div className="mt-2 text-sm text-[#14120e]/55">Be the first to list one — it takes about a minute.</div>
            </>
          ) : (
            <>
              <div className="mt-4 font-serif text-2xl text-[#14120e]">No items match this filter</div>
              <div className="mt-2 text-sm text-[#14120e]/55">Try a different tab, or be the first to list one.</div>
            </>
          )}
          <Link href="/products/new" className={`${pillButtonPrimary} mt-5 px-6 py-3 text-sm`}>
            List an Item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visible.map((item) => (
            <ProductCard item={item} now={now} key={item.id} />
          ))}
        </div>
      )}
    </div>
  )
}
