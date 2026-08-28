'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PackageOpen } from 'lucide-react'
import { ProductCard } from './ProductCard'
import { pillButtonPrimary } from '@/lib/ui'

type Filter = 'all' | 'auctions' | 'buy-now' | 'newest'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'auctions', label: 'Live auctions' },
  { id: 'buy-now', label: 'Buy now' },
  { id: 'newest', label: 'Newest' },
]

export function ProductGrid({ products }: { products: any[] }) {
  const [filter, setFilter] = useState<Filter>('all')
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
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f.id
                ? 'bg-white text-[#0b0b12]'
                : 'border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="col-span-full py-16 px-8 text-center border border-dashed border-white/15 rounded-[22px]">
          <div className="w-[52px] h-[52px] mx-auto rounded-2xl bg-gradient-to-br from-indigo-600/35 to-purple-600/35 border border-white/10 flex items-center justify-center">
            <PackageOpen className="w-6 h-6 text-white/70" />
          </div>
          {products.length === 0 ? (
            <>
              <div className="mt-4 text-lg font-semibold text-white">No items available right now</div>
              <div className="mt-2 text-sm text-white/55">Be the first to list one — it takes about a minute.</div>
            </>
          ) : (
            <>
              <div className="mt-4 text-lg font-semibold text-white">No items match this filter</div>
              <div className="mt-2 text-sm text-white/55">Try a different tab, or be the first to list one.</div>
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
